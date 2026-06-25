// Write JD signal-JSON sidecars (<job>.md.json) for every saved job.
// Signals come from the workflow's per-chunk temp files (/tmp/enrichment-jd-*.json);
// frontmatter + body are parsed deterministically from each .md so the sidecar
// always satisfies config/job.schema.json even if a chunk produced no signals.
// Run: node scripts/write-jd-sidecars.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { displayPath, userPath } from "../src/core/paths/workspace.mjs";
import { parseYaml } from "../src/core/profile/yaml.mjs";

// Full YAML parse when it works; otherwise a lenient top-level-scalar fallback
// that skips nested blocks (e.g. a messy `history:` list with embedded quotes).
// Consumers only need company/role plus the simple scalars, so the fallback is safe.
function parseFrontmatter(fmText) {
  try {
    const parsed = parseYaml(fmText);
    if (parsed && typeof parsed === "object") return { fm: parsed, lenient: false };
  } catch {
    /* fall through */
  }
  const out = {};
  for (const line of fmText.split("\n")) {
    if (/^\s/.test(line)) continue; // indented → nested, skip
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (val === "") continue; // nested block header (e.g. `history:`)
    val = val.replace(/^["']|["']$/g, "");
    if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
    else if (val === "true" || val === "false") val = val === "true";
    out[m[1]] = val;
  }
  return { fm: out, lenient: true };
}

const TMP = "/tmp";
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const pathCtx = { repoRoot: ROOT };
const JOBS = userPath(pathCtx, "workspace/jobs");

// 1) gather signals keyed by file path from all chunk temp files
const sigByFile = new Map();
for (const cf of readdirSync(TMP).filter((f) => /^enrichment-jd-\d+\.json$/.test(f))) {
  let data;
  try {
    data = JSON.parse(readFileSync(`${TMP}/${cf}`, "utf8"));
  } catch {
    console.error(`skip unreadable ${cf}`);
    continue;
  }
  for (const r of data.results || []) {
    if (!r?.file) continue;
    const sig = Array.isArray(r.signals) ? r.signals : [];
    const file = String(r.file);
    const keys = new Set([file, isAbsolute(file) ? file : userPath(pathCtx, file)]);
    for (const key of keys) {
      const prev = sigByFile.get(key);
      // non-empty wins: a re-extraction patch overrides an earlier empty result
      if (sig.length || !prev || !prev.length) sigByFile.set(key, sig);
    }
  }
}

// 2) write a sidecar for every JD .md
const jdFiles = readdirSync(JOBS)
  .filter((f) => f.endsWith(".md") && !f.endsWith(".md.json") && f !== "README.md")
  .map((f) => join(JOBS, f));

let written = 0;
const noSignals = [];
const noFrontmatter = [];
const lenient = [];
for (const f of jdFiles) {
  const raw = readFileSync(f, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  let frontmatter = {};
  let body = raw;
  if (m) {
    const parsed = parseFrontmatter(m[1]);
    frontmatter = parsed.fm;
    body = m[2];
    if (parsed.lenient) lenient.push(f);
  } else {
    noFrontmatter.push(f);
  }
  if (!frontmatter?.company || !frontmatter.role) noFrontmatter.push(f);
  const signals = sigByFile.get(f) || [];
  if (!signals.length) noSignals.push(f);
  writeFileSync(`${f}.json`, `${JSON.stringify({ frontmatter, body, signals }, null, 2)}\n`);
  written++;
}

console.log(
  `Wrote ${written} sidecars (${jdFiles.length} JDs) in ${displayPath(pathCtx, "workspace/jobs")}.`
);
console.log(
  `  with signals: ${written - noSignals.length} · no signals: ${noSignals.length} · lenient frontmatter: ${lenient.length} · missing company/role: ${noFrontmatter.length}`
);
if (lenient.length) console.log(`Lenient-parsed:\n  ${lenient.join("\n  ")}`);
if (noSignals.length) console.log(`No-signal files:\n  ${noSignals.join("\n  ")}`);
if (noFrontmatter.length) console.log(`No-frontmatter files:\n  ${noFrontmatter.join("\n  ")}`);
