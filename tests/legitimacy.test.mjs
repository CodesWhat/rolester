import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateGate, renderGateBlock } from "../src/core/evaluate/gate.mjs";
import {
  assessLegitimacy,
  EVERGREEN_PHRASES,
  LEGITIMACY_DEFAULTS,
  resolveLegitimacyConfig,
} from "../src/core/evaluate/legitimacy.mjs";

const NOW = new Date("2026-06-12T00:00:00Z");
const longBody = (extra = "") =>
  "We are hiring a Solutions Engineer to lead customer deployments and integrations. " +
  "You will work with our product and engineering teams to ship real outcomes for customers. " +
  "Responsibilities include onboarding, technical discovery, and solution design. ".repeat(6) +
  "This is a permanent, full-time role on a named team with a specific charter and budget. " +
  extra;

const job = (frontmatter, body) => ({ frontmatter, body });

// ── resolveLegitimacyConfig ──────────────────────────────────────────────────

test("resolveLegitimacyConfig returns defaults when no config", () => {
  const c = resolveLegitimacyConfig(undefined);
  assert.equal(c.enabled, true);
  assert.equal(c.maxAgeDays, LEGITIMACY_DEFAULTS.max_posting_age_days);
  assert.equal(c.minBodyChars, LEGITIMACY_DEFAULTS.min_body_chars);
  assert.ok(c.evergreenPhrases.includes("talent community"));
});

test("resolveLegitimacyConfig overrides scalars and EXTENDS phrase lists", () => {
  const c = resolveLegitimacyConfig({
    legitimacy: {
      max_posting_age_days: 30,
      evergreen_phrases: ["seasonal pool", "TALENT COMMUNITY"],
    },
  });
  assert.equal(c.maxAgeDays, 30);
  assert.ok(c.evergreenPhrases.includes("seasonal pool")); // user phrase added
  assert.ok(c.evergreenPhrases.includes("talent community")); // default kept
  // deduped + lowercased: "TALENT COMMUNITY" doesn't create a duplicate
  assert.equal(c.evergreenPhrases.filter((p) => p === "talent community").length, 1);
});

test("resolveLegitimacyConfig honors enabled:false", () => {
  assert.equal(resolveLegitimacyConfig({ legitimacy: { enabled: false } }).enabled, false);
});

// ── assessLegitimacy: textual tells (strong) ─────────────────────────────────

test("evergreen / talent-community phrasing → suspect", () => {
  const r = assessLegitimacy({
    job: job({}, longBody("Join our talent community for future openings.")),
    now: NOW,
  });
  assert.equal(r.verdict, "suspect");
  assert.ok(r.signals.some((s) => s.id === "evergreen-language" && s.severity === "strong"));
});

test("staffing-agency phrasing → suspect", () => {
  const r = assessLegitimacy({
    job: job({}, longBody("We are recruiting on behalf of our client, a major firm.")),
    now: NOW,
  });
  assert.equal(r.verdict, "suspect");
  assert.ok(r.signals.some((s) => s.id === "recruiter-farm"));
});

test("a clean, recent, full posting → clear", () => {
  const r = assessLegitimacy({ job: job({ postedAt: "2026-06-01" }, longBody()), now: NOW });
  assert.equal(r.verdict, "clear");
  assert.deepEqual(r.signals, []);
});

// ── assessLegitimacy: mild signals need two ──────────────────────────────────

test("stale alone is a single soft signal, not suspect", () => {
  const r = assessLegitimacy({ job: job({ postedAt: "2026-01-01" }, longBody()), now: NOW });
  assert.equal(r.verdict, "clear");
  assert.ok(r.signals.some((s) => s.id === "stale" && s.severity === "mild"));
  assert.match(r.reason, /single soft signal/);
});

test("thin JD alone is a single soft signal, not suspect", () => {
  const r = assessLegitimacy({
    job: job({ postedAt: "2026-06-01" }, "Short JD. Apply now."),
    now: NOW,
  });
  assert.equal(r.verdict, "clear");
  assert.ok(r.signals.some((s) => s.id === "thin-jd"));
});

test("stale + thin together → suspect (two mild signals)", () => {
  const r = assessLegitimacy({
    job: job({ postedAt: "2026-01-01" }, "Short JD. Apply now."),
    now: NOW,
  });
  assert.equal(r.verdict, "suspect");
  assert.equal(r.signals.filter((s) => s.severity === "mild").length, 2);
});

// ── assessLegitimacy: data gaps & staleness math ─────────────────────────────

test("missing posting date records a gap, does not flag stale", () => {
  const r = assessLegitimacy({ job: job({}, longBody()), now: NOW });
  assert.ok(r.gaps.some((g) => /no posting date/.test(g)));
  assert.ok(!r.signals.some((s) => s.id === "stale"));
});

test("falls back to dateOpened when postedAt is absent", () => {
  const r = assessLegitimacy({ job: job({ dateOpened: "2026-01-01" }, longBody()), now: NOW });
  assert.ok(r.signals.some((s) => s.id === "stale"));
});

test("max_posting_age_days override changes the staleness boundary", () => {
  const recentish = job({ postedAt: "2026-05-20" }, longBody()); // ~23 days old
  assert.equal(
    assessLegitimacy({ job: recentish, now: NOW }).signals.some((s) => s.id === "stale"),
    false
  );
  const strict = assessLegitimacy({
    job: recentish,
    targeting: { legitimacy: { max_posting_age_days: 14 } },
    now: NOW,
  });
  assert.ok(strict.signals.some((s) => s.id === "stale"));
});

// ── assessLegitimacy: disabled + scan history ────────────────────────────────

test("disabled config short-circuits to clear", () => {
  const r = assessLegitimacy({
    job: job({}, longBody("Join our talent community.")),
    targeting: { legitimacy: { enabled: false } },
    now: NOW,
  });
  assert.equal(r.verdict, "clear");
  assert.deepEqual(r.signals, []);
});

test("scanHistory above thresholds → evergreen-recurring (strong)", () => {
  const r = assessLegitimacy({
    job: job({ postedAt: "2026-06-01" }, longBody()),
    now: NOW,
    scanHistory: { seenCount: 6, firstSeen: "2026-01-01", lastSeen: "2026-06-10" },
  });
  assert.equal(r.verdict, "suspect");
  assert.ok(r.signals.some((s) => s.id === "evergreen-recurring"));
});

test("scanHistory below thresholds does not flag", () => {
  const r = assessLegitimacy({
    job: job({ postedAt: "2026-06-01" }, longBody()),
    now: NOW,
    scanHistory: { seenCount: 2, firstSeen: "2026-06-01", lastSeen: "2026-06-10" },
  });
  assert.equal(r.verdict, "clear");
});

// ── gate integration ─────────────────────────────────────────────────────────

const TARGETING = {
  role_buckets: [{ name: "primary", priority: "primary", titles: ["Solutions Engineer"] }],
  keep_signals: ["customer deployment"],
  cut_signals: ["graveyard on-call"],
  excluded_companies: [],
};
const PROFILE = { compensation: {}, location: { remote: true }, authorization: {} };

const KEEP_BODY = "We value customer deployment work. Compensation: $200,000–$250,000 base.";
const keepJob = (extra = "") => ({
  frontmatter: { company: "GoodCo", role: "Solutions Engineer" },
  body: `${KEEP_BODY} ${extra}`,
});

test("gate: a clean posting stays KEEP with legitimacy clear and no LEGITIMACY line", () => {
  const r = evaluateGate({ job: keepJob(), targeting: TARGETING, profile: PROFILE, now: NOW });
  assert.equal(r.gate, "KEEP");
  assert.equal(r.legitimacy.verdict, "clear");
  assert.doesNotMatch(renderGateBlock(r), /LEGITIMACY/);
});

test("gate: a suspect posting flips KEEP → REVIEW/manual and renders the LEGITIMACY line", () => {
  const r = evaluateGate({
    job: keepJob("Join our talent community for future opportunities."),
    targeting: TARGETING,
    profile: PROFILE,
    now: NOW,
  });
  assert.equal(r.gate, "REVIEW");
  assert.equal(r.action, "manual");
  assert.equal(r.legitimacy.verdict, "suspect");
  assert.ok(r.reasons.some((x) => /legitimacy suspect/.test(x)));
  assert.match(renderGateBlock(r), /LEGITIMACY: suspect - /);
});

test("gate: legitimacy never overrides a hard CUT", () => {
  const r = evaluateGate({
    job: keepJob("graveyard on-call required. Join our talent community."),
    targeting: TARGETING,
    profile: PROFILE,
    now: NOW,
  });
  assert.equal(r.gate, "CUT"); // cut signal wins
  assert.ok(r.legitimacy); // still computed and present
});

test("EVERGREEN_PHRASES export is non-empty and lowercase", () => {
  assert.ok(EVERGREEN_PHRASES.length > 0);
  assert.ok(EVERGREEN_PHRASES.every((p) => p === p.toLowerCase()));
});
