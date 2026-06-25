import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeWritingSamples,
  discoverWritingSamples,
  renderWritingStyleProfile,
} from "../src/core/profile/writing-style.mjs";

test("discovers writing samples while skipping README and unsupported files", () => {
  const files = [
    "writing-samples/README.md",
    "writing-samples/cover-letter.md",
    "writing-samples/email.txt",
    "writing-samples/sample.pdf",
  ];

  assert.deepEqual(discoverWritingSamples(files), [
    "writing-samples/cover-letter.md",
    "writing-samples/email.txt",
  ]);
});

test("analyzes measurable writing-style signals", () => {
  const analysis = analyzeWritingSamples([
    {
      path: "writing-samples/sample.md",
      text: "I built the workflow. It shipped in a week.\n\nNo fluff; direct proof, then context.",
    },
  ]);

  assert.equal(analysis.sampleCount, 1);
  assert.equal(analysis.firstPerson, "present");
  assert.equal(analysis.semicolons, "present");
  assert.equal(analysis.ellipsis, "absent");
  assert.equal(analysis.preferredVerbs.includes("built"), true);
  assert.equal(analysis.averageSentenceWords > 3, true);
});

test("renders a reusable cached style profile for agents", () => {
  const markdown = renderWritingStyleProfile({
    date: "2026-06-07",
    analysis: {
      sampleCount: 2,
      totalWords: 120,
      averageSentenceWords: 12,
      paragraphShape: "short",
      firstPerson: "present",
      punctuation: "semicolons present; em dashes absent; ellipses absent",
      semicolons: "present",
      emDashes: "absent",
      ellipsis: "absent",
      preferredVerbs: ["built", "ran", "shipped"],
      avoidSignals: ["passionate about", "leveraged"],
      sourceFiles: ["writing-samples/a.md", "writing-samples/b.txt"],
    },
  });

  assert.match(markdown, /^# Writing Style Profile/m);
  assert.match(
    markdown,
    /Read this before drafting cover letters, essays, outreach, or application answers/
  );
  assert.match(markdown, /Preferred verbs: built, ran, shipped/);
  assert.match(markdown, /Avoid: passionate about, leveraged/);
});
