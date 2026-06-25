# Setup

Rolester is a local, skill-driven job-search workspace. An agent (Claude Code,
Codex, or any AGENTS.md-aware tool) drives the workflow; the CLI scaffolds,
renders, and serves the dashboard.

## First Run

```bash
node bin/rolester.mjs start            # once published: npx rolester start
node bin/rolester.mjs start claude     # …or name the agent to launch
```

`start` does the whole arc in one shot:

1. Scaffolds `candidate/` and `workspace/` directories (idempotent).
2. Installs skills so Claude Code sees `/apply-job`, `/evaluate-job`, etc.
3. Seeds `workspace/tracker.json` from the demo template (if not yet present).
4. Boots the live dashboard at http://localhost:7777 with hot reload.
5. Launches your agent with the starter message `familiarize yourself and let's
   get started`.

The first bare word picks the agent (`rolester start claude`, `rolester start
codex`, or any CLI on your PATH). Omit it to use the first one found.

Flags: `--no-agent` (scaffold + dashboard only), `--no-dashboard`,
`--agent <name>` (alias for the positional), `--port <n>`.

## Manual Wiring

Prefer to open the agent yourself?

```bash
npm install        # also runs install-skills via postinstall
npm run doctor     # confirm the scaffold and environment
```

Then open your agent in the repo root and send:

> familiarize yourself and let's get started

The agent reads `AGENTS.md`, verifies the skills shim, and runs `ingest-profile`
conversationally if the candidate profile is not yet set up.

## Candidate Setup

`ingest-profile` (or `npm run ingest`) interviews you and produces these files
under `candidate/` (gitignored):

- `profile.yml` — identity, location, comp floor and targets, domain/toolchain
- `targeting.yml` — role buckets, keep/cut signals, excluded companies
- `evidence.yml` — accomplishment claims that feed tailored artifacts
- `honesty.yml` — tools confirmed, do-not-claim, fabrication boundaries
- `form-defaults.yml` — applicant facts and expected-base for portal forms
- `modes.yml` — optional usage and application posture switches

Until `ingest-profile` has run, the agent will prompt to complete onboarding
before routing any other intent.

`modes.yml` can also be managed later with `npm run modes`: `usage_mode` changes
how much discretionary work Rolester runs, while `application_mode` changes how
aggressively it pursues already-discovered roles. If the file is absent, the safe
defaults are `standard` usage and `balanced` application mode.

## Setup Modes

When `ingest-profile` runs for the first time it asks two quick questions before
the main interview begins.

### Basic vs Advanced

- **Basic** — read-only, manual workflow. The agent researches, drafts, and
  guides; you copy/paste and click. No browser automation, no extension required.
- **Advanced** — opt into the authenticated browser + mail capabilities (status
  sync, authenticated search, in-platform message ingest, one-click apply,
  profile optimization, and `mail_access` for provider-agnostic verification-code
  reads via `webmail` plus Gmail/Outlook webmail ingest). Each
  capability is still individually off by default; nothing runs until you read a
  platform's terms, record consent, and enable it via `npm run automation`. The
  Chrome extension is the preferred path (no separate credential store needed);
  `npm run automation -- status` shows what's live. Choosing Advanced during
  setup just surfaces the install guidance and opt-in prompts at the right moment
  — you can enable or disable anything later.

### Deep vs Shallow (and resume-later)

- **Deep** — full onboarding interview in one session: identity, targets, comp,
  location, evidence, honesty boundaries, writing-style calibration, and (in
  Advanced mode) capability opt-ins.
- **Shallow** — collect the minimum-viable config now, defer the rest. The skill
  saves progress after each step to `workspace/setup-state.json` (written by the
  agent; gitignored). Re-running `ingest-profile` (or `npm run ingest`) reads
  that file and resumes from where you left off, so you can stop and come back
  without losing ground.

`npm run doctor` reports whether setup is complete or still in progress.

## Agent Files

- `AGENTS.md` — canonical intent router (used natively by Codex and similar).
- `CLAUDE.md` — points Claude Code at the same rules.

Both require `apply-job` to run or verify `evaluate-job` before tailoring,
filling, or submitting.

## Dashboard

`rolester start` brings the dashboard up. To run it separately:

```bash
npm run tracker        # one-shot snapshot → workspace/tracker.html
npm run tracker:dev    # live-reloading dev server on :7777
```

`rolester start [agent]` runs that dashboard as a separate local process and
writes `.internal/tracker-dev.pid` plus `.internal/tracker-dev.log`, so the page
stays available while the launched agent works.

`npm run tracker` publishes the dashboard shell plus
`workspace/dashboard-data.js`. The live server serves those files alongside
`workspace/tracker.json`, watches tracker data and dashboard source, and refreshes
the open page over Server-Sent Events.

## Workspace Directories

Generated and private artifacts live under `workspace/` (gitignored):

- `jobs/` — saved job-description files
- `tailored/` — tailored resume, cover letter, and short-answer artifacts
- `intake/` — sourced and triaged posting queue
- `scan-results/` — raw board/ATS scan output
- `comms/` — recruiter and hiring communication threads
- `interview-prep/` — interview packets and story-bank exports
- `writing-samples/` — voice-calibration samples
- `research/` — company intel, comp benchmarks, board-discovery log

## Health Check

```bash
npm run doctor
```

Reports environment health, skills discoverability, workspace scaffold state,
and any config schema errors.
