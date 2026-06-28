# E Corp — Technical Screen Transcript
**Date:** 2026-05-08
**Round:** Technical screen / system design
**Interviewer:** Sam Rivera (Staff Engineer, Platform Intelligence)
**Duration:** 90 min (15 min intro + 75 min system design)
**Format:** Zoom; shared whiteboard (Excalidraw)

---

## Overview

Focused system design session. Sam opened with a concrete scenario — E Corp's current incident pipeline and what's broken — then asked Riley to design an AI layer on top of it. Riley walked a retrieval-augmented architecture with explicit latency and safety reasoning throughout. Sam probed hard on p99 latency at peak load, retrieval precision vs recall tradeoffs, and the human-in-the-loop boundary. Riley had concrete answers for all three. Session ended with 10 minutes of "what questions do you have for us" — Riley asked sharp product-facing questions about eval practices and stakeholder buy-in.

Overall: strong. Sam's informal comment at the close: "This is the kind of design I'd want to implement."

---

## Q&A Log

**Sam: Let me describe our actual problem. We get roughly 800 high-severity alerts per week across 340 microservices. The on-call rotation is burned out. Median time to triage is 23 minutes. We think AI can help but haven't committed to a design. If you were joining on Monday, how would you think about this?**

A: First thing I'd do is scope the problem narrower. 800 alerts per week sounds like a lot, but not all 800 are novel — I'd bet a meaningful fraction are repeat patterns or correlated alerts from a single upstream cause. So step zero is understand the alert taxonomy before designing anything.

Assuming we want to cut triage time for the genuinely novel cases: I'd build a retrieval-augmented incident triage system. The intuition is that your SREs already know how to triage most of these — the knowledge is in your runbooks, your past postmortems, and your system topology docs. The problem is that finding and synthesizing that knowledge takes time on-call. An AI layer can do that retrieval in seconds instead of minutes.

Concrete design: index your runbooks, postmortems, and service dependency graph into a vector store. When an alert fires, extract the structured context — service name, error class, affected metrics, time-of-day — and run a semantic search over the indexed corpus. Take the top-k retrieved chunks, pass them with the alert context to an LLM, and ask it to produce a structured triage output: probable cause, severity reasoning, recommended first-action, and relevant on-call escalation path. Deliver that to the on-call in Slack or PagerDuty before they've even opened a terminal.

**Sam: What vector store and embedding approach would you use?**

A: At this scale, pgvector on your existing Postgres cluster is a reasonable starting point — avoids adding a new infra dependency, and 340 services' worth of runbooks is not a large corpus. If query latency becomes a bottleneck or you want approximate nearest-neighbor at higher throughput, I'd consider Pinecone or Weaviate, but I wouldn't add that complexity before validating the retrieval quality on the simpler stack.

For embeddings: I'd use a hosted text-embedding model — OpenAI ada-002 or a comparable API — so I don't have to own the model hosting. The chunk strategy matters more than the embedding choice at this scale. I'd use a sliding-window chunking scheme with parent-document retrieval: chunk at paragraph level for indexing, but retrieve the full parent section when serving context to the LLM. That way the LLM sees coherent procedural steps, not fragmented mid-sentences.

I made a mistake at Meridian early on with naive sentence-level chunking on a 4-million-page corpus. It lost cross-document context and caused hallucinated citations in the early builds. Sliding window + parent retrieval fixed it.

**Sam: 800 alerts per week means roughly 2 per hour on average, but you'll have burst periods. What's your p99 latency target and how do you hit it?**

A: My target for something in the triage path is sub-10 seconds end-to-end. The on-call is already context-switched and anxious; a 30-second wait makes the tool feel unreliable and they'll stop using it.

To hit sub-10s at burst load: the retrieval step (embedding the alert + nearest-neighbor search) should be under 500ms on pgvector with an HNSW index. The LLM inference call is the long pole — that's typically 3–8 seconds for a quality completion with a 2K-token context window. So you want to parallelize: kick off retrieval and any metadata lookups (service owner, on-call handle, recent deployment history) simultaneously, then assemble the LLM prompt only after all context is ready.

I'd also pre-warm the embedding for known recurring alert classes. If you've seen "postgres replication lag on db-shard-7" 40 times, you can cache that retrieval result and only re-run the LLM call with fresh incident context. Cache hit cuts the latency floor dramatically.

**Sam: How do you evaluate retrieval quality in production, especially for a corpus that updates continuously as new postmortems are written?**

A: A few layers. First, offline: identify 30–50 "gold standard" alert scenarios where you know what the right runbook section is, and run those on a schedule after every corpus update. It's a lightweight regression suite — not perfect, but catches big degradation.

Second, in production, implicit feedback: track whether the on-call acted on the suggested action within the next 5 minutes (a proxy for "the triage was useful"). Track citation click-through if you surface linked runbook sections. These aren't ground truth, but they correlate with quality.

Third, periodic explicit feedback: add a quick thumbs-up/thumbs-down on the triage card in Slack. Even 10% response rate on high-sev alerts gives you enough signal to catch systematic retrieval gaps — wrong service family being matched, outdated runbook superseding a newer one.

At Meridian we ran all three of these. The implicit feedback caught a bug where the retrieval kept surfacing a deprecated procurement policy doc that had never been marked inactive. We fixed the corpus hygiene, not the model.

**Sam: Let's talk about the agentic side. You mentioned recommended first-action in the triage output. What if the LLM recommends a remediation action — restart the service, rollback a deployment, adjust a rate limit — and we want to automate that?**

A: That's where you have to be very explicit about the write boundary. Triage output is read-only: it tells the human what to look at. Remediation automation is a write action, and those need a fundamentally different design.

My model: the AI generates a structured action recommendation (verb, target resource, parameters) and presents it to the on-call as a proposed action — "Restart payment-service pod on us-east-1c? [Execute] [Dismiss]". Human confirms. Tool executes. The confirmation is a single click because the AI did the thinking; the human's job is to sanity-check and authorize.

I built this pattern at Meridian for procurement workflows — the agent drafted approval emails and looked up ERP budget codes, but never sent anything without a human clicking confirm. Cut admin work 87% per manager, zero incidents from mis-fires. The same principle scales to infrastructure actions; the safety constraint is the same.

What you cannot do is full auto-remediation without a human gate on write paths. The failure mode is the model mis-classifying the root cause, executing the wrong action, and making a bad incident worse. That failure is much harder to explain to a bank regulator than "the AI suggested the wrong thing and a human dismissed it."

**Sam: You've mentioned eval a few times. How do you structure the eval practice long-term? This isn't a fire-and-forget system — it needs to keep getting better.**

A: I'd set up three recurring loops. Weekly: automated regression suite on the gold-standard scenarios, triggered after any corpus change or model update. If anything degrades more than a threshold, block the update and page the owner. Monthly: a structured review of the worst 20 triage outputs — the ones where the on-call dismissed the suggestion or rated it unhelpful. Root-cause them: bad retrieval, bad chunking, hallucinated context? Each root cause has a different fix. Quarterly: a broader human eval where SREs rate 100 random triage cards. This surfaces systematic biases that the automated suite doesn't catch — like the model consistently underestimating severity for a specific service family.

The goal is to make the eval cycle fast enough that improving the system doesn't feel like a research project. If a corpus fix takes a week to validate, no one does it. If it takes an hour, it happens continuously.

---

## Riley's Post-Interview Notes

- Sam is technically sharp and cares about safety reasoning — not just "ship the AI thing." The human-in-the-loop framing landed well.
- Strong signal that E Corp's real pain is exactly what I've solved at two places. This feels like the highest-leverage match in my current search.
- E Corp's comp range ($215–255K) is on target. I want to ask $240K at offer.
- Next: onsite panel. Need to prep for behavioral rounds (Jordan Park and two cross-functional interviewers).
