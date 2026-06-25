import assert from "node:assert/strict";
import test from "node:test";

import {
  buildHiringCafeUrl,
  hiringCafePastDaysForHours,
  parseHiringCafeSearchState,
  resolveRecencyWindow,
} from "../src/core/providers/hiringcafe.mjs";
import {
  buildRemoteVibeCodingJobsUrl,
  buildSourceUrl,
  providerKey,
} from "../src/core/providers/source-url.mjs";

test("builds HiringCafe URL from query and arbitrary searchState filters", () => {
  const built = buildHiringCafeUrl({
    query: "forward deployed engineer",
    now: new Date("2026-06-11T12:00:00.000Z"),
    windowHours: 24,
    safetyMinutes: 0,
    searchState: {
      sortBy: "date",
      workplaceTypes: ["Remote"],
      locations: ["United States"],
    },
  });
  const url = new URL(built.url);
  const state = JSON.parse(url.searchParams.get("searchState"));

  assert.equal(url.origin, "https://hiring.cafe");
  assert.equal(state.searchQuery, "forward deployed engineer");
  assert.equal(state.sortBy, "date");
  assert.deepEqual(state.workplaceTypes, ["Remote"]);
  assert.deepEqual(state.locations, ["United States"]);
  assert.equal(state.dateFetchedPastNDays, 2);
});

test("preserves filters from a pasted HiringCafe URL while refreshing recency", () => {
  const pasted = new URL("https://hiring.cafe/");
  pasted.searchParams.set(
    "searchState",
    JSON.stringify({
      searchQuery: "solutions engineer",
      dateFetchedPastNDays: 7,
      sortBy: "relevance",
      workplaceTypes: ["Remote"],
      locations: ["United States"],
      salaryRange: [200000, 0],
    })
  );

  const built = buildHiringCafeUrl({
    url: pasted.toString(),
    now: new Date("2026-06-11T12:00:00.000Z"),
    windowHours: 24,
  });
  const state = JSON.parse(new URL(built.url).searchParams.get("searchState"));

  assert.equal(state.searchQuery, "solutions engineer");
  assert.equal(state.sortBy, "relevance");
  assert.deepEqual(state.workplaceTypes, ["Remote"]);
  assert.deepEqual(state.locations, ["United States"]);
  assert.deepEqual(state.salaryRange, [200000, 0]);
  assert.equal(state.dateFetchedPastNDays, 3);
});

test("derives exact recency metadata from last run while using broad URL window", () => {
  const recency = resolveRecencyWindow({
    lastRunAt: "2026-06-11T06:00:00.000Z",
    now: new Date("2026-06-11T12:00:00.000Z"),
    safetyMinutes: 30,
  });

  assert.deepEqual(recency, {
    hours: 6,
    fetchHours: 6.5,
    postFilterAfter: "2026-06-11T06:00:00.000Z",
  });
  assert.equal(hiringCafePastDaysForHours(recency.fetchHours), 2);
});

test("expands HiringCafe day window when last run is more than 24h ago", () => {
  assert.equal(hiringCafePastDaysForHours(25), 3);
  assert.equal(hiringCafePastDaysForHours(49), 4);
});

test("parses HiringCafe searchState JSON from a full URL", () => {
  const url = new URL("https://hiring.cafe/");
  url.searchParams.set("searchState", JSON.stringify({ searchQuery: "agentic ai" }));

  assert.deepEqual(parseHiringCafeSearchState(url.toString()), { searchQuery: "agentic ai" });
});

test("builds Remote Vibe Coding Jobs query URL", () => {
  assert.equal(
    buildRemoteVibeCodingJobsUrl({ query: "Claude Code", page: 2 }),
    "https://remotevibecodingjobs.com/?q=Claude+Code&page=2"
  );
});

test("dispatches source URL builders by provider", () => {
  const hiringCafe = buildSourceUrl({
    provider: "HiringCafe",
    query: "agentic ai",
    windowHours: 24,
  });
  assert.match(hiringCafe.url, /^https:\/\/hiring\.cafe\/\?searchState=/);

  const remoteVibe = buildSourceUrl({
    provider: "remote-vibe-coding-jobs",
    query: "vibe coding",
  });
  assert.equal(remoteVibe.url, "https://remotevibecodingjobs.com/?q=vibe+coding");
});

test("dispatches pasted HiringCafe URLs without requiring a separate query", () => {
  const pasted = new URL("https://hiring.cafe/");
  pasted.searchParams.set(
    "searchState",
    JSON.stringify({
      searchQuery: "mcp",
      workplaceTypes: ["Remote"],
    })
  );

  const built = buildSourceUrl({
    provider: "HiringCafe",
    url: pasted.toString(),
    recency: {
      hours: 24,
      safetyMinutes: 0,
    },
  });
  const state = JSON.parse(new URL(built.url).searchParams.get("searchState"));

  assert.equal(state.searchQuery, "mcp");
  assert.deepEqual(state.workplaceTypes, ["Remote"]);
  assert.equal(state.dateFetchedPastNDays, 2);
});

test("reads nested recency config from source objects", () => {
  const built = buildSourceUrl({
    provider: "HiringCafe",
    query: "applied ai",
    recency: {
      windowHours: 24,
      safetyMinutes: 90,
    },
  });
  const state = JSON.parse(new URL(built.url).searchParams.get("searchState"));

  assert.equal(state.dateFetchedPastNDays, 3);
  assert.equal(built.recency.fetchHours, 25.5);
});

test("normalizes common provider spellings", () => {
  assert.equal(providerKey("HiringCafe"), "hiringcafe");
  assert.equal(providerKey("remote-vibe-coding-jobs"), "remotevibecodingjobs");
});
