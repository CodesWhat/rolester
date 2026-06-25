#!/usr/bin/env node
// One-time migration for the Tracker Content Register (typed display fields).
//
// Legacy rows store mixed-topic prose in `app.note`, which the dashboard no longer
// renders on cards. This backfills a scannable `app.statusNote` (the jobs-card slot)
// from the FIRST SENTENCE of `app.note` for any row that doesn't have one yet, so
// existing rows show a clean one-liner until a skill writes a proper typed value at
// the next status transition. `app.note` is preserved unchanged (search text).
//
// Dry-run by default. Pass --write to persist.
//
//   node scripts/backfill-statusNote.mjs           # preview
//   node scripts/backfill-statusNote.mjs --write   # apply

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TRACKER = join(ROOT, "workspace", "tracker.json");
const WRITE = process.argv.includes("--write");
const MAX = 120;

function firstSentence(value) {
  const text = String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  const [first] = text.split(/(?<=[.!?])\s+/);
  const out = (first || text).trim();
  return out.length <= MAX ? out : `${out.slice(0, MAX - 1).trim()}...`;
}

const tracker = JSON.parse(readFileSync(TRACKER, "utf8"));
const apps = Array.isArray(tracker.applications) ? tracker.applications : [];

let updated = 0;
const preview = [];
for (const app of apps) {
  if (app.statusNote && String(app.statusNote).trim()) continue;
  const derived = firstSentence(app.note);
  if (!derived) continue;
  app.statusNote = derived;
  updated += 1;
  preview.push(`  ${app.company || app.id}: ${derived}`);
}

console.log(`${updated} row(s) ${WRITE ? "updated" : "would be updated"} (of ${apps.length}).`);
if (preview.length) console.log(preview.join("\n"));

if (WRITE && updated) {
  writeFileSync(TRACKER, `${JSON.stringify(tracker, null, 2)}\n`);
  console.log(
    `\nWrote ${TRACKER}. Run: node src/cli/tracker.mjs --verify && node src/cli/tracker.mjs`
  );
} else if (!WRITE) {
  console.log("\n(dry run — pass --write to persist)");
}
