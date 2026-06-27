# Interview Prep — Hooli, Principal Engineer AI Platform
**Generated:** 2026-05-26
**Next round:** System design panel (2026-06-04, virtual, 90 min)
**Interviewers:** Jordan Ellis (Principal Architect) + Priya Nair (Staff Engineer)

---

## One-screen live cue card

**Role in one line:** Own architecture + roadmap of Hooli's multi-tenant LLM orchestration layer; lead 4–6 engineers.

**My edge:** I've built and shipped production RAG (Meridian, 4M pages, 200 daily users, 8-week P→P) and run FDE deployments end-to-end at Pulsar. I've operated both sides of the platform/consumer split — which means I know exactly what breaks at the API boundary.

**Comp anchor:** Target $265K+ base; their posted band is $250–290K. Don't anchor low.

---

### 5 likely questions + grounded answers

**1. "Design a multi-tenant LLM orchestration layer."**
Three layers: Gateway (auth, tenant ID, quota check), Orchestration (routing, RAG, tool-use), Fleet (model endpoints). Quota = token-bucket per tenant in Redis, dual buckets (RPM + TPM). Routing = logical model names resolved against a fleet registry so a model swap is a registry update, not a tenant config change. Canary via weighted routing rule.

**2. "How do you support RAG for internal product teams?"**
Named index collections per tenant — teams declare which indices are in scope. Two-stage retrieval: ANN shortlist (Pinecone/Qdrant, top-50), cross-encoder re-rank (take top-k). Keep re-rank candidate set small (≤20) to protect latency. Result: sub-60s p95 on 4M pages at Meridian on commodity hardware.

**3. "Walk through a production AI system you owned."**
Meridian RAG: 4M-page corpus, 8 wks P→P, 200 daily users, ~60% research-cycle-time cut. Owned retrieval design, embedding pipeline, validation harness. Go-live: golden-test-set validation gate in ingest; controlled rollout (12 users → org). First incident: cache miss rate at scale → L2 cache, hit rate 70%, resolved.

**4. "How do you lead without direct authority?"**
At Pulsar: 3 concurrent enterprise deployments in Q1, cross-functional (CS, Sales, customer eng). No direct reports. Alignment via shared runbooks, weekly cadence, and being the person who removed blockers. Result: all 3 live on schedule, zero P1s.

**5. "What's your approach to platform observability?"**
Four signals: (1) request success rate per tenant + model, (2) latency p50/p95/p99 by tier, (3) retrieval quality score trend (if evals exist), (4) rolling cost per tenant vs. quota. On-call: isolate first — one tenant or all? one model or all? three most common root causes I've hit: quota surprise, model endpoint health, corpus drift.

---

### 2 questions to ask

- "What does the AI Platform team own vs. product teams — where's the API boundary today, and how settled is that line?"
- "What's the biggest unsolved scaling problem in the current LLM orchestration stack?"

---

## Study layer

### Hooli context
- Consumer + enterprise products; AI platform is internal infra, not customer-facing end users.
- Team owns LLM gateway, retrieval stack, eval/observability layer.
- Reports to Marcus Webb, VP Engineering AI Platform.
- Known pressure: product teams sometimes route around the platform (sneak their own retrieval in) — expect questions about platform adoption + governance.

### Retrieval depth — be ready to go here
- ANN algorithms: HNSW (Pinecone default), IVF-PQ (Qdrant default). Tradeoffs: HNSW better recall, IVF-PQ better memory. At Meridian used HNSW.
- Cross-encoder re-ranking: small bi-encoder passes → cross-encoder scores top candidates. Cross-encoder is O(n) but n is small (≤20). GPU helps but not required.
- Chunking strategy: 512-token chunks w/ 64-token overlap at Meridian. Overlap prevents boundary misses.
- Embedding freshness: stale embeddings → retrieval quality degrades silently. The validation harness I built at Meridian is the answer here.

### Multi-tenancy patterns
- Token bucket (quota): standard, Redis-backed, dual buckets (RPM + TPM).
- Priority queues: interactive = drop on empty, batch = queue + drain.
- Cost attribution: per-request write to timeseries store (not on hot path), dashboard over it.
- Model fleet registry: etcd or Consul, logical name → weighted endpoint mapping, local cache + invalidation.

### Potential gaps / watch-outs
- "Have you owned GPU fleet management?" → No, not directly. At Meridian worked with infra team on capacity; I'd partner the same way here. Don't overclaim.
- Hybrid SF: if it comes up, be honest it's a constraint. Don't say it's fine if it isn't — they'll find out.

### Logistics
- Virtual onsite format, 90 min, whiteboard tool TBD (likely Excalidraw or their internal tool).
- Dress: casual, video on.
- Follow up within 24h with a thank-you to Dana Park.
