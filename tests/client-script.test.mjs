import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DASHBOARD_SCRIPT } from "../src/core/tracker/client-script.mjs";

// The dashboard's client JS is embedded as a template string and shipped inside
// a <script> tag — the test suite never runs it in a browser, so a syntax error
// previously shipped green and broke the live page (theme toggle, band filter,
// countdown, sortable table). `new Function(body)` parses the script without
// executing it, so a parse error throws here. This is a cheap structural guard,
// not a behavioral test (no DOM is involved).
describe("client-script.mjs DASHBOARD_SCRIPT", () => {
  it("parses as valid JavaScript (no syntax error)", () => {
    assert.doesNotThrow(() => {
      // eslint-disable-next-line no-new-func
      new Function(DASHBOARD_SCRIPT);
    }, "DASHBOARD_SCRIPT has a JS syntax error — it would break the rendered dashboard");
  });

  it("is a non-empty IIFE-wrapped script", () => {
    assert.ok(DASHBOARD_SCRIPT.trim().length > 0, "DASHBOARD_SCRIPT is empty");
    assert.match(
      DASHBOARD_SCRIPT,
      /\(function\s*\(\)\s*\{/,
      "expected the client script to be wrapped in an IIFE"
    );
  });
});
