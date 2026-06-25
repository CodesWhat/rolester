import assert from "node:assert/strict";
import test from "node:test";

import { classifyLiveness } from "../src/core/liveness/liveness-core.mjs";

test("classifies a visible apply control as active", () => {
  const result = classifyLiveness({
    status: 200,
    finalUrl: "https://jobs.example.com/role",
    bodyText: "Senior Forward Deployed Engineer\nAbout the role\nRequirements",
    applyControls: ["Apply for this job"],
  });

  assert.equal(result.result, "active");
  assert.equal(result.code, "apply_control_visible");
});

test("expired body text wins even when generic apply text is present", () => {
  const result = classifyLiveness({
    status: 200,
    finalUrl: "https://jobs.example.com/role",
    bodyText: "This job is no longer available. Apply to other roles on our careers page.",
    applyControls: ["Apply"],
  });

  assert.equal(result.result, "expired");
  assert.equal(result.code, "expired_body");
});

test("short pages without apply controls are treated as expired shell pages", () => {
  const result = classifyLiveness({
    status: 200,
    finalUrl: "https://jobs.example.com/role",
    bodyText: "Careers",
    applyControls: [],
  });

  assert.equal(result.result, "expired");
  assert.equal(result.code, "insufficient_content");
});
