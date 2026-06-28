# Pied Piper — Final Round Prep Packet
**Role:** Senior Software Engineer, Enterprise AI Team  
**Date:** 2026-06-14 · 10:00–13:00 CT  
**Format:** 90-min system design (Dev Okafor + Yuki Stein) → 60-min exec vision (Priya Nakamura + Bertram Hooper)  
**Generated:** 2026-06-13

---

## Panel roster

| Name | Title | Focus |
|------|-------|-------|
| Dev Okafor | Staff Engineer | System design depth, distributed systems, observability |
| Yuki Stein | Senior Architect | API design, multi-tenancy, long-term scalability |
| Priya Nakamura | Engineering Manager | Team fit, cross-functional execution, delivery track record |
| Bertram Hooper | CTO | Technical vision, company direction, long-term ambition |

---

## Session 1: System design (90 min)

### What to expect
Based on the tech screen, Dev and Yuki will go deeper on the enterprise API surface. Likely topics: multi-tenant observability, AI feature design, API versioning strategy. They'll probe your architecture instincts, not just your ability to describe patterns.

### Likely prompt: "Design a compression-quality observability service for the enterprise tier"

**Opening frame:**
Before drawing anything, confirm: "What's the SLA we're optimizing for — dashboards, alerting, or both? And do customers get per-job granularity or aggregate views?"

**Design sketch:**
- Compression job → emits `job.completed` event to Kafka (partition by `customer_id`)
- Consumer aggregates: per-job quality score, bytes-saved ratio, latency P50/P99
- Short-term store: Cassandra / DynamoDB — 30 days, hot reads for tenant dashboards
- Long-term store: BigQuery / S3 — 1yr rollup for trend analytics
- Anomaly detection: Z-score sliding window (15-min) per tenant; alert on quality degradation
- Customer-facing: REST + SSE endpoint for real-time dashboard feed; webhook for async alerting

**Multi-tenancy must-says:**
- Tenant isolation at partition/row level — never fan data across tenant boundaries
- Per-tenant rate limits on the dashboard query endpoint
- Customer controls: they configure alert thresholds, we enforce floor minimums for SLA compliance

### Likely follow-up: "How does the AI config-recommendation feature fit into this?"
The observability service is the training signal. Historical job outcomes (quality score, settings, file domain) feed the embedding index. Recommendation reads the same data layer — no separate data pipeline. Keeps the dependency graph simple.

### Observability instrumentation (fix the gap from tech screen)
Mention proactively: "On the webhook dispatch path, I'd add OpenTelemetry traces — span per dispatch attempt, attributes for `customer_id`, `endpoint_hash`, status code, retry count. Aggregate into per-endpoint latency histograms and DLQ depth metrics. This is how ops knows when a tenant's endpoint is degrading before the tenant does."

---

## Session 2: Exec vision (60 min)

### Priya Nakamura — EM focus
She cares about: team process, delivery reliability, cross-functional collaboration, how you handle ambiguity.

**Likely Q: "Tell me about a time you drove a complex technical project with non-eng stakeholders."**
Answer: Meridian agentic procurement. Mapped the procurement team's existing approval workflow before writing a line of code. Key insight: finance needed audit control, so built human-in-the-loop confirmation into the tool-call chain. Went back 3 times to refine the approval UX based on manager feedback. ~87% admin time reduction. Stakeholders could see exactly what the agent was doing and why.

**Likely Q: "How do you balance moving fast on enterprise integrations vs maintaining reliability?"**
Answer: Fast and reliable aren't opposites if you scope risk at the integration boundary. At Pulsar, each new integration uses a standardized discovery template so I know exactly what can go wrong before I code. I keep an integration-specific runbook in draft from day one — by go-live it's complete. That's how I ran 3 concurrent integrations with zero P1 incidents.

### Bertram Hooper — CTO focus
He cares about: long-term technical vision, where you see AI going, how you think at the system level vs the feature level.

**Likely Q: "Where do you see AI taking compression infrastructure in 3–5 years?"**
Answer: Compression is currently output-agnostic — you tune for size vs speed and the algorithm decides. AI makes compression context-aware: the system understands that this dataset is a healthcare image archive vs a financial log stream vs a video file, and applies domain-optimal compression strategies automatically. Beyond that, AI can close the loop — learn from downstream access patterns (which compressed chunks get read most?) and tune retention vs quality tradeoffs in real time. The platform becomes self-optimizing. The integration layer is where that loop closes with the customer's data stack.

**Likely Q: "What's a technical bet you've made that most people would have argued against at the time?"**
Answer: At Meridian, I pushed for a production RAG pipeline over a vendor search tool when most people wanted to buy rather than build. The corpus was too domain-specific for off-the-shelf retrieval quality. Building it took 8 weeks but gave us control over chunking, retrieval logic, and citation accuracy — which turned out to matter enormously when the use case became user-facing (researchers citing the excerpts in reports). The build-vs-buy instinct was right because the differentiation lived in the domain knowledge embedded in the corpus, not the infrastructure.

---

## Comp strategy

**Their band:** $180K–$215K base, 0.08–0.15% equity, ~10% bonus  
**Riley's ask:** $215K base, top of equity band, $260K+ TC

If they ask comp early: "I'm targeting $215K base; I saw that's the top of the posted band and I think that reflects the FDE and AI-production background I'm bringing."

If the offer comes in at mid-band ($195–200K): "I appreciate the offer. My floor is $215K base based on comp data for this level with enterprise AI deployment experience in Austin. Can we close that gap on base before we finalize?"

Don't let them substitute equity for cash — total comp matters, but base floor is a hard line.

---

## Questions to ask

**For Dev / Yuki (system design session):**
1. "What's the current biggest source of latency variance in the enterprise tier webhook path, and is that something the team owns or a platform constraint?"
2. "How does the enterprise API team coordinate with core-platform on API versioning? Who holds the deprecation schedule?"

**For Priya (EM session):**
1. "What does a successful 90-day ramp look like for this role — what do you want someone to have shipped or learned by then?"
2. "How does the enterprise team decide which AI features to prioritize when there's customer pull in multiple directions?"

**For Bertram (exec session):**
1. "What's the current biggest friction point between PP's compression core and the enterprise customer experience — and where does AI help most in the next 18 months?"

---

## Study notes

- **Middle-out compression:** PP's algorithm — lossless, proprietary, better Weissman Score than standard LZ variants. Key properties: deterministic output (same input = same compressed bytes), CPU-intensive compression / fast decompression. Enterprise customers care about decompression speed more than compression speed.
- **PP enterprise product context:** ~600 enterprise customers, multi-tenant SaaS, integration via REST + SDK. Most pain points are in the integration onboarding (takes too long) and observability (customers can't see what's happening inside the compression job).
- **The AI feature angle:** Riley should frame the AI layer as "closing the loop between the platform and the customer outcome" — that's the through-line from the JD, Priya's HM screen, and the tech screen focus.
- **Dev Okafor's gap flag:** didn't mention observability instrumentation spontaneously in the tech screen. Fix this in session 1 — bring up OpenTelemetry traces proactively on the webhook dispatch design.
