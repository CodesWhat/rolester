// Pure URL builder for Wellfound (wellfound.com, formerly AngelList Talent).
// No HTTP client, no fetch, no network — returns a string URL only.
//
// Wellfound exposes stable SEO landing pages that require no auth:
//   /role/r/{slug}           — role, remote-only  (preferred remote path)
//   /role/l/{slug}/{loc}     — role + city/region
//   /role/{slug}             — role only, all locations
//
// The dynamic /jobs SPA app is intentionally NOT built here: its query params
// are unstable and robots.txt disallows /*?role=* etc. Drive it via browser tool.
//
// source.url passthrough is always honoured first.
// Role/location slugs: lowercase-hyphenated via slug().

const WELLFOUND_ORIGIN = "https://wellfound.com";

/** Slugify a human-readable string to the hyphenated-lowercase path format Wellfound uses. */
function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * buildWellfoundUrl(source) → string URL.
 *
 * Honoured fields:
 *   source.url      — passthrough, returned as-is.
 *   source.role     — job title (preferred over source.query).
 *   source.query    — fallback title when source.role is absent.
 *   source.remote   — boolean; selects the /role/r/{slug} remote-only path.
 *   source.location — city/region string; selects /role/l/{slug}/{loc}.
 *
 * Priority: url → remote+role → role+location → role-only.
 * Throws if neither url nor role/query is provided.
 */
export function buildWellfoundUrl(source = {}) {
  // 1. Explicit URL passthrough — caller already has the exact link.
  if (source.url) return source.url;

  const title = source.role || source.query || "";
  if (!title) {
    throw new Error(
      "buildWellfoundUrl requires source.url, source.role, or source.query. " +
        "To link to the remote hub, set source.url = 'https://wellfound.com/remote' directly."
    );
  }

  const roleSlug = slug(title);

  // remote flag wins over location.
  if (source.remote) {
    return `${WELLFOUND_ORIGIN}/role/r/${roleSlug}`;
  }

  if (source.location) {
    const locSlug = slug(source.location);
    return `${WELLFOUND_ORIGIN}/role/l/${roleSlug}/${locSlug}`;
  }

  return `${WELLFOUND_ORIGIN}/role/${roleSlug}`;
}
