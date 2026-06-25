# Search Sources

Rolester should pull from as many practical sources as it can without turning
scanner matches into apply decisions. Sources feed intake; `evaluate-job` still
owns the body-read gate.

## Source Types

- URL-query sources: build deterministic search URLs from config and capture
  results with Playwright when the page is browser-rendered.
- RSS/Atom sources: poll feeds, store item metadata, then open each posting for
  body capture.
- ATS sources: use public or reverse-discovered company job APIs where stable.
- Aggregators: collect broad matches, preserve their source labels, and dedupe
  against canonical job URLs.
- Manual/auth sources: support saved browser sessions, but mark them as
  interactive and do not require them for baseline setup.

## HiringCafe

HiringCafe keeps filters inside the `searchState` query parameter. Rolester
should build that URL directly from a search string and optional `searchState`
filters instead of clicking through the UI to configure searches.

Rules:

- Preserve arbitrary filters from config or a pasted full HiringCafe URL.
- Default generated searches to `sortBy: "date"` unless a source URL/config
  explicitly says otherwise.
- Derive the recency window from `lastRunAt` when available.
- Add a small safety margin to the URL fetch window.
- Store `recency.postFilterAfter` and exact-filter captured rows after
  Playwright extraction, because HiringCafe's URL filter is a coarse window.

The initial implementation lives in `src/core/providers/hiringcafe.mjs`.

## Remote Vibe Coding Jobs

Remote Vibe Coding Jobs is useful as an AI-native remote aggregator. It exposes:

- search URLs shaped like `https://remotevibecodingjobs.com/?q=<query>`
- an RSS feed at `https://remotevibecodingjobs.com/feed.xml`
- tech, culture, level, location, and salary browsing paths
- visible source labels such as Jobicy, LinkedIn, Greenhouse, Ashby, RemoteOK,
  Google Jobs, Working Nomads, Lever, and manual listings

Use it as both:

- a direct query source for AI-assisted developer roles
- a source-discovery hint for which upstream boards and ATS adapters are worth
  prioritizing

## How to add a source provider

Touch these files in order, replacing `<name>` with the provider key (lowercase, no spaces):

1. **`src/core/providers/<name>.mjs`** — export a `buildXxxUrl(source)` function that
   returns a string URL from a source config object. See `lever.mjs` or `wellfound.mjs`
   for a pure URL-builder template, or `hiringcafe.mjs` for one that also computes
   recency state.

2. **`src/core/providers/source-url.mjs`** — import the builder and add an `if
   (provider === "<name>")` branch inside `buildSourceUrl`. Return
   `{ url, searchState: {}, recency: null }` (or the full recency shape if applicable).

3. **`scripts/capture-search-sources.mjs`** — two additions:
   - In `inferProviderFromUrl`: add an `if (raw.includes("<domain>")) return "<name>";`
     line so bare URLs are auto-detected.
   - In `extractOffers`: add a branch for the provider. For SPA boards, add a
     `page.evaluate(extractXxx)` DOM extractor (see `extractHiringCafe` or
     `extractWellfound`). For boards with a public JSON API, fetch directly instead
     (see `fetchLeverPostings` for the pattern).

4. **`src/core/liveness/job-link-checker.mjs`** — if the board renders via JavaScript
   and a plain HTTP fetch will return a short shell (or 403), add the hostname(s) to the
   array inside `isSpaJobHost`. Optionally extend `spaEscalation` if the provider has a
   machine-readable API to use as a liveness fallback.

5. **`src/core/scoring/sourced-scanner.mjs`** *(only if the provider has a company-level
   ATS API)* — add a `fetchXxx(entry, fetchImpl)` function, register it in
   `fetchProvider`'s dispatch, and add the URL pattern to `inferProvider` so company
   entries can be detected automatically from a `careers_url`.

## Curated Board Registry

A domain-tagged menu of vetted and planned board/aggregator entries. Skills read this
table to offer a filtered starter menu — it is NOT a universal set of defaults. The
`general` tag means suitable for all domains; domain-specific tags (e.g. `tech/software`,
`tech/AI`, `remote`) indicate narrower scope.

**Note:** this registry is currently seeded with tech/software/AI boards because that is
what has been built and vetted so far. Boards for other domains (healthcare, finance,
trades, logistics, etc.) should be added here as they are vetted via `research-boards`
— do not add unvetted entries.

| Board | Domain tag(s) | Type | Confidence | Status | Notes |
|---|---|---|---|---|---|
| HiringCafe | general | aggregator | high | implemented | `src/core/providers/hiringcafe.mjs`; DOM extractor in `capture-search-sources.mjs`; field-neutral shipped default |
| LinkedIn | general | aggregator | high | implemented | `extractLinkedIn` in `capture-search-sources.mjs`; disabled by default (auth brittleness); `--include-disabled` to surface |
| Google Jobs | general | aggregator | high | planned | structured-data aggregator; field-neutral; no provider impl yet |
| Wellfound | tech/software | aggregator | high | implemented | `src/core/providers/wellfound.mjs`; SPA browser source; tech-domain only |
| Remote Vibe Coding Jobs | tech/software, remote | aggregator | high | implemented | URL builder in `source-url.mjs`; RSS via `src/core/providers/rss.mjs`; AI-native remote aggregator |
| Ashby | general | ATS | high | implemented | `fetchAshby` in `sourced-scanner.mjs`; company-level ATS API |
| Greenhouse | general | ATS | high | implemented | `fetchGreenhouse` in `sourced-scanner.mjs`; company-level ATS API |
| Lever | general | ATS | high | implemented | `src/core/providers/lever.mjs`; JSON API in `capture-search-sources.mjs`; company-level ATS API |
| Workable | general | ATS | high | implemented | `fetchWorkable` in `sourced-scanner.mjs`; company-level ATS API |
| SmartRecruiters | general | ATS | high | implemented | `fetchSmartRecruiters` in `sourced-scanner.mjs`; company-level ATS API |
| Recruitee | general | ATS | medium | planned | company-level ATS; no provider impl yet |
| Workday | general | ATS | medium | planned | company-level ATS; no provider impl yet |
| RemoteOK | remote | niche-board | high | planned | remote-only; RSS feed available |
| Jobicy | remote | niche-board | high | planned | remote-only; RSS feed available |
| Working Nomads | remote | niche-board | high | planned | remote-only; curated listings |
| We Work Remotely | remote | niche-board | high | planned | remote-only; well-established |
| Remotive | remote | niche-board | high | planned | remote-only; RSS feed available |
| Forward Deployed Engineer Board | tech/AI | niche-board | high | vetted | `fwddeploy.com`; dated live listings from real companies; url-query; NOT a field-neutral shipped default |
| Agentic Engineering Jobs | tech/AI | niche-board | high | vetted | `agentic-engineering-jobs.com`; AI-agent / RAG / LLM niche (1,200+ listings, salary + seniority filters); url-query; NOT a field-neutral shipped default |
| AI Jobs | tech/AI | niche-board | borderline | vetted | `aijobs.net`; AI/ML-only aggregator; borderline (weak per-listing company attribution, no RSS); confirm before adding; NOT a field-neutral shipped default |

### Registry legend

- **Domain tag(s):** `general` = all domains; `tech/software` = software engineering domain only; `tech/AI` = AI/ML/agent roles; `remote` = remote-posture candidates across domains. Combine tags with commas for entries that span multiple.
- **Type:** `aggregator` = collects from many sources; `ATS` = company-level ATS API adapter; `niche-board` = curated domain-specific board; `RSS` = feed-only.
- **Confidence:** `high` = real dated listings, stable URL, identifiable companies; `medium` = unvetted but reputable; `borderline` = real but with noted quality caveats.
- **Status:** `implemented` = provider code ships with Rolester; `vetted` = legitimacy-screened via `research-boards`, provider impl pending; `planned` = on roadmap, not yet vetted or implemented.

---

## Initial Catalog (legacy reference)

The table above supersedes this list. Kept briefly for cross-reference until all
entries are confirmed migrated.

Aggregators and broad sources:

- HiringCafe — ✓ implemented (`src/core/providers/hiringcafe.mjs`, DOM extractor in `capture-search-sources.mjs`)
- Wellfound — ✓ implemented (`src/core/providers/wellfound.mjs`, DOM extractor in `capture-search-sources.mjs`; SPA host in `isSpaJobHost`)
- Remote Vibe Coding Jobs — ✓ implemented (URL builder inline in `source-url.mjs`, feeds via `src/core/providers/rss.mjs`)
- LinkedIn — ✓ implemented (DOM extractor `extractLinkedIn` in `capture-search-sources.mjs`; disabled by default, requires `--include-disabled`)
- Google Jobs — planned

Discovered via `research-boards` (vetted, provider impl pending — domain-specific, kept
here as reference; they are NOT part of the field-neutral shipped defaults):

- Forward Deployed Engineer Board (`fwddeploy.com`) — niche AI/forward-deployed board with
  dated live listings from real companies; url-query.
- Agentic Engineering Jobs (`agentic-engineering-jobs.com`) — AI-agent / RAG / LLM niche
  board (1,200+ listings, salary + seniority filters); url-query.
- AI Jobs (`aijobs.net`) — AI/ML-only aggregator (borderline: weak per-listing company
  attribution, no RSS); url-query.

ATS and company APIs:

- Ashby — ✓ implemented (`fetchAshby` in `sourced-scanner.mjs`; SPA host in `isSpaJobHost`)
- Greenhouse — ✓ implemented (`fetchGreenhouse` in `sourced-scanner.mjs`)
- Lever — ✓ implemented (`src/core/providers/lever.mjs`; `fetchLeverPostings` JSON API in `capture-search-sources.mjs`; `fetchLever` in `sourced-scanner.mjs`; SPA host in `isSpaJobHost`)
- Workable — ✓ implemented (`fetchWorkable` in `sourced-scanner.mjs`)
- SmartRecruiters — ✓ implemented (`fetchSmartRecruiters` in `sourced-scanner.mjs`)
- Recruitee — planned
- Workday — planned

Remote boards:

- RemoteOK — planned
- Jobicy — planned
- Working Nomads — planned
- We Work Remotely — planned
- Remotive — planned

## State

Each source run should write:

- source id and label
- generated or captured URL
- `lastRunAt`
- exact recency cutoff
- raw result count
- deduped result count
- closed/expired count
- intake file path

This lets the next run use the exact delta from the prior run instead of a fixed
24-hour sweep.
