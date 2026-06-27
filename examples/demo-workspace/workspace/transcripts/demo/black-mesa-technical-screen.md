# Black Mesa — Technical Screen Transcript
**Date:** 2026-05-15
**Interviewer:** Dr. Marcus Kleiner, Research Systems Lead
**Format:** 60-minute video call
**Round:** Technical screen (round 2 of loop)

---

## Context

Technical screen focusing on Riley's production pipeline experience and experiment-to-production discipline. Dr. Kleiner opened by explaining that most candidates come from pure software backgrounds with limited exposure to research workflows; he was specifically interested in candidates who had built for non-engineering stakeholders.

---

## Transcript (condensed)

**Kleiner:** Let's start with what you described on your resume — a RAG pipeline at Meridian. Walk me through what that actually looked like end to end.

**Riley:** Sure. The need was a 4-million-page internal corpus — research reports, regulatory filings, vendor contracts — that analysts were manually searching with keyword tools. The process took 3 hours minimum per research cycle. My job was to make it dramatically faster without sacrificing citation quality, because the outputs were going into investment memos.

I built a retrieval pipeline with chunk-level embedding — about 512 tokens per chunk with 64-token overlap — indexed into a vector store. Added a BM25 re-ranking layer for lexical signal, then a final LLM synthesis step that returned a cited excerpt rather than a raw chunk. Sub-60 seconds for most queries; 200+ analysts using it daily within two months of launch.

**Kleiner:** How long from first prototype to what you'd call production-grade?

**Riley:** Eight weeks. Two weeks prototyping to validate the retrieval quality, one week for stakeholder review and setting SLOs — we landed on "95% of queries under 60 seconds, cited excerpt required" — then five weeks of hardening: observability, failure handling for bad embeddings, a re-chunking pass when we discovered certain document types broke our chunk assumptions.

**Kleiner:** What broke first in production that you didn't catch in the prototype?

**Riley:** Document format drift. The corpus had a mix of scanned PDFs, structured XML exports, and Word conversions — and the scanned PDFs had OCR noise that wrecked embedding quality for about 8% of the corpus. I caught it two weeks post-launch from a quality signal: analysts started flagging "weird" results. Added a document quality classifier at ingestion, routed low-confidence docs through a separate OCR-correction step. Fixed the tail.

**Kleiner:** That's a good answer. We see a lot of that — the 90% case is fine, it's the 8% that bites you in a research context because researchers actually try to retrieve the weird stuff. How did you instrument it so you could see that 8% before analysts told you?

**Riley:** Honestly, the first time I caught it from analyst feedback, not monitoring. That's the gap I closed: added a per-document ingestion quality score, tracked p95 score by document type, set an alert at threshold. After that I'd have caught it in a daily digest. The lesson is you need a quality SLO at the *input* layer, not just the output.

**Kleiner:** Tell me about deploying systems for people who aren't engineers. What does that handoff look like?

**Riley:** At Pulsar I ran concurrent enterprise deployments for companies running Salesforce, Greenhouse, Workday — each integration has undocumented edge cases. My job was to get their ops team to a point where they could own it without me. That means: runbook written before I call it done, monitoring dashboard with human-readable alert names (not "p99_latency_ms > 800"), and at least one live incident response drill before handoff. The goal is the customer team handles the 3 AM page, not me.

**Kleiner:** Black Mesa's research staff are scientists, not engineers. Have you worked in that kind of environment?

**Riley:** Not a pure research lab, but close analogs. At Meridian, the primary users of the RAG system were research analysts with zero tolerance for "please reindex the corpus and try again" — they needed it to just work, surfacing quality issues transparently rather than failing silently. And at Pulsar, the customer-side owners of our deployments were operations leads, not engineers. The pattern is the same: you have to make the system's health legible to non-engineers, or the system will quietly degrade.

**Kleiner:** Last one. If you were designing a real-time anomaly detection pipeline over a stream of experimental sensor readings — say, 10K events/second, occasional multi-hour gaps, and 1% known corrupt readings — how would you approach it?

**Riley:** I'd reach for a sliding-window aggregation on top of an event stream (Kafka or Kinesis), with a separate corruption classifier running on ingestion. For the multi-hour gaps, I'd differentiate between an intentional experimental pause and a system outage — that means session-boundary markers in the event schema, not just timestamp deltas. Anomaly detection layer would be statistical baseline per sensor per session window (rolling mean + 3-sigma), with a human-review queue for events in the 2–3 sigma range rather than auto-reject. I'd want to avoid burning researchers on false positives.

**Kleiner:** The corruption classifier — how do you build that without labeled training data?

**Riley:** Start with heuristics: physical bounds (readings outside the sensor's rated range), temporal consistency (5-sigma spike in a single reading vs. trend), and cross-sensor correlation (if sensor A is anomalous and sensor B isn't, that's more informative than either alone). Accumulate analyst-reviewed cases into a small labeled dataset fast — probably 200–300 examples in the first month of operation. Then a lightweight binary classifier can replace or augment the heuristics. Keep the heuristics in the pipeline anyway as a sanity layer.

**Kleiner:** Good. I think we've got what we need. You'll hear from Chloe about next steps — there's an HM screen and then we move to the loop.

---

## Riley's Debrief Notes

Felt strong. Kleiner is technically rigorous — the corruption-classifier follow-up was sharp. My answer on document format drift was honest (caught it from user feedback, not monitoring), and he seemed to appreciate that. The system-design question aligned well with my Pulsar instrumentation experience.

Main gap I sensed: no direct Kafka/Kinesis production experience (I've used SQS + Lambda for event-driven work at Pulsar). Not a blocker but worth flagging if it comes up again in the loop.

**Open concern:** Kleiner didn't address the onsite requirement. Will need to raise this explicitly with Dr. Vance or Chloe before going further into the loop.
