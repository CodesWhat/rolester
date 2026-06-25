import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCompAndLogistics,
  buildDoNotOverclaim,
  buildSignalMatchRows,
  extractStoryGaps,
  likelyQuestions,
  renderInterviewPacket,
  topFitSignals,
} from "../src/core/interview/packet.mjs";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EVIDENCE = [
  {
    id: "ev-001",
    claim: "Built production AI workflows from prototype to deployment.",
    evidence: "Led the end-to-end build of three agentic pipelines shipped to prod.",
    metrics: ["Reduced manual review time by 40%"],
    links: [],
    role_signals: ["agentic workflow", "prototype-to-production"],
    allowed_wording: ["production AI workflow"],
    forbidden_wording: ["model training"],
  },
  {
    id: "ev-002",
    claim: "Designed and shipped multi-tenant SaaS architecture.",
    evidence: "Architected isolation layer for 50+ tenants.",
    metrics: [],
    links: [],
    role_signals: ["saas architecture", "multi-tenant"],
    allowed_wording: ["multi-tenant SaaS design"],
    forbidden_wording: ["10x engineer"],
  },
];

const HONESTY = {
  tools: {
    do_not_claim: ["Tool Never Used"],
  },
  claims: {
    do_not_fabricate: ["degrees", "employers", "metrics"],
  },
};

const PROFILE_PRIVATE_COMP = {
  candidate: {
    full_name: "Alex Candidate",
    preferred_name: "Alex",
    email: "alex@example.com",
  },
  compensation: {
    currency: "USD",
    current_comp_shareable: false,
    current_base: 180000,
    target_base: 160000,
    minimum_base: 200000,
    target_total_comp: 280000,
  },
  authorization: {
    work_authorized: true,
    requires_sponsorship: false,
    notice_period: "2 weeks",
  },
};

const PROFILE_SHAREABLE_COMP = {
  ...PROFILE_PRIVATE_COMP,
  compensation: {
    ...PROFILE_PRIVATE_COMP.compensation,
    current_comp_shareable: true,
  },
};

const JOB = {
  frontmatter: {
    role: "Senior AI Engineer",
    company: "Acme Corp",
  },
  signals: ["agentic workflow", "saas architecture", "kubernetes"],
};

// Base section headers that must appear in every packet (from template).
const REQUIRED_HEADERS = [
  "# Interview Packet",
  "## Positioning Thesis",
  "## Top Fit Signals",
  "## JD Signal Match",
  "## Likely Questions",
  "## Questions To Ask",
  "## Comp And Logistics",
  "## Do Not Overclaim",
];

// ---------------------------------------------------------------------------
// buildSignalMatchRows
// ---------------------------------------------------------------------------

describe("buildSignalMatchRows", () => {
  it("returns a row for a matched signal with verbatim claim and allowed_wording", () => {
    const rows = buildSignalMatchRows(["agentic workflow"], EVIDENCE);
    assert.equal(rows.length, 1);
    const row = rows[0];
    assert.equal(row.signal, "agentic workflow");
    // evidence must be verbatim claim text
    assert.equal(row.evidence, "Built production AI workflows from prototype to deployment.");
    // howToSay must be the first allowed_wording entry
    assert.equal(row.howToSay, "production AI workflow");
  });

  it("produces NO row for an unmatched signal", () => {
    const rows = buildSignalMatchRows(["kubernetes"], EVIDENCE);
    assert.equal(rows.length, 0);
  });

  it("handles multiple matched signals", () => {
    const rows = buildSignalMatchRows(
      ["agentic workflow", "saas architecture", "kubernetes"],
      EVIDENCE
    );
    assert.equal(rows.length, 2);
    const signals = rows.map((r) => r.signal);
    assert.ok(signals.includes("agentic workflow"));
    assert.ok(signals.includes("saas architecture"));
    assert.ok(!signals.includes("kubernetes"));
  });

  it("falls back to claim text when allowed_wording is absent", () => {
    const evidenceNoWording = [
      {
        id: "ev-x",
        claim: "Deep TypeScript expertise.",
        evidence: "...",
        metrics: [],
        links: [],
        role_signals: ["typescript"],
        allowed_wording: [],
        forbidden_wording: [],
      },
    ];
    const rows = buildSignalMatchRows(["typescript"], evidenceNoWording);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].howToSay, "Deep TypeScript expertise.");
  });

  it("returns empty array for empty jobSignals", () => {
    assert.deepEqual(buildSignalMatchRows([], EVIDENCE), []);
  });
});

// ---------------------------------------------------------------------------
// extractStoryGaps
// ---------------------------------------------------------------------------

describe("extractStoryGaps", () => {
  it("lists an unmatched job signal as a gap", () => {
    const gaps = extractStoryGaps({
      jobSignals: ["kubernetes"],
      evidence: EVIDENCE,
    });
    assert.equal(gaps.length, 1);
    assert.equal(gaps[0].signal, "kubernetes");
    assert.ok(
      gaps[0].note.includes("candidate/evidence.yml"),
      "note should reference candidate/evidence.yml"
    );
  });

  it("returns empty array when all signals have evidence", () => {
    const gaps = extractStoryGaps({
      jobSignals: ["agentic workflow", "saas architecture"],
      evidence: EVIDENCE,
    });
    assert.equal(gaps.length, 0);
  });

  it("returns all signals as gaps when evidence is empty", () => {
    const gaps = extractStoryGaps({
      jobSignals: ["kubernetes", "rust"],
      evidence: [],
    });
    assert.equal(gaps.length, 2);
  });
});

// ---------------------------------------------------------------------------
// topFitSignals
// ---------------------------------------------------------------------------

describe("topFitSignals", () => {
  it("returns only matched signals", () => {
    const top = topFitSignals({ jobSignals: JOB.signals, evidence: EVIDENCE });
    assert.ok(top.includes("agentic workflow"));
    assert.ok(top.includes("saas architecture"));
    assert.ok(!top.includes("kubernetes"));
  });

  it("respects the limit", () => {
    const manySignals = [
      "agentic workflow",
      "saas architecture",
      "agentic workflow",
      "multi-tenant",
      "prototype-to-production",
    ];
    const top = topFitSignals({ jobSignals: manySignals, evidence: EVIDENCE }, 2);
    assert.equal(top.length, 2);
  });

  it("returns empty array when no signals match", () => {
    const top = topFitSignals({ jobSignals: ["kubernetes"], evidence: EVIDENCE });
    assert.equal(top.length, 0);
  });
});

// ---------------------------------------------------------------------------
// buildCompAndLogistics — privacy gate
// ---------------------------------------------------------------------------

describe("buildCompAndLogistics", () => {
  it("NEVER includes current_base regardless of current_comp_shareable", () => {
    const block = buildCompAndLogistics({ profile: PROFILE_PRIVATE_COMP });
    // current_base must never appear — packet is a shareable artifact
    assert.ok(
      !block.includes("180000") && !block.includes("180,000"),
      "current_base must never appear in the packet"
    );
  });

  it("NEVER includes current_base even when current_comp_shareable is true", () => {
    const block = buildCompAndLogistics({ profile: PROFILE_SHAREABLE_COMP });
    assert.ok(
      !block.includes("180,000") && !block.includes("180000"),
      "current_base must never appear in the packet — shareable artifact invariant"
    );
  });

  it("includes target_base, minimum_base, target_total_comp", () => {
    const block = buildCompAndLogistics({ profile: PROFILE_PRIVATE_COMP });
    assert.ok(block.includes("160")); // target_base 160000
    assert.ok(block.includes("200")); // minimum_base 200000
    assert.ok(block.includes("280")); // target_total_comp 280000
  });

  it("includes notice_period and work_authorized", () => {
    const block = buildCompAndLogistics({ profile: PROFILE_PRIVATE_COMP });
    assert.ok(block.includes("2 weeks"));
    assert.ok(block.includes("yes"));
  });
});

// ---------------------------------------------------------------------------
// buildDoNotOverclaim
// ---------------------------------------------------------------------------

describe("buildDoNotOverclaim", () => {
  it("includes a forbidden_wording phrase from evidence", () => {
    const block = buildDoNotOverclaim({ evidence: EVIDENCE, honesty: HONESTY });
    assert.ok(block.includes("model training"), "should include forbidden_wording from evidence");
  });

  it("includes honesty do_not_claim tool", () => {
    const block = buildDoNotOverclaim({ evidence: EVIDENCE, honesty: HONESTY });
    assert.ok(block.includes("Tool Never Used"), "should include do_not_claim tool");
  });

  it("includes honesty do_not_fabricate items", () => {
    const block = buildDoNotOverclaim({ evidence: EVIDENCE, honesty: HONESTY });
    assert.ok(block.includes("degrees"));
    assert.ok(block.includes("employers"));
    assert.ok(block.includes("metrics"));
  });

  it("deduplicates across sources", () => {
    // "metrics" appears in both honesty.claims and we can check count
    const block = buildDoNotOverclaim({ evidence: EVIDENCE, honesty: HONESTY });
    const count = (block.match(/- metrics/g) ?? []).length;
    assert.equal(count, 1, "metrics should appear exactly once (deduplicated)");
  });

  it("returns placeholder when no constraints", () => {
    const block = buildDoNotOverclaim({ evidence: [], honesty: {} });
    assert.ok(block.includes("No overclaim"));
  });
});

// ---------------------------------------------------------------------------
// likelyQuestions
// ---------------------------------------------------------------------------

describe("likelyQuestions", () => {
  it("returns a non-empty array of strings", () => {
    const qs = likelyQuestions({ job: JOB, profile: PROFILE_PRIVATE_COMP });
    assert.ok(Array.isArray(qs));
    assert.ok(qs.length > 0);
    for (const q of qs) {
      assert.equal(typeof q, "string");
      assert.ok(q.length > 0);
    }
  });

  it("includes role-derived question mentioning the role title", () => {
    const qs = likelyQuestions({ job: JOB, profile: PROFILE_PRIVATE_COMP });
    const hasRole = qs.some((q) => q.includes("Senior AI Engineer"));
    assert.ok(hasRole, "at least one question should reference the role");
  });

  it("includes generic behavioural prompts from the bank", () => {
    const qs = likelyQuestions({ job: JOB, profile: PROFILE_PRIVATE_COMP });
    const hasGeneric = qs.some(
      (q) => q.includes("Walk me through") || q.includes("How do you handle")
    );
    assert.ok(hasGeneric, "should include at least one generic behavioural question");
  });

  it("works when job has no signals", () => {
    const jobNoSignals = { frontmatter: { role: "Engineer", company: "Co" } };
    const qs = likelyQuestions({ job: jobNoSignals, profile: PROFILE_PRIVATE_COMP });
    assert.ok(qs.length > 0);
  });
});

// ---------------------------------------------------------------------------
// renderInterviewPacket — section headers
// ---------------------------------------------------------------------------

describe("renderInterviewPacket", () => {
  const baseParams = {
    job: JOB,
    profile: PROFILE_PRIVATE_COMP,
    evidence: EVIDENCE,
    honesty: HONESTY,
  };

  it("contains all required base section headers from template", () => {
    const packet = renderInterviewPacket(baseParams);
    for (const header of REQUIRED_HEADERS) {
      assert.ok(packet.includes(header), `packet must include section: "${header}"`);
    }
  });

  it("contains Evidence Gaps section (appended output)", () => {
    const packet = renderInterviewPacket(baseParams);
    assert.ok(packet.includes("## Evidence Gaps"));
  });

  it("includes Audience Focus section when audience is provided", () => {
    const packet = renderInterviewPacket({ ...baseParams, audience: "technical" });
    assert.ok(
      packet.includes("## Audience Focus (technical)"),
      "should include audience focus section for 'technical'"
    );
  });

  it("does NOT include Audience Focus when audience is omitted", () => {
    const packet = renderInterviewPacket(baseParams);
    assert.ok(!packet.includes("## Audience Focus"));
  });

  it("NEVER exposes current_base when not shareable (end-to-end)", () => {
    const packet = renderInterviewPacket(baseParams);
    // current_base = 180000
    assert.ok(
      !packet.includes("180,000") && !packet.includes("180000"),
      "packet must not expose current_base when current_comp_shareable is false"
    );
  });

  it("NEVER exposes current_base even when current_comp_shareable is true (end-to-end)", () => {
    const packet = renderInterviewPacket({
      ...baseParams,
      profile: PROFILE_SHAREABLE_COMP,
    });
    // current_base = 180000 — must never appear regardless of shareable flag
    assert.ok(
      !packet.includes("180,000") && !packet.includes("180000"),
      "packet must never expose current_base — hard invariant for shareable artifact"
    );
  });

  it("JD signal match table uses verbatim claim text", () => {
    const packet = renderInterviewPacket(baseParams);
    assert.ok(
      packet.includes("Built production AI workflows from prototype to deployment."),
      "packet must include verbatim claim text in signal match table"
    );
  });

  it("does NOT include 'not shared' placeholder — current comp is simply omitted", () => {
    const packet = renderInterviewPacket(baseParams);
    assert.ok(!packet.includes("not shared"));
  });

  it("shows evidence gap for unmatched signal", () => {
    const packet = renderInterviewPacket(baseParams);
    // 'kubernetes' is in JOB.signals but not in EVIDENCE
    assert.ok(packet.includes("kubernetes"), "gap signal 'kubernetes' should appear in packet");
  });

  it("packet is a non-empty string", () => {
    const packet = renderInterviewPacket(baseParams);
    assert.equal(typeof packet, "string");
    assert.ok(packet.length > 200);
  });
});
