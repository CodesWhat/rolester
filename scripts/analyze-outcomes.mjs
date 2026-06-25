#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { displayPath, userPath } from "../src/core/paths/workspace.mjs";
import { parseYaml } from "../src/core/profile/yaml.mjs";
import { buildOutcomeSummary } from "../src/core/tracker/outcome-analysis.mjs";
import { loadTrackerData } from "../src/core/tracker/tracker-data.mjs";

// Resolve inputs relative to the repo root, not the caller's cwd, so the canonical
// `node scripts/analyze-outcomes.mjs --summary` works from anywhere. The source of
// truth is workspace/tracker.json (see src/cli/tracker.mjs).
const root = join(fileURLToPath(new URL("..", import.meta.url)));
const pathCtx = { repoRoot: root };

// Role-family classification is domain-general: it reads candidate/targeting.yml
// (role_families → role_buckets → tech fallback) so a trucking or nursing seeker
// gets their own families, not the tech defaults. Absent config = back-compat.
const targeting = loadYaml(userPath(pathCtx, "candidate/targeting.yml"));
const trackerPath = userPath(pathCtx, "workspace/tracker.json");
if (!existsSync(trackerPath)) {
  console.error(
    `Tracker not found at ${displayPath(pathCtx, "workspace/tracker.json")}. Seed one from templates/tracker.json.`
  );
  process.exit(1);
}
const data = loadTrackerData(trackerPath);
const summary = buildOutcomeSummary({ ...data, targeting });

if (process.argv.includes("--summary")) {
  console.log(`Applications: ${summary.counts.apps}`);
  console.log(`Sourced: ${summary.counts.sourced}`);
  console.log(`By status: ${formatCounts(summary.byStatus)}`);
  console.log(`By role family: ${formatCounts(summary.byRoleFamily)}`);
  console.log("Top sourced:");
  for (const row of summary.topSourced.slice(0, 8)) {
    console.log(`- ${row.score}% ${row.co} - ${row.role} (${row.family}, ${row.mode})`);
  }
} else {
  console.log(JSON.stringify(summary, null, 2));
}

function formatCounts(counts) {
  return Object.entries(counts)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}

function loadYaml(rel) {
  if (!existsSync(rel)) return undefined;
  try {
    return parseYaml(readFileSync(rel, "utf8"));
  } catch {
    return undefined;
  }
}
