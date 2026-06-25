#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { displayPath, userPath } from "../src/core/paths/workspace.mjs";
import { loadTrackerData, validateTrackerData } from "../src/core/tracker/tracker-data.mjs";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const pathCtx = { repoRoot: root };
const trackerPath = userPath(pathCtx, "workspace/tracker.json");
if (!existsSync(trackerPath)) {
  console.error(
    `Tracker not found at ${displayPath(pathCtx, "workspace/tracker.json")}. Seed one from templates/tracker.json.`
  );
  process.exit(1);
}

const data = loadTrackerData(trackerPath);
const result = validateTrackerData(data);

console.log(`APPS: ${data.apps.length}`);
console.log(`SOURCED: ${data.sourced.length}`);

for (const warning of result.warnings) console.log(`WARN ${warning}`);
for (const error of result.errors) console.log(`ERROR ${error}`);

console.log(`Tracker health: ${result.errors.length} errors, ${result.warnings.length} warnings`);
if (result.errors.length > 0) process.exitCode = 1;
