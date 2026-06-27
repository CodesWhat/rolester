# System Design Round — Massive Dynamic
**Date:** 2026-06-09 | **Duration:** ~90 min
**Interviewers:** Yuki Tanaka (Staff Engineer), Priya Desai (Principal Engineer)
**Candidate:** Riley Chen

---

## Setup

*Yuki opened the session with a brief framing:*

> "We're going to ask you to design an enterprise semantic search and retrieval system — think of it as the knowledge-retrieval backbone for a large professional services firm with a mix of internal documents, email archives, and structured data. We care about the tradeoffs you make, not a perfect answer. Feel free to ask clarifying questions."

---

## Clarifying questions (Riley, first 5 min)

**Riley:** "Before I start, a few quick questions. What's the rough corpus size — documents, pages, update frequency?"

**Yuki:** "~12 million documents, averaging 8 pages each. Mix of PDFs, Word docs, structured reports. About 50K new or updated docs per week."

**Riley:** "Query pattern — mostly interactive (user types a question, expects sub-second results), or batch?"

**Priya:** "Primarily interactive. Target P95 under 400ms end-to-end. Batch is secondary."

**Riley:** "Multi-tenant? Are different firm clients logically or physically isolated?"

**Priya:** "Logically isolated. Shared infrastructure, but data isolation is a hard compliance requirement."

**Riley:** "Okay, that shapes a few key decisions. I'll start with ingestion, work through retrieval, then talk about isolation and eval."

---

## Ingestion pipeline

**Riley:** "At 96M pages with 50K weekly updates, ingestion has to be async and fault-tolerant. I'd use a queue-based pipeline — new or updated docs land in S3, a trigger fires a message onto SQS or Kafka, and a fleet of ingestion workers processes them in parallel.

Each worker: extract text (Unstructured.io or equivalent for PDF/DOCX), clean, chunk. On chunking strategy — at 96M pages I'd target 512-token chunks with 64-token overlap. The overlap handles sentence-boundary cuts. For very long structured docs (annual reports, legal filings) I'd also extract section headers as metadata for filtering.

Embedding: batch async, not real-time, to keep costs manageable. I'd run a sentence-transformers model or OpenAI text-embedding-3-large depending on accuracy requirements and cost tolerance. Store chunks with metadata: doc_id, chunk_index, tenant_id, doc_type, created_at, section_header."

**Priya:** "How do you handle document updates? If a doc is revised, what happens to its chunks?"

**Riley:** "Soft delete + re-index. When a doc update comes in, I mark all chunks with that doc_id as `active=false` in the vector store, ingest the new version, then hard-delete stale chunks after a 24-hour TTL. This avoids a race where a query hits a partially re-indexed doc. For append-only corpora (email archives) there's no soft-delete, just ingest."

---

## Retrieval architecture

**Riley:** "For retrieval I'd go hybrid: BM25 keyword search in parallel with dense vector search, then fuse with RRF — Reciprocal Rank Fusion. Neither alone is sufficient: BM25 handles exact-match and rare terms (product codes, client names); dense handles semantic intent. RRF is simple, doesn't require tuning score scales, and empirically outperforms linear interpolation for most enterprise corpora.

After fusion, I'd add a cross-encoder reranker on the top 20 results, returning the top 5 (or top-k as configured). Cross-encoder reranking gives a big quality lift — it's the most cost-effective spend in the retrieval stack because it's only running on 20 candidates, not the whole corpus."

**Yuki:** "How do you choose k for the initial retrieval?"

**Riley:** "Empirically, from your eval set. Start at 50 from each modality, measure recall@5 and MRR@5 on labeled queries, then find the knee in the curve. In practice for enterprise corpora I've seen 20–50 from each modality cover 95%+ recall. Going higher is diminishing returns and increases reranker cost."

**Yuki:** "What's your eval setup?"

**Riley:** "Before shipping, I'd want 500–1000 human-labeled (query, relevant doc) pairs — ideally seeded from historical search logs if they exist, supplemented with synthetic negatives. Metrics: Recall@5, MRR@5, NDCG@5, and latency (P50, P95, P99). I'd also set up an LLM-as-judge layer for end-to-end answer quality if we're feeding this into a RAG answer pipeline, not just search. Regular regression testing on each model or pipeline change."

---

## Multi-tenant data isolation

**Yuki:** "Talk us through multi-tenant isolation — this is the part we care most about given our compliance posture."

**Riley:** "Right. With logical isolation and compliance requirements, I'd enforce isolation at multiple layers — not just hope the application layer gets it right.

First, embedding namespace per tenant. Most vector stores (Pinecone, Weaviate, Qdrant) support namespaces or collections with access policies. Tenant A's vectors live in Tenant A's namespace — the query itself can't cross namespaces without an explicit cross-namespace call, which we never make in the hot path.

Second, metadata filtering is a predicate applied *before* candidate retrieval, not after. Post-filtering is dangerous: if you retrieve top-100, then filter by tenant_id, you could leak zero results to the right user and still have fetched Tenant B's data internally. Pre-filtering at the vector store level avoids that.

Third, audit log every retrieval request: tenant_id, query hash, retrieved doc_ids, timestamp. That's your compliance trail.

Fourth, rate limits per tenant at the API gateway layer, not inside the model call — prevents one tenant from starving others."

**Priya:** "What if two tenants need to share a corpus — say, a parent firm and a subsidiary?"

**Riley:** "I'd model that as a shared namespace with explicit ACL membership rather than cross-namespace queries. The parent and sub are both members of a 'shared' namespace. ACL entries define which namespaces a tenant's query is allowed to hit. This keeps the multi-namespace query explicit and auditable rather than implicit."

**Priya:** "That's a reasonable approach. One follow-up: how do you handle ACL changes without downtime?"

**Riley:** "ACLs are config, not schema — store in a fast-read cache (Redis) fronting a durable store (Postgres). ACL invalidation on write, short TTL (60s) on cache entries. A namespace the tenant just lost access to will still be queryable for up to 60s — that's the tradeoff. For stricter compliance, make it synchronous at write time (invalidate, flush, then return)."

---

## Scaling and cost

**Riley:** "On cost: the most expensive components are (1) embedding at ingestion and (2) the reranker at query time. For ingestion, batch async keeps GPU cost low — you're paying for throughput, not latency. For the reranker, a quantized cross-encoder (int8) is ~40% cheaper with <2% quality drop in my experience. For the dense retrieval model, consider a smaller but domain-fine-tuned model over a large general-purpose one — domain-specific recall is usually better and cheaper.

At 96M pages, I'd also tier the corpus: hot tier (last 2 years, higher-quality embedding) in dedicated fast-read namespaces, cold tier (older) in cheaper storage with longer retrieval SLA. Most queries target recent content in practice."

---

## Wrap-up

**Yuki:** "Nice. We're almost at time. Any questions for us?"

**Riley:** "Two: What does the team's current eval harness look like — do you have labeled query sets, or is that something you'd want to build from scratch? And how often does the AI Platform team get visibility into how enterprise customers are actually using the retrieval layer?"

**Yuki:** "We have about 200 labeled queries today — well below where we want to be. That's actually a near-term priority. And on your second question: we do quarterly business reviews with our top 10 enterprise customers; the Staff Eng often joins those."

**Riley:** "That's good to hear on both counts. I'd want to invest heavily in the eval set early — the rest of the architecture decisions compound from there."

---

## Debrief notes (internal — not shared with candidate)

*Yuki's post-round notes:*
- Strong on retrieval architecture; specifically, the BM25+dense+RRF+reranker stack was described precisely and in the right order.
- Good instinct on namespace-level isolation vs post-filtering — that's the subtle thing most candidates miss.
- One gap: ACL change handling was a bit hand-wavy initially; recovered when pushed. Worth probing on the panel.
- Eval harness knowledge is above average — candidate has clearly run evals in production.
- Recommend advancing to panel.
