#!/usr/bin/env node
// Backfill `benefits: [key]` onto tracker rows by extracting from each row's
// job-description file (artifacts.jdPath) + comp/notes free text.
//
// The browser-side dashboard can't read JD files, so benefits are extracted
// server-side here and persisted onto the row (same pattern as compEstimate).
// Idempotent: re-running re-derives from current JD files. Skills (evaluate-job /
// sourced-scanner) should capture benefits at add-time going forward; this seeds
// existing rows.
//
//   node scripts/backfill-benefits.mjs           # write
//   node scripts/backfill-benefits.mjs --dry     # report only

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { extractBenefitKeys } from "../src/core/tracker/benefits.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const trackerPath = resolve(repoRoot, "workspace/tracker.json");
const dryRun = process.argv.includes("--dry");

const tracker = JSON.parse(readFileSync(trackerPath, "utf8"));

let scanned = 0;
let updated = 0;
let cleared = 0;
const tally = {};

for (const arrayKey of ["applications", "sourced"]) {
  const rows = tracker[arrayKey];
  if (!Array.isArray(rows)) continue;
  for (const row of rows) {
    scanned += 1;
    const jdPath = row?.artifacts?.jdPath || row?.artifacts?.jd;
    let jdText = "";
    if (jdPath) {
      const abs = resolve(repoRoot, jdPath);
      if (existsSync(abs)) jdText = readFileSync(abs, "utf8");
    }
    const keys = extractBenefitKeys(jdText, row?.tc, row?.note, row?.sub);
    const before = JSON.stringify(row.benefits || []);
    const after = JSON.stringify(keys);
    if (before === after) continue;
    if (keys.length) {
      row.benefits = keys;
      updated += 1;
      for (const k of keys) tally[k] = (tally[k] || 0) + 1;
    } else if (row.benefits) {
      delete row.benefits;
      cleared += 1;
    }
  }
}

console.log(`scanned ${scanned} rows · updated ${updated} · cleared ${cleared}`);
console.log("benefit distribution:", JSON.stringify(tally, null, 2));

if (dryRun) {
  console.log("(dry run — tracker.json not written)");
} else {
  writeFileSync(trackerPath, `${JSON.stringify(tracker, null, 2)}\n`);
  console.log(`wrote ${trackerPath}`);
}
