# Cyberdyne Systems — Onsite Prep + Post-Loop Debrief
**Role:** Staff ML Engineer · Neural-Net Division
**Onsite date:** 2026-06-05
**Generated:** 2026-06-04 (pre-onsite prep) · Updated post-loop 2026-06-06

---

## Pre-Onsite Cue Card

**The role in one line:** Own model-serving reliability and evaluation pipelines for autonomous decision systems — production ML conscience of the division.

---

### Likely questions + grounded answers

**Q: Walk me through a production ML system you owned end-to-end.**
Pulsar scheduling AI — I owned the full deployment lifecycle across 3 concurrent enterprise accounts in one quarter: discovery, integration (Salesforce, Greenhouse, Workday), config, go-live, hypercare. Zero P1 incidents. Cut avg time-to-value from 14 to 9 weeks. The metric was reliability, not model novelty.

**Q: How do you design an evaluation pipeline for high-stakes model outputs?**
At Meridian, the RAG pipeline served a 4M-page corpus — eval was recall + citation precision with a human-review gate on any excerpt that drove downstream action. Offline eval gives you coverage; online sampling tells you if the model is still behaving in prod. You need both. For autonomous systems, I'd add shadow scoring + a confidence gate before any write action.

**Q: Tell me about a time you stopped or delayed a deployment.**
Pulsar, mid-quarter: customer pushed an undocumented schema change. Model eval on the new format was untested; I pulled the go-live by one week, ran evals, re-confirmed with the customer. The pre-agreed readiness criteria gave me the cover to hold without it becoming a political fight.

**Q: How do you handle disagreement between safety and product on a release?**
Set the criteria before the model is done, not during launch review. At Pulsar, I brought stop criteria into the project kickoff so "hold" became "enforcing what we agreed," not "engineer slowing us down." Safety veto should be structural, not a negotiation.

**Q: What's your read on agentic systems in a production context?**
I've shipped one at Meridian: Claude API + custom tools parsing vendor quotes, looking up ERP budget codes, drafting approval emails — with a human-in-the-loop confirmation before any writes. The safety design was: confidence gate on every tool call, pre-flight check before the write step, full audit log. ~87% reduction in procurement admin. The human-in-the-loop step was non-negotiable until we had 3 months of production data.

---

### Comp anchor
Band is $215–255K base / $320–380K TC (posted). Ask for $240K+ given hybrid SF concession. Hybrid SF is a real drawback for an Austin remote candidate — price it.

### Questions to ask
1. Who has the authority to stop a model deployment — engineering, safety, or product — and what happens when they disagree?
2. What does the evaluation pipeline look like today, and what's the biggest coverage gap?

### Secondary questions (if time)
3. How do safety review cycles map to the ML platform release cadence — are they in the same planning loop?
4. What's the on-call structure for model quality incidents?

---

## Study Layer

**Model-serving infra concepts to brush up on:**
- Batching strategies (dynamic batching, request coalescing)
- Canary deploy + feature flagging for model rollouts
- Latency budget design (P50/P99 targets, budget allocation across pipeline stages)
- Rollback automation — checkpoint management, traffic routing

**Eval pipeline patterns:**
- Offline evals: precision/recall, human-labeled ground truth, adversarial sets
- Shadow scoring: running new model in shadow, comparing outputs vs. current
- Online quality monitoring: confidence distribution tracking, output sampling, outcome feedback loop
- Human-in-the-loop review gating: when to route to human, how to set thresholds

**Cyberdyne context:**
- Neural-Net Division: focus on autonomous scheduling + logistics decisions (real-world ops impact)
- Public statements on safety governance: layered review process for any model affecting physical systems
- Team structure: ML Platform (Kazan) + Safety (Sorkin) appear to be separate functions — coordinate closely but distinct OKRs

---

## Post-Loop Debrief (added 2026-06-06)

**What went well:**
- Coding round (Marcus Webb): observability design was exactly what they're building — strong match
- HM session (Diego Reyes): excellent alignment on reliability-first philosophy; Diego described a lead-without-authority role expansion that's squarely in scope
- System design (Dr. Kazan): layered eval pipeline approach landed well; cold-start probe was manageable

**What was unresolved:**
- Safety governance (Dr. Sorkin + Jordan Kim): stop-deploy authority in ambiguous escalation cases was NOT directly answered. Jordan's team is on a separate OKR cycle from safety — structural coordination gap.
- Need a direct answer from Diego or Sorkin before considering any offer.

**Net signal:** Strong on technical fit and role scope. One structural governance question needs a clean answer. Hybrid SF remains a real concession to price into any comp ask ($240K+ base floor given the location cost).

**Next step:** Priya said decision debrief in 5–7 business days from 2026-06-05. Check in 2026-06-13 if no update.
