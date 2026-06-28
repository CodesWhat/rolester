# Technical Screen — Pied Piper · Senior Software Engineer
**Date:** 2026-06-09  
**Interviewer:** Dev Okafor, Staff Engineer  
**Format:** 75 minutes — system design discussion (~40 min) + live coding task (~35 min)  
**Platform:** Video call with shared IDE (Replit)

---

## System Design: Multi-tenant API fan-out for a compression-event webhook service

**Dev:** Let's start with a design problem. Pied Piper's enterprise customers want webhooks fired when a compression job completes — latency, quality score, bytes saved. You have 10,000 enterprise tenants. Each can configure up to 20 webhook endpoints. Walk me through how you'd build this.

**Riley:** First question: what's the SLA on webhook delivery? Best-effort or at-least-once?

**Dev:** At-least-once. They're using it to trigger downstream workflows — payment processing confirmations, audit logs. Can't drop.

**Riley:** Got it. I'd design it event-driven with a persistent queue. Compression job completes → publishes a `job.completed` event to Kafka, partitioned by `customer_id`. Separate consumer group reads from Kafka, fans out to each configured endpoint per tenant. I'd use a worker pool — maybe 50 workers per region — with per-endpoint retry queues. Exponential backoff, dead-letter after 5 attempts, alert on DLQ depth.

**Dev:** Why Kafka over SQS or RabbitMQ here?

**Riley:** Tenant isolation. With Kafka I can partition by `customer_id` and get ordering guarantees per-tenant without cross-tenant interference. SQS would work for basic fan-out but you lose the per-tenant ordering and replay capabilities. At 10K tenants with bursty compression jobs, the partition model also makes it easy to scale horizontally — add consumer replicas for the hot partitions.

**Dev:** How do you handle a tenant with 20 endpoints where 18 are healthy and 2 are down?

**Riley:** Circuit breaker per endpoint. If an endpoint fails 3 consecutive deliveries, open the circuit for 5 minutes, continue delivering to the healthy 18. Log the circuit-open event, fire an internal alert. When the circuit closes after the backoff, re-deliver the DLQ messages for that endpoint first. Tenant doesn't see delivery stopped — they see per-endpoint delivery status in their dashboard.

**Dev:** Good. What about a misconfigured tenant webhook endpoint that returns 200 but is actually swallowing events and not processing them?

**Riley:** That's the idempotency problem from the tenant's side — we can't fully solve it, but we can surface it. What I'd do: require tenants to echo back the `event_id` in their response body (optional, but if they do, we validate it). We also track a per-tenant `acknowledged_count` over a rolling 24h window and flag anomalies — endpoint receives 200 responses but downstream workflow never fires a confirmation callback. That's a proactive support signal, not something we can enforce technically.

**Dev:** Fair. Let's talk about the data model for storing webhook delivery history. How long do you retain?

**Riley:** Raw delivery records — 30 days. Per-event rollup (attempt counts, final status, latency) — 1 year. Hot path reads off a write-optimized store (Cassandra or DynamoDB keyed on `customer_id` + `event_id` + `timestamp`). Historical analytics read from a columnar store (BigQuery or Redshift daily export). Tenant-facing dashboard queries the 30-day hot store directly via a read replica.

**Dev:** Let's shift. You've built RAG pipelines in production. How would you approach building a retrieval-augmented config-recommendation feature for PP — basically, when an enterprise customer is setting up a new compression profile, suggest optimal settings based on similar past jobs?

**Riley:** Interesting application. The corpus here is PP's historical job metadata — input file type, size distribution, latency targets, quality settings, and the resulting quality scores. Index that as vector embeddings keyed by a feature vector: file type + size bucket + domain (healthcare vs financial vs logistics). At recommendation time, embed the customer's new job spec, retrieve the K nearest historical profiles, pass them as context to the model, and have it draft a recommended config with rationale. Human-in-the-loop confirmation before it's applied — this is enterprise infra, you don't want auto-config surprises.

**Dev:** How do you handle data freshness? The optimal settings change as our compression algorithm improves.

**Riley:** Sliding window indexing. Only embed jobs from the last 90 days by default. Flag retrieved examples that are older than the last major algorithm version and include a staleness warning in the recommendation context. Re-embed on a weekly batch cycle. If a customer's domain has very few recent examples, fall back to a wider window and surface that uncertainty in the recommendation confidence score.

---

## Live Coding: Implement a rate-limited webhook dispatcher

**Dev:** I want you to write a function `dispatchWebhook(endpoint, payload, rateLimiter)` in TypeScript. The `rateLimiter` is a token-bucket with a `.acquire()` method that returns a Promise resolving when a token is available. The function should: acquire a token, POST the payload, retry up to 3 times on 5xx, return the final response or throw on exhaustion.

**Riley:**

```typescript
interface RateLimiter {
  acquire(): Promise<void>;
}

interface WebhookResponse {
  status: number;
  body: string;
}

async function dispatchWebhook(
  endpoint: string,
  payload: unknown,
  rateLimiter: RateLimiter,
  maxRetries = 3
): Promise<WebhookResponse> {
  await rateLimiter.acquire();

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      if (res.status >= 500) {
        lastError = new Error(`Server error: ${res.status}`);
        attempt++;
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 100));
        }
        continue;
      }

      return { status: res.status, body: await res.text() };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      attempt++;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 100));
      }
    }
  }

  throw new Error(
    `dispatchWebhook failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}
```

**Dev:** Why did you add `AbortSignal.timeout` rather than a separate `setTimeout` + abort controller?

**Riley:** Cleaner and avoids the cleanup footgun — with a manual `AbortController` + `setTimeout` you have to clear the timeout in the finally block or you leak it. `AbortSignal.timeout` is self-cleaning. Available since Node 18 and all modern runtimes, so it's safe in this context.

**Dev:** What if `rateLimiter.acquire()` hangs indefinitely?

**Riley:** That's a gap — I'd wrap `rateLimiter.acquire()` in a `Promise.race` against a timeout as well. Probably a configurable `acquireTimeoutMs` parameter with a default of 30s. If it times out, throw with a clear error so the caller knows it's a rate-limiter starvation issue, not a network issue.

---

## Debrief notes (internal)

- Strong on distributed systems fundamentals — circuit breaker per endpoint, partition-by-tenant, DLQ depth alerting, all correct patterns.
- RAG answer was grounded and specific — "semantic paragraph boundaries," "staleness warning in context" are non-generic, shows real production experience.
- TypeScript was idiomatic. Caught the `AbortSignal.timeout` pattern vs manual cleanup without prompting.
- Gap flag: didn't spontaneously mention observability instrumentation (traces on webhook dispatch latency) — pushed but answered well when asked.
- Recommendation: advance to final round.
