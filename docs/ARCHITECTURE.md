# Architecture

Rolester is organized around skills plus deterministic scripts.

## Flow

```text
candidate profile  ──────────────────────────────────────────────────────┐
  -> search setup                                                         │
  -> sourced scan                                                         │
  -> gated intake  <── research loop (research-company / -comp / -boards)│
  -> body-read evaluation                                                 │
  -> tailoring                                                            │
  -> communication tracking                                               │
  -> application tracking                                                 │
  -> interview prep                                                       │
  -> outcome tracking ──> reevaluation loop (reevaluate-strategy) ───────┘
```

The research loop feeds evaluation and interview prep with cited company intel
and comp benchmarks. The reevaluation loop reads the full funnel and recommends
targeting, fit-calibration, or channel-mix changes when outcome thresholds trip.

## Intent Router

Root `AGENTS.md` and `CLAUDE.md` instruct agents how to map user intent to the
16 skills. Routes are grouped below by cluster.

### Onboarding

- New workspace or incomplete profile → `ingest-profile`
- "Scan my projects folder / repo" → `ingest-profile` (projects-scan mode)
- "Sync / import email, pull recruiter replies" (Apple Mail or opted-in Gmail/Outlook webmail) → `ingest-mail`
- "Sync / check LinkedIn or Wellfound messages/DMs" (opt-in browser) → `ingest-messages`

### Apply Cycle

- "Apply", "submit", or a JD URL with apply intent → `apply-job`
  (`apply-job` must run or verify `evaluate-job` as step zero; LinkedIn Easy Apply
  postings can use the opt-in authenticated one-click path gated by the
  `one_click_apply` capability — no new skill, stays within `apply-job`)
- "Gate", "should I apply", or a JD URL without apply intent → `evaluate-job`
- "Find jobs", "source", "search", "refresh queue" → `search-jobs`
- "Set up searches", "build search config" → `setup-searches`
- "Tailor résumé / cover letter / short answer" (after gate passes) →
  `tailor-application`

### Research Loop

- "Research this company" / company URL or name pasted → `research-company`
- "What's market comp", "benchmark my salary ask" → `research-comp`
- "Find more boards", "what sources should I add", stale queue → `research-boards`

### Communications

- Email or recruiter message: draft, reply, follow-up, thank-you, scheduling,
  written negotiation counter → `email-comms`
- Live / verbal offer call, real-time negotiation coaching, rehearsal →
  `interview-prep`

### Interview & Story Bank

- Interview invite, screen, panel, assessment → `interview-prep`
- Building behavioral / STAR stories, story bank → `interview-prep`

### Outcomes & Strategy

- Rejection, offer, status change, outcome update → `track-outcomes`
- "Check my statuses", "sync my pipeline", poll ATS dashboards → `sync-status`
  (opt-in browser automation; reads portals, hands transitions to `track-outcomes`)
- "Why am I getting filtered", strategy review, re-rank, or when outcome
  thresholds trip → `reevaluate-strategy`

### Settings

- "Change a setting", comp floor/target, exclusions, writing style, form defaults,
  search sources, usage mode, application mode, browser automation, or session
  browser → `configure`

`apply-job` must run or verify `evaluate-job` as step zero.

## Layers

### Skill Layer

Skills make judgment calls:

- what to ask during onboarding
- whether a job passes the body-read gate
- how to rate fit
- which evidence should support an application
- how to draft and summarize candidate communications
- what to include in an interview packet

### Script Layer

Scripts should be deterministic:

- validate setup
- build source URLs from config
- parse saved jobs
- dedupe sourced roles
- check link liveness
- render documents
- validate tracker state

### Communication Layer

Tracker state stores concise communication thread metadata. Longer message
bodies and summaries live in `workspace/comms/`.

`email-comms` should read both before drafting so the user does not need to
re-provide thread history.

### Source Layer

Search sources are provider adapters under `src/core/providers/`.

- URL-query sources build stable URLs from config before Playwright opens them.
- RSS/Atom sources should poll feeds before browser capture.
- ATS sources should use stable public endpoints where possible.
- Browser-rendered sources should preserve the generated URL, raw capture, and
  exact recency cutoff.

See [SOURCES.md](SOURCES.md).

### User Layer

Candidate facts, generated artifacts, and tracker state stay local.

### System Layer

Reusable skills, scripts, templates, and schemas are public-safe.

See [../DATA_CONTRACT.md](../DATA_CONTRACT.md).
