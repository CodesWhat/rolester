# Panel Interview Prep — Massive Dynamic Staff Engineer
**Date:** 2026-06-20 | **Format:** Remote (Zoom) | **Duration:** ~3 hrs (3 × 45-min sessions + debrief)
**Interviewers (expected):**
- Session 1: **Jordan Reyes**, Product Manager — product strategy and cross-functional scope
- Session 2: **Alicia Morrow**, Data Science Lead — model evaluation, ML systems collaboration
- Session 3: **Marcus Webb**, Director of Engineering — leadership, scope, compensation conversation

---

## Pre-panel checklist

- [ ] Confirm Zoom links from Camille (should arrive by 2026-06-18)
- [ ] Test audio/video; quiet room; backup tethering ready
- [ ] One-pager cue card open in second monitor (this doc, live-cue section only)
- [ ] Have Meridian + Pulsar bullet points visible — ground every answer in real work

---

## Live cue card (keep this visible during the panel)

### Role in one line
Staff Engineer on the AI Platform team — own the LLM integration layer; some team-lead duties, cross-functional with data science and enterprise customers.

### Jordan Reyes (Product) — likely questions

**"How do you work with PMs when you disagree on scope?"**
> State your concern once, clearly, with a cost/risk estimate attached. Then either make the tradeoff explicit in the doc or time-box a spike. At Meridian when the PM wanted to ship the RAG pipeline without an eval harness, I quantified the risk (no baseline → can't detect regression) and proposed a 3-day eval set sprint as a prerequisite. They agreed. Don't go silent, don't escalate immediately.

**"Describe how you'd take a fuzzy product ask and turn it into a technical spec."**
> Start with the user outcome, not the feature. At Pulsar: customer wanted "faster onboarding" → I ran a time-to-value audit (discovery call to first live API call) and found the integration config step was 60% of the time. Wrote a spec for a config wizard + validation CLI. Prototype in 2 weeks, customer confirmed it before we built the full thing.

**"What's the biggest product risk you see in the LLM integration layer?"**
> Retrieval quality degrading silently. There's no runtime error — the system still returns answers, they're just wrong. The mitigation is a continuous eval pipeline with real user queries and human-spot-check sampling. I'd prioritize building that before any new features.

---

### Alicia Morrow (Data Science) — likely questions

**"How do you collaborate with data scientists who don't write production code?"**
> Separate what they own from what I own. DS owns the model choice + eval criteria + data labeling. Eng owns the serving infrastructure, the API contract, the latency SLA. At Meridian, I built an eval harness the DS team could run themselves (CLI + JSON output) — removed the bottleneck where they needed me to run benchmarks.

**"How would you design an eval harness for the retrieval layer?"**
> Three layers: (1) offline eval on a labeled set (500+ query/doc pairs, Recall@5 + MRR@5); (2) online eval via interleaved ranking (A/B on a small % of live traffic, track click-through + session length); (3) LLM-as-judge for end-to-end answer quality (sample 50 queries/day, judge rates relevance 1–5). Dashboards for each. Set a regression gate in CI so a PR that drops Recall@5 by >2 points blocks deploy.

**"Walk me through a time your system had a quality regression and how you caught it."**
> At Meridian, we changed the chunking strategy (512→256 tokens) and pushed without running offline eval. Query quality on long documents dropped noticeably — users reported "answers that seem truncated." We caught it in the weekly DS review via the LLM-as-judge score drop. Root cause: shorter chunks lost sentence context. Rolled back chunking, added a chunking-strategy test to the eval pipeline.

---

### Marcus Webb (Dir. Engineering) — likely questions

**"Where do you want to be in 3 years?"**
> Staff or Principal, still hands-on but with broader technical scope — owning the architecture of a platform that multiple product teams build on, mentoring 4–6 engineers. Not looking to move full-time into EM; I'm a player-coach. The best version of this role has me in customer conversations once a quarter and writing production code the other 90% of the time.

**"How do you make the case for technical debt investment to leadership?"**
> Frame it as risk or velocity, not engineering hygiene. "Our retrieval index rebuild takes 72 hours and blocks deploys during that window" is a business risk. Quantify it: N deploys blocked, M hours of eng time per cycle. Then propose the fix with a cost estimate. At Pulsar, I got 3 sprints of infra time approved by showing that one P1 incident had cost 40 eng-hours of firefighting.

**"Comp expectations?"**
> "I'm targeting $240K base. I know the posted band is $215–255K, so I'm mid-range. Total comp is important too — I'd want to understand the RSU grant size and vesting schedule before committing to a number."

---

## Questions to ask (pick 2 per session)

**Jordan (Product)**
1. "What's the biggest gap between where the LLM integration layer is today and where the product roadmap needs it in 12 months?"
2. "How does the product team think about exposing the retrieval API to enterprise customers vs keeping it internal?"

**Alicia (Data Science)**
1. "What does your current eval coverage look like — labeled set size, how often you run evals on regressions?"
2. "How does the DS team influence the platform roadmap — do you have a standing forum, or is it more ad hoc?"

**Marcus (Dir. Engineering)**
1. "What would make someone in this role successful at 6 months vs 18 months — how do those look different?"
2. "How does this team interface with enterprise customers — does Staff Eng ever join discovery or onboarding calls?"

---

## Study layer

### What Riley brings that's differentiated
- **Meridian RAG pipeline:** 4M pages, prototype→prod in 8 weeks, 200+ daily users, 60% research-cycle-time reduction. One of few candidates who can speak to both architecture AND the evaluation discipline (built the harness).
- **Meridian agentic workflow:** Claude API + tool use + HITL — proves LLM API depth beyond retrieval.
- **Pulsar FDE:** 3 concurrent enterprise deployments, 14→9 week time-to-value, customer-facing. Cross-functional without formal authority. This is the "player-coach" proof point for Marcus.

### Potential gaps to address proactively
- **Multi-tenant ACL depth:** Yuki's notes flagged this. If asked: "The approach I'd refine is synchronous ACL invalidation on write for compliance-critical changes — the async cache TTL is a tradeoff I'd want to tighten based on the firm's actual compliance SLA."
- **Formal EM track:** Riley has led small teams but no EM title. Frame as "player-coach, not EM" — be direct, not defensive.
- **Platform vs FDE:** This role is more inward-facing. Acknowledge it: "I'm drawn to roles where the platform work has a customer-facing feedback loop — I see that here via the quarterly BRs with enterprise customers."

### Massive Dynamic AI Platform context
- Platform serves ~40 internal product teams + enterprise customers directly
- Current retrieval stack is likely earlier-gen (Elasticsearch + basic embedding) — opportunity to modernize
- Team of 14; Staff role is a new headcount (greenfield scope, not a replacement)
- Quarterly offsites; otherwise fully remote

---

## Logistics
- **Zoom links:** Confirm with Camille Torres (camille.torres@massive-dynamic.example) by 2026-06-18
- **Duration:** 10:00 AM – 1:00 PM CT (3 × 45-min sessions, 10-min breaks between)
- **Follow-up:** Thank-you note to each interviewer same day; separate emails, not a group reply
