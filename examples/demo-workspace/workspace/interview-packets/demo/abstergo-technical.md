# Abstergo Industries — Senior Software Engineer | Interview Prep

**Role:** Senior Software Engineer, AI Tooling  
**Stage:** Technical screen (done 2026-06-05) → HM screen (done 2026-06-13) → panel TBD  
**Generated:** 2026-06-04

---

## Live cue card

**One-liner:** Abstergo wants a production RAG + agentic-workflow builder for internal ops tooling — exactly Meridian scope, plus Pulsar deployment discipline.

**Comp anchor:** Posted $180–215K base / TC $250–310K. Push for $215K base; won't go below $190K. Equity terms matter — get vesting schedule.

**3 questions to ask:**
1. What's the current state of the RAG system — is there an eval harness in place or is retrieval quality assessed manually?
2. How does the team handle human-in-the-loop approval for agentic writes vs. reads — any patterns already established?
3. Remote async-friendly is listed — what does that look like in practice for cross-functional stakeholder collaboration?

---

## Likely questions + Riley's grounded answers

**"Walk me through a production RAG system you built."**  
At Meridian, built RAG over a ~4M-page internal research corpus. Replaced 3-hour manual triage with sub-60s cited-excerpt queries. Chunking + embedding pipeline, retrieval eval loop, integration with existing research tooling. Prototype to prod in 8 weeks; 200+ daily users; ~60% reduction in research cycle time.

**"Describe an agentic workflow you shipped."**  
Procurement workflow at Meridian: Claude API + custom tools that parsed vendor quotes, looked up ERP budget codes, drafted approval emails with a human-in-the-loop confirmation step before any writes. Cut admin time ~87% per manager. Key design decision was hard-gating all writes behind a human confirm — no silent mutations.

**"How do you work with non-engineering stakeholders on AI tooling?"**  
At Pulsar, owned discovery and config with customer teams (Salesforce, Greenhouse, Workday integrations). Ran structured kickoffs, translated operational requirements into integration specs, and held stakeholder review gates at each phase. Same pattern at Meridian — scoped RAG and agentic workflows by shadowing the ops teams first, not spec'ing in a vacuum.

**"What's your approach to evaluating retrieval quality?"**  
Define a golden eval set before shipping anything — sample real queries, label expected chunks, track precision/recall on a hold-out set. Instrument at the query level in production (latency, empty-result rate, thumbs up/down where possible). Treat retrieval eval as a living process, not a one-time gate.

**"How do you manage multiple competing priorities on a small team?"**  
At Pulsar, ran 3 concurrent enterprise deployments in one quarter. Weekly priority sync with stakeholders, per-deployment kanban, explicit scope changes documented and re-confirmed. Zero P1 incidents across all three — outcome of disciplined up-front scoping, not just heroics.

---

## Study layer (skim before the panel)

- **Abstergo stack hints from JD:** Python/TypeScript; ERP/HRIS integrations; LLM APIs; vector DBs. Mirror Meridian's stack story closely.
- **Differentiation vs. a pure backend SWE:** Abstergo explicitly wants someone who works directly with stakeholders — lean into the Pulsar customer-facing deployment experience, not just the Meridian build experience.
- **Risk flag:** Base range $180–215K; floor of range ($180K) is below Riley's hard floor ($190K). Top of range meets ask. If an offer comes below $200K, counter to $210K and hold. Don't anchor to their floor.
- **Fit note (76):** This is a secondary-family role (Staff SWE vs. FDE). The AI tooling scope is a strong keep signal, but the absence of external customer-facing deploy work (it's internal tooling) is the gap. Honest positioning: Meridian is the closest analog; Pulsar shows deploy discipline.
