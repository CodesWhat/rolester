#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { displayPath, userPath } from "../src/core/paths/workspace.mjs";
import {
  analyzeWritingSamples,
  discoverWritingSamples,
  renderWritingStyleProfile,
} from "../src/core/profile/writing-style.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const pathCtx = { repoRoot: ROOT };
const sampleDir = userPath(pathCtx, "workspace/writing-samples");
const outputPath = userPath(pathCtx, "candidate/writing-style.md");

mkdirSync(sampleDir, { recursive: true });
mkdirSync(userPath(pathCtx, "candidate"), { recursive: true });

const files = readdirSync(sampleDir).map((file) => join(sampleDir, file));
const samplePaths = discoverWritingSamples(files);

if (samplePaths.length === 0) {
  if (!existsSync(outputPath)) {
    writeFileSync(outputPath, fallbackProfile());
    console.log(
      `No writing samples found. Wrote fallback ${displayPath(pathCtx, "candidate/writing-style.md")}.`
    );
  } else {
    console.log(
      `No writing samples found. Existing ${displayPath(pathCtx, "candidate/writing-style.md")} left unchanged.`
    );
  }
  process.exit(0);
}

const samples = samplePaths.map((path) => ({
  path,
  text: readFileSync(path, "utf8"),
}));
const analysis = analyzeWritingSamples(samples);
const date = new Date().toISOString().slice(0, 10);
writeFileSync(outputPath, renderWritingStyleProfile({ date, analysis }));
console.log(
  `Wrote ${displayPath(pathCtx, "candidate/writing-style.md")} from ${samplePaths.length} sample(s).`
);

function fallbackProfile() {
  const date = new Date().toISOString().slice(0, 10);
  return `# Writing Style Profile

_Generated ${date}. No writing samples found in writing-samples/._

Read this before drafting cover letters, essays, outreach, or application answers.

## Agent Instructions

- Use the existing \`README.md\` Voice section as the source of truth.
- First-person, plain, confident, human.
- Kill corporate-speak, breathless buzzwords, triadic adjective stacks, and em-dash pileups.
- Lead with concrete shipped work and honest constraints.
- Do not import facts from writing samples. Style only.
`;
}
