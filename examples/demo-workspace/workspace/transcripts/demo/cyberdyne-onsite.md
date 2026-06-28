# Cyberdyne Systems — Onsite Loop Debrief
**Date:** 2026-06-05
**Format:** Full-day onsite (virtual loop, 4 sessions)
**Panels:**
- AM-1: Coding + Observability (Marcus Webb, Staff ML Engineer)
- AM-2: Hiring Manager (Diego Reyes, VP ML Engineering)
- PM-1: System Design (Dr. Sarah Kazan, ML Platform Lead)
- PM-2: Safety & Cross-functional (Dr. Alan Sorkin, Safety Lead; Jordan Kim, EM)

---

## AM-1: Coding + Observability — Marcus Webb

**Q: Walk me through how you'd build observability for a model-serving endpoint.**

Riley's answer: "Three layers. First, request-level logging: input hash, latency, output confidence, any upstream feature values you're feeding in. Second, aggregate dashboards: p50/p95/p99 latency, error rate, confidence distribution over time. Third, quality monitors: shadow scoring or a human-review sample on a slice of traffic. The first two tell you the system is up; the third tells you the model is still doing what you think it's doing."

Marcus follow-up: "How do you decide what goes in the quality monitor?"

Riley: "Start with the highest-stakes outputs — in Pulsar's case that was schedule changes that touched multiple enterprise accounts. We sampled 5% of those outputs, spot-reviewed them weekly, and had an automated trigger if confidence dropped below a threshold we'd agreed on before launch."

**Live coding:** Implemented a streaming latency tracker with percentile aggregation and a rolling-window alerting check. Wrote clean, testable code. Marcus asked about thread safety; Riley added a lock and noted the tradeoffs vs. an async queue.

**Signal:** Strong. Marcus noted after (via Priya) that the observability approach matched what they're building.

---

## AM-2: Hiring Manager — Diego Reyes, VP ML Engineering

**Q: Tell me about a time you held a deployment when you shouldn't have shipped.**

Riley: "At Pulsar, mid-quarter, the customer's integration team pushed a schema change that wasn't in the agreed SLA. The model's confidence on the new format was untested. I flagged it, pulled the scheduled go-live by a week, ran evals on the new schema, and re-confirmed with the customer. Zero P1 incidents for that deployment. My manager initially pushed back on the delay — I had the eval results and we'd pre-agreed on the readiness criteria, so I held."

Diego: "How did you get buy-in on the readiness criteria up front?"

Riley: "I bring the criteria into the kickoff, not the launch review. Once everyone agrees what 'ready' looks like in week one, I'm not the person slowing you down at the end — I'm just enforcing what we already decided."

**Q: Where do you want to be in two years?**

Riley: "Owning a platform or a product surface with real production impact. I'm good at the hands-on work and I'm good at getting cross-functional stakeholders aligned. Staff IC or a player-coach lead role, not a pure people-manager track."

Diego: "We're building out a lead-without-authority function on the platform side. You'd be the person coordinating safety, product, and infra on a model release cycle."

**Signal:** Very positive. Diego described the role's scope expansion possibility. Strong fit on reliability-first philosophy.

---

## PM-1: System Design — Dr. Sarah Kazan, ML Platform Lead

**Prompt:** Design an online evaluation pipeline for an autonomous scheduling model where outputs can affect real-world resource allocation decisions.

Riley's design:

1. **Shadow scoring:** Run the new model in shadow mode for 2 weeks alongside the current model. Compare outputs on the same inputs; flag divergence >5% for human review.

2. **Confidence gating:** Any output where model confidence < threshold routes to a human reviewer before action is taken. Threshold is set during offline eval; re-calibrated quarterly.

3. **Outcome feedback loop:** For scheduling decisions, capture downstream outcome signal (did the schedule work? were there exceptions?) with a lag of 48–72 hrs. Feed into offline eval dataset monthly.

4. **Automated rollback trigger:** If the online quality metric (sampled human review pass rate) drops below agreed floor, auto-rollback to the previous checkpoint; page on-call.

Dr. Kazan probed: "How do you handle the latency cost of the confidence gating?"

Riley: "You set the confidence threshold to filter out the easy cases — ideally 80–90% of traffic routes through without gating. The hard cases should get human eyes anyway; the latency is a feature, not a bug."

Dr. Kazan: "What if the outcome feedback is ambiguous or delayed past the recalibration window?"

Riley: "You use a proxy metric in the interim — downstream exception rate or manual override rate tends to correlate well with actual model error. Document the proxy, flag it as provisional, and recalibrate when you have real outcome data."

**Signal:** Good. Kazan seemed satisfied with the layered approach. Asked Riley to think about how to handle cold-start for a new model family — Riley noted offline eval dataset seeding and a conservative initial confidence threshold.

---

## PM-2: Safety & Cross-functional — Dr. Alan Sorkin (Safety Lead) + Jordan Kim (EM)

This session surfaced the main unresolved question.

**Q (Sorkin): Who should have stop-deploy authority — engineering, safety, or product?**

Riley: "Safety should have veto authority, no question, for anything touching real-world physical or financial consequences. Engineering has the technical stop-deploy for quality failures. Product shouldn't have unilateral deploy authority over either — they can push for timelines, but the safety and quality gates are non-negotiable."

Sorkin: "In practice we've had cases where the product team escalated around us. How would you handle that?"

Riley: "You need the criteria in writing before the escalation happens. If the stop criteria are documented and everyone signed off in the kickoff, an escalation becomes 'we're asking you to override documented criteria' — that's a very different conversation than 'engineer won't ship.' I've used this at Pulsar."

**Follow-up (unresolved):** Sorkin didn't answer directly who currently owns the stop-deploy decision in ambiguous cases. Jordan Kim mentioned the safety and infra teams operate in separate OKR cycles — they're not in each other's planning loops. Riley flagged this internally as a governance gap that needs clarity before accepting any offer.

**Q (Jordan): How do you work with a team that's skeptical of "AI-first" approaches?**

Riley: "Show them the failure modes first, not the success cases. If you come in saying 'AI will fix this,' you've lost the skeptics. If you come in saying 'here are the three things that can go wrong and here's how we handle each,' you build trust. I lead with the risk surface."

**Signal:** Mixed. Good technical rapport with Sorkin on safety philosophy. Governance structure question left open — Riley would need an answer before committing.

---

## Riley's Post-Onsite Assessment

**Strong signals:**
- Diego's description of the lead-without-authority role is exactly what Riley wants
- Marcus and Sarah showed strong technical depth — would be a high-quality team
- Comp band ($215–255K base, $320–380K TC) is within range, though hybrid SF is a real concession

**Risk flags:**
- Safety governance: who owns stop-deploy in ambiguous escalation cases is UNRESOLVED
- Jordan Kim's team appears siloed from safety — two OKR cycles = coordination risk
- Hybrid SF: two days/week means travel cost and schedule disruption from Austin

**Net read:** Strong interest if governance question resolves cleanly. Would need a direct answer from Diego or Sorkin before entering offer discussion.

*Riley sent post-onsite thank-you emails to all four panelists via Priya on 2026-06-06.*
