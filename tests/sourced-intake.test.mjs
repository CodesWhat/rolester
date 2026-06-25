import assert from "node:assert/strict";
import test from "node:test";

import { renderSourcedIntake } from "../src/core/scoring/sourced-intake.mjs";

test("renders sourced offers as a gate-first Markdown intake queue", () => {
  const markdown = renderSourcedIntake({
    date: "2026-06-07",
    offers: [
      {
        company: "OpenAI",
        title: "AI Deployment Engineer- Codex",
        url: "https://jobs.ashbyhq.com/openai/example",
        location: "Remote - US",
        source: "ashby-api",
        reqId: "ashby:example",
        possibleDuplicate: true,
      },
    ],
    summary: { scanned: 10, new: 1, filteredTitle: 8, filteredLocation: 1, duplicates: 0 },
  });

  assert.match(markdown, /^# Sourced Intake - 2026-06-07/m);
  assert.match(markdown, /BODY-READ GATE before tailoring or applying/);
  assert.match(markdown, /Fit is a scanner rule score from ATS metadata\/body/);
  assert.match(
    markdown,
    /\| \[ \] gate \| (?:high|med|stretch) \d+% \| [^|]+ \| OpenAI \| \[AI Deployment Engineer- Codex\]/
  );
  assert.match(markdown, /possible-duplicate, ashby:example/);
});

test("escapes markdown table separators in text fields", () => {
  const markdown = renderSourcedIntake({
    date: "2026-06-07",
    offers: [
      {
        company: "Anthropic",
        title: "Applied AI Architect | Enterprise",
        url: "https://job-boards.greenhouse.io/anthropic/jobs/1",
        location: "SF | NYC",
        source: "greenhouse-api",
      },
    ],
    summary: { scanned: 1, new: 1, filteredTitle: 0, filteredLocation: 0, duplicates: 0 },
  });

  assert.match(markdown, /Applied AI Architect \\\| Enterprise/);
  assert.match(markdown, /SF \\\| NYC/);
});
