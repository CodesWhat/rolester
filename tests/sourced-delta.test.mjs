import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  diffSnapshotOffers,
  latestSnapshotPair,
  offerIdentity,
  renderDeltaMarkdown,
  summarizeDelta,
} from "../src/core/scoring/sourced-delta.mjs";

test("uses req ids before normalized URLs for stable offer identity", () => {
  assert.equal(
    offerIdentity({
      reqId: "hiringcafe:abc123",
      url: "https://hiring.cafe/job/abc123?utm_source=noise",
    }),
    "hiringcafe:abc123"
  );
  assert.equal(
    offerIdentity({
      url: "https://www.linkedin.com/jobs/view/444555666/?trk=public_jobs_topcard-title",
    }),
    "linkedin:444555666"
  );
  assert.equal(
    offerIdentity({
      url: "https://job-boards.greenhouse.io/acme/jobs/123?gh_jid=123&utm_campaign=x",
    }),
    "greenhouse:123"
  );
});

test("diffs current job-board snapshots against the previous snapshot", () => {
  const previous = [
    {
      company: "Acme",
      title: "Forward Deployed Engineer",
      url: "https://hiring.cafe/job/old",
      reqId: "hiringcafe:old",
    },
    {
      company: "Beta",
      title: "Director of IT",
      url: "https://jobs.ashbyhq.com/beta/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    },
  ];
  const current = [
    {
      company: "Acme",
      title: "Forward Deployed Engineer",
      url: "https://hiring.cafe/job/old",
      reqId: "hiringcafe:old",
    },
    {
      company: "Gamma",
      title: "AI Solutions Architect",
      url: "https://hiring.cafe/job/new",
      reqId: "hiringcafe:new",
    },
  ];

  const delta = diffSnapshotOffers({ current, previous });

  assert.deepEqual(
    delta.newOffers.map((offer) => offer.company),
    ["Gamma"]
  );
  assert.deepEqual(
    delta.carriedOffers.map((offer) => offer.company),
    ["Acme"]
  );
  assert.deepEqual(
    delta.removedOffers.map((offer) => offer.company),
    ["Beta"]
  );
});

test("summarizes delta counts separately from repo dedupe", () => {
  const delta = diffSnapshotOffers({
    current: [
      {
        company: "Gamma",
        title: "AI Solutions Architect",
        url: "https://hiring.cafe/job/new",
        reqId: "hiringcafe:new",
      },
      {
        company: "Acme",
        title: "Forward Deployed Engineer",
        url: "https://hiring.cafe/job/old",
        reqId: "hiringcafe:old",
      },
    ],
    previous: [
      {
        company: "Acme",
        title: "Forward Deployed Engineer",
        url: "https://hiring.cafe/job/old",
        reqId: "hiringcafe:old",
      },
    ],
    seenIds: new Set(["hiringcafe:new"]),
  });

  const summary = summarizeDelta(delta);

  assert.deepEqual(summary, {
    current: 2,
    previous: 1,
    newSincePrevious: 1,
    newAfterRepoDedupe: 0,
    carried: 1,
    removed: 0,
  });
});

test("allows a one-file baseline when explicitly requested", () => {
  const dir = mkdtempSync(join(tmpdir(), "sourced-delta-"));
  const snapshotPath = join(dir, "linkedin-browser-20260608-120000.json");
  mkdirSync(dir, { recursive: true });
  writeFileSync(snapshotPath, JSON.stringify({ source: "linkedin-browser", offers: [] }));

  const pair = latestSnapshotPair({ dir, source: "linkedin-browser", baselineOk: true });

  assert.equal(pair.current, snapshotPath);
  assert.equal(pair.previous, null);
  assert.equal(pair.baseline, true);
});

test("renders baseline deltas without a previous file path", () => {
  const markdown = renderDeltaMarkdown({
    currentPath: "scan-results/linkedin-browser-20260608-120000.json",
    previousPath: null,
    delta: diffSnapshotOffers({
      current: [
        {
          company: "Acme",
          title: "Forward Deployed Engineer",
          url: "https://www.linkedin.com/jobs/view/123/",
        },
      ],
      previous: [],
    }),
    summary: {
      current: 1,
      previous: 0,
      newSincePrevious: 1,
      newAfterRepoDedupe: 1,
      carried: 0,
      removed: 0,
    },
  });

  assert.match(markdown, /Previous: `empty baseline/);
  assert.match(markdown, /Acme/);
});
