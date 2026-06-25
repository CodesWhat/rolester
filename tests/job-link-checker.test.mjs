import assert from "node:assert/strict";
import test from "node:test";

import { checkUrlLiveness } from "../src/core/liveness/job-link-checker.mjs";

const SPA_RESPONSE = async () =>
  new Response("<html><body>Loading</body></html>", {
    status: 200,
    headers: { "content-type": "text/html" },
  });

test("short Ashby SPA shell is uncertain rather than expired", async () => {
  const result = await checkUrlLiveness("https://jobs.ashbyhq.com/acme/123", {
    fetchImpl: SPA_RESPONSE,
  });

  assert.equal(result.result, "uncertain");
  assert.equal(result.code, "spa_shell");
  assert.equal(result.escalationHint, "browser-evaluate");
  assert.equal("escalationUrl" in result, false);
});

test("Lever SPA shell returns lever-json escalation hint with escalationUrl", async () => {
  const result = await checkUrlLiveness("https://jobs.lever.co/acme/abc-123", {
    fetchImpl: SPA_RESPONSE,
  });

  assert.equal(result.result, "uncertain");
  assert.equal(result.code, "spa_shell");
  assert.equal(result.escalationHint, "lever-json");
  assert.equal(result.escalationUrl, "https://api.lever.co/v0/postings/acme?mode=json");
});

test("Lever SPA shell with no path company sets escalationUrl to null", async () => {
  const result = await checkUrlLiveness("https://jobs.lever.co/", {
    fetchImpl: SPA_RESPONSE,
  });

  assert.equal(result.escalationHint, "lever-json");
  assert.equal(result.escalationUrl, null);
});

test("Wellfound SPA shell returns browser-evaluate escalation hint", async () => {
  const result = await checkUrlLiveness("https://wellfound.com/company/acme/jobs", {
    fetchImpl: SPA_RESPONSE,
  });

  assert.equal(result.result, "uncertain");
  assert.equal(result.code, "spa_shell");
  assert.equal(result.escalationHint, "browser-evaluate");
  assert.equal("escalationUrl" in result, false);
});
