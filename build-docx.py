#!/usr/bin/env python3
"""Build ATS-friendly .docx from tailored .md files (for portals that reject RTF/txt, e.g. Greenhouse).

Usage:
    python3 build-docx.py "tailored/Company - Role" "tailored/Company - Cover Letter"

Builds a custom Helvetica/black/tight pandoc reference doc once, then renders each base.md -> base.docx.
Do NOT use the source .docx as the reference (serif + loose spacing overflow to 3 pages).
Verify after: soffice --headless --convert-to pdf <file>.docx ; confirm Helvetica, black bold headings, 1-2 pages.
"""
import re, sys, os, subprocess, zipfile, tempfile

RESUME_DIR = os.path.dirname(os.path.abspath(__file__))
NORM = [(" — "," - "),("—"," - "),(" – "," - "),("–","-"),(" · "," | "),("·","|"),
        (" → "," -> "),("→","->"),("’","'"),("‘","'"),("“","\""),("”","\""),
        ("…","..."),(" "," "),("−","-"),("×","x")]


def make_reference(dst):
    default = os.path.join(tempfile.gettempdir(), "ref_default.docx")
    with open(default, "wb") as f:
        f.write(subprocess.run(["pandoc","--print-default-data-file","reference.docx"],
                               check=True, capture_output=True).stdout)
    zin = zipfile.ZipFile(default); data = {n: zin.read(n) for n in zin.namelist()}; zin.close()

    th = data['word/theme/theme1.xml'].decode('utf-8')
    th = re.sub(r'(<a:latin typeface=")[^"]*("[^/]*/>)', r'\1Helvetica\2', th)
    data['word/theme/theme1.xml'] = th.encode('utf-8')

    st = data['word/styles.xml'].decode('utf-8')
    st = re.sub(r'<w:color\b[^>]*/>', '<w:color w:val="000000"/>', st)          # all black
    st = st.replace('<w:sz w:val="24" />\n        <w:szCs w:val="24" />',
                    '<w:sz w:val="22" />\n        <w:szCs w:val="22" />')        # 11pt body
    st = st.replace('<w:spacing w:after="200" />', '<w:spacing w:after="80" />')

    def edit_style(xml, sid, before=None, after=None, sz=None, bold=False):
        m = re.search(r'(<w:style [^>]*w:styleId="%s".*?</w:style>)' % re.escape(sid), xml, re.S)
        if not m:
            print("  WARN: style not found:", sid); return xml
        nb = m.group(1)
        if before is not None or after is not None:
            def repsp(mm):
                s = mm.group(0)
                if before is not None: s = re.sub(r'w:before="\d+"', 'w:before="%d"' % before, s)
                if after  is not None: s = re.sub(r'w:after="\d+"',  'w:after="%d"'  % after,  s)
                return s
            nb = re.sub(r'<w:spacing[^/]*/>', repsp, nb, count=1)
        if sz is not None:
            nb = re.sub(r'<w:sz w:val="\d+" />',   '<w:sz w:val="%d" />'   % sz, nb)
            nb = re.sub(r'<w:szCs w:val="\d+" />', '<w:szCs w:val="%d" />' % sz, nb)
        if bold and '<w:b/>' not in nb and '<w:b ' not in nb:
            nb = re.sub(r'(<w:rPr>)', r'\1<w:b/><w:bCs/>', nb, count=1)
        return xml[:m.start(1)] + nb + xml[m.end(1):]

    st = edit_style(st, 'Heading1', before=0,   after=40, sz=36, bold=True)   # name
    st = edit_style(st, 'Heading2', before=140, after=40, sz=26, bold=True)   # sections
    st = edit_style(st, 'Heading3', before=120, after=20, sz=24, bold=True)   # job titles
    st = edit_style(st, 'BodyText', before=0,   after=80)
    data['word/styles.xml'] = st.encode('utf-8')

    doc = data['word/document.xml'].decode('utf-8')
    sect = ('<w:pgSz w:w="12240" w:h="15840" /><w:pgMar w:top="720" w:right="1080" '
            'w:bottom="720" w:left="1080" w:header="432" w:footer="432" w:gutter="0" />')
    doc = doc.replace('<w:sectPr>', '<w:sectPr>' + sect, 1)
    data['word/document.xml'] = doc.encode('utf-8')

    zo = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
    for n, b in data.items(): zo.writestr(n, b)
    zo.close()


def build(base):
    base = base[:-3] if base.endswith(".md") else base
    if not os.path.isabs(base):
        base = os.path.join(RESUME_DIR, base)
    md = open(base + ".md").read()
    for a, b in NORM: md = md.replace(a, b)
    md = "\n".join(re.sub(r"(?<=\S)  +", " ", l) for l in md.split("\n"))
    ascii_md = os.path.join(tempfile.gettempdir(), "ascii.md")
    open(ascii_md, "w").write(md)
    subprocess.run(["pandoc", ascii_md, "-f", "markdown-smart",
                    "-o", base + ".docx", "--reference-doc", REF], check=True)
    print("BUILT:", os.path.basename(base) + ".docx", os.path.getsize(base + ".docx"), "bytes")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    REF = os.path.join(tempfile.gettempdir(), "ref_helv.docx")
    make_reference(REF)
    for arg in sys.argv[1:]:
        build(arg)
