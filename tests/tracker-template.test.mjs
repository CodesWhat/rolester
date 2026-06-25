import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("tracker template includes communication state", async () => {
  const tracker = JSON.parse(await readFile(`${root}/templates/tracker.json`, "utf8"));

  assert.deepEqual(Object.keys(tracker), ["applications", "sourced", "sources", "communications"]);
  assert.ok(Array.isArray(tracker.communications));
});

test("tracker template is a demo seed: every row flagged demo:true", async () => {
  const tracker = JSON.parse(await readFile(`${root}/templates/tracker.json`, "utf8"));

  // The shipped template seeds demo data so a fresh install has a populated
  // funnel. Every row across every collection must carry demo:true so that
  // stripDemo() clears the entire seed the moment any real row is added.
  for (const key of ["applications", "sourced", "sources", "communications"]) {
    assert.ok(tracker[key].length > 0, `${key} should be seeded with demo rows`);
    for (const row of tracker[key]) {
      assert.equal(row.demo, true, `every ${key} row must be flagged demo:true`);
    }
  }
});

test("tracker schema requires communications collection", async () => {
  const schema = JSON.parse(await readFile(`${root}/config/tracker.schema.json`, "utf8"));

  assert.ok(schema.required.includes("communications"));
  assert.equal(schema.properties.communications.type, "array");
  assert.deepEqual(schema.properties.communications.items.required, ["id", "status", "summary"]);
});
