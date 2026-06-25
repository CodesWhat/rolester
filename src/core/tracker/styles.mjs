// Tracker dashboard stylesheet. Extracted from dashboard.mjs so cosmetic
// tweaks live in one place instead of the HTML generator.
export const DASHBOARD_CSS = `
  /* ── Design tokens ──────────────────────────────────────────────────────
     Default theme is Paper Command Center: warm cream paper, ink text,
     coral primary actions, and teal/mustard status accents. */
  :root {
    --bg: #faf6ef;
    --surface: #fffaf2;
    --surface-alt: #f5f0e8;
    --text: #2b2724;
    --text-muted: #5a4f4a;
    --border: #dfd2c2;
    --header-bg: #f5f0e8;
    --header-text: #2b2724;
    --shadow: 0 12px 28px rgba(43, 39, 36, 0.08), 0 2px 4px rgba(43, 39, 36, 0.04);

    /* Paper Command Center accent palette */
    --accent: #e8553d;  /* coral   */
    --green:  #2f9e8f;  /* teal    */
    --red:    #ba2f20;  /* danger  */
    --orange: #e0a93b;  /* mustard */
    --purple: #7b5f4b;  /* umber   */
    --cyan:   #2f9e8f;  /* teal    */

    /* Monogram avatar slots */
    --c-0: var(--accent);
    --c-1: var(--green);
    --c-2: var(--purple);
    --c-3: var(--orange);
    --c-4: var(--cyan);
    --c-5: var(--red);
  }

  [data-theme="dark"] {
    --bg: #282c34;
    --surface: #31363f;
    --surface-alt: #3a404b;
    --text: #abb2bf;
    --text-muted: #828a97;
    --border: #3b4048;
    --header-bg: #21252b;
    --header-text: #abb2bf;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.25);

    /* One Dark Pro accent palette */
    --accent: #61afef;
    --green:  #98c379;
    --red:    #e06c75;
    --orange: #d19a66;
    --purple: #c678dd;
    --cyan:   #56b6c2;
  }

  /* ── Alternate palettes ──────────────────────────────────────────────────
     The hero dropdown picks a FAMILY (original / spinel / charcoal / slate);
     the ☀/☾ toggle picks the MODE (light / dark) within it. So each family has
     two blocks, keyed [data-theme="<family>-<mode>"]. Each block re-declares the
     base tokens + the six accents; --c-0..--c-5 inherit their var(--accent)/etc.
     mapping from :root, so monogram slots and funnel colors re-theme for free.
     ("original" reuses :root for light and [data-theme="dark"] for dark.) */

  /* Spinel Light (ruby gemstone) — lavender-grey surfaces, brick-red accent,
     slate table headers. Faithful port of light_spinel.json. */
  [data-theme="spinel-light"] {
    --bg: #f1f0f6;
    --surface: #e3e2ec;
    --surface-alt: #dcdaeb;
    --text: #3f3a45;
    --text-muted: #807e86;
    --border: #cdccd3;
    --header-bg: #98a4bd;
    --header-text: #ffffff;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.05);
    --accent: #c03737;  /* keyword brick red */
    --green:  #158927;
    --red:    #9e2b2b;  /* deeper than accent so danger ≠ in-progress */
    --orange: #ea7d16;
    --purple: #a83bbf;
    --cyan:   #03a2a2;
  }

  /* Spinel Dark (ruby gemstone) — charcoal surfaces, coral-red accent,
     lavender-tinted text. Faithful port of dark_spinel.json. */
  [data-theme="spinel-dark"] {
    --bg: #2f2f2f;
    --surface: #3a3a3a;
    --surface-alt: #454545;
    --text: #d1ccf1;
    /* text-muted lifted slightly — #9893ad has low contrast on #3a3a3a charcoal */
    --text-muted: #aba5c2;
    --border: #505050;        /* slightly lighter — #484848 bleeds into surface */
    --header-bg: #262626;     /* a step below bg so header reads as a distinct zone */
    --header-text: #d1ccf1;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.25);
    --accent: #dd5555;  /* coral keyword red */
    --green:  #5ac16c;
    --red:    #ef6b66;
    --orange: #ff9a3b;
    --purple: #d464eb;
    --cyan:   #7dcfcf;
  }

  /* Slate & Coral — your swatch: #364651 blue-slate + #D3423D coral, #B23028
     brick as the distinct danger red. */
  [data-theme="slate-light"] {
    --bg: #f6f8fa;
    --surface: #e9eef2;
    --surface-alt: #dce4ea;
    --text: #2c3942;
    --text-muted: #6b7a84;
    --border: #d4dde3;
    --header-bg: #dce4ea;
    --header-text: #2c3942;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.05);
    --accent: #d3423d;  /* swatch coral */
    --green:  #3f8f5a;
    --red:    #b23028;  /* swatch brick */
    --orange: #c1700a;
    --purple: #9a4fb0;
    --cyan:   #2f8f9a;
  }
  [data-theme="slate-dark"] {
    --bg: #2c3942;
    --surface: #364651;
    --surface-alt: #41535f;
    --text: #dde6ea;
    --text-muted: #9fb3bc;    /* lightened slightly from #93a4ad for better contrast */
    /* border was identical to surface-alt — step it darker so row lines read */
    --border: #4e636f;
    --header-bg: #232e35;
    --header-text: #dde6ea;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.3);
    --accent: #d3423d;  /* swatch coral */
    --green:  #7fbf86;
    --red:    #c44038;  /* stepped up from #b23028 — deeper brick reads too dark in dark mode */
    --orange: #e2974a;
    --purple: #b98cd6;
    --cyan:   #5bb8c4;
  }

  /* Box (Hack The Box) — iTerm2 scheme: navy #141d2b + lime-green #9fef00 accent.
     Green-accented (not red); ANSI red #cc0403/#f2201f used for danger. */
  [data-theme="box-light"] {
    --bg: #f4f7fb;
    --surface: #e7edf5;
    --surface-alt: #d9e2ee;
    --text: #141d2b;
    --text-muted: #5e6b80;
    --border: #d2dbe8;
    --header-bg: #141d2b;
    --header-text: #9fef00;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.05);
    --accent: #5a9e00;  /* lime toned for white-bg legibility */
    --green:  #2f8f3e;
    --red:    #cc0403;  /* ANSI red */
    --orange: #b07d00;
    --purple: #a01ea6;
    --cyan:   #0a8f8f;
  }
  [data-theme="box-dark"] {
    --bg: #141d2b;
    --surface: #1d2a3d;
    --surface-alt: #26354b;
    --text: #cdd6e5;
    --text-muted: #7e8ca6;
    --border: #2b3a52;
    --header-bg: #0f1622;
    --header-text: #9fef00;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3);
    --accent: #9fef00;  /* HTB lime */
    --green:  #2fb344;
    --red:    #f2201f;  /* ANSI bright red */
    --orange: #e0a52a;
    --purple: #cb1ed1;
    --cyan:   #0dcdcd;
  }

  /* Tokyo Night — the popular editor palette. Light is "Tokyo Night Light"
     (deep-blue ink on warm-grey paper); dark is the classic "Storm"-adjacent
     night with periwinkle text. */
  [data-theme="tokyonight-light"] {
    --bg: #e1e2e7;
    --surface: #d5d6db;
    --surface-alt: #c8cad3;
    --text: #3760bf;          /* TN-light foreground is itself a blue */
    /* text-muted lifted from #848cb5 → #6e7599 for better contrast on light surfaces */
    --text-muted: #6e7599;
    --border: #b8bcd0;        /* slightly darker than before so borders are visible */
    --header-bg: #c0c2ce;     /* stepped down from surface-alt so header reads distinct */
    --header-text: #3760bf;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.05);
    --accent: #2e7de9;
    --green:  #4d6a2e;        /* darkened slightly for legibility on light bg */
    --red:    #d41f57;        /* toned from #f52a65 — still vivid, less neon */
    --orange: #7a5c2e;        /* darkened for legibility */
    --purple: #7c44cc;        /* toned from #9854f1 */
    --cyan:   #005f80;        /* darkened from #007197 */
  }
  [data-theme="tokyonight-dark"] {
    --bg: #1a1b26;
    --surface: #1f2335;
    --surface-alt: #292e42;
    --text: #c0caf5;
    /* text-muted lifted from #565f89 → #7281b8 — the original is too dark on surface */
    --text-muted: #7281b8;
    --border: #343b58;        /* slightly lighter than before so borders are visible */
    --header-bg: #16161e;
    --header-text: #c0caf5;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3);
    --accent: #7aa2f7;
    --green:  #9ece6a;
    --red:    #f7768e;
    --orange: #e0af68;
    --purple: #bb9af7;
    --cyan:   #7dcfff;
  }

  /* Gruvbox — retro warm palette. Light is the cream "bg0" paper; dark is the
     classic "#282828" with sand-coloured text. */
  [data-theme="gruvbox-light"] {
    --bg: #fbf1c7;
    --surface: #ebdbb2;
    --surface-alt: #d5c4a1;
    --text: #3c3836;
    --text-muted: #665c54;    /* darkened from #7c6f64 — better contrast on cream */
    /* border was identical to surface-alt (#d5c4a1) making row lines invisible;
       step it one notch darker so table separators actually read */
    --border: #c0a882;
    --header-bg: #cdc0a0;     /* step between surface-alt and border so header reads distinct */
    --header-text: #3c3836;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.05);
    --accent: #458588;        /* gruvbox blue/aqua */
    --green:  #79740e;        /* darkened from #98971a — better on light bg */
    --red:    #cc241d;
    --orange: #d65d0e;
    --purple: #b16286;
    --cyan:   #427b58;        /* darkened from #689d6b */
  }
  [data-theme="gruvbox-dark"] {
    --bg: #282828;
    --surface: #3c3836;
    --surface-alt: #504945;
    --text: #ebdbb2;
    /* text-muted: #a89984 is fine on dark bg but slightly low — keep, it's authentic */
    --text-muted: #a89984;
    /* border was identical to surface-alt (#504945) — step it lighter so row lines read */
    --border: #665c54;
    --header-bg: #1d2021;
    --header-text: #ebdbb2;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3);
    --accent: #83a598;        /* gruvbox bright aqua */
    --green:  #b8bb26;
    --red:    #fb4934;
    --orange: #fe8019;
    --purple: #d3869b;
    --cyan:   #8ec07c;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); padding: 2rem; transition: background 0.15s ease, color 0.15s ease; }
  .wrap { max-width: 1180px; margin: 0 auto; }
  /* ── Hero ─────────────────────────────────────────────────────────────
     Rat mark stretches to the full height of the eyebrow + heading + subtitle
     stack; the actions (timestamp + theme toggle) pin to the top-right. */
  .hero { display: flex; align-items: stretch; gap: 1.5rem; padding: 0.5rem 0 0.25rem; }
  .brand-logo { flex: 0 0 auto; align-self: stretch; width: auto; height: auto; aspect-ratio: 1 / 1; max-height: 8.5rem; min-height: 4rem; object-fit: contain; border-radius: 16px; display: block; transition: filter 0.15s ease; }
  /* Dark mode: invert the rat so it reads on dark backgrounds; hue-rotate keeps the red tie red rather than flipping it to cyan. data-mode=dark is set for every dark theme family. */
  [data-mode="dark"] .brand-logo { filter: invert(1) hue-rotate(180deg); }
  .hero-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .eyebrow { font-size: 0.72rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--cyan); font-weight: 700; margin-bottom: 0.5rem; }
  h1 { font-size: 2.4rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; margin: 0; }
  .hero h1 { color: var(--text); }
  /* Hero subtitle: a segmented metadata strip (identity · targeting · floor),
     not a run-on sentence. Mono labels + generous column gaps carry the structure;
     it wraps gracefully on its own (no manual line breaks). */
  .sub { color: var(--text-muted); margin-top: 0.7rem; font-size: 0.9rem; line-height: 1.4;
         display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 1.9rem; row-gap: 0.45rem; }
  .sub b { color: var(--text); font-weight: 650; }
  .hm-seg { display: inline-flex; align-items: baseline; gap: 0.5rem; }
  .hm-role { color: var(--text-muted); }
  .hm-dot { color: var(--text-muted); opacity: 0.45; }
  .hm-k { font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--text-muted); opacity: 0.7; }
  h2 { font-size: 1.25rem; margin: 2rem 0 0.75rem; color: var(--text); display: flex; align-items: center; gap: 0.55rem; }
  h2 .ic { width: 18px; height: 18px; color: var(--cyan); flex: 0 0 auto; }
  h2.overdue { color: var(--red); }
  h2.overdue .ic { color: var(--red); }
  .hero-actions { display: flex; align-items: center; gap: 0.75rem; flex: 0 0 auto; align-self: flex-start; }
  @media (max-width: 640px) {
    .hero { flex-wrap: wrap; align-items: flex-start; }
    .brand-logo { max-height: 4.5rem; }
    .hero-actions { order: -1; margin-left: auto; }
    .hero-text { flex-basis: 100%; }
    h1 { font-size: 1.9rem; }
  }
  .ts { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; }
  .theme-toggle { display: inline-flex; align-items: center; justify-content: center; width: 2.2rem; height: 2.2rem; padding: 0; background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; flex: 0 0 auto; }
  .theme-toggle:hover { border-color: var(--accent); color: var(--accent); }
  .theme-toggle svg { width: 18px; height: 18px; display: block; }
  .theme-toggle .icon-sun { display: none; }
  [data-mode="dark"] .theme-toggle .icon-sun { display: block; }
  [data-mode="dark"] .theme-toggle .icon-moon { display: none; }
  /* Palette picker — native select, themed chrome */
  .theme-select { height: 2.2rem; padding: 0 0.55rem; background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 8px; font-family: inherit; font-size: 0.78rem; font-weight: 600; cursor: pointer; flex: 0 0 auto; }
  .theme-select:hover { border-color: var(--accent); }
  .theme-select:focus { outline: none; border-color: var(--accent); }

  /* ── Stat cards (command center) ─────────────────────────────────────── */
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 1.5rem 0 1rem; }
  .stat { background: var(--surface); border-radius: 12px; padding: 18px 18px 16px; transition: transform 0.16s; }
  .stat-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .stat-ico { display: inline-flex; color: var(--stat-c, var(--accent)); flex: 0 0 auto; }
  .stat-ico .ic { width: 22px; height: 22px; }
  .stat-n { font-size: 2.2rem; font-weight: 800; line-height: 1; color: var(--stat-c, var(--accent)); letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
  .stat-l { font-size: 0.75rem; color: var(--text-muted); margin-top: 8px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
  @media (prefers-reduced-motion: no-preference) {
    @keyframes stat-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .stat { animation: stat-rise 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
    .stat:nth-child(2) { animation-delay: 0.06s; }
    .stat:nth-child(3) { animation-delay: 0.12s; }
    .stat:nth-child(4) { animation-delay: 0.18s; }
  }
  @media (max-width: 640px) { .stats { grid-template-columns: repeat(2, 1fr); } }

  /* ── Funnel section ───────────────────────────────────────────────────── */
  .funnel-section { background: var(--surface); border-radius: 12px; padding: 1.5rem; margin: 3rem 0; }
  .funnel-section h2 { margin-top: 0; }
  .funnel-empty { color: var(--text-muted); font-size: 0.9rem; padding: 2rem 0; text-align: center; }
  .funnel-legend { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; margin-top: 14px; font-size: 12.5px; color: var(--text-muted); }
  .funnel-legend span { display: inline-flex; align-items: center; gap: 6px; }
  .dot { width: 9px; height: 9px; border-radius: 2px; display: inline-block; flex: 0 0 auto; }

  /* SVG funnel */
  svg#sankey { width: 100%; height: auto; display: block; overflow: visible; }
  svg#sankey .lbl { font-family: inherit; font-size: 13.5px; font-weight: 600; fill: var(--text); letter-spacing: -0.01em; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; cursor: pointer; }
  svg#sankey .lbl .v { fill: var(--text-muted); font-weight: 500; font-variant-numeric: tabular-nums; }
  svg#sankey .colh { font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; fill: var(--text-muted); font-weight: 700; text-anchor: middle; }
  svg#sankey .ribbon { transition: opacity 0.22s ease, filter 0.22s ease; cursor: pointer; }
  svg#sankey .node { transition: opacity 0.22s ease; cursor: pointer; fill-opacity: 0.82; }
  svg#sankey.focus .ribbon { opacity: 0.16; }
  svg#sankey.focus .ribbon.on { opacity: 1; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.35)); }
  svg#sankey.focus .node { opacity: 0.32; }
  svg#sankey.focus .node.on { opacity: 1; }
  svg#sankey.focus .lbl { opacity: 0.32; transition: opacity 0.22s ease; }
  svg#sankey.focus .lbl.on { opacity: 1; }

  /* Node color classes — fill uses CSS token so both themes work */
  .nc-accent { fill: var(--accent); }
  .nc-green { fill: var(--green); }
  .nc-red { fill: var(--red); }
  .nc-orange { fill: var(--orange); }
  .nc-purple { fill: var(--purple); }
  .nc-cyan { fill: var(--cyan); }
  .nc-text-muted { fill: var(--text-muted); }

  /* Gradient stop colors — same CSS-token mechanism as the node bars above, so
     ribbons stay colored and re-theme automatically. patchGradientStops() in the
     page script is a belt-and-suspenders fallback for engines that ignore var()
     in stop-color (the CSS property wins over the JS-set attribute when both apply). */
  svg#sankey stop.gs-src-accent, svg#sankey stop.gs-tgt-accent { stop-color: var(--accent); }
  svg#sankey stop.gs-src-green, svg#sankey stop.gs-tgt-green { stop-color: var(--green); }
  svg#sankey stop.gs-src-red, svg#sankey stop.gs-tgt-red { stop-color: var(--red); }
  svg#sankey stop.gs-src-orange, svg#sankey stop.gs-tgt-orange { stop-color: var(--orange); }
  svg#sankey stop.gs-src-purple, svg#sankey stop.gs-tgt-purple { stop-color: var(--purple); }
  svg#sankey stop.gs-src-cyan, svg#sankey stop.gs-tgt-cyan { stop-color: var(--cyan); }
  svg#sankey stop.gs-src-text-muted, svg#sankey stop.gs-tgt-text-muted { stop-color: var(--text-muted); }

  /* Floating tooltip */
  .fteip { position: fixed; z-index: 60; display: none; pointer-events: none; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; box-shadow: var(--shadow); white-space: nowrap; }
  .fteip .ft-flow { font-size: 11px; color: var(--text-muted); font-weight: 500; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
  .fteip .ft-swatch { width: 8px; height: 8px; border-radius: 2px; display: inline-block; flex: 0 0 auto; }
  .fteip .ft-n { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--text); }
  .fteip .ft-n small { font-size: 12px; font-weight: 500; color: var(--text-muted); margin-left: 5px; }

  /* Funnel filter chip */
  .funnel-chip { display: inline-flex; align-items: center; gap: 8px; background: color-mix(in srgb, var(--cyan) 12%, var(--surface)); border: 1px solid color-mix(in srgb, var(--cyan) 40%, transparent); color: var(--cyan); border-radius: 8px; padding: 6px 12px; font-size: 12.5px; font-weight: 600; cursor: pointer; white-space: nowrap; margin-bottom: 8px; }
  .funnel-chip .x { font-size: 14px; line-height: 1; opacity: 0.8; }
  .funnel-chip:hover { background: color-mix(in srgb, var(--cyan) 20%, var(--surface)); }

  /* Tables — fixed layout so Company/Role columns align across every table */
  table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: 8px; overflow: hidden; margin-bottom: 1rem; table-layout: fixed; }
  th { background: var(--header-bg); color: var(--header-text); text-align: left; padding: 0.6rem 1rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 0.55rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; vertical-align: top; }
  /* Shared leading column widths → Company + Role line up table-to-table */
  th:first-child, td:first-child { width: 15rem; }
  th:nth-child(2), td:nth-child(2) { width: 15rem; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: var(--surface-alt); }
  .co { display: inline-flex; align-items: center; gap: 0.5rem; max-width: 100%; min-width: 0; }
  .co-name { font-weight: 500; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .avatar { position: relative; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 6px; font-size: 0.82rem; font-weight: 700; flex: 0 0 auto; color: var(--avatar); background: color-mix(in srgb, var(--avatar) 20%, var(--surface)); border: 1px solid color-mix(in srgb, var(--avatar) 35%, transparent); }
  /* Logo image sits inset from the chip edge so it has breathing room (never
     touches the rounded corners). Inset is relative so it scales with chip size. */
  .avatar .logo-img { position: absolute; inset: 16%; width: 68%; height: 68%; object-fit: contain; background: transparent; }
  /* Logo chip: clean white backdrop, initials hidden underneath (revealed by
     onerror if the image fails). Works for both transparent and solid logos. */
  .avatar.has-logo { background: #ffffff; border-color: var(--border); color: transparent; }
  /* Work-mode cell: small glyph + label */
  .mode-cell { display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; }
  .mode-cell .ic { width: 14px; height: 14px; color: var(--text-muted); flex: 0 0 auto; }
  /* Fit score: number + a band-coloured bar filled to the score */
  .score { display: inline-flex; align-items: center; gap: 0.5rem; justify-content: flex-end; white-space: nowrap; }
  .score-n { font-weight: 800; font-size: 0.8rem; min-width: 1.4em; text-align: right; font-variant-numeric: tabular-nums; }
  .score-bar { width: 46px; height: 6px; border-radius: 6px; background: color-mix(in srgb, var(--text) 12%, transparent); overflow: hidden; flex-shrink: 0; }
  .score-bar i { display: block; height: 100%; border-radius: 6px; }
  /* Triage fit (coarse pre-evaluation estimate): hollow/dashed bar + dimmed
     number so it is visibly distinct from a calibrated, body-read fit. */
  .score.triage .score-n { opacity: 0.78; font-weight: 700; }
  .score.triage .score-bar { background: transparent; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text) 24%, transparent); }
  .score.triage .score-bar i { opacity: 0.45; }
  .badge { display: inline-block; padding: 0.2em 0.6em; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: var(--sc, var(--text-muted)); background: color-mix(in srgb, var(--sc, var(--text-muted)) 16%, var(--surface)); }
  .badge-applied, .badge-submitted, .badge-awaiting, .badge-waiting, .badge-drafted, .badge-scheduled { color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, var(--surface)); }
  .badge-interview, .badge-reviewing, .badge-screening, .badge-passed { color: var(--green); background: color-mix(in srgb, var(--green) 16%, var(--surface)); }
  .badge-offer { color: var(--green); background: color-mix(in srgb, var(--green) 22%, var(--surface)); font-weight: 700; }
  .badge-rejected, .badge-closed, .badge-withdrawn, .badge-blocked { color: var(--red); background: color-mix(in srgb, var(--red) 16%, var(--surface)); }
  .badge-needs-reply { color: var(--orange); background: color-mix(in srgb, var(--orange) 18%, var(--surface)); }
  .muted { color: var(--text-muted); font-size: 0.9rem; }
  .no-data { background: var(--surface); border-radius: 8px; padding: 2rem; text-align: center; color: var(--text-muted); margin-top: 1rem; }

  /* Hidden app rows when funnel filter active */
  #apps-table tbody tr[data-stage].hidden { display: none; }

  /* ── New: scrollable apps table + numeric columns ───────────────────────── */
  .table-scroll { overflow-x: auto; }
  #apps-table { min-width: 60rem; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }

  /* ── Badge variants: sourced + referral ─────────────────────────────────── */
  .badge-sourced { color: var(--purple); background: color-mix(in srgb, var(--purple) 16%, var(--surface)); }
  .badge-referral { color: var(--cyan); background: color-mix(in srgb, var(--cyan) 16%, var(--surface)); }

  /* ── Row hover tooltip (.jobtip) ────────────────────────────────────────── */
  .jobtip { position: fixed; z-index: 55; display: none; pointer-events: none; width: 22rem; background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; box-shadow: var(--shadow); }
  .jobtip .jt-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
  .jobtip .jt-company { font-weight: 700; font-size: 13px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .jobtip .jt-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 12px; padding-top: 10px; border-top: 1px solid var(--border); }
  .jobtip .jt-k { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 3px; }
  .jobtip .jt-v { font-size: 12px; font-weight: 600; color: var(--text); overflow-wrap: anywhere; }
  .jobtip .jt-note { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); font-size: 12px; line-height: 1.5; color: var(--text-muted); }
  .jobtip .jt-note-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--cyan); font-weight: 700; margin-bottom: 4px; }
  .jobtip .jt-warn { margin-top: 10px; padding: 7px 10px; border-radius: 6px; font-size: 12px; line-height: 1.45; border: 1px solid color-mix(in srgb, var(--orange) 40%, transparent); background: color-mix(in srgb, var(--orange) 10%, var(--surface)); color: var(--orange); }

  /* ── All Jobs table ───────────────────────────────────────────────────────── */
  .jobs-section { margin: 3rem 0; }
  .sec-h { display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
  .sec-h h2 { margin: 0; }
  .jobs-count { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .jobs-hint { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex-shrink: 1; }

  /* Search + reset bar */
  .tbl-controls { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
  .tbl-search { flex: 1; min-width: 220px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 9px 14px; color: var(--text); font-size: 13px; font-family: inherit; transition: border-color 0.12s; }
  .tbl-search:focus { outline: none; border-color: var(--accent); }
  .tbl-search::placeholder { color: var(--text-muted); }
  .tbl-reset { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 9px 14px; color: var(--text-muted); font-size: 12.5px; font-family: inherit; cursor: pointer; font-weight: 600; white-space: nowrap; transition: background 0.12s, color 0.12s; }
  .tbl-reset:hover { background: var(--surface-alt); color: var(--text); }

  /* Active-filter chips */
  .active-filters { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 10px; }
  .active-filters:empty { display: none; }
  .fchip { display: inline-flex; align-items: center; gap: 7px; background: var(--surface-alt); border: 1px solid var(--border); color: var(--text-muted); border-radius: 8px; padding: 5px 10px; font-size: 12px; font-weight: 600; white-space: nowrap; }
  .fchip .x { cursor: pointer; color: var(--text-muted); font-size: 13px; line-height: 1; opacity: 0.8; transition: color 0.1s; }
  .fchip .x:hover { color: var(--text); opacity: 1; }

  /* Jobs table wrapper — horizontal scroll on narrow viewports */
  .tbl-wrap { border-radius: 10px; background: var(--surface); overflow-x: auto; }

  /* The jobs table itself */
  table.jobs { width: 100%; border-collapse: collapse; background: transparent; border-radius: 0; margin-bottom: 0; table-layout: fixed; font-size: 13px; min-width: 700px; }
  table.jobs col.c-co   { width: 19%; }
  table.jobs col.c-role { width: 41%; }
  table.jobs col.c-base { width: 8%;  }
  table.jobs col.c-mode { width: 8%;  }
  table.jobs col.c-fit  { width: 12%; }
  table.jobs col.c-state{ width: 12%; }

  /* Header row: sortable, sticky */
  table.jobs thead th { background: var(--header-bg); color: var(--header-text); text-align: center; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; cursor: pointer; user-select: none; white-space: nowrap; position: sticky; top: 0; z-index: 3; transition: color 0.12s; }
  table.jobs thead th:hover { color: var(--accent); }
  table.jobs thead th .arr { color: var(--accent); margin-left: 4px; font-size: 10px; }

  /* Filter row (per-column inputs): sticky below header, same background so header reads as one unit */
  table.jobs tr.filt th { background: var(--header-bg); padding: 6px 8px; border-bottom: 1px solid var(--border); position: sticky; top: 26px; z-index: 2; cursor: default; }
  table.jobs tr.filt input,
  table.jobs tr.filt select { width: 100%; min-width: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 4px 7px; color: var(--text); font-size: 11.5px; font-family: inherit; transition: border-color 0.12s; }
  table.jobs tr.filt input:focus,
  table.jobs tr.filt select:focus { outline: none; border-color: var(--accent); }
  table.jobs tr.filt input::placeholder { color: var(--text-muted); }

  /* Body rows */
  table.jobs tbody td { padding: 8px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  table.jobs tbody tr:last-child td { border-bottom: none; }
  table.jobs tbody tr:hover td { background: color-mix(in srgb, var(--accent) 5%, var(--surface)); }
  table.jobs tbody tr.hidden { display: none; }

  /* Column-specific body styles */
  table.jobs td.jt-role   { font-weight: 600; }
  table.jobs td.jt-base   { font-weight: 700; color: var(--text); }
  table.jobs td.jt-mode   { text-align: center; }
  table.jobs td.jt-mode .ic { width: 16px; height: 16px; color: var(--text-muted); display: block; margin: 0 auto; }
  table.jobs td.jt-fit    { text-align: right; }
  table.jobs td.jt-status { text-align: center; overflow: visible; text-overflow: clip; }
  table.jobs td.jt-status .badge { font-size: 11px; }

  /* Badge variant for sourced status */
  .badge-sourced { color: var(--purple); background: color-mix(in srgb, var(--purple) 16%, var(--surface)); }

  @media (max-width: 900px) { .jobs-hint { display: none; } }
  @media (max-width: 640px) { .tbl-wrap { border-radius: 8px; } }

  /* ── Active Pipeline card grid ────────────────────────────────────────────── */
  .active-section { margin: 3rem 0; }
  .active-section .empty { color: var(--text-muted); font-size: 0.9rem; padding: 1rem 0; }

  /* Stage filter chips (each carries its stage colour via --sc). */
  .stagefilter { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
  .stage-btn { background: var(--surface); border: 1px solid color-mix(in srgb, var(--sc, var(--border)) 36%, var(--border)); color: var(--sc, var(--text-muted)); border-radius: 10px; padding: 7px 13px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 7px; }
  .stage-btn:hover { background: var(--surface-alt); }
  .stage-btn.on { background: color-mix(in srgb, var(--sc, var(--accent)) 18%, var(--surface)); border-color: color-mix(in srgb, var(--sc, var(--accent)) 55%, transparent); }
  .stage-btn .sdot { width: 8px; height: 8px; border-radius: 50%; background: var(--sc, var(--text-muted)); flex: none; }
  .stage-btn .bn { font-size: 11px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
  .stage-btn.on .bn { color: inherit; opacity: .85; }

  /* Stage groups (furthest-along first), each with a coloured header + count. */
  .pipeline-groups { display: flex; flex-direction: column; gap: 22px; }
  .stage-group.hidden { display: none; }
  .stage-group-h { display: flex; align-items: center; gap: 9px; margin-bottom: 11px; }
  .stage-group-h .sdot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
  .stage-group-h .sg-label { font-size: 13px; font-weight: 750; color: var(--text); letter-spacing: .01em; }
  .stage-group-h .sg-count { font-size: 11px; font-weight: 700; color: var(--text-muted); font-variant-numeric: tabular-nums; background: var(--surface-alt); border-radius: 20px; padding: 1px 8px; }
  .more-sourced { margin-top: 10px; font-size: 12px; color: var(--text-muted); }

  .pipeline-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 16px; }

  .card { background: var(--surface); border-radius: 16px; padding: 16px 17px; display: flex; flex-direction: column; gap: 11px; cursor: help; transition: transform .16s, background .16s; }
  .card:hover { transform: translateY(-3px); background: var(--surface-alt); }
  .card.hidden { display: none; }

  .card .chead { display: flex; align-items: flex-start; gap: 11px; }
  .card .chead .avatar { width: 2rem; height: 2rem; }
  .card .cmain { flex: 1; min-width: 0; }
  .card .crole { font-size: 14.5px; font-weight: 650; color: var(--text); line-height: 1.32; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .card .csub { font-size: 11.5px; color: var(--text-muted); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Stage pill: raw status label, coloured by stage (--sc). Fit chip lives in the meta row. */
  .card .spill { flex: none; max-width: 46%; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; line-height: 1; padding: 4px 9px; border-radius: 20px; color: var(--sc, var(--text-muted)); background: color-mix(in srgb, var(--sc, var(--text-muted)) 14%, var(--surface)); }
  .card .spill .sdot { width: 6px; height: 6px; border-radius: 50%; background: var(--sc, var(--text-muted)); flex: none; }
  .card .spill .spill-t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .card .cfit { font-size: 11.5px; font-weight: 750; font-variant-numeric: tabular-nums; }
  .card .cfit.triage { opacity: 0.7; font-weight: 650; }

  .card .ccomp { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; font-size: 12.5px; color: var(--text-muted); }
  .card .ccomp b { color: var(--accent); font-weight: 750; font-size: 14px; }
  .card .ccomp .sep { opacity: .5; }

  .card .cnote { font-size: 12px; color: var(--text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  .card .cmeta { display: flex; align-items: center; gap: 10px; border-top: 1px solid var(--border); padding-top: 11px; margin-top: auto; color: var(--text-muted); }
  .card .cmeta .mic { display: inline-flex; align-items: center; }
  .card .cmeta .mic .ic { width: 16px; height: 16px; }
  .card .cmeta .mic.warn { color: var(--orange); }
  .card .cmeta .cdate { margin-left: auto; font-size: 11.5px; font-variant-numeric: tabular-nums; }

  /* ── Company cell clickable ──────────────────────────────────────────────── */
  .co { cursor: pointer; }
  .co:hover .co-name { text-decoration: underline; color: var(--accent); }
  .co:hover .avatar { border-color: var(--accent); }

  /* ── Job detail modal ────────────────────────────────────────────────────── */
  #job-modal { position: fixed; inset: 0; z-index: 200; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,.5); backdrop-filter: blur(4px); padding: 1rem; }
  #job-modal.open { display: flex; }
  #job-modal-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 720px; max-height: 88vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,.3); position: relative; }
  #job-modal-close { position: absolute; top: 12px; right: 14px; background: none; border: none; color: var(--text-muted); font-size: 22px; line-height: 1; cursor: pointer; padding: 4px 8px; border-radius: 6px; z-index: 2; }
  #job-modal-close:hover { background: var(--surface-alt); color: var(--text); }
  #job-modal-body { overflow-y: auto; padding: 20px 24px 24px; flex: 1; }

  /* Modal header */
  .jm-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; padding-right: 32px; }
  .jm-titles { flex: 1; min-width: 0; }
  .jm-company { font-size: 1.25rem; font-weight: 800; color: var(--text); line-height: 1.2; }
  .jm-role { font-size: 0.9rem; color: var(--text-muted); margin-top: 3px; }
  .jm-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; align-items: center; }

  /* Facts grid (mirrors .jt-grid / .jt-k / .jt-v) */
  .jm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px 16px; padding: 14px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 16px; }
  .jm-k { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 3px; }
  .jm-v { font-size: 13px; font-weight: 600; color: var(--text); overflow-wrap: anywhere; }
  .jm-v a { color: var(--accent); text-decoration: none; }
  .jm-v a:hover { text-decoration: underline; }

  /* Artifact / email / conversation sections */
  .jm-section { margin-bottom: 18px; }
  .jm-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; color: var(--cyan); margin-bottom: 8px; }
  .jm-artifact-box { background: var(--surface-alt); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; white-space: pre-wrap; font-size: 12.5px; line-height: 1.6; color: var(--text); max-height: 240px; overflow-y: auto; word-break: break-word; }
  .jm-empty { color: var(--text-muted); font-size: 12.5px; font-style: italic; }

  /* Email thread */
  .jm-email-list { display: flex; flex-direction: column; gap: 10px; }
  .jm-email { background: var(--surface-alt); border-radius: 8px; padding: 10px 12px; }
  .jm-email-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
  .jm-dir { font-size: 12px; font-weight: 700; flex: 0 0 auto; }
  .jm-dir-in  { color: var(--green); }
  .jm-dir-out { color: var(--accent); }
  .jm-dir-note { color: var(--text-muted); }
  .jm-email-date { font-size: 11px; color: var(--text-muted); flex: 0 0 auto; }
  .jm-email-subject { font-size: 12.5px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .jm-email-summary { font-size: 12.5px; color: var(--text-muted); line-height: 1.5; }

  /* Conversations */
  .jm-conv-list { display: flex; flex-direction: column; gap: 10px; }
  .jm-conv { background: var(--surface-alt); border-radius: 8px; padding: 10px 12px; }
  .jm-conv-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap; }
  .jm-conv-date { font-size: 11px; color: var(--text-muted); }
  .jm-conv-kind { font-size: 12px; font-weight: 700; color: var(--text); }
  .jm-conv-who  { font-size: 12px; color: var(--text-muted); }
  .jm-conv-rec  { font-size: 11px; background: color-mix(in srgb, var(--green) 16%, var(--surface)); color: var(--green); border-radius: 4px; padding: 2px 6px; font-weight: 600; }
  .jm-conv-notes { font-size: 12.5px; color: var(--text); line-height: 1.5; }

  /* Responsive */
  @media (max-width: 560px) {
    #job-modal-panel { max-height: 96vh; border-radius: 12px; }
    #job-modal-body { padding: 14px 14px 18px; }
  }

  /* ── Needs Attention section ─────────────────────────────────────────────── */
  .attention-section { margin: 3rem 0; }
  .attention-list { display: flex; flex-direction: column; gap: 8px; }

  .att-item {
    display: flex; align-items: center; gap: 12px;
    background: var(--surface); border-radius: 8px; padding: 12px 16px;
    border: none; text-align: left; width: 100%;
    font-family: inherit; font-size: inherit; color: var(--text);
    transition: background 0.14s;
  }
  button.att-item { cursor: pointer; }
  div.att-item { cursor: default; }

  /* Ribbon-tinted urgency, matching the (borderless) pipeline cards: a faint
     full-surface wash keyed to the urgency colour — no border, no edge strip.
     Severity also shows in the coloured .att-when timestamp below. */
  .att-overdue { background: color-mix(in srgb, var(--red) 9%, var(--surface)); }
  .att-due     { background: color-mix(in srgb, var(--orange) 9%, var(--surface)); }
  button.att-overdue:hover { background: color-mix(in srgb, var(--red) 15%, var(--surface)); }
  button.att-due:hover     { background: color-mix(in srgb, var(--orange) 15%, var(--surface)); }

  .att-main { flex: 1 1 0; min-width: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 6px; }
  .att-co   { font-weight: 700; color: var(--text); white-space: nowrap; }
  .att-role { color: var(--text-muted); font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .att-reason { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: var(--text-muted); flex-basis: 100%; margin-top: 2px; }
  .att-reason .ic { width: 13px; height: 13px; flex: 0 0 auto; }

  .att-when { flex: 0 0 auto; font-variant-numeric: tabular-nums; font-weight: 600; font-size: 0.82rem; white-space: nowrap; }
  .att-overdue .att-when { color: var(--red); }
  .att-due     .att-when { color: var(--orange); }

  @media (max-width: 560px) {
    .att-item { flex-wrap: wrap; }
    .att-when { margin-left: auto; }
  }

  /* ── Unified Jobs section: sticky toolbar + view toggle ─────────────────── */
  /* The sticky toolbar holds the section heading, search box, reset button,
     and the Board/Table toggle. It sticks to the top of the viewport while
     scrolling so filters are always reachable. */
  .jobs-sticky-toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg);
    /* Opaque backdrop so table rows don't bleed through */
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 10px 0 10px;
    margin-bottom: 10px;
  }
  .jobs-toolbar-left {
    display: flex;
    align-items: baseline;
    gap: 0.65rem;
    flex: 0 0 auto;
  }
  .jobs-toolbar-h {
    margin: 0;
    font-size: 1.15rem;
  }
  .jobs-toolbar-center {
    display: flex;
    flex: 1 1 auto;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }
  .jobs-toolbar-right {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Segmented toggle control */
  .view-toggle {
    display: inline-flex;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    gap: 0;
  }
  .vt-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 13px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 12.5px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s, color 0.12s;
    line-height: 1;
  }
  .vt-btn .ic { width: 14px; height: 14px; flex: 0 0 auto; }
  .vt-btn + .vt-btn { border-left: 1px solid var(--border); }
  .vt-btn:hover { background: var(--surface-alt); color: var(--text); }
  .vt-btn.active {
    background: color-mix(in srgb, var(--accent) 14%, var(--surface));
    color: var(--accent);
  }
  .vt-btn.active:hover {
    background: color-mix(in srgb, var(--accent) 20%, var(--surface));
  }

  /* View wrap: all three views live here; CSS class shows/hides them */
  .jobs-view-wrap .jobs-table-view { display: block; }
  .jobs-view-wrap .jobs-board-view { display: none; }
  .jobs-view-wrap .jobs-calendar-view { display: none; }
  .jobs-view-wrap.jobs-view-board .jobs-table-view { display: none; }
  .jobs-view-wrap.jobs-view-board .jobs-board-view { display: block; }
  .jobs-view-wrap.jobs-view-calendar .jobs-table-view { display: none; }
  .jobs-view-wrap.jobs-view-calendar .jobs-calendar-view { display: block; }

  /* ── Calendar view ──────────────────────────────────────────────────────── */
  .jobs-calendar-view { padding-top: 4px; }
  .cal-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 10px 16px; margin-bottom: 14px;
  }
  .cal-nav { display: inline-flex; align-items: center; gap: 8px; }
  .cal-arrow {
    width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
    background: var(--surface); border: 1px solid var(--border); border-radius: 7px;
    color: var(--text-muted); font-size: 16px; line-height: 1; cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .cal-arrow:hover { background: var(--surface-alt); color: var(--text); border-color: var(--accent); }
  .cal-title {
    min-width: 150px; text-align: center; font-size: 14px; font-weight: 700;
    color: var(--text); font-variant-numeric: tabular-nums;
  }
  .cal-today-btn {
    margin-left: 4px; background: var(--surface-alt); border: 1px solid var(--border);
    border-radius: 7px; padding: 5px 12px; color: var(--text-muted);
    font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .cal-today-btn:hover { background: var(--surface); color: var(--accent); border-color: var(--accent); }
  .cal-legend { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 6px 14px; font-size: 11px; color: var(--text-muted); }
  .cal-lg { display: inline-flex; align-items: center; gap: 5px; }
  .cal-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: 0 0 auto; }
  .cal-dot--applied { background: var(--cyan); }
  .cal-dot--due     { background: var(--orange); }
  .cal-dot--overdue { background: var(--red); }

  .cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 6px; }
  .cal-weekdays span {
    text-align: center; font-size: 10.5px; font-weight: 700;
    letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-muted);
  }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
  .cal-cell {
    min-height: 86px; background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 6px; display: flex; flex-direction: column; gap: 4px;
    overflow: hidden;
  }
  .cal-cell--out { background: transparent; border-color: transparent; }
  .cal-cell--out .cal-cell-day { opacity: 0.4; }
  .cal-cell--today { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 7%, var(--surface)); }
  .cal-cell-day { font-size: 11px; font-weight: 700; color: var(--text-muted); font-variant-numeric: tabular-nums; }
  .cal-cell--today .cal-cell-day { color: var(--accent); }
  .cal-cell-evs { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .cal-ev {
    display: block; font-size: 10.5px; line-height: 1.3; font-weight: 600;
    padding: 2px 6px; border-radius: 5px; text-decoration: none;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cal-ev--applied { background: color-mix(in srgb, var(--cyan) 16%, var(--surface)); color: var(--cyan); }
  .cal-ev--due     { background: color-mix(in srgb, var(--orange) 18%, var(--surface)); color: var(--orange); }
  .cal-ev--overdue { background: color-mix(in srgb, var(--red) 16%, var(--surface)); color: var(--red); }
  a.cal-ev:hover { text-decoration: underline; filter: brightness(1.08); }

  @media (max-width: 640px) {
    .cal-cell { min-height: 58px; padding: 4px; border-radius: 6px; }
    .cal-grid, .cal-weekdays { gap: 4px; }
    .cal-ev { font-size: 9px; padding: 1px 4px; }
    .cal-title { min-width: 120px; font-size: 13px; }
  }

  /* Board view padding/margin within the unified section */
  .jobs-board-view { padding-top: 4px; }
  .board-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
  .board-head .stagefilter { margin-bottom: 0; flex: 1 1 auto; }

  /* Ensure the section heading in the toolbar aligns with h2 style */
  .jobs-section { margin: 3rem 0; }
  .jobs-section .sec-h { display: none; } /* hide old sec-h if any leaked */

  @media (max-width: 700px) {
    .jobs-sticky-toolbar { flex-direction: column; align-items: stretch; }
    .jobs-toolbar-left { justify-content: space-between; }
    .jobs-toolbar-center { flex-wrap: wrap; }
    .jobs-toolbar-right { justify-content: flex-end; }
  }

  /* ── "Show rejected" toggle + terminal (rejected/withdrawn) visibility ───── */
  .rej-toggle {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-muted);
    font-size: 12.5px; font-weight: 600; font-family: inherit;
    cursor: pointer; white-space: nowrap; line-height: 1;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .rej-toggle .ic { width: 14px; height: 14px; flex: 0 0 auto; }
  .rej-toggle:hover { background: var(--surface-alt); color: var(--text); }
  .rej-toggle .rej-n {
    font-size: 11px; font-variant-numeric: tabular-nums;
    background: var(--surface-alt); color: var(--text-muted);
    border-radius: 20px; padding: 1px 7px;
  }
  .rej-toggle.active {
    background: color-mix(in srgb, var(--red) 13%, var(--surface));
    border-color: color-mix(in srgb, var(--red) 45%, transparent);
    color: var(--red);
  }
  .rej-toggle.active .rej-n { background: color-mix(in srgb, var(--red) 22%, var(--surface)); color: var(--red); }

  /* Terminal rows/groups/chips stay hidden until #jobs-section.show-rejected. */
  #jobs-section:not(.show-rejected) #jobsbody tr[data-terminal="1"] { display: none; }
  #jobs-section:not(.show-rejected) .stage-group--terminal,
  #jobs-section:not(.show-rejected) .stage-btn--terminal { display: none; }

  .card.rejected { opacity: 0.72; }
  .card.rejected:hover { opacity: 1; }
  .card.rejected .avatar .logo-img { filter: grayscale(1); }

  /* ── Editorial refresh ──────────────────────────────────────────────────────
     A palette-independent type + structure pass that composes with every theme:
     lighter/tighter headings, one oversized hero numeral, monospace metadata, and
     crisper less-rounded surfaces. Token-driven, so it re-themes for free. */
  :root { --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace; }

  h1 { font-weight: 300; letter-spacing: -0.03em; }
  h2 { font-weight: 400; letter-spacing: -0.015em; }
  .jm-company { font-weight: 300; letter-spacing: -0.02em; }
  .sg-label { font-weight: 600; }
  .eyebrow { color: var(--text-muted); font-weight: 600; letter-spacing: 0.24em; }

  /* Masthead: bigger light title, ruled off from the body with a hairline. */
  .hero { padding: 0.25rem 0 1.4rem; border-bottom: 1px solid var(--border); align-items: flex-start; }
  h1 { font-size: clamp(2.6rem, 4.6vw, 3.4rem); }
  .eyebrow { margin-bottom: 0.7rem; }
  .sub { margin-top: 0.85rem; }

  /* Drop the four stat cards for a borderless horizontal figure band: big light
     monochrome numerals over mono labels, framed by a hairline rule. No card chrome. */
  .stats { display: flex; flex-wrap: wrap; gap: 1.6rem 3.5rem; background: none; padding: 1.6rem 0;
           margin: 0 0 1.25rem; border-bottom: 1px solid var(--border); grid-template-columns: none; }
  .stat { background: none; border-radius: 0; padding: 0; min-width: 0; }
  .stat:hover { transform: none; }
  .stat-ico { display: none; }
  .stats .stat .stat-top { display: block; }
  .stat-n { font-weight: 300; letter-spacing: -0.03em; font-size: clamp(2.3rem, 3.6vw, 3rem);
            line-height: 1; color: var(--text); }
  .stat-l { margin-top: 7px; font-size: 0.68rem; letter-spacing: 0.14em; color: var(--text-muted); }
  @media (max-width: 640px) { .stats { gap: 1.25rem 2.25rem; } }

  /* Metadata (dates, counts, keys, fit) set in mono so machine data reads as a byline. */
  .ts, .att-when, .card .cmeta .cdate, .jobs-count, .stage-btn .bn, .sg-count,
  .jm-email-date, .jm-conv-date, .jt-k, .jm-k, .stat-l, .jobs-hint, .cfit,
  .score-n, .num { font-family: var(--mono); }
  .stat-l { letter-spacing: 0.06em; }

  /* Crisper, less-rounded surfaces (12–16px → 6–8px); pills de-pilled. */
  .stat, .funnel-section, .card, .att-item, .no-data { border-radius: 8px; }
  #job-modal-panel { border-radius: 10px; }
  table, .tbl-wrap, .tbl-search, .tbl-reset, .stage-btn, .funnel-chip, .fchip,
  .theme-toggle, .theme-select, .jm-artifact-box, .jm-email, .jm-conv, .jobtip,
  .fteip { border-radius: 6px; }
  .avatar { border-radius: 5px; }
  .brand-logo { border-radius: 10px; }
  .badge { border-radius: 3px; }
  .card .spill, .sg-count { border-radius: 6px; }
  .score-bar, .score-bar i { border-radius: 3px; }

  /* ── UI sweep: card ribbon tint + roomier table ──────────────────────────────
     Cards take a subtle stage-coloured wash (colour + translucency, whole-surface,
     never an edge strip) and NO border — the wash alone defines the surface; the
     All-Jobs table gets a larger logo and a 2-line role. */
  .card { background: color-mix(in srgb, var(--sc, var(--accent)) 10%, var(--surface));
          border: none; transition: transform .16s, background .16s; }
  .card:hover { background: color-mix(in srgb, var(--sc, var(--accent)) 16%, var(--surface)); }
  .card.rejected { background: var(--surface); }

  table.jobs .co .avatar { width: 2.6rem; height: 2.6rem; }
  table.jobs tbody td { vertical-align: middle; padding-top: 10px; padding-bottom: 10px; }
  table.jobs td.jt-role { white-space: normal; line-height: 1.3; }
  .co-text { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
  .co-sub { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden;
            text-overflow: ellipsis; }

  /* ── Notification bell + panel ──────────────────────────────────────────── */
  .notif-wrap { position: relative; }

  /* Bell button — sized like .theme-toggle */
  .notif-bell {
    background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
    color: var(--text-muted); cursor: pointer; font-family: inherit;
    padding: 7px 10px; display: inline-flex; align-items: center; gap: 5px;
    line-height: 1; transition: background 0.12s, color 0.12s; position: relative;
  }
  .notif-bell:hover { background: var(--surface-alt); color: var(--text); }
  .notif-bell .ic { width: 16px; height: 16px; flex: 0 0 auto; }

  /* Count badge: absolute top-right pill */
  .notif-badge {
    position: absolute; top: -5px; right: -6px;
    background: var(--red); color: #fff;
    font-size: 10px; font-weight: 700; font-family: var(--mono);
    border-radius: 10px; padding: 1px 5px; min-width: 18px;
    text-align: center; line-height: 1.5; pointer-events: none;
  }

  /* Panel popover */
  .notif-panel {
    display: none; position: absolute; right: 0; top: calc(100% + 8px);
    width: 380px; max-height: 70vh; overflow-y: auto;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; z-index: 60;
    box-shadow: 0 8px 32px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.10);
  }
  .notif-panel.open { display: block; }
  @media (max-width: 440px) { .notif-panel { width: calc(100vw - 16px); right: 0; } }

  /* Panel header — sticky so it stays visible while scrolling the list */
  .notif-head {
    display: flex; align-items: center; gap: 8px; padding: 12px 14px 10px;
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; background: var(--surface); z-index: 1;
  }
  .notif-head h3 {
    margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center;
    gap: 6px; flex: 1; color: var(--text);
  }
  .notif-head h3 .ic { width: 15px; height: 15px; }
  .notif-head .jobs-count { margin-left: 0; }
  .notif-close {
    background: none; border: none; cursor: pointer; color: var(--text-muted);
    font-size: 18px; line-height: 1; padding: 3px 6px; border-radius: 4px;
    font-family: inherit; margin-left: auto;
  }
  .notif-close:hover { background: var(--surface-alt); color: var(--text); }

  /* Empty state */
  .notif-empty {
    padding: 28px 20px; text-align: center; color: var(--text-muted);
    font-size: 13px; font-style: italic;
  }

  /* Item list */
  .notif-list { display: flex; flex-direction: column; }

  /* Override att-item layout for panel context */
  .notif-item {
    display: flex; flex-direction: column; gap: 0;
    border-radius: 0; padding: 0;
    border-bottom: 1px solid var(--border);
  }
  .notif-item:last-child { border-bottom: none; }

  /* Clickable item header row */
  .notif-item-head {
    display: flex; align-items: center; gap: 10px;
    width: 100%; background: transparent; border: none; border-radius: 0;
    text-align: left; font-family: inherit; font-size: inherit; color: var(--text);
    cursor: pointer; padding: 11px 14px;
    transition: background 0.12s;
  }
  .notif-item-head:hover { background: var(--surface-alt); }
  /* Keep urgency washes on the item-head hover state */
  .notif-item.att-overdue .notif-item-head:hover { background: color-mix(in srgb, var(--red) 12%, var(--surface-alt)); }
  .notif-item.att-due     .notif-item-head:hover { background: color-mix(in srgb, var(--orange) 12%, var(--surface-alt)); }

  /* Chevron — rotates 90deg when expanded */
  .notif-chev {
    flex: 0 0 auto; color: var(--text-muted); font-size: 16px; line-height: 1;
    transition: transform 0.18s; display: inline-block;
  }
  .notif-item.expanded .notif-chev { transform: rotate(90deg); }

  /* Draft panel — hidden until expanded */
  .notif-draft { display: none; padding: 0 14px 13px; }
  .notif-item.expanded .notif-draft { display: block; }

  .notif-subj { font-weight: 700; font-size: 12.5px; color: var(--text); margin-bottom: 7px; }
  .notif-body {
    font-family: var(--mono); font-size: 11.5px; line-height: 1.55;
    color: var(--text-muted); background: var(--surface-alt);
    border: 1px solid var(--border); border-radius: 6px;
    padding: 9px 11px; white-space: pre-wrap; word-break: break-word;
    max-height: 200px; overflow-y: auto; margin: 0 0 9px;
  }
  .notif-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 6px; }
  .notif-act {
    background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
    padding: 6px 12px; color: var(--text-muted); font-size: 12px; font-weight: 600;
    font-family: inherit; cursor: pointer; white-space: nowrap;
    transition: background 0.12s, color 0.12s;
  }
  .notif-act:hover { background: var(--surface-alt); color: var(--text); }
  .notif-nodraft {
    font-size: 12px; color: var(--text-muted); font-style: italic;
    padding: 4px 0 8px;
  }

  /* ── Draft button (always-visible quick-action bar per notification item) ── */
  .notif-item-bar {
    display: flex; align-items: center; gap: 7px;
    padding: 0 14px 9px;
  }
  .att-draft-btn {
    background: var(--surface-alt); border: 1px solid var(--border);
    border-radius: 6px; padding: 4px 11px;
    color: var(--text-muted); font-size: 11.5px; font-weight: 600;
    font-family: inherit; cursor: pointer; white-space: nowrap;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .att-draft-btn:hover { background: var(--surface); color: var(--accent); border-color: var(--accent); }

  /* ── Today action bar ────────────────────────────────────────────────────── */
  .today-bar {
    margin: 1rem 0 1.5rem;
    background: var(--surface);
    border-radius: 8px;
    padding: 0;
    overflow: hidden;
  }

  .today-bar-head {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px 8px;
    border-bottom: 1px solid var(--border);
  }
  .today-bar-head .ic { width: 14px; height: 14px; color: var(--cyan); flex: 0 0 auto; }
  .today-bar-label {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--text-muted); font-family: var(--mono);
  }
  .today-bar-count {
    font-size: 10.5px; font-weight: 700; color: var(--text-muted);
    font-family: var(--mono); font-variant-numeric: tabular-nums;
    background: var(--surface-alt); border-radius: 4px; padding: 1px 6px;
  }
  .today-bar-overflow {
    margin-left: auto; font-size: 10.5px; color: var(--text-muted);
    font-family: var(--mono);
  }

  .today-bar-empty {
    padding: 12px 16px;
    font-size: 12.5px; color: var(--text-muted); font-style: italic;
  }

  .today-bar-list {
    display: flex; flex-direction: column;
  }

  .tq-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 16px;
    border-bottom: 1px solid var(--border);
    transition: background 0.12s;
  }
  .tq-item:last-child { border-bottom: none; }

  /* Urgency tints — whole-surface wash, no edge strip */
  .tq-overdue { background: color-mix(in srgb, var(--red) 7%, var(--surface)); }
  .tq-due     { background: color-mix(in srgb, var(--orange) 7%, var(--surface)); }
  .tq-prep    { background: color-mix(in srgb, var(--cyan) 6%, var(--surface)); }
  .tq-wait    { background: var(--surface); }

  .tq-item:hover { background: var(--surface-alt); }
  .tq-overdue:hover { background: color-mix(in srgb, var(--red) 12%, var(--surface-alt)); }
  .tq-due:hover     { background: color-mix(in srgb, var(--orange) 12%, var(--surface-alt)); }
  .tq-prep:hover    { background: color-mix(in srgb, var(--cyan) 11%, var(--surface-alt)); }

  .tq-icon { flex: 0 0 auto; display: inline-flex; }
  .tq-icon .ic { width: 13px; height: 13px; }
  .tq-overdue .tq-icon { color: var(--red); }
  .tq-due     .tq-icon { color: var(--orange); }
  .tq-prep    .tq-icon { color: var(--cyan); }
  .tq-wait    .tq-icon { color: var(--text-muted); }

  /* Action leads (primary), company · role is secondary context underneath. */
  .tq-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
  .tq-action { font-weight: 650; font-size: 13px; color: var(--text); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tq-ctx { font-size: 11.5px; color: var(--text-muted); line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tq-dot { color: var(--border); }
  .tq-overdue .tq-action { color: var(--red); }

  .tq-when {
    flex: 0 0 auto; font-size: 11px; font-weight: 600;
    font-family: var(--mono); font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .tq-overdue .tq-when { color: var(--red); }
  .tq-due     .tq-when { color: var(--orange); }
  .tq-prep    .tq-when { color: var(--cyan); }
  .tq-wait    .tq-when { color: var(--text-muted); }

  .tq-actions { display: flex; gap: 6px; flex: 0 0 auto; }
  .tq-btn {
    background: var(--surface-alt); border: 1px solid var(--border);
    border-radius: 5px; padding: 3px 10px;
    color: var(--text-muted); font-size: 11px; font-weight: 600;
    font-family: inherit; cursor: pointer; white-space: nowrap;
    text-decoration: none; display: inline-block; line-height: 1.6;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .tq-btn:hover { background: var(--surface); color: var(--accent); border-color: var(--accent); }
  .tq-btn-draft { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); }
  .tq-btn-draft:hover { background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }

  @media (max-width: 560px) {
    .tq-item { flex-wrap: wrap; gap: 6px 10px; }
    .tq-ctx { display: none; }
    .tq-when { order: -1; }
  }
`;
