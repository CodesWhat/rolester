#!/usr/bin/env node
// Evergreen date-rebase for the demo fixture. Shifts every standalone date value in
// a tracker.json by the whole-day delta between `meta.demoAnchor` and a reference
// "today" (real today by default), so the seeded search reads as current whenever the
// demo is rebuilt — interviews stay in the near future, applications stay in the past,
// the freshness pill stays recent. Operates IN PLACE on the file passed in; the
// committed fixture stays anchored (build:demo runs this on a throwaway build copy).
//
// Only values that are EXACTLY an ISO date or datetime are shifted (full-string match),
// so prose that merely mentions a date ("screen cleared 06-12") is never touched. Format
// is preserved: date-only stays YYYY-MM-DD, datetime keeps its time-of-day and Z suffix.
//
// Usage: node scripts/rebase-demo-dates.mjs <path/to/tracker.json> [referenceToday=YYYY-MM-DD]
import { readFileSync, writeFileSync } from "node:fs";

const DAY_MS = 86_400_000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

function midnightUtc(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function shiftValue(value, deltaMs) {
  if (typeof value !== "string") return value;
  if (DATE_ONLY.test(value)) {
    return new Date(midnightUtc(value) + deltaMs).toISOString().slice(0, 10);
  }
  if (ISO_DT.test(value)) {
    const hadMillis = /\.\d{3}Z$/.test(value);
    const iso = new Date(new Date(value).getTime() + deltaMs).toISOString();
    return hadMillis ? iso : iso.replace(/\.\d{3}Z$/, "Z");
  }
  return value;
}

function walk(node, deltaMs, counter) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const next = walk(node[i], deltaMs, counter);
      if (next !== node[i]) node[i] = next;
    }
    return node;
  }
  if (node && typeof node === "object") {
    for (const key of Object.keys(node)) {
      const next = walk(node[key], deltaMs, counter);
      if (next !== node[key]) node[key] = next;
    }
    return node;
  }
  if (typeof node === "string") {
    const shifted = shiftValue(node, deltaMs);
    if (shifted !== node) counter.n++;
    return shifted;
  }
  return node;
}

function main() {
  const [filePath, referenceToday] = process.argv.slice(2);
  if (!filePath) {
    console.error("usage: node scripts/rebase-demo-dates.mjs <tracker.json> [YYYY-MM-DD]");
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(filePath, "utf8"));
  const anchor = data?.meta?.demoAnchor;
  if (!anchor || !DATE_ONLY.test(anchor)) {
    console.error(`no usable meta.demoAnchor (got ${JSON.stringify(anchor)}); refusing to rebase`);
    process.exit(1);
  }

  const todayYmd = referenceToday || new Date().toISOString().slice(0, 10);
  const deltaDays = Math.round((midnightUtc(todayYmd) - midnightUtc(anchor)) / DAY_MS);
  const deltaMs = deltaDays * DAY_MS;

  if (deltaDays === 0) {
    console.log(`demoAnchor ${anchor} already == today ${todayYmd}; nothing to shift.`);
    return;
  }

  const counter = { n: 0 };
  walk(data, deltaMs, counter);

  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(
    `rebased ${counter.n} date values by ${deltaDays >= 0 ? "+" : ""}${deltaDays}d ` +
      `(${anchor} → ${data.meta.demoAnchor}); reference today=${todayYmd}`
  );
}

main();
