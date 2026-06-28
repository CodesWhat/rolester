# Aperture Science — Technical Deep Dive Debrief
**Date:** 2026-05-29
**Round:** Technical screen (Enrichment Center deployment panel)
**Interviewers:** Nadia Kuznetsova (Senior FDE), Marcus Webb (Platform Engineering Lead)
**Duration:** 75 min

---

## Overview

Strong session. Panel focused on production deployment patterns, agentic tool-use safety, and RAG evaluation in the field. Riley grounded every answer in real deployment work. The "prototype-to-managed-service" framing resonated clearly with both interviewers.

---

## Q&A Log

**Q (Nadia): Walk us through your end-to-end ownership of an enterprise AI deployment. What does "done" look like to you?**

A: At Pulsar, "done" meant the customer was operating independently without us in the room — monitoring their own integration, running their own playbooks, calling support only for genuine edge cases rather than hand-holding. Getting there required four distinct phases: discovery (mapping their data sources and integration surfaces), config (building the actual connectors — Salesforce, Greenhouse, Workday for three of our accounts), parallel-run validation where we ran the AI output alongside the old manual process for 2–3 weeks, and hypercare exit where we transferred the runbook and confirmed the customer team could own it. Shortest time-to-value I hit was 9 weeks, down from a team average of 14 before I restructured the parallel-run phase.

**Q (Marcus): You mentioned validating AI output alongside manual process. How did you instrument that?**

A: We built a lightweight evaluation log — every AI scheduling decision wrote a structured record (input context, output recommendation, model confidence, timestamp) to a Postgres table the customer team could query. We added a human-review flag that triggered a Slack alert for any decision above a configurable risk threshold. After 2–3 weeks of parallel runs, we could show the customer their own data: here's the agreement rate, here's where the AI diverged and why, here's what a false positive cost you. That framing got buy-in faster than any pitch deck because it was their numbers.

**Q (Nadia): Tell me about a deployment that went sideways. What happened and how did you recover?**

A: One account's Greenhouse integration broke mid-deployment because they pushed a schema migration on their end without notifying us. The webhook payload changed, our parser started dropping fields silently, and we only caught it 18 hours later during a check-in call. Recovery: immediately switched to a degraded-mode fallback that queued records instead of processing them, wrote a schema-diff script to catch future changes, and added a daily assertion check on the field set we depended on. Post-incident, I pushed for a "change communication" clause in our standard deployment agreement. No P1s from schema drift after that.

**Q (Marcus): We use Claude API heavily for multi-step agent workflows in the Enrichment Center product. Have you built agentic tool-use in production? What are the edge cases you watched for?**

A: Yes — at Meridian I shipped an agentic procurement workflow using Claude with custom tools. The tools could parse vendor quotes, look up ERP budget codes, and draft approval emails. The edge cases that bit us early were around tool call chaining — the model would sometimes request a budget-code lookup and then use a stale cached value rather than the fresh result, especially if we had multiple function calls in one turn. We fixed that by designing idempotent tools and making the tool-call/response boundary explicit in the system prompt. The bigger safety challenge was the write path: sending an email is irreversible. We added a mandatory human-in-the-loop gate before any write-side action — the agent drafted, a human confirmed, then the tool executed. Cut procurement admin by about 87% per manager once we got that pattern stable.

**Q (Nadia): Our customers ask us to connect to their data for RAG. How do you evaluate retrieval quality in a field context where you can't label the full corpus?**

A: Same challenge at Meridian — 4M pages, no labeled test set. We used a few proxies: (1) retrieval coherence: for a sample of real user queries, did the top-k chunks actually contain the relevant entity or policy? (2) citation hit-rate: when users clicked through on a cited excerpt, did it answer their question? We tracked that via a simple thumbs-up in the UI. (3) comparison-task evaluation: we identified 20 "gold standard" queries where we knew the right answer and ran them on a schedule to catch regressions after corpus updates. Not perfect, but it caught the two big chunking bugs that would have degraded production quality.

**Q (Marcus): Where do you think FDE work is going in the next 18 months as agentic products mature?**

A: The deployment surface is going to get harder before it gets easier. Right now most enterprise integrations are read-only or near-read-only — surface data, display recommendations. As customers want agents to actually execute (send emails, update CRM records, trigger approvals), the FDE has to be the person who designs the safety boundary. That means instrument-everything, explicit human-in-the-loop gates on write paths, and clear escalation paths when the model produces something the customer didn't expect. The FDE who succeeds in that world understands both the engineering and the trust-building with non-technical stakeholders.

---

## Panel Feedback (noted informally during call)

- Nadia: "The Greenhouse schema-drift story is exactly the kind of thing we run into. That's a mature answer."
- Marcus: "Really liked the human-in-the-loop framing on write actions — most candidates hand-wave past that."
- Both expressed clear interest in moving to next step (take-home scoping exercise).

---

## Riley's Post-Interview Notes

- Strong rapport with both interviewers; panel culture feels collaborative and technically deep.
- Comp is the main flag — base range ($155–190K) sits at or below my floor. Need to understand equity in context before deciding whether to push forward.
- Role scope is close to ideal: owns deployment lifecycle, builds tooling, feeds product. Would do this work.
- Next step: take-home scoping exercise within 48 hours.
