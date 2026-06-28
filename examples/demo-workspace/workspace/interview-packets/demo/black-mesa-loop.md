# Black Mesa — Research Engineer | Loop Prep Packet
**Generated:** 2026-05-22
**Stage:** Interview loop (post HM screen, pre onsite)
**Status note:** 3 of 4 loop stages complete; onsite Boston scheduled 2026-06-10

---

## Role in One Line

Build production-grade data pipelines and internal tooling for a research org that runs on Python, Kafka, and scientific ambiguity.

---

## Mode Tension (flag early)

Onsite Boston only — this is the practical dealbreaker to clarify before going further. Riley is Austin/remote. If Dr. Vance's team can offer even a hybrid model, that changes the calculus. Ask directly at the onsite.

---

## The Arc So Far

| Date | Round | Who | Signal |
|------|-------|-----|--------|
| 2026-05-09 | Recruiter screen | Chloe Park, Talent Acquisition | Positive; flagged onsite early |
| 2026-05-15 | Technical screen | Dr. Marcus Kleiner, Research Systems Lead | Strong; praised Meridian RAG + Pulsar instrumentation |
| 2026-05-22 | Hiring-manager screen | Dr. Eli Vance, Director of Research Engineering | Positive; interested in cross-functional deployment track record |
| 2026-05-30 | System design | Cross-functional panel (3 interviewers) | Good push-back on latency tradeoffs; recovered well |
| 2026-06-10 | Onsite | Full-day Boston | TBD |

---

## Live Cue Cards (use during call)

### Q1: "Walk us through a time you turned a prototype into a production system."

> Meridian RAG pipeline — 8-week prototype-to-prod on a 4M-page corpus. Started as a manual analyst search, became a sub-60s cited-excerpt query tool with 200+ daily users. Key moves: instrument first, set SLOs before hardening, write the runbook before calling it "done."

### Q2: "How do you handle data sources that are poorly documented or constantly changing?"

> At Pulsar, customer systems — Salesforce, Greenhouse, Workday — each had undocumented field mappings. Built a schema-drift detector that flagged mismatches in CI. Treated external docs as a liability, code as truth. Same instinct here: build for change, not for the spec.

### Q3: "How do you scope work with researchers who can't give precise requirements?"

> Start with the pain metric, not the feature request. At Meridian, the ask was "better search" — ran 2 days of observation sessions to define "sub-60s with a cited excerpt" as the real target. Prototype exposed the gaps, researchers validated. Iterate from there.

### Q4: "Tell me about a production incident on a system you owned."

> Pulsar enterprise deployment — caught a P1-adjacent issue at 2 AM from a latency spike alert. Misconfigured Salesforce batch sync window. Fixed the config, added a sync-window validator, updated the runbook, wrote the post-mortem. Zero customer impact.

### Q5: "What's your experience with LLM-powered internal tooling?"

> Meridian agentic workflow: Claude API + custom tools to parse vendor quotes, look up ERP budget codes, draft approval emails with human-in-the-loop confirmation before any write. Cut procurement admin ~87% per manager. That's the kind of AI integration that actually sticks because it keeps the human in the loop at the decision point.

### Q6: "Why Black Mesa specifically?"

> The research-to-production translation problem is genuinely hard — most companies solve it by hiring more researchers or more engineers rather than building better tooling. The Applied Research Systems team framing suggests Black Mesa is trying to solve the leverage problem. That's the work I want to do.

---

## Comp Anchor

- Posted band: $195–235K base + 10–15% bonus + equity
- Riley's ask: **$215K base**
- Hard floor: **$190K base** (do not go below)
- Total comp target: $260K
- Onsite = should command premium; use as leverage if offer comes in at band bottom

---

## Questions to Ask at Onsite

1. "What does the on-call rotation look like — frequency, escalation paths, and how incidents are handled when a research system fails mid-experiment?"
2. "Is there any flexibility on the onsite requirement? Even a 3-days-onsite / 2-remote hybrid would change the logistics significantly. Austin is home base."
3. "What does success look like at 6 months — what does the team need to see from the person in this role?"
4. "How do research leads typically engage with the Applied Research Systems team — is it project-based, embedded, or on-demand?"

---

## Study Layer

### Their Stack (inferred)
- Python (primary), likely some Go or Rust for performance-critical paths
- Kafka or Kinesis-style event streaming (Riley's gap: used SQS/Lambda, not Kafka directly — be honest, frame as close analog)
- Datadog or Grafana for observability (Riley has Datadog from Pulsar deployments)
- MLflow or W&B for experiment tracking (unfamiliar — acknowledge and show curiosity)

### Riley's Differentiators vs. Typical Research Eng Candidates
- **Production RAG at scale:** 4M-page corpus, 200+ daily users — most research-eng candidates have prototyped RAG, not shipped it
- **Agentic tool-use in prod:** Claude API + human-in-the-loop approval workflow — uncommon in 2024-era research eng backgrounds
- **Cross-functional deployment:** Pulsar's enterprise rollouts = direct analog to Black Mesa's researcher-as-stakeholder model
- **Instrumentation discipline:** "runbook before go-live" is a real pattern, not just a resume line

### Risk Factors
- No direct Kafka production experience (SQS/Lambda is analogous but not identical)
- Onsite Boston requirement is a practical dealbreaker unless hybrid path opens
- Role is somewhat downstream of the "forward deployed" primary target; fit 81 reflects this
