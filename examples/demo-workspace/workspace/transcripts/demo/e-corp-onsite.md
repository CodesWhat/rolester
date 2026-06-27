# E Corp — Virtual Onsite Panel Transcript
**Date:** 2026-05-21
**Round:** Onsite / panel (full-day virtual)
**Interviewers:**
  - Jordan Park — Engineering Director, Platform Intelligence
  - Sam Rivera — Staff Engineer (second session; live coding)
  - Priya Okoye — Principal PM, Developer Experience
  - Dana Kim — Platform Engineering Lead, SRE
**Schedule:** 9:00 AM–2:30 PM CT (30-min lunch break)
**Format:** Zoom; separate sessions per interviewer; live coding in Replit

---

## Session 1 — Leadership & Scope (Jordan Park, 60 min)

**Jordan: You've been in forward-deployed and product-adjacent engineering roles. Why a platform / staff IC role now, and why E Corp specifically?**

A: My work at Pulsar and Meridian has been deeply cross-functional — I've been the person who owns both the technical design and the customer or stakeholder relationship. What I've found is that the highest-leverage thing I do isn't the customer interaction itself; it's building the systems and patterns that make the next deployment, the next integration, the next incident faster. I want to pour more of my energy into that second-order work.

E Corp specifically: the scale of the operational problem you're solving — 340 services, 800 high-sev alerts per week — is genuinely hard. And the AI-augmented approach your team is taking is the right one. I've built the RAG + agentic workflow stack that maps to what you need, and I want to apply it somewhere it affects thousands of engineers, not just a handful of customer accounts.

**Jordan: Tell me about a time you pushed for a technical decision that wasn't the path of least resistance. How did you make the case?**

A: At Meridian, my instinct on the RAG pipeline was to go simple first — off-the-shelf chunking, basic nearest-neighbor search, hosted LLM API. The rest of the team wanted to evaluate a custom fine-tuned model because they thought we'd get better domain accuracy. I pushed back because fine-tuning would have taken 3–4 months and required labeled training data we didn't have.

I made the case by proposing a time-bounded proof of concept: give me four weeks to build the RAG approach on the production corpus and measure it against the five queries that mattered most to the actual users. At the four-week mark, we had sub-60-second retrieval with good citation accuracy on those queries. The fine-tuning path was still six weeks from even a prototype. The team voted to ship the RAG approach.

The lesson I took: when you have a simpler hypothesis, the fastest way to win the argument is to ship the simpler thing fast and let the data decide. Works better than slide decks.

**Jordan: How do you mentor more-junior engineers, especially on a staff IC track where you don't have formal management authority?**

A: I don't think I need formal authority to do useful mentoring. What I do is make myself a resource on design decisions — when someone on the team is sketching an approach, I try to be the person they show it to before the PR, not the person who reviews it after.

Concretely: I do office-hours-style 1:1s where the junior engineer drives — they bring the problem, I ask questions. I've found that most of the time the person already has 80% of the right answer and they need someone to think out loud with, not someone to tell them what to do. I also try to externalize my own design reasoning when I'm working — write short design docs, leave comments in code that explain the "why" rather than the "what," run informal retros after we ship something non-trivial.

The thing I actively avoid is creating dependency on me for answers. If someone comes to me with the same category of question twice, I try to figure out why we don't have a document or a pattern that handles it, and build that instead.

**Jordan: This role touches SRE, product, and finance ops teams. Where have you had the hardest time aligning with non-engineering stakeholders, and what did you do?**

A: The hardest alignment I've had was at Meridian when we were rolling out the agentic procurement workflow. The finance team was worried about the AI touching anything near budget codes or vendor contracts — they'd seen automation projects go badly before, and their default was "no."

What I did: I didn't ask for permission to automate. I asked to show them what the system would do before it did anything. I ran a live demo where the agent processed 10 of their real (but already-resolved) procurement requests, showed the draft email output, showed the budget code it had looked up, and then showed the human-in-the-loop confirmation step. I asked them to find errors. They found two — both cases where the budget code mapping was ambiguous. We fixed those mappings and re-ran. By the end of the session, the finance manager was the one who said "let's pilot this."

The lesson: non-technical stakeholders often distrust automation because they've seen automation fail silently. Making the system observable and the human gate explicit turns the conversation from "do you trust AI?" to "do you trust your own judgment?" They do trust their own judgment.

---

## Session 2 — Live Coding (Sam Rivera, 60 min)

**Problem:** Implement an alert deduplication function that takes a stream of incoming alerts and collapses correlated alerts (same service, same error class, within a 5-minute window) into a single deduplicated alert event, attaching a count and the earliest/latest timestamps.

**Riley's Approach** (narrated during session):

"I'll start with the simplest structure that handles the window correctly — a dict keyed on (service_name, error_class), storing the first-seen timestamp, latest-seen timestamp, and count. On each incoming alert, check whether we're within 5 minutes of the first-seen for that key. If yes, merge. If no, emit the existing deduped event and start a new window.

One design question before I code: do we need to handle out-of-order alert delivery? If this is a live stream from PagerDuty or Datadog, alerts might arrive slightly out of order. I'll code the simple in-order version first and note where we'd add a buffer for the out-of-order case."

```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional

@dataclass
class Alert:
    service: str
    error_class: str
    timestamp: datetime
    payload: dict = field(default_factory=dict)

@dataclass
class DeduplicatedAlert:
    service: str
    error_class: str
    first_seen: datetime
    last_seen: datetime
    count: int
    representative_payload: dict

class AlertDeduplicator:
    def __init__(self, window_minutes: int = 5):
        self.window = timedelta(minutes=window_minutes)
        # key -> DeduplicatedAlert (open window)
        self._open: dict[tuple, DeduplicatedAlert] = {}

    def process(self, alert: Alert) -> Optional[DeduplicatedAlert]:
        """
        Ingest an alert. Returns a closed (emitted) DeduplicatedAlert if the
        previous window for this key just expired, else None.
        """
        key = (alert.service, alert.error_class)
        existing = self._open.get(key)

        if existing is None:
            # First alert for this key
            self._open[key] = DeduplicatedAlert(
                service=alert.service,
                error_class=alert.error_class,
                first_seen=alert.timestamp,
                last_seen=alert.timestamp,
                count=1,
                representative_payload=alert.payload,
            )
            return None

        if alert.timestamp - existing.first_seen <= self.window:
            # Within window — merge
            existing.last_seen = max(existing.last_seen, alert.timestamp)
            existing.count += 1
            return None
        else:
            # Window expired — emit the old event, start a new one
            emitted = existing
            self._open[key] = DeduplicatedAlert(
                service=alert.service,
                error_class=alert.error_class,
                first_seen=alert.timestamp,
                last_seen=alert.timestamp,
                count=1,
                representative_payload=alert.payload,
            )
            return emitted

    def flush(self) -> list[DeduplicatedAlert]:
        """Emit all open windows at end-of-stream."""
        result = list(self._open.values())
        self._open.clear()
        return result
```

"The time complexity is O(1) per alert. The space is O(k) where k is the number of distinct (service, error_class) pairs with open windows — bounded by your service count, so manageable.

For the out-of-order case I mentioned: I'd add a small buffer — say, a sorted heap of alerts ordered by timestamp, flushing the heap whenever the newest arrival is more than N seconds ahead of the oldest. That keeps the dedup logic clean while tolerating late arrivals. I wouldn't add that complexity until you know you need it."

**Sam's follow-up push:** "What if the same alert fires 200 times in 30 seconds during a major incident — how does your count-based dedup interact with on-call routing?"

A: "The count is exactly the signal you want. Instead of 200 PagerDuty pages, the on-call gets one with 'count: 200, first_seen: 09:14:07, last_seen: 09:14:37' — that's an immediate severity signal. You can route based on count threshold: count > 50 in 5 minutes auto-escalates to the director tier. Count < 10 stays at primary on-call. The count replaces volume as a severity proxy without requiring the on-call to mentally sum up the noise."

---

## Session 3 — Cross-Functional Alignment (Priya Okoye, 45 min)

**Priya: This role will work closely with my PM team on developer experience tooling. We often have competing priorities and limited eng bandwidth. How do you navigate that as a staff engineer?**

A: My starting point is that I want to understand what my PM counterpart is optimizing for before I propose any solution. In my experience, the worst breakdown between eng and product is when each side is solving a slightly different problem and neither one knows it.

Practically: I try to be in discovery conversations with the stakeholders my PM is talking to, even as an observer. When I understand why a feature matters — not just what it is — I can make much better technical tradeoffs. And I can flag earlier when a requested feature has a much simpler implementation than the PM assumed, or when it's technically much harder than it looks.

On competing priorities: I'm direct about capacity. I'd rather say "I can build 80% of this in two weeks or 100% of it in six — which matters more?" early in the planning cycle than disappoint at the end of a sprint.

**Priya: Walk me through a time you had to push back on a product direction because of technical risk. How did you handle it without damaging the relationship?**

A: At Meridian, the PM wanted to launch the RAG pipeline to all 200 internal users on day one of production availability. My concern was retrieval quality — we'd done internal testing but hadn't validated on the diversity of real user queries. I estimated we had maybe 15% of queries where the output would be confidently wrong, which is a bad first impression.

I proposed a two-week private beta with 20 power users before the full launch. The PM's concern was timeline — they'd already communicated a date to the research team. We compromised: launched to all users, but added a prominent "Beta" label and a feedback button on every response, with a commitment to do a quality review at two weeks and communicate publicly what we'd fixed. The PM got to hit the date; I got a feedback loop before we were fully committed.

That approach — find the constraint the PM is protecting, and solve for that constraint while managing your own risk — has worked every time I've tried it.

**Priya: What metrics would you use to measure whether the incident triage AI is working?**

A: I'd track three tiers. Efficiency: median time-to-triage before and after, and the distribution — I care about p90 more than median because the worst incidents are where the system pays off most. Adoption: what fraction of high-sev on-calls open the AI triage card? If it's under 70%, it's not trusted. Quality: explicit thumbs-up/down on triage suggestions, rated separately from "the incident was resolved" — an incident can resolve for reasons unrelated to whether the triage was useful.

Long-term outcome metric: on-call rotation burnout, proxied by escalation rate and voluntary rotation churn. That's harder to attribute but it's the actual problem we're solving.

---

## Session 4 — SRE / Operational Depth (Dana Kim, 45 min)

**Dana: We have 340 microservices with heterogeneous observability setups — some fully instrumented, some barely. How do you design an AI triage layer that degrades gracefully when context is missing?**

A: Graceful degradation is a design constraint, not an afterthought. The triage system should be explicit about what context it has and what it's inferring.

Practically: structure the triage output as a ranked list of "what we know" (retrieved runbook match, service owner, last deployment timestamp) and "what we're inferring" (probable cause, recommended action) with a confidence signal. When the system doesn't have runbook coverage for a service, it should say so — "No runbook found; alerting service owner: @dana.kim" — rather than hallucinating a confident recommendation.

For the poorly-instrumented services: I'd treat sparse observability as a corpus gap, not a model failure. Build a flywheel: every time an SRE resolves an incident without a good triage card, prompt them for a one-paragraph postmortem contribution. The corpus grows from real incident resolutions. Six months in, the sparse-coverage services will have accumulated runbook content from the incidents that actually happened.

**Dana: How do you think about rollback and failure handling for the AI triage system itself? If it goes down during a major incident, the on-call is extra-burdened.**

A: The AI triage layer must be strictly additive — it never sits in the alert delivery path. If the triage service is down, the raw alert still routes normally; the on-call just doesn't get the AI context card. The worst case is the status quo, not a degraded incident response.

For rollback on the AI layer: version all prompts and retrieval configs alongside the codebase. If a model update degrades triage quality — detected by the automated eval suite — I want to be able to roll back to the previous prompt/model version in under 5 minutes. I'd treat prompt changes with the same CI discipline as code changes: automated test suite, staged rollout, instant rollback on regression.

---

## Post-Panel Notes (Morgan Hayes follow-up call, 2026-05-22)

Morgan called the day after to debrief informally. Key signals:
- Jordan: "One of the strongest systems-design interviews I've seen this cycle. The live coding was clean and the safety reasoning was exactly what we need."
- Dana: "Appreciated the graceful-degradation framing — most candidates don't think about failure modes for the AI layer itself."
- Priya: "Strong PM/eng partnership instincts. Wanted to know if Riley has shipped product, not just infrastructure."
- Sam: "Still likes the technical direction from the first session. The dedup sketch was good."
- Committee voted unanimous advance to offer stage.

*Full debrief captured 2026-05-27; offer expected by 2026-06-02.*
