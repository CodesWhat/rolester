# E Corp — Staff SWE | Interview Prep
**Role:** Staff Software Engineer, Platform Intelligence
**Panel date:** 2026-05-21 (virtual onsite)
**Comp anchor:** Ask $240K base + $15K sign-on. Floor $190K. TC posted $320–380K.

---

## Live cue card (keep this up)

**The role in one sentence:** Build AI-powered incident triage and agentic approval workflows for E Corp's 340-service financial platform — staff IC with cross-functional scope across SRE, product, and finance ops.

**Why I fit (say this early):**
- Built and shipped production RAG at Meridian (4M pages, 200 daily users, 60% research-cycle reduction)
- Built agentic tool-use workflow with human-in-the-loop safety at Meridian (87% procurement admin cut)
- 3 concurrent enterprise deployments at Pulsar, all on schedule, zero P1s — cross-functional stakeholder work is normal for me

**Comp anchor (repeat internally before negotiation):** $240K base. $190K floor. Don't anchor below $215K even casually.

---

## Five questions I expect + my answers

**1. Walk me through a system you built that reduced operational toil.**
→ Meridian RAG: replaced 3-hour manual research triage with sub-60s cited-excerpt queries. 8 weeks proto→prod, 200+ daily users, ~60% research-cycle-time reduction. The unlock was parent-document retrieval — naive chunking lost cross-document context and caused hallucinated citations; sliding-window fixed it.

**2. How would you design an LLM-powered incident triage pipeline?**
→ Index runbooks + past postmortems in vector store (pgvector to start). On alert: extract structured context (service, error class, affected metrics), run semantic search, retrieve top-k chunks, pass with alert context to LLM, produce structured output (probable cause, severity, recommended action, escalation path). Deliver to on-call in Slack in under 10 seconds. Human reviews; AI does NOT auto-execute.

**3. Tell me about a time you aligned non-technical stakeholders on a risky AI feature.**
→ Meridian agentic procurement: finance team's default was "no" due to past automation failures. I ran a live demo on their real (already-resolved) requests, showed the human-in-the-loop confirmation step, invited them to find errors. They found two ambiguous budget code cases; we fixed them live. Finance manager ended up asking to expand the pilot. Observable system + explicit human gate changed "do you trust AI?" into "do you trust your own judgment?"

**4. How do you evaluate retrieval quality without a labeled test set?**
→ Three proxies: (1) gold-standard query suite — 30–50 known-good scenarios, run on a schedule after any corpus update; (2) implicit feedback — did the on-call act on the suggestion within 5 min?; (3) explicit thumbs-up/down in the alert card. At Meridian this caught a deprecated policy doc surfacing in retrieval that we'd never have spotted otherwise.

**5. How do you mentor without formal authority as a staff IC?**
→ Be the person they show the design to before the PR, not after. Office-hours 1:1s where they drive the agenda. Externalize my own design reasoning: short design docs, "why" comments in code. Actively avoid creating dependency — if I get the same question twice, I build the document or pattern that handles it, not another 1:1 answer.

---

## Two questions to ask them

1. What does success look like at 6 months for this role — what's shipped and what's measurably better?
2. How is the AI-ops initiative resourced — is this team starting greenfield, or inheriting existing infra I'd own?

---

## Study layer (10-min skim if time allows)

**E Corp context:** Large diversified financial platform, millions of daily transactions. AI-ops initiative is net-new — greenfield inside a mature infra org. Their public SRE blog mentions a "zero-ticket incident response" north star. Tie answers to that where natural.

**Technical concepts to have sharp:**
- Sliding-window chunking + parent-document retrieval (I've built this — know the tradeoffs cold)
- HNSW index for vector search (pgvector syntax: `CREATE INDEX ON table USING hnsw (embedding vector_cosine_ops)`)
- Human-in-the-loop patterns in agentic workflows: draft→confirm→execute, never auto-execute on write paths
- Alert dedup: window-based with (service, error_class) key; count as severity signal
- Eval harness: offline gold-standard suite + in-production implicit/explicit feedback

**Cross-functional / behavioral:**
- Stack-rank my wins: Meridian RAG > Meridian agentic workflow > Pulsar deployment scale. Lead with the one that matches the question's framing.
- "Failure" story: Meridian RAG early chunking bug. Caught in internal beta, fixed before launch, added CI test. Shows rigor, not recklessness.
- PM partnership: the Meridian launch timing compromise (hit the date, add Beta label + feedback loop) shows I don't just say no.

**Comp:** If they ask current comp, politely decline: "I keep that private, but my target is $240K base and I'm confident the range works for both of us based on what's been shared." Don't anchor first if avoidable.
