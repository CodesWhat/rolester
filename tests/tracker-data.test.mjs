import assert from "node:assert/strict";
import test from "node:test";

import {
  findDuplicateCompanyRoles,
  parseTrackerHtml,
  validateTrackerData,
} from "../src/core/tracker/tracker-data.mjs";

const TRACKER = `
<script>
const APPS = [
  {co:"Acme", role:"Forward Deployed Engineer", base:"$200-250K", tc:"+equity", fit:"high", score:88, status:"awaiting", date:"06-07", loc:"Remote US", mode:"remote", channel:"board", note:"Submitted"},
];
const PROSPECTS = [
  {co:"Acme", role:"Forward Deployed Engineer", base:"$200-250K", tc:"+equity", fit:"high", score:88, loc:"Remote US", mode:"remote", channel:"board", link:"https://jobs.example.com/acme-fde", note:"Duplicate"},
  {co:"Beta", role:"Applied AI Engineer", base:"$220-260K", tc:"+equity", fit:"high", score:91, loc:"NYC", mode:"hybrid", channel:"board", link:"https://jobs.example.com/beta-ai", note:"Clean"},
];
</script>`;

test("parses APPS and PROSPECTS (legacy HTML format) arrays from tracker HTML", () => {
  const data = parseTrackerHtml(TRACKER);

  assert.equal(data.apps.length, 1);
  assert.equal(data.sourced.length, 2);
  assert.equal(data.sourced[1].co, "Beta");
});

test("finds duplicate company-role pairs across tracker arrays", () => {
  const data = parseTrackerHtml(TRACKER);
  const duplicates = findDuplicateCompanyRoles(data);

  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].key, "acme::forward deployed engineer");
});

test("validates status, score, mode, channel, and sourced link fields", () => {
  const data = parseTrackerHtml(TRACKER);
  const result = validateTrackerData(data);

  assert.equal(result.errors.length, 0);
  assert.equal(
    result.warnings.some((warning) => warning.includes("Duplicate")),
    true
  );
});
