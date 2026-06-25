# Rolester — AGENTS.md

> For AI coding agents (Claude Code, Codex, Cursor, Gemini CLI — anything that reads
> AGENTS.md). If someone pointed you at this file or its URL: read it, then set them up by
> following the steps below. This is the front door; the full operating contract ships
> inside the repo.

## What Rolester is

An agentic, local-first job-search workspace. It helps one person find, vet, tailor,
track, and prep for roles — from their own data, on their own machine, driven by their own
AI agent (you). It isn't a site you log into; it's a set of skills you run locally. No
cloud, no account, no telemetry. Free, MIT-licensed, zero runtime dependencies.

## Requirements

- Node.js >= 18
- An agent CLI on PATH — `claude` or `codex` (Rolester runs *through* you)
- Nothing else. There is no `npm install` step.

## Install & start

Pre-release (not on npm yet), so install from the repo:

```
git clone https://github.com/CodesWhat/rolester
cd rolester
node bin/rolester.mjs start claude     # or: node bin/rolester.mjs start codex
```

Once it's published this becomes `npx rolester start`.

`start` scaffolds a local `workspace/`, installs the skills (so `/evaluate-job`,
`/apply-job`, etc. become available), seeds demo data and boots a live dashboard at
http://localhost:7777, then hands control to you with a starter message.

## After it starts — what to do

The loop is **paste → route → tune**: the user pastes something (a job description, a
recruiter email, a LinkedIn URL), you classify it and run the owning skill, the tracker and
dashboard update. To get going:

1. **Onboard** — run `ingest-profile` (or `npm run ingest`) to read the user's resume and
   generate their `candidate/*.yml` config plus a personalized `candidate/AGENTS.md`.
2. **Vet a job** — when the user pastes a JD, run `evaluate-job` before anything else.
3. **Apply** — `apply-job` (it verifies `evaluate-job` first, then `tailor-application`).
4. **Comms** — recruiter message → `email-comms`; scheduling a call → `schedule-meeting`.
5. **Track** — outcomes land on the dashboard at http://localhost:7777.

After install, **read the repo's own `AGENTS.md`** (the long one). It is the source of
truth for intent routing, the body-read and submit-safety gates, and tracker write-back.
This file only gets you to the front door — don't improvise procedures it covers.

## The skills

`apply-job` · `calendar-sync` · `configure` · `email-comms` · `evaluate-job` ·
`ingest-mail` · `ingest-messages` · `ingest-profile` · `interview-prep` ·
`optimize-linkedin` · `reevaluate-strategy` · `relationship-sourcing` · `research-boards` ·
`research-comp` · `research-company` · `schedule-meeting` · `search-jobs` ·
`setup-searches` · `sync-status` · `tailor-application` · `track-outcomes`

## Rules — read before acting for the user

- **NEVER submit a job application without explicit user confirmation**, unless their local
  config opts into auto-submit. This is the one hard safety gate.
- **ASK before** sending any outbound message (email, LinkedIn) on the user's behalf.
- **ALWAYS run the owning skill** instead of improvising — skills are the how-to, AGENTS.md
  is the contract.
- The user's data **stays on their machine**. Never upload a resume, evidence, or tracker
  data anywhere.

## Tool notes

- **Claude Code** reads `CLAUDE.md`, not `AGENTS.md`. If you saved this file locally, add
  `@AGENTS.md` to the top of your `CLAUDE.md` so it gets ingested. Once Rolester is
  installed, its repo already wires `CLAUDE.md → AGENTS.md` for you.
- **Codex, Cursor, Gemini CLI, VS Code** read `AGENTS.md` directly (VS Code needs the
  `chat.useAgentsMdFile` setting enabled).

## Keeping current

- **Update an install:** `git pull` in the `rolester` folder, then re-run
  `node bin/rolester.mjs start <agent>`. The user's `workspace/` and `candidate/` data are
  preserved across updates.
- **This file** is maintained by hand and versioned with Rolester releases — a short
  onboarding pointer, not a living memory. For anything deeper, defer to the repo `AGENTS.md`
  and `docs/`, which are the canonical, always-current sources. Don't auto-generate it.
