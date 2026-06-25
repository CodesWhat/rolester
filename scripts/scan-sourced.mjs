#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkUrlLiveness } from "../src/core/liveness/job-link-checker.mjs";
import { userPath } from "../src/core/paths/workspace.mjs";
import { parseYaml } from "../src/core/profile/yaml.mjs";
import { renderSourcedIntake } from "../src/core/scoring/sourced-intake.mjs";
import {
  buildLocationFilter,
  buildTitleFilter,
  computeFamilyOutcomes,
  filterAndDedupeOffers,
  loadScannerConfig,
  scanCompanies,
  scanSearchSources,
  scoreSourcedOffer,
} from "../src/core/scoring/sourced-scanner.mjs";
import { buildSeenSets } from "../src/core/tracker/tracker-data.mjs";

// 7.3: Load profile to get relocation triggers for inferMode.
// Gracefully degrades if candidate/profile.yml is absent.
const _scriptRoot = join(fileURLToPath(import.meta.url), "../..");
const pathCtx = { repoRoot: _scriptRoot };
const _profilePath = userPath(pathCtx, "candidate/profile.yml");
const _targetingPath = userPath(pathCtx, "candidate/targeting.yml");
let _reloTriggers = null; // null = not loaded yet; [] = loaded but empty or absent

function getReloTriggers() {
  if (_reloTriggers !== null) return _reloTriggers;
  try {
    if (existsSync(_profilePath)) {
      const profile = parseYaml(readFileSync(_profilePath, "utf8"));
      const relocation = profile?.location?.relocation ?? [];
      _reloTriggers = relocation
        .filter((c) => typeof c === "string" && c.trim().length > 0)
        .map((c) => c.toLowerCase().trim());
    } else {
      _reloTriggers = [];
    }
  } catch {
    _reloTriggers = [];
  }
  return _reloTriggers;
}

function loadCandidateConfig() {
  let targeting = null;
  let profile = null;
  try {
    if (existsSync(_targetingPath)) {
      targeting = parseYaml(readFileSync(_targetingPath, "utf8")) || null;
    }
  } catch {
    targeting = null;
  }
  try {
    if (existsSync(_profilePath)) {
      profile = parseYaml(readFileSync(_profilePath, "utf8")) || null;
    }
  } catch {
    profile = null;
  }
  if (targeting == null && profile == null) return {};
  return { targeting, profile };
}

const args = process.argv.slice(2);
const configPath = valueAfter("--config") || userPath(pathCtx, "config/sourced-scan.json");
const companyFilter = valueAfter("--company");
const write = args.includes("--write");
const intake = args.includes("--intake");
const verify = args.includes("--verify");
const trackerFormat = args.includes("--format=tracker");
const summaryOnly = args.includes("--summary");
const limit = Number(valueAfter("--limit") || 0);
const timestamped = args.includes("--timestamped");

const config = loadScannerConfig(configPath);
const candidateConfig = loadCandidateConfig();
const { seenUrls, seenReqIds, seenCompanyRoles, tracker } = buildSeenSets(_scriptRoot);

// Outcome-aware scoring: down-weight role families the candidate's own results
// show never convert via cold board apply (see computeFamilyOutcomes). Attaching
// it to candidateConfig threads it into scoreSourcedOffer via filterAndDedupeOffers.
const familyOutcomes = computeFamilyOutcomes(tracker?.apps || [], candidateConfig.targeting);
candidateConfig.familyOutcomes = familyOutcomes;
const coldFamilies = Object.entries(familyOutcomes)
  .filter(([, s]) => s.cold)
  .map(([fam, s]) => `${fam} (0/${s.total})`);
if (coldFamilies.length > 0) {
  console.log(`Cold-board lanes down-weighted: ${coldFamilies.join(", ")}`);
}
const titleFilter = buildTitleFilter(config.title_filter);
const locationFilter = buildLocationFilter(config.location_filter);

const scanned = await scanCompanies(config, { companyFilter });

// Also scan the RSS-bearing sources from config/search-sources.yml (the file
// setup-searches writes). This wires the search-sources pipeline into the sweep;
// browser/auth source types (HiringCafe, Wellfound, authenticated LinkedIn/Indeed)
// are agent-driven per the Browser Automation Contract and not fetched here.
const searchSourcesPath = userPath(pathCtx, "config/search-sources.yml");
let sourcedFromSearches = { offers: [], errors: [] };
if (!companyFilter && existsSync(searchSourcesPath)) {
  try {
    const searchSources = parseYaml(readFileSync(searchSourcesPath, "utf8"));
    sourcedFromSearches = await scanSearchSources(searchSources);
  } catch (error) {
    sourcedFromSearches.errors.push({ company: "search-sources.yml", error: error.message });
  }
}
const allOffers = [...scanned.offers, ...sourcedFromSearches.offers];
scanned.offers = allOffers;
scanned.errors = [...scanned.errors, ...sourcedFromSearches.errors];

let filtered = filterAndDedupeOffers(allOffers, {
  seenUrls,
  seenReqIds,
  seenCompanyRoles,
  titleFilter,
  locationFilter,
  config: candidateConfig,
});

if (verify && filtered.kept.length > 0) {
  const checked = [];
  const dropped = [];
  for (const offer of filtered.kept) {
    const live = await checkUrlLiveness(offer.url);
    if (live.result === "expired") dropped.push({ ...offer, liveness: live });
    else checked.push({ ...offer, liveness: live });
  }
  filtered = { ...filtered, kept: checked, expired: dropped };
}

const outputOffers = filtered.kept.map(toOutputOffer);
const summary = {
  scanned: scanned.offers.length,
  new: filtered.kept.length,
  filteredTitle: filtered.filteredTitle.length,
  filteredLocation: filtered.filteredLocation.length,
  duplicates: filtered.duplicates.length,
  invalid: filtered.invalid.length,
  expired: filtered.expired?.length || 0,
  errors: scanned.errors,
  offers: limit > 0 ? outputOffers.slice(0, limit) : outputOffers,
};

if (summaryOnly) {
  printSummary(summary, filtered.kept, candidateConfig);
} else if (trackerFormat) {
  for (const offer of summary.offers) {
    console.log(toTrackerObject(offer, candidateConfig));
  }
} else {
  console.log(JSON.stringify(summary, null, 2));
}

if (write) {
  const scanResultsDir = userPath(pathCtx, "workspace/scan-results");
  mkdirSync(scanResultsDir, { recursive: true });
  const stamp = timestamped ? timestamp(new Date()) : new Date().toISOString().slice(0, 10);
  const out = join(scanResultsDir, `sourced-${stamp}.json`);
  writeFileSync(out, JSON.stringify(summary, null, 2));
  console.error(`Wrote ${out}`);
}

if (intake) {
  const intakeDir = userPath(pathCtx, "workspace/intake");
  mkdirSync(intakeDir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const out = join(intakeDir, `sourced-${date}.md`);
  writeFileSync(
    out,
    renderSourcedIntake({ date, offers: summary.offers, summary, config: candidateConfig })
  );
  console.error(`Wrote ${out}`);
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
}

function timestamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function printSummary(summary, offers, cfg = {}) {
  console.log(`Scanned: ${summary.scanned}`);
  console.log(`New after filters/dedupe: ${summary.new}`);
  console.log(`Filtered by title: ${summary.filteredTitle}`);
  console.log(`Filtered by location: ${summary.filteredLocation}`);
  console.log(`Duplicates: ${summary.duplicates}`);
  if (summary.errors.length > 0) {
    console.log("Errors:");
    for (const error of summary.errors) console.log(`- ${error.company}: ${error.error}`);
  }
  console.log("Top scanner output:");
  for (const offer of offers.slice(0, limit || 25)) {
    const dup = offer.possibleDuplicate ? " possible-duplicate" : "";
    const rating = offer.score == null || !offer.fit ? scoreSourcedOffer(offer, cfg) : offer;
    console.log(
      `- ${rating.score}% ${rating.fit} ${rating.gate || "review"} | ${offer.company} | ${offer.title} | ${offer.location || "N/A"} | ${offer.url}${dup}`
    );
  }
}

function toOutputOffer(offer) {
  const { bodyText, ...rest } = offer;
  return {
    ...rest,
    bodyChars: String(bodyText || "").length,
  };
}

function toTrackerObject(offer, cfg = {}) {
  const safe = (value) => JSON.stringify(value || "");
  const rating = offer.score == null || !offer.fit ? scoreSourcedOffer(offer, cfg) : offer;
  const noteParts = [
    `Found by scanner via ${offer.source}`,
    `scanner fit ${rating.score}% (${rating.fit}, ${rating.gate || "review"})`,
    rating.ratingReason,
    Array.isArray(rating.ruleFlags) && rating.ruleFlags.length > 0
      ? `flags: ${rating.ruleFlags.join(", ")}`
      : "",
    "BODY-READ GATE before tailoring",
  ].filter(Boolean);
  return `{co:${safe(offer.company)}, role:${safe(offer.title)}, base:${safe(offer.comp || "verify")}, tc:${safe("+equity/bonus")}, loc:${safe(offer.location || "verify")}, mode:${safe(inferMode(offer.location))}, fitBucket:${safe(rating.fit)}, fitScore:${rating.score}, fitBasis:"triage", channel:"board", link:${safe(offer.url)}, note:${safe(noteParts.join("; "))}}`;
}

// 7.3: inferMode reads relo triggers from profile.location.relocation.
// Falls back to "hybrid" when no relo triggers are configured — no hardcoded metros.
function inferMode(location = "") {
  const lower = location.toLowerCase();
  if (lower.includes("remote")) return "remote";

  const triggers = getReloTriggers();
  if (triggers.length > 0 && triggers.some((metro) => lower.includes(metro))) return "relo";

  if (/\b(onsite|on-site|in office|in-office)\b/.test(lower)) return "onsite";

  return "hybrid";
}
