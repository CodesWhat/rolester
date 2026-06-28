#!/usr/bin/env node
import { mkdirSync } from "node:fs";
// Record a smooth screen-capture of a navigation session through the dashboard,
// at a FIXED viewport (so every frame is identical size — no padding artifacts),
// and print the resulting webm path. ffmpeg then converts it to the embed GIF.
//
// Usage: node scripts/record-demo-video.mjs <baseUrl> <outDir>
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:4599";
const OUT = process.argv[3] || "/tmp/demo-video";
const W = 1512;
const H = 900;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: W, height: H } },
});
const page = await context.newPage();
const wait = (ms) => page.waitForTimeout(ms);
const go = async (view) => {
  await page.click(`[data-page-link="${view}"]`);
};
const scroll = async (dy, steps = 14) => {
  // gentle, eased wheel scroll so the motion reads smoothly in the GIF
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps);
    await wait(28);
  }
};

await page.goto(`${BASE}/#dashboard`, { waitUntil: "networkidle" });
// Wait for the data-driven cards to actually populate before the tour starts, so
// the recording never shows the "Loading…" / empty-card state. The leading load
// segment is trimmed off in the ffmpeg step (-ss), but this guarantees the held
// dashboard frame is fully rendered.
await page
  .waitForFunction(
    () => {
      const t = document.querySelector(".focus-card-title");
      return t && !/loading/i.test(t.textContent || "");
    },
    { timeout: 9000 }
  )
  .catch(() => {});
await wait(2600); // clean, populated dashboard hold (trim point lands in here)

await go("jobs");
await wait(1500);
await scroll(520); // reveal the funnel + Jobs Explorer
await wait(1100);
await scroll(-520);
await wait(500);

await go("calendar");
await wait(1700);

await go("library");
await wait(1200);
await scroll(420);
await wait(1100);
await scroll(-420);
await wait(500);

await go("dashboard");
await wait(1400);

const video = page.video();
await context.close(); // flush the recording
const path = await video.path();
await browser.close();
console.log(path);
