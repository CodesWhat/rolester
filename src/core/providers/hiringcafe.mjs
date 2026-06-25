const HIRING_CAFE_ORIGIN = "https://hiring.cafe/";

export function buildHiringCafeUrl({
  query,
  url: sourceUrl = null,
  searchState = {},
  lastRunAt = null,
  now = new Date(),
  windowHours = null,
  safetyMinutes = 30,
} = {}) {
  const sourceState = sourceUrl ? parseHiringCafeSearchState(sourceUrl) : {};

  const recency = resolveRecencyWindow({ lastRunAt, now, windowHours, safetyMinutes });
  const state = {
    ...sourceState,
    ...searchState,
  };

  if (query) state.searchQuery = query;
  if (!state.searchQuery || typeof state.searchQuery !== "string") {
    throw new Error("buildHiringCafeUrl requires a query string or URL searchState.searchQuery");
  }

  if (!state.sortBy) state.sortBy = "date";
  state.dateFetchedPastNDays = hiringCafePastDaysForHours(recency.fetchHours);

  const url = new URL(HIRING_CAFE_ORIGIN);
  url.searchParams.set("searchState", JSON.stringify(state));

  return {
    url: url.toString(),
    searchState: state,
    recency,
  };
}

export function parseHiringCafeSearchState(sourceUrl) {
  const parsedUrl = new URL(sourceUrl);
  const rawSearchState = parsedUrl.searchParams.get("searchState");
  if (!rawSearchState) return {};

  try {
    const parsedState = JSON.parse(rawSearchState);
    if (!parsedState || typeof parsedState !== "object" || Array.isArray(parsedState)) {
      throw new Error("searchState must be an object");
    }
    return parsedState;
  } catch (error) {
    throw new Error(`Invalid HiringCafe searchState JSON: ${error.message}`);
  }
}

export function resolveRecencyWindow({
  lastRunAt = null,
  now = new Date(),
  windowHours = null,
  safetyMinutes = 30,
} = {}) {
  const nowDate = toDate(now, "now");
  let hours = Number(windowHours || 0);

  if (!hours && lastRunAt) {
    const lastRunDate = toDate(lastRunAt, "lastRunAt");
    hours = Math.max(1, (nowDate.getTime() - lastRunDate.getTime()) / 36e5);
  }

  if (!hours) hours = 24;
  const safetyHours = Math.max(0, Number(safetyMinutes || 0) / 60);
  const exactHours = Math.max(1, hours);
  const fetchHours = exactHours + safetyHours;
  const postFilterAfter = new Date(nowDate.getTime() - exactHours * 36e5).toISOString();

  return {
    hours: roundHours(exactHours),
    fetchHours: roundHours(fetchHours),
    postFilterAfter,
  };
}

export function hiringCafePastDaysForHours(hours) {
  const numericHours = Math.max(1, Number(hours || 24));
  // Current observed HiringCafe convention: dateFetchedPastNDays=2 renders the
  // "Past 24 hours" filter. Use the smallest broad window that should not miss
  // anything, then exact-filter captured rows with recency.postFilterAfter.
  return Math.max(2, Math.ceil(numericHours / 24) + 1);
}

function toDate(value, label) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${label} date`);
  return date;
}

function roundHours(value) {
  return Math.round(value * 100) / 100;
}
