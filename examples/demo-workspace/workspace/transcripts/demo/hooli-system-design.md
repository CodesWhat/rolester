# Hooli — System Design Panel Transcript
**Round:** System Design (virtual onsite-style)
**Date:** 2026-06-04
**Interviewers:** Jordan Ellis (Principal Architect, AI Platform) + Priya Nair (Staff Engineer, AI Platform)
**Candidate:** Riley Chen
**Duration:** ~90 min

---

## Setup (0–5 min)

**Jordan:** Thanks for joining us, Riley. Today we want to do a design session rather than a quiz. We'll give you a problem, you'll drive the whiteboard, and we'll poke at it together. No trick answers — we're looking for how you think and what tradeoffs you see. Sound good?

**Riley:** Works for me. I prefer the back-and-forth anyway.

**Jordan:** Great. Here's the scenario: Hooli is building an internal AI Platform — the LLM orchestration layer that product teams call when they need to run inference, do retrieval, or chain multi-step workflows. Today it's a single-tenant prototype. Your job is to design the production multi-tenant version. We have maybe a dozen internal product teams as tenants today, with a roadmap to 50+. Go.

---

## Phase 1: Clarify scope (5–15 min)

**Riley:** Before I start drawing, a few quick questions. First — what does "multi-tenant" mean at Hooli specifically? Are these fully isolated business units, or product teams inside one company sharing a trust boundary?

**Priya:** Mostly internal product teams with a single corporate identity. No legal data-isolation requirement yet, but finance needs cost attribution per team, and the ML team is paranoid about one runaway batch job starving interactive latency.

**Riley:** Got it — so soft isolation: cost attribution, quota enforcement, latency protection, but not hard encryption-at-rest-per-tenant. Second question: what's the primary interface — sync HTTP, async job queue, or both?

**Jordan:** Both. Interactive features need p95 < 300ms for the LLM call itself. Batch eval pipelines can tolerate minutes.

**Riley:** And third — do product teams bring their own model preferences, or does the platform standardize the model fleet?

**Priya:** Platform owns the fleet. Teams pick from an approved menu. We want to be able to swap a model version without touching every product team.

**Riley:** Perfect. That simplifies routing considerably. Let me sketch the high-level layers.

---

## Phase 2: High-level design (15–45 min)

**Riley:** I'll think of this as three layers: a Gateway layer, an Orchestration layer, and a Resource/Fleet layer.

**Gateway** is the front door — AuthN/AuthZ, tenant identification, quota check, request normalization. Every call enters here. It stamps the request with a tenant ID and a priority class (interactive vs. batch) and hands off to the Orchestration layer.

**Orchestration** is where the interesting logic lives. It has three main jobs: routing (pick the right model endpoint based on the tenant's config + current fleet health), context management (for RAG calls — retrieve, rank, inject into the prompt), and tool-execution (for agentic calls — dispatch tool calls, handle retries, enforce human-in-the-loop gates where configured).

**Fleet** is the actual model inference — could be internal GPU clusters or external API endpoints. The orchestration layer never cares which.

**Jordan:** Walk me through the quota enforcement. How does that work in practice?

**Riley:** At the gateway, I'd keep a token-bucket per tenant in Redis — two buckets actually: one for request-rate (RPM) and one for token throughput (TPM). Interactive calls check both and fast-fail if the bucket is drained. Batch calls go to a separate queue and drain from a lower-priority bucket. The finance cost-attribution side is a separate write — every completed request writes a cost record to a timeseries store, tagged with tenant ID, model, and token count. That feeds the dashboard; it's not on the hot path.

**Priya:** What happens when a tenant's interactive bucket is empty? Do you queue or drop?

**Riley:** For interactive: return 429 immediately with a Retry-After header. Queuing interactive requests hides the problem from the caller and wrecks their p95. For batch: queue and drain in priority order. The queue is a simple Redis sorted set keyed by enqueue time; background workers pull it.

**Jordan:** Good. Let me push on the routing layer. Say team A wants GPT-5 and team B wants our internal fine-tune — how does routing know what to send where, and how does a model swap work?

**Riley:** Each tenant has a model config — basically a mapping from logical model names (like "default-reasoning" or "fast-draft") to a fleet endpoint. The orchestration layer resolves the logical name at request time. To swap a model, you update the fleet registry — not the tenant config. If I'm doing a gradual rollout, I make "default-reasoning" point to a weighted routing rule: 10% to the new model, 90% to the old. I can shift the weight without any tenant knowing. Canary + rollback in one config change.

**Priya:** That's basically what we want to do. What does the fleet registry look like?

**Riley:** Lightweight key-value in something like etcd or a Consul service catalog — model name → endpoint URL + health status + capacity weight. The orchestration layer does a local cache with a short TTL (say, 10s) so routing doesn't block on a registry read per request. On a model health event, the registry pushes an invalidation.

---

## Phase 3: RAG + Retrieval design (45–65 min)

**Jordan:** Let's shift to retrieval. A product team wants to add RAG — grounded their assistant on their internal docs. How do you support that on this platform?

**Riley:** First design question: is the retrieval corpus per-tenant, shared, or both?

**Priya:** Mixed. Some teams have their own corpus; a few want to share a global company knowledge base.

**Riley:** Then I'd model it as named index collections — each tenant declares which indices they want in scope for a given call. The retrieval layer looks up the indices from a registry, runs ANN against each, and merges results before ranking. Shared indices are just indices flagged as global; the retrieval layer has read access regardless of tenant.

For the retrieval architecture itself: I'd go two-stage. First pass: fast approximate nearest-neighbor over a vector index (something like Pinecone or a self-hosted Qdrant). Returns top-50 to top-100 by embedding similarity. Second pass: cross-encoder re-rank on the shortlist — compute a relevance score for each doc against the actual query, take top-k. Re-ranking is where quality comes from; ANN is where latency comes from.

**Jordan:** At Hooli scale, how do you keep the re-ranking from blowing your p95?

**Riley:** A few levers. One: cap the re-rank candidate set — if ANN gives you 100 docs, re-rank 20 not 100. The quality delta from 20→100 is marginal and the latency delta is not. Two: cache re-rank results for identical (query, doc-set) pairs — helps when multiple users ask the same thing against a small corpus. Three: run re-ranker on GPU if available; it's a small transformer, fast. At Meridian I hit sub-60s p95 on a 4M-page corpus with a 2-stage pipeline on commodity hardware — at Hooli's scale I'd throw more resources at the re-ranker before touching the architecture.

**Priya:** You mentioned Meridian. How big was the team there, and were you doing this solo?

**Riley:** Small team — three engineers total. I owned the retrieval pipeline and the embedding infra; one other eng owned the ingest pipeline; the third handled the frontend. The RAG design decisions were mine; I consulted with our infra lead on the vector DB choice but drove the two-stage retrieval call myself.

---

## Phase 4: Observability + failure modes (65–80 min)

**Jordan:** Last topic — how do you know this thing is healthy in production?

**Riley:** Four signals I'd watch. One: request success rate per tenant, per model — 4xx vs. 5xx, broken down. A spike in 5xx on one model tells you fleet health; a spike in 4xx on one tenant tells you quota or auth. Two: latency percentiles — p50, p95, p99 per tier (interactive vs. batch), sampled. Three: retrieval quality signals — if you have evals, track score distributions over time; a drop tells you corpus drift or model change. Four: cost per tenant — rolling 24h spend vs. quota, alerts when approaching ceiling.

**Priya:** What's your on-call story when something goes wrong?

**Riley:** First response: isolate. Is it one tenant or all? One model or all models? One region? That tree takes 2 minutes with the right dashboards. Most prod incidents I've hit traced to one of three causes: a tenant hitting quota unexpectedly (fix: raise limit or notify), a model endpoint going unhealthy (fix: pull from routing, failover to secondary), or a corpus update that invalidated embeddings without re-indexing (fix: trigger re-index, roll back corpus if urgent). I'd instrument alerts for all three — not just generic error rate.

**Jordan:** How did you handle the Meridian RAG rollout when it first went live? Walk me through the go-live story.

**Riley:** Prototype→prod in 8 weeks. The first two weeks I was nervous about the embedding pipeline — we were ingesting 4M pages from a mix of PDFs and internal wikis, inconsistent formatting. I built a validation step that ran after each ingest batch and spot-checked retrieval quality against a golden test set of 50 known-answer queries. If precision dropped below a threshold, the pipeline halted and alerted rather than silently serving stale or wrong docs. That probably saved us two incidents.

Go-live was a controlled rollout — we gave access to one team of 12 power users first, monitored for a week, then opened to the org. First production incident was actually a capacity issue: we underestimated embedding cache hit rates and got hammered on our first high-traffic day. Added an L2 cache in front of the vector DB — hit rate went to ~70%, latency came down, incident resolved.

---

## Wrap-up (80–90 min)

**Jordan:** Good session. Any questions for us?

**Riley:** Two. What does the AI Platform team own versus the product teams who consume it — where's the API boundary today, and how contentious is that line? And what's the biggest unsolved scaling problem in the current LLM orchestration stack?

**Jordan:** Honest answer to the first: the line moves every quarter. We want it at the orchestration layer but some product teams have snuck their own retrieval stacks in. Part of the Principal job is pulling that back. Second question: cost attribution at the call level — we can do it at the batch level today but we can't tell you what a single user's session costs. That's the next hard problem.

**Riley:** Both of those are exactly the kind of problems I want to be working on.

**Jordan:** Good. We'll be in touch soon.

---

*End of transcript. Session concluded approximately 90 min.*
