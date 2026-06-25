#!/usr/bin/env node
// B10 — one-shot tokenization of dashboard-shell.html for theming + dark mode.
//
// Invariant: every token's LIGHT value equals the literal it replaces, so the
// light theme renders byte-identical. Only [data-theme="dark"] changes anything.
//
// What it does:
//   1. Tailwind config colors (#hex) → var(--m-<key>); collect key→lightHex.
//   2. rgba() ink/surface families → channel tokens rgba(var(--rgb-*), a).
//   3. Inject --m-* + --rgb-* light defs into :root.
//   4. Replace the [data-theme="dark"] stub with a full dark token block
//      (m-roles + existing paper/ink/accent tokens + channels + header).
//
// Re-runnable guard: aborts if already tokenized (marker token present).
//   node scripts/tokenize-dashboard.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const file = resolve(
  fileURLToPath(new URL("..", import.meta.url)),
  "src/core/tracker/dashboard-shell.html"
);
let s = readFileSync(file, "utf8");

if (s.includes("--m-surface:")) {
  console.error(
    "ABORT: already tokenized (found --m-surface). Restore from backup before re-running."
  );
  process.exit(1);
}

// ── 1. Tailwind config colors → var(--m-key) ──────────────────────────────────
const colorsStart = s.indexOf('"colors": {');
const colorsEnd = s.indexOf("}", colorsStart);
let colorsBlock = s.slice(colorsStart, colorsEnd);
const lightHex = {};
colorsBlock = colorsBlock.replace(/"([a-z0-9-]+)":\s*"(#[0-9a-fA-F]{3,8})"/g, (_m, key, hex) => {
  lightHex[key] = hex;
  return `"${key}": "var(--m-${key})"`;
});
s = s.slice(0, colorsStart) + colorsBlock + s.slice(colorsEnd);
console.log(`config colors tokenized: ${Object.keys(lightHex).length}`);

// ── 2. rgba ink/surface families → channel tokens ─────────────────────────────
const rgbaSubs = [
  [/rgba\(43,\s*39,\s*36,\s*([\d.]+)\)/g, "rgba(var(--rgb-line), $1)"],
  [/rgba\(25,\s*28,\s*30,\s*([\d.]+)\)/g, "rgba(var(--rgb-line), $1)"],
  [/rgba\(255,\s*250,\s*242,\s*([\d.]+)\)/g, "rgba(var(--rgb-surface), $1)"],
  [/rgba\(255,\s*250,\s*243,\s*([\d.]+)\)/g, "rgba(var(--rgb-surface), $1)"],
  [/rgba\(246,\s*239,\s*228,\s*([\d.]+)\)/g, "rgba(var(--rgb-band), $1)"],
];
let rgbaCount = 0;
for (const [re, rep] of rgbaSubs) {
  s = s.replace(re, (m, a) => {
    rgbaCount += 1;
    return rep.replace("$1", a);
  });
}
console.log(`rgba channel-tokenized: ${rgbaCount}`);

// ── 3. Light token defs to inject into :root ──────────────────────────────────
const mLight = Object.entries(lightHex)
  .map(([k, hex]) => `    --m-${k}: ${hex};`)
  .join("\n");
const channelsLight = [
  "    --rgb-line: 43, 39, 36;",
  "    --rgb-surface: 255, 250, 242;",
  "    --rgb-band: 246, 239, 228;",
].join("\n");

const rootInject = `\n    /* B10: Tailwind role tokens (--m-*) — light = original config hex. */\n${mLight}\n    /* B10: rgba channel triplets (used as rgba(var(--rgb-x), a)). */\n${channelsLight}\n`;

// inject before the closing brace of :root (right after the header-pill-shadow line)
const anchor =
  "    --header-pill-shadow: 0 8px 28px rgba(var(--rgb-line), 0.12), 0 2px 6px rgba(var(--rgb-line), 0.05);";
if (!s.includes(anchor)) {
  console.error("ABORT: :root header-pill-shadow anchor not found (did rgba sub change it?).");
  process.exit(1);
}
s = s.replace(anchor, anchor + rootInject);

// ── 4. Dark values ────────────────────────────────────────────────────────────
// Per-role dark map for the Tailwind --m-* tokens. White text on colored accents
// (on-secondary/on-tertiary/on-error) stays white; on-primary flips (primary
// surface goes light); container/fixed roles invert with their surface.
const DARK_M = {
  background: "#16140f",
  surface: "#16140f",
  "surface-container-low": "#1c1913",
  "surface-container-lowest": "#211e18",
  "surface-bright": "#262219",
  "surface-variant": "#201d16",
  "surface-container": "#201d16",
  "surface-container-high": "#221f17",
  "surface-container-highest": "#2a261e",
  "surface-dim": "#242019",
  "surface-tint": "#9a8f7f",
  outline: "#9a8f7f",
  "outline-variant": "#3a342a",
  "on-surface": "#efe9dd",
  "on-background": "#efe9dd",
  "on-surface-variant": "#b3a99d",
  primary: "#efe9dd",
  "primary-container": "#efe9dd",
  "on-primary": "#1a1712",
  "on-primary-container": "#ffd8cf",
  "primary-fixed": "#5a2a20",
  "primary-fixed-dim": "#6a3328",
  "on-primary-fixed": "#ffd8cf",
  "on-primary-fixed-variant": "#f4b2a5",
  "inverse-surface": "#efe9dd",
  "inverse-on-surface": "#16140f",
  "inverse-primary": "#ff8068",
  secondary: "#ff6e57",
  "secondary-container": "#ff6e57",
  "secondary-fixed": "#3a201a",
  "secondary-fixed-dim": "#6a3328",
  "on-secondary": "#ffffff",
  "on-secondary-container": "#ffd8cf",
  "on-secondary-fixed": "#ffd8cf",
  "on-secondary-fixed-variant": "#f4b2a5",
  tertiary: "#46c4b1",
  "tertiary-container": "#173b35",
  "tertiary-fixed": "#173b35",
  "tertiary-fixed-dim": "#2a5b54",
  "on-tertiary": "#06201c",
  "on-tertiary-container": "#46c4b1",
  "on-tertiary-fixed": "#a9ddd6",
  "on-tertiary-fixed-variant": "#6fcabb",
  error: "#ff6d5b",
  "error-container": "#3d201a",
  "on-error": "#ffffff",
  "on-error-container": "#ffb4a7",
};
// Fallback for any unmapped key: flip by luminance (dark→light, light→dark).
function luminanceFlip(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16),
    g = parseInt(h.slice(2, 4), 16),
    b = parseInt(h.slice(4, 6), 16);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum < 128 ? "#efe9dd" : "#1c1913";
}
const mDark = Object.keys(lightHex)
  .map((k) => {
    const v = DARK_M[k] || luminanceFlip(lightHex[k]);
    if (!DARK_M[k]) console.log(`  (fallback dark for --m-${k}: ${lightHex[k]} → ${v})`);
    return `    --m-${k}: ${v};`;
  })
  .join("\n");

// Dark overrides for the hand-CSS tokens (paper/ink/accent) + channels + shadow.
const baseDark = `    --paper-bg: #16140f;
    --paper-band: #201d16;
    --paper-surface: #221f19;
    --paper-edge: #3a342a;
    --paper-edge-strong: #4a4339;
    --ink: #efe9dd;
    --ink-soft: #b3a99d;
    --coral: #ff6e57;
    --coral-dark: #ff8068;
    --teal: #46c4b1;
    --teal-light: #173b35;
    --mustard: #e9b653;
    --mustard-light: #322a14;
    --sky: #5ea4d7;
    --plum: #c585b5;
    --danger: #ff6d5b;
    --card-shadow: 0 12px 28px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.36);
    --rgb-line: 235, 229, 221;
    --rgb-surface: 34, 31, 25;
    --rgb-band: 32, 29, 22;`;

const darkStub = `  [data-theme="dark"],
  [data-theme$="-dark"] {
    --header-bar-bg: rgba(33, 37, 43, 0.82);
    --header-pill-bg: rgba(33, 37, 43, 0.9);
    --header-pill-border: rgba(255, 255, 255, 0.1);
    --header-pill-shadow: 0 8px 28px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.3);
  }`;
if (!s.includes(darkStub)) {
  console.error("ABORT: [data-theme=dark] stub not found verbatim.");
  process.exit(1);
}
const darkFull = `  [data-theme="dark"],
  [data-theme$="-dark"] {
    --header-bar-bg: rgba(33, 37, 43, 0.82);
    --header-pill-bg: rgba(33, 37, 43, 0.9);
    --header-pill-border: rgba(255, 255, 255, 0.1);
    --header-pill-shadow: 0 8px 28px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.3);
${baseDark}
    /* B10: dark values for Tailwind role tokens. */
${mDark}
  }`;
s = s.replace(darkStub, darkFull);

writeFileSync(file, s);
console.log("wrote", file);
