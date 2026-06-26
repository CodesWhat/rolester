---
name: track-outcomes
description: Record application outcomes, execute status transitions in tracker.json, append durable patterns to role-family learning files, check reevaluation thresholds, and write back any mid-flow gate changes stated by the user.
---

# track-outcomes

> **Runs under AGENTS.md.** These contracts bind without being restated here: Privacy Invariant (`current_base` never outbound), Honesty Firewall, Placeholder/Bracket Ban, Gate Write-back, Domain-Neutral Rule, Browser Automation Contract, Activity Pulse logging, Tracker verify+re-render, and Sent-Clears-Draft. Inline reminders at point-of-use are intentional; standalone restatements point back to the relevant AGENTS.md section.

## STEP 0 — Classify the incoming outcome

Accept one of: **rejection**, **interview invite**, **offer received**, **ghosted/stale**, **status update**, **blocker removal**, **manual note**, or **explicit gate change** ("never apply to X again", "add Y as a cut signal").

Identify the target application by company + role title (or `id` if known). Read the matching row from `workspace/tracker.json` (applications array). If no matching row exists, confirm with the user before creating a new entry.

## STEP 1 — Read gate files

Read in order:

1. `candidate/targeting.yml` — `role_buckets`, `role_families` (if present), `cut_signals`, `excluded_companies`, and `reevaluation` thresholds (`rejection_total`, `rejection_per_family`).
2. `candidate/application-limits.yml` — per-company caps and cooldowns.
3. `workspace/tracker.json` — the full applications array for current status, fitScore, channel, mode, appliedAt, note, and conversations[].

If `candidate/targeting.yml#reevaluation` is absent, use defaults: `rejection_total: 7`, `rejection_per_family: 3`.

## STEP 2 — Execute the status transition

### Canonical status vocabulary

| Status | Array | Board visibility | Meaning |
|---|---|---|---|
| `sourced` | `sourced[]` | active | Discovered, not yet evaluated |
| `reviewed-hold` | `sourced[]` | active | Passed the evaluate-job gate; ready to pursue |
| `cut` | `sourced[]` | **archived** | Failed the gate (cut_signals, exclusions, comp below floor). Off the active board but kept in data, recoverable. Do not delete. |
| `closed` | `sourced[]` | **archived** | Posting gone / expired before evaluation. Off the active board. |
| `manual-apply` | `applications[]` | **active** | Auto-apply could not complete (Cloudflare/CAPTCHA human-check, ATS account or password reset required, Ashby/Workday exercise, ATS spam-rejection, or any step needing the human). Human must finish applying. ACTIVE — stays surfaced on the board. Record the specific reason + the apply URL in `note`. Never call this "blocked". |
| `awaiting` | `applications[]` | active | Submitted; waiting for response |
| `interview` | `applications[]` | active | Interview stage |
| `offer` | `applications[]` | active | Offer received |
| `rejected` | `applications[]` | active/archive | Closed with rejection |
| `withdrawn` | `applications[]` | **archived** | Candidate chose to withdraw mid-process (comp gap, competing offer, culture read, role-scope mismatch, or proactive exit). Distinct from a market rejection — the candidate acted, the market did not close. (Pre-application pruning — role cut/hold/skipped — also lands here via the STAGE_RULES keyword map, but that is scanner-only behavior; this status in `applications[]` always means a voluntary mid-process candidate exit.) |

**Archived statuses** (`cut`, `closed`, `withdrawn`) are off the active board but stay in the data. The dashboard triage banner counts `reviewed-hold` + `manual-apply` and prompts the user to review them with the agent.

**`manual-apply` is always active, never archived.** Once the human finishes applying, transition to `awaiting`.

### Permitted transitions

| From | Event | To |
|---|---|---|
| `sourced` | gate pass (evaluate-job KEEP/REVIEW) | `reviewed-hold` |
| `sourced` | gate cut (evaluate-job CUT) | `cut` (archived) |
| `sourced` | posting gone | `closed` (archived) |
| `reviewed-hold` | submitted successfully | `awaiting` |
| `reviewed-hold` | auto-apply blocked, human needed | `manual-apply` |
| `reviewed-hold` | user decides to pass | `cut` (archived) |
| `manual-apply` | human finishes applying | `awaiting` |
| `manual-apply` | user decides to pass | `withdrawn` (archived) |
| `awaiting` | interview invite | `interview` |
| `awaiting` | rejection | `rejected` |
| `interview` | final outcome | `offer` / `rejected` |
| `interview` | candidate withdraws | `withdrawn` (archived) |
| `offer` | accepted/declined | close the row with a note |
| any | user withdraws | `withdrawn` (archived) |

Apply the transition:

- Set `status` to the new value.
- Set the appropriate date field: `appliedAt` if this is a new submission.
- **On round completion** (transitioning OUT of `interview` → `rejected`, `offer`, or next-round advance): in the same write, null out `app.nextInterviewAt`, null out `app.interviewNote`, and null out `app.interviewAt` if this was the last scheduled round. (If the candidate is advancing to a next round, `schedule-meeting` will write the new `nextInterviewAt` when that round is booked — track-outcomes always clears the just-completed round's values regardless.)
- Write the outcome to **typed, single-topic fields** per the **Tracker Content
  Register** in AGENTS.md — no superlatives, no editorializing, evidence only. The
  old "note OR conversations[]" choice is replaced by this routing:

  | What you heard | Write to |
  |----------------|----------|
  | Stage filtered / rejection / live state | `app.statusNote` (≤120 chars) + an activity event |
  | Comp / band signal | `app.compNote` (≤140 chars) |
  | Interview scheduled | `app.interviewNote` (≤60 chars) + a `conversations[]` entry (round `kind` follows the canonical Round Vocabulary in AGENTS.md — type, never number; `final` only when the process truly ends there) |
  | Process intel (next rounds, stakeholders) | `conversations[].processNote` (≤160 chars) |
  | Coaching / objections | `conversations[].learnings[]` (labeled, ≤5) |
  | Keyword / screening fit | `candidate/learnings/<family>.md` |

  `app.note` is internal-only (search text + a ≤60-char submission one-liner) and is
  never rendered on a card — do not use it as an outcome dumping ground. Use
  `expected_base` / `target_base` / `minimum_base` for any comp — **never write
  `current_base` into any tracker field or note under any circumstances.**

## STEP 2b — Comm record write-back

If a `communications[]` record exists for this job, it **must** be updated in the **same** tracker.json write as the app-row change. A write that updates `app.*` and leaves the comm record untouched leaves a ghost CTA on every comm-derived render surface (Next Steps card, Focus card, Action Queue).

In the same write:

1. Set `comm.status`:
   - Rejection, candidate withdrawal, role closed → `closed`
   - Interview invite, offer received → `waiting` (next round or decision pending)
   - Ghosted/stale being closed out → `closed`
   - Blocker removed, data-completion form submitted, additional-info provided → `waiting`
2. Set `comm.nextActionDue = null` — the expected event has occurred; the due-date is consumed.
3. Set `comm.draft = null` (and `app.followUp.draft = null` if present) — the draft that backed the pending action is gone.
4. Append a note to `comm.messages[]`:
   ```json
   { "direction": "note", "sentAt": "<ISO timestamp>", "body": "<one-liner: what was recorded, e.g. 'Rejection received — recorded by track-outcomes'>" }
   ```

**D.E.Shaw / Avature / data-completion case:** if the completion event is a submitted additional-info or data-completion form that was tracked in a `communications[]` thread (identified by subject line or recruiter name), treat that thread as the comm record above — flip it to `waiting`, null its `nextActionDue`, clear its `draft`, and append the outbound-completion note.

## STEP 3 — Persist and validate

Edit `workspace/tracker.json` directly (the tracker CLI has no mutation subcommands — JSON edits are the only write path).

**Single-write requirement:** all `app.*` and `comm.*` field changes from STEP 2 and STEP 2b must land in ONE tracker.json write. This includes the interview-round-completion nulls (`nextInterviewAt`, `interviewNote`, `interviewAt`) when transitioning out of an interview round. A partial write that updates the app row and leaves the comm record or interview datetime fields untouched is non-compliant — it leaves ghost CTAs on Next Steps, Focus card, and Action Queue.

After editing, run BOTH validators — they check different things and neither
replaces the other (see RULES):

```
node src/cli/tracker.mjs --verify   # JSON shape/structure vs tracker.schema.json
npm run verify:tracker              # domain integrity: status/score/modes/channels/dupes
```

If either reports errors, fix the JSON before proceeding. Do not continue to the next step until BOTH exit clean.

## STEP 4 — Re-render the dashboard

Run:

```
node src/cli/tracker.mjs
```

Confirm the status change appears correctly in `workspace/tracker.html`. If the render output looks wrong, diagnose before proceeding.

If the outcome creates or extends a follow-up cadence (e.g., interview scheduled, offer pending response, ghosted application to chase), also run:

```
node src/cli/tracker.mjs --followups
```

Review any follow-ups now due and hand off to `email-comms` if a draft is needed.

**Ghost CTA check:** verify that no `communications[]` record for this job still shows `comm.nextActionDue` in the past, a non-null `comm.draft`, or `comm.status` in a stale state after a terminal app outcome. If found, STEP 2b was missed — go back and apply the comm write-back before continuing.

Then log the outcome to the Activity Pulse feed (the dashboard's live timeline — see **Activity Pulse** in AGENTS.md), picking the type by what happened:

```
# interview / screen / onsite advance:
npm run activity -- append --type interview --actor world \
  --title "Interview stage — <Company>" --summary "<stage / detail>" \
  --company "<Company>" --app-id <application id> --write

# offer:
npm run activity -- append --type offer --actor world \
  --title "Offer — <Company>" --summary "<detail>" \
  --company "<Company>" --app-id <application id> --write

# rejection / closed:
npm run activity -- append --type status_change --actor world \
  --title "Closed — <Company>" --summary "<reason>" \
  --company "<Company>" --app-id <application id> --write

# candidate withdrawal (neutral tone — candidate exited, market did not close):
npm run activity -- append --type status_change --actor agent \
  --title "Withdrew — <Company>" --summary "<reason: comp gap / competing offer / culture read / role-scope mismatch / proactive exit>" \
  --company "<Company>" --app-id <application id> --write

# blocker needing the user:
npm run activity -- append --type failure --actor world --needs-user \
  --title "Blocked — <Company>" --summary "<what's blocking>" \
  --company "<Company>" --app-id <application id> --write
```

## STEP 5 — Append to role-family learning file

The `learnings` helper resolves the family slug automatically from `candidate/targeting.yml` (`role_families` → `role_buckets` → neutral slug); no manual derivation is needed.

Compose the entry body as markdown, capturing only durable signal:

- **On rejection:** stage where filtered, objection or gap heard, comp signal if disclosed, keywords or framing that did not land, channel.
- **On candidate withdrawal:** reason the candidate chose to exit (comp gap, competing offer, culture read, role-scope mismatch, timeline mismatch, or proactive de-prioritization). This is strategy signal — record it to track which conditions drive voluntary exits so patterns can inform future targeting.
- **On advance/offer:** winning positioning or phrasings, keywords that landed, comp signal, channel that converted.
- **On ghosted/stale:** funnel stage last known, channel, elapsed time.

Keep entries evidence-linked — only record what was actually observed or stated. Do not invent lessons.

Write the entry body to a temp file (e.g. `/tmp/learning-body.md`), then:

1. Dry-run (preview + lint):
   ```
   npm run learnings -- append "<role title>" --title "<short label>" --body-file /tmp/learning-body.md
   ```
2. If the preview looks correct, commit the entry:
   ```
   npm run learnings -- append "<role title>" --title "<short label>" --body-file /tmp/learning-body.md --write
   ```

The helper creates `candidate/learnings/` and the family file on first `--write`. A missing family file is normal — the helper handles it silently.

## STEP 6 — Check reevaluation thresholds

Run:

```
npm run analyze:outcomes -- --summary
```

Read `byStatus` (total rejected count) and `byRoleFamily` (per-family rejected counts) from the output.

`analyze-outcomes.mjs` loads `candidate/targeting.yml` and passes it to `classifyRoleFamily`, so `byRoleFamily` reflects the candidate's own families (`role_families` → `role_buckets` → built-in tech fallback only when no config). The slugs match what STEP 5 derives; no manual cross-reference is needed.

Compare against thresholds, read from `candidate/targeting.yml#reevaluation.rejection_total` / `reevaluation.rejection_per_family` (defaults `rejection_total: 7`, `rejection_per_family: 3` when absent). The CLI emits the counts; the threshold comparison is an agent behavior (the read-only CLI does not branch on config). Read the threshold values from the YAML and compare against the `--summary` counts:

- Total rejections ≥ `rejection_total` → trigger reject-pattern review.
- Rejections in one role family ≥ `rejection_per_family` → trigger family-level reject-pattern review.
- A cluster of advances or offers in one family or channel → trigger double-down review.

If any threshold is tripped, hand off to `reevaluate-strategy` and report which threshold was crossed and the counts.

## STEP 7 — Write back mid-flow gate changes

If the user states any new constraint during the outcome flow ("never apply to X again", "add this as a cut signal", "cap this company at 1 app"), write it to the canonical gate file immediately:

- Exclusion → `candidate/targeting.yml#excluded_companies`
- Cut signal → `candidate/targeting.yml#cut_signals`
- Keep signal → `candidate/targeting.yml#keep_signals`
- Per-company cap or cooldown → `candidate/application-limits.yml`
- Comp floor or anchor change → `candidate/profile.yml#compensation`

**Friction rule:** write-and-report for unambiguous, low-blast-radius changes (one clear cut signal, a cap just hit). Confirm-first for consequential changes (broad exclusion, comp floor drop, large re-rank). After writing, echo `Written to <file>: <key: value>`.

A stated gate must never live only in chat. Do not hardcode it into skill prose.

## STEP 8 — Commit

Commit `workspace/tracker.json`, any updated `candidate/learnings/<family>.md`, and any gate file changes with an emoji-conventional message:

```
✨ feat(tracker): record <outcome-type> for <Company> — <Role>
```

Include the role family and threshold status in the commit body if a reevaluation threshold was tripped.

---

## RULES

- Tracker mutations are direct JSON edits + two complementary validation checks + `node src/cli/tracker.mjs` re-render: run `node src/cli/tracker.mjs --verify` (validates JSON shape/structure against config/tracker.schema.json — required keys, field presence) AND `npm run verify:tracker` (validates domain integrity — status recognizability, score range 0–100, modes, channels, duplicate company-role pairs). Both must pass; they check different things and neither replaces the other. The tracker CLI is read-only (no mutation subcommands). Never fabricate a mutation subcommand.
- **Never write `current_base` into any tracker field, note, conversations entry, or learning file.** Use `expected_base`, `target_base`, or `minimum_base` only (the `learnings` helper enforces this).
- Notes must be factual. No superlatives, no invented lessons, no editorializing.
- Use `email-comms` for drafting follow-ups or replies. This skill records the outcome; it does not draft outbound text.
- Do not check reevaluation thresholds from prose in AGENTS.md — always run `npm run analyze:outcomes -- --summary` and read the actual counts.
- Role-family taxonomy is driven by `candidate/targeting.yml` (`role_families` or `role_buckets`); `classifyRoleFamily` in `outcome-analysis.mjs` accepts a `targeting` arg and prefers candidate-supplied families over the built-in tech slugs, which apply only when no candidate config is present. `analyze-outcomes.mjs` wires targeting through, so non-tech candidates get correct family files.
- Reevaluation threshold fields (`reevaluation.rejection_total`, `reevaluation.rejection_per_family`) live in `candidate/targeting.yml` (schema'd). The read-only CLI emits the raw counts; comparing them against the thresholds is an agent behavior — read the threshold values from the YAML and branch on them. Do not expect the CLI to apply thresholds for you.
