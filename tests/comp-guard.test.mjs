import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COMP_LEAK_PATTERNS,
  CURRENT_BASE_TOKEN,
  findCompLeak,
  findCurrentBaseToken,
} from "../src/core/profile/comp-guard.mjs";

// ── findCompLeak (broad set — for stores that must not discuss comp at all) ───

test("findCompLeak catches the current_base field and common disclosure phrasings", () => {
  assert.ok(findCompLeak("they asked my current_base"));
  assert.ok(findCompLeak("my current base is high"));
  assert.ok(findCompLeak("disclosed current salary"));
  assert.ok(findCompLeak("I currently make above band"));
  assert.equal(findCompLeak("target_base and minimum_base are fine to record"), null);
});

test("findCompLeak returns match metadata", () => {
  const hit = findCompLeak("see current_base here");
  assert.equal(hit.match, "current_base");
  assert.ok(typeof hit.index === "number");
  assert.ok(COMP_LEAK_PATTERNS.length >= 3);
});

// ── findCurrentBaseToken (tight — for research/market prose) ───────────────────

test("findCurrentBaseToken flags only the literal field token, not market phrasings", () => {
  assert.ok(findCurrentBaseToken("vs your current_base of X"));
  assert.ok(findCurrentBaseToken("CURRENT_BASE")); // case-insensitive
  // These are legitimate in company/market research and must NOT be flagged:
  assert.equal(findCurrentBaseToken("their current base of operations is Austin"), null);
  assert.equal(findCurrentBaseToken("engineers currently make $200k in this market"), null);
  assert.equal(findCurrentBaseToken("Glassdoor: Current Salary Ranges 2026"), null);
  assert.equal(findCurrentBaseToken(""), null);
});

test("findCurrentBaseToken returns match metadata and exposes the pattern", () => {
  const hit = findCurrentBaseToken("dump: current_base");
  assert.equal(hit.match, "current_base");
  assert.equal(hit.pattern, CURRENT_BASE_TOKEN.source);
});
