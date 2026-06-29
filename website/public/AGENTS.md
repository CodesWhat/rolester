# Rolester — AGENTS.md

> **For humans:** this file is the AI agent's operating manual, not a setup guide for people.
> If you're trying to install Rolester, see the README at
> https://github.com/CodesWhat/rolester or the site at rolester.codeswhat.com instead.

> **For AI agents:** you landed in the right place. Read this file, then follow the steps
> below to set the user up. The full operating contract ships inside the repo.

## What Rolester is

An agentic, local-first job-search workspace. It helps one person find, vet, tailor,
track, and prep for roles — from their own data, on their own machine, driven by their own
AI agent (you). It isn't a site you log into; it's a set of skills you run locally. No
cloud, no account, no telemetry. Free to self-host, MIT licensed, zero runtime dependencies.

## Requirements

- Node.js >= 18
- A coding-agent CLI on PATH — Claude Code or Codex (Rolester runs *through* you):
  - Claude Code: `npm install -g @anthropic-ai/claude-code` (https://claude.com/claude-code)
  - Codex: `npm install -g @openai/codex` (https://github.com/openai/codex)

## Install & start

Clone the repo and run it in-tree. The agent runs from source, so a local clone is the canonical path:

```
git clone https://github.com/CodesWhat/rolester
cd rolester
npm install
node bin/rolester.mjs start claude        # or: node bin/rolester.mjs start codex
```

`start` scaffolds a local `workspace/`, installs the skills (so `/evaluate-job`,
`/apply-job`, etc. become available), seeds demo data and boots a live dashboard at
http://localhost:7777, then hands control to you with a starter message. Paste a job
posting and say "evaluate this", or try the bundled sample under `examples/sample-jobs/`.

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

`apply-job` · `calendar-sync` · `company-health` · `configure` · `discover-companies` ·
`email-comms` · `evaluate-job` · `ingest-mail` · `ingest-messages` · `ingest-profile` ·
`interview-prep` · `optimize-linkedin` · `reevaluate-strategy` · `relationship-sourcing` ·
`research-boards` · `research-comp` · `research-company` · `schedule-meeting` ·
`search-jobs` · `setup-searches` · `sync-status` · `tailor-application` · `track-outcomes`

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

- **Update an install:** run `node bin/rolester.mjs update` in the `rolester` folder.
  It fetches the latest published code via npm; your `workspace/` and `candidate/` data are
  untouched.
- **This file** is maintained by hand and versioned with Rolester releases — a short
  onboarding pointer, not a living memory. For anything deeper, defer to the repo `AGENTS.md`
  and `docs/`, which are the canonical, always-current sources. Don't auto-generate it.
