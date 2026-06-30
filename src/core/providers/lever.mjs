// Pure URL builder for Lever ATS (jobs.lever.co / api.lever.co).
// No HTTP client, no fetch, no network — returns a string URL only.
//
// Board URL  : https://jobs.lever.co/{company}          (human-facing SPA)
// JSON API   : https://api.lever.co/v0/postings/{company}?mode=json  (public JSON)
//
// The company slug is the last path segment of the board URL.
// api.lever.co returns [] (HTTP 200) for unknown slugs — not a 404.

const BOARD_ORIGIN = "https://jobs.lever.co";
const API_ORIGIN = "https://api.lever.co";

/** Slugify a human-readable string to lowercase-hyphenated format. */
function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * buildLeverUrl(source) → string URL.
 *
 * Honoured fields:
 *   source.url      — passthrough, returned as-is.
 *   source.company  — company slug or name (slugified automatically).
 *   source.json     — boolean; switches to api.lever.co JSON endpoint.
 *   source.api      — alias for source.json.
 *
 * Throws if neither url nor company is provided.
 */
export function buildLeverUrl(source = {}) {
  if (source.url) return source.url;

  const company = source.company || "";
  if (!company) {
    throw new Error("buildLeverUrl requires source.url or source.company");
  }

  const companySlug = slug(company);

  if (source.json || source.api) {
    // Public postings JSON API — returns all published postings as a JSON array.
    // mode=json is required; the endpoint returns HTML without it.
    const url = new URL(`/v0/postings/${companySlug}`, API_ORIGIN);
    url.searchParams.set("mode", "json");
    return url.toString();
  }

  // Default: human-facing job board (SPA shell).
  return `${BOARD_ORIGIN}/${companySlug}`;
}

/**
 * leverSearchEntry(company) → schema-valid search-sources entry for the
 * company's public Lever job board.
 *
 * @param {string} company  Company name or slug; slugified automatically for the URL.
 * @returns {{ provider: string, source_type: string, label: string, url: string, enabled: boolean }}
 */
export function leverSearchEntry(company) {
  const companySlug = slug(company || "");
  if (!companySlug) {
    throw new Error("leverSearchEntry: company name is required");
  }

  return {
    provider: "Lever",
    source_type: "ats",
    label: `Lever – ${company}`,
    url: `${BOARD_ORIGIN}/${companySlug}`,
    enabled: true,
  };
}
