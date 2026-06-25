#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

import { userPath } from "../src/core/paths/workspace.mjs";
import {
  buildOfferIdentitySet,
  diffSnapshotOffers,
  latestSnapshotPair,
  loadSnapshot,
  renderDeltaMarkdown,
  summarizeDelta,
} from "../src/core/scoring/sourced-delta.mjs";
import { buildSeenSets } from "../src/core/tracker/tracker-data.mjs";

const args = process.argv.slice(2);
const pathCtx = { repoRoot: ROOT };
const source = valueAfter("--source") || "";
let currentPath = valueAfter("--current");
let previousPath = valueAfter("--previous");
const format = valueAfter("--format") || "md";
const write = args.includes("--write");
const repoNewOnly = args.includes("--repo-new-only");
const baselineOk = args.includes("--baseline-ok") || args.includes("--baseline");
const outPath = valueAfter("--out");

if (args.includes("--help")) {
  console.log(`Usage:
  npm run delta:sourced -- --source hiringcafe
  npm run delta:sourced -- --current scan-results/current.json --previous scan-results/previous.json
  npm run delta:sourced -- --source linkedin --repo-new-only --write

Options:
  --source NAME       Pick the latest two scan-results/*.json files whose names include NAME.
  --current FILE      Current snapshot JSON. Overrides --source current selection.
  --previous FILE     Previous snapshot JSON. Overrides --source previous selection.
  --format md|json    Output format. Default: md.
  --repo-new-only     Only print offers that are new since previous and not already seen in tracker/jobs.
  --baseline-ok       With one matching snapshot, compare against an empty baseline.
  --write             Write markdown to intake/delta-<source>-<date>.md, or --out path.
  --out FILE          Explicit output file for --write.
`);
  process.exit(0);
}

if (!currentPath || !previousPath) {
  const pair = latestSnapshotPair({
    dir: userPath(pathCtx, "workspace/scan-results"),
    source,
    baselineOk,
  });
  currentPath ||= pair.current;
  previousPath ||= pair.previous;
}

const current = loadSnapshot(currentPath);
const previous = previousPath
  ? loadSnapshot(previousPath)
  : { path: null, label: "empty baseline", generatedAt: null, offers: [], raw: {} };
const seenIds = buildRepoSeenIds();
let delta = diffSnapshotOffers({ current: current.offers, previous: previous.offers, seenIds });
if (repoNewOnly) {
  delta = { ...delta, newOffers: delta.newOffers.filter((offer) => !offer.repoDuplicate) };
}
const summary = summarizeDelta(delta);

if (format === "json") {
  console.log(
    JSON.stringify(
      { current: currentPath, previous: previousPath, summary, offers: delta.newOffers },
      null,
      2
    )
  );
} else {
  const markdown = renderDeltaMarkdown({ currentPath, previousPath, delta, summary });
  if (write) {
    const intakeDir = userPath(pathCtx, "workspace/intake");
    mkdirSync(intakeDir, { recursive: true });
    const label = source || basename(currentPath).replace(/\.json$/, "");
    const out =
      outPath || join(intakeDir, `delta-${label}-${new Date().toISOString().slice(0, 10)}.md`);
    writeFileSync(out, markdown);
    console.error(`Wrote ${out}`);
  }
  console.log(markdown);
}

function buildRepoSeenIds() {
  const { seenUrls, seenReqIds } = buildSeenSets(ROOT);
  return new Set(
    [...seenReqIds, ...buildOfferIdentitySet([...seenUrls].map((url) => ({ url })))]
      .filter(Boolean)
      .map((id) => String(id).toLowerCase())
  );
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
}
