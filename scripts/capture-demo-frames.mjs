#!/usr/bin/env node
import { mkdirSync } from "node:fs";
// One-shot demo-tour frame capture for the marketing embed. Drives a headless
// Chromium at a FIXED viewport across the dashboard's hash views, so every frame
// is byte-for-byte the same dimensions — the mismatched frame sizes were what
// made the old gif_creator GIF pad with dark/white gaps. Output: <outDir>/frame-N.png.
//
// Usage: node scripts/capture-demo-frames.mjs <baseUrl> <outDir>
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:4599";
const OUT = process.argv[3] || "/tmp/demo-frames";
const W = 1512;
const H = 900;
// Tour order — varied surfaces that show the loop at a glance.
const VIEWS = ["dashboard", "jobs", "calendar", "library"];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

let n = 0;
for (const view of VIEWS) {
  n += 1;
  // Unique query per view forces a full document load so the hash sets the view.
  await page.goto(`${BASE}/?f=${n}#${view}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800); // let Sankey / charts settle
  await page.screenshot({ path: `${OUT}/frame-${n}.png` });
  console.log(`captured frame-${n}.png (${view})`);
}

await browser.close();
console.log(`Done → ${OUT}`);
