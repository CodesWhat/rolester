import { buildHiringCafeUrl } from "./hiringcafe.mjs";
import { buildLeverUrl } from "./lever.mjs";
import { buildWellfoundUrl } from "./wellfound.mjs";

export function buildSourceUrl(source, { now = new Date(), lastRunAt = null } = {}) {
  const provider = providerKey(source?.provider);
  if (provider === "hiringcafe") {
    const recency = source.recency || {};
    return buildHiringCafeUrl({
      query: source.query || source.term,
      url: source.url,
      searchState: source.searchState || {},
      lastRunAt: source.lastRunAt ?? recency.lastRunAt ?? lastRunAt,
      now,
      windowHours: source.windowHours ?? recency.windowHours ?? recency.hours,
      safetyMinutes: source.safetyMinutes ?? recency.safetyMinutes,
    });
  }

  if (provider === "remotevibecodingjobs") {
    return {
      url: buildRemoteVibeCodingJobsUrl(source),
      searchState: {},
      recency: null,
    };
  }

  if (provider === "wellfound") {
    return {
      url: buildWellfoundUrl(source),
      searchState: {},
      recency: null,
    };
  }

  if (provider === "lever") {
    return {
      url: buildLeverUrl(source),
      searchState: {},
      recency: null,
    };
  }

  if (source?.url) return { url: source.url, searchState: {}, recency: null };
  throw new Error(`Unsupported source provider: ${source?.provider || "(missing)"}`);
}

export function providerKey(provider) {
  return String(provider || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function buildRemoteVibeCodingJobsUrl(source = {}) {
  const url = new URL(source.path || "/", "https://remotevibecodingjobs.com");
  if (source.query) url.searchParams.set("q", source.query);
  if (source.page) url.searchParams.set("page", String(source.page));
  return url.toString();
}
