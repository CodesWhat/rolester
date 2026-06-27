# Final Loop Prep — Weyland-Yutani Staff Engineer, Spaceframe
**Generated:** 2026-06-12 | **Loop date:** 2026-06-14, 10:00 AM CT (4 hrs)
**Panel:** Lena Park (VP Eng), Soren Holt (Principal Eng), Kira Oduya (Staff Eng), Dag Eriksen (Mission Ops)

---

## Live Cue Card (keep this up during the call)

**Role in one line:** Staff Eng owning the distributed telemetry + HITL approval stack for
mission-critical spaceframe ops — high reliability, human-in-the-loop safety, AI-augmented
monitoring.

**My strongest anchors:**
- Pulsar: 3 concurrent enterprise deployments, 0 P1s, time-to-value 14→9 weeks
- Meridian: RAG pipeline (4M pages, sub-60s, 200+ daily users); HITL procurement workflow
  (Claude API + ERP tools, human-confirm before writes) — that pattern IS what they're building

**Comp anchor:** base $215K floor, ask $230K (at midpoint of their $215–255K band). Total
comp ~$340K at mid. Don't anchor lower; their band confirms the target.

---

## Likely Questions + Riley's Answers

**Q1: Tell me about a time you had to make a reliability decision under uncertainty.**

Meridian RAG cutover. We had 200+ daily internal users depending on a 3-hour manual triage
process. On the day we went live, I discovered the embedding model had a latency spike under
load that pushed us from 45s to 90s on complex queries — double our SLA. I chose not to roll
back: the spike was under a specific query pattern I could filter. I routed those queries to a
fallback path (synchronous, no cache) while I diagnosed, communicated proactively to the 6
power users who would notice, and shipped the fix in 4 hours. Zero escalations. The lesson:
know your fallback before you flip the switch, and communicate before people ask.

**Q2: How do you approach system design when the failure domain is life-safety?**

Same discipline, higher stakes on the "what fails safe" question. At the core: local life-safety
paths must not depend on remote systems. At Meridian, our HITL workflow had a rule: if the
approval confirmation didn't arrive in 30s, the agent did nothing — it surfaced the pending
action and waited, rather than retrying or assuming approval. That "fail to safe state, not fail
to action" principle is what I'd apply to the Spaceframe alerting architecture too. On-orbit
alerting must be independent of the link; the ground path is additive, not the primary.

**Q3: How do you drive an architecture decision when you don't have consensus?**

Write the RFC. State the constraint clearly, list the options with honest trade-offs, propose
one, and circulate with a 5-business-day async response window. I find that asynchronous written
debate surfaces better objections than a meeting. If there's still disagreement after one
round, I ask: "Is this a reversible decision?" If yes, we time-box: ship the proposed option
for 30 days, measure, revisit. If irreversible, we escalate to an explicit decision-maker. I've
never had to go above one level because most disagreements dissolve when the trade-offs are
written down clearly.

**Q4: (for Mission Ops — Dag) What do you know about operating in high-latency environments?**

Designed around it at Meridian: the RAG pipeline had to handle degraded network for remote
offices — we pre-cached embeddings locally and used a sync protocol that assumed 30s round-trip.
For Spaceframe, the analogy is local-first: on-orbit systems need to make safe decisions without
waiting for ground. The link is for coordination and post-hoc analysis, not the critical path
for immediate safety responses. I'd expect the Spaceframe architecture to have the same
topology, and from my technical screen with Soren, it does — I want to understand more about
how the local alerting threshold config gets updated and validated.

**Q5: (for Lena — cross-functional leadership) How do you work with non-engineering stakeholders
on reliability tradeoffs?**

At Pulsar, I negotiated SLAs with enterprise customers directly. The conversation always starts
with: "What does downtime cost you, in concrete terms?" Once they quantify it, the math on
redundancy vs. cost becomes obvious. I bring the same framing to product and ops: "Here's the
failure mode, here's the impact in terms of your outcome, here's the cost to prevent it vs.
accept it." I've found that engineers often over-engineer for low-probability failures and
under-communicate the residual risk they accept. I try to make residual risk explicit and get
sign-off in writing.

---

## Questions to Ask the Panel

- **For Lena (VP Eng):** "What does success look like for the Staff Eng in this role at the
  12-month mark? What would make you say 'that person changed how we build'?"
- **For Soren (Principal Eng):** "On the HITL approval layer — you mentioned plan-level
  approval is the direction. What's the blocking constraint today? Engineering capacity,
  operator UX, or something in the mission-ops regulatory framework?"
- **For Kira (Staff Eng):** "What's the hardest part of day-to-day engineering on this team
  that the JD doesn't mention?"
- **For Dag (Mission Ops):** "In a real blackout scenario, what's the thing that keeps you
  up at night that the current system doesn't handle well?"

---

## Study Layer

**Key Spaceframe architecture decisions to have opinions on:**
- Kafka vs. NATS for high-frequency sensor streams (Kafka partition model fits; NATS JetStream
  is viable alternative with lower operational overhead)
- InfluxDB 3.x vs. TimescaleDB for time-series: InfluxDB better for write-heavy telemetry,
  Timescale better if SQL analytics queries dominate
- On-orbit Kubernetes vs. lightweight orchestrator (k3s or Nomad given edge compute constraints)
- gRPC streaming for sensor → edge aggregator (good fit; protobuf schema gives backward compat)

**Comp readiness:**
- Band is $215–255K base, posted. Ask $230K — in-band, slightly above midpoint.
- TC $340K at mid includes equity RSU + 12% bonus. If they anchor low, hold at $220K floor
  and ask for signing to close gap.
- Do NOT accept below $200K base. Floor is $190K absolute.
- On-call premium is reasonable to request if on-call turns out heavier than 1 wk/quarter.

**Red flags to watch for:**
- Vague answer on on-call scope ("it varies" without a range is a yellow flag)
- Any suggestion that the on-orbit HITL approval layer can be bypassed under operational
  pressure — that's an architecture smell and a values mismatch
- Unclear escalation tree for safety-critical incidents
