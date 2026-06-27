# Technical Screen — Weyland-Yutani, Staff Engineer Spaceframe
**Date:** 2026-06-03 | **Interviewer:** Soren Holt, Principal Engineer, Spaceframe
**Format:** 75-minute video call — 15 min intro, 45 min system design, 15 min Q&A
**Riley's prep:** Reviewed JD telemetry stack requirements; pulled Meridian pipeline notes.

---

## Section 1 — Background (15 min)

**Soren:** Walk me through what you're building at Pulsar and how that maps to what Spaceframe
does.

**Riley:** At Pulsar I own the full deployment lifecycle for our AI scheduling product. Discovery
through config through integration with Salesforce, Greenhouse, Workday — then hypercare once
the customer is live. I'm currently running three concurrent enterprise deployments. The parallel
I see with Spaceframe is the "you can't just redeploy" constraint. When a customer is in
hypercare and I have a misconfigured integration, I can't push a hot-fix at will — I have to
route through their change-approval process, which can be a 48-hour gate. So I've gotten very
comfortable designing for forward-compatibility and building operational runbooks that don't
require me to be on-call for every customer edge case.

**Soren:** What's your experience with the actual distributed infrastructure side?

**Riley:** At Meridian I designed and deployed a production RAG pipeline over about 4 million
pages of internal documents. The interesting constraint there wasn't scale — it was latency
budget: we needed cited excerpts in under 60 seconds to actually replace the manual workflow we
were targeting. So I spent a lot of time on chunking strategy, embedding cache layering, and
how we routed queries to avoid full-corpus scans. I also shipped an agentic workflow on top of
the same infrastructure: Claude API with custom tool bindings that parsed vendor quotes, looked
up ERP budget codes, drafted approval emails, and waited for a human-in-the-loop confirmation
before any write to the ERP. That human-approval gate is the pattern I think maps most directly
to what Spaceframe's HITL approval layer is doing.

**Soren:** Good. That's actually close to what we're trying to formalize. Let's get into design.

---

## Section 2 — System Design: Telemetry Pipeline for Degraded-Link Ops (45 min)

**Soren:** Design a telemetry ingestion pipeline that has to work across a 200-to-800ms
variable-latency link with periodic 5-minute complete blackouts. Data sources: 40 sensor streams
at mixed cadence (1 Hz for crew vitals, 10 Hz for nav, 1 kHz for engine). Consumers: real-time
alerting (SLA <30s on-orbit, <60s ground), time-series storage for post-mission analysis, and
an AI anomaly-detection model that runs inference every 5 seconds. Go.

**Riley:** First constraint I want to name: at 1 kHz from engine sensors, raw throughput is
roughly 1M data points per sensor per 1000 seconds — if I have 10 engine sensors that's 10M
points/ksec, so I'm not going to route raw data through the link under any circumstances. So
the first architectural decision is: local edge processing and aggregation happen on-orbit, the
link carries compressed, pre-aggregated data plus full-fidelity bursts for anomaly windows.

I'd put a local Kafka cluster on the orbiting end. Each sensor stream produces into a topic
partitioned by sensor ID. Local consumers do:
1. Windowed aggregation: 1-second roll-ups for nav/engine (so 10 Hz → 1 Hz, 1 kHz → 1 Hz
   over the link), passthrough for crew vitals.
2. Anomaly pre-screening: a lightweight threshold check that elevates a sensor to "high-fidelity
   burst" mode if a value crosses a configured band — in burst mode, that stream goes full
   cadence for 30 seconds.
3. Persistence to local time-series (InfluxDB or equivalent) as the ground-truth store for post-
   mission analysis. This exists independently of link status.

For the link itself: a forward-proxy daemon handles chunked, acknowledged sends. During a
blackout it buffers to disk (compacted, LZ4-compressed). On reconnect it replays in order with
priority given to alert-tagged segments. The ground-side consumer reconstructs the timeline from
sequence numbers — gaps are flagged but not fatal, because the on-orbit store is the source of
truth for the full-fidelity record.

**Soren:** How are you handling the 30-second alerting SLA given that you might be in a 5-minute
blackout?

**Riley:** On-orbit alerting is a separate path that doesn't touch the link. The edge node has
its own alert evaluator — it screens every aggregated window, checks configured thresholds, and
if a crew-impacting alert fires, it routes to on-orbit display immediately. That's the local
life-safety path. What crosses the link asynchronously is the alert event record so ground can
see it too, but the crew doesn't wait for ground confirmation to see a warning.

For ground-side alerting — where a ground team is watching a dashboard — the SLA starts from
the moment the data arrives on the ground segment. If there's a 5-minute blackout, ground
alerting is inherently delayed by the blackout duration. That's a physics constraint, not an
architecture deficiency. The SLO doc needs to say: "ground alerting latency ≤ 60s from data
receipt, with the understanding that receipt is delayed during link blackouts."

**Soren:** Good distinction. How does the AI anomaly model fit in?

**Riley:** The model runs at the ground segment, not on-orbit — I don't want to burn compute
budget on the edge for inference. It consumes from the reconstructed ground-side Kafka topic,
runs on a 5-second sliding window, and produces a scored anomaly event if confidence crosses
threshold. That anomaly event feeds the human-in-the-loop approval queue — the model recommends
an action, a crew operator sees it, confirms, and only then does the write go back through the
link to the actuator system. The latency on that loop is link-limited, so again: local crew UI
has priority for immediate safety responses; the AI-augmented path is for "considered" decisions
that can tolerate 1–5 minute round trips.

**Soren:** What breaks first under load?

**Riley:** The link buffer on blackout. If a blackout is longer than expected or the burst data
rate during an anomaly window exceeds the buffer I've provisioned, I start dropping or compacting
more aggressively. I'd address that with: (a) a configurable retention-tier so safety-critical
sensor data is last to be compacted, (b) an alert that fires when the buffer depth crosses 70%,
(c) automatic burst-mode throttling — if the buffer is filling, I revert anomaly sensors to 1 Hz
aggregated until link is restored. The trade is: I lose full-fidelity on the anomaly window, but
I don't lose the event itself.

**Soren:** [nodding] That's a reasonable priority queue. What does the operational runbook look
like for an engineer on-call dealing with a link failure?

**Riley:** Step 1: confirm blackout is link, not on-orbit outage — there's a beacon heartbeat on
a separate low-bandwidth channel that's always-on; if beacon is alive, link is degraded not dead.
Step 2: verify local on-orbit alerting is still green (check the on-orbit dashboard feed). Step
3: monitor buffer depth via the metrics dashboard — if >70%, trigger the burst-mode throttle
manually if auto-throttle hasn't fired. Step 4: on reconnect, watch the replay feed for any
alert-tagged events that were buffered, surface them to mission ops immediately. The whole
blackout window should be a hold-steady, not a fire drill — the architecture is designed to
operate independently of the link.

---

## Section 3 — Q&A (15 min)

**Riley:** A few things I want to understand. One: what's the on-call expectation? The JD says
~1 week per quarter primary — is that accurate, and what does primary on-call look like at 3am?

**Soren:** Realistic answer: primary on-call is about 4 weeks per year. Wakes at 3am are rare
because the local alerting system handles most things without ground involvement, but mission
anomalies can pull you in. We have a secondary rotation too. If we're being honest, it's a role
that requires you to actually care about uptime in a way that goes beyond the 9-to-5.

**Riley:** That's fair — I'd just want to understand the escalation tree and what I'm expected
to resolve solo versus escalate. Second question: on the HITL approval layer, how is the
"approve" action scoped right now? Is an operator approving individual actuator writes, or is
it approving a plan/sequence?

**Soren:** Currently individual writes. We know that's not scalable — one of the open design
questions for the Staff hire is rethinking the granularity. We're considering plan-level
approval with explicit rollback points. That would be yours to own.

**Riley:** That's interesting scope. Third: the legacy Perl subsystems — what does "cutover"
look like in terms of risk tolerance? Zero-downtime implies parallel running, which has a cost.

**Soren:** Yes, we expect shadow-mode parallel running for at least 90 days before any
cutover. The risk tolerance is exactly zero. You would own the shadow-mode framework.

---

*Overall: strong systems design; Riley's HITL model from Meridian mapped directly to Spaceframe's
approval-layer problem. On-call and safety-scope questions showed appropriate due diligence.
Advance to HM screen and final loop.*
