import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DASHBOARD_CSS } from "../src/core/tracker/styles.mjs";

// The dashboard's CSS is embedded as a template string inside a <style> tag —
// the test suite never parses it in a browser, so a single missing brace once
// shipped green and broke the live page completely: an unclosed
// `[data-theme="gruvbox-dark"] {` swallowed every base rule via CSS nesting, so
// the whole stylesheet only applied under one theme and the default page
// rendered naked. These are cheap structural guards (no DOM, no browser) that
// mirror the DASHBOARD_SCRIPT JS parse guard in client-script.test.mjs.

// Strip /* */ comments and string literals so brace/depth accounting reflects
// real CSS structure, not braces that appear inside comments or content:"…".
function stripCommentsAndStrings(css) {
  let out = "";
  let inComment = false;
  let inString = false;
  let quote = "";
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (inComment) {
      if (ch === "*" && css[i + 1] === "/") {
        inComment = false;
        i++;
      } else if (ch === "\n") {
        out += "\n";
      }
      continue;
    }
    if (inString) {
      if (ch === quote && css[i - 1] !== "\\") inString = false;
      continue;
    }
    if (ch === "/" && css[i + 1] === "*") {
      inComment = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      continue;
    }
    out += ch;
  }
  return { code: out, unterminatedComment: inComment, unterminatedString: inString };
}

describe("styles.mjs DASHBOARD_CSS", () => {
  it("has no unterminated comments or strings", () => {
    const { unterminatedComment, unterminatedString } = stripCommentsAndStrings(DASHBOARD_CSS);
    assert.ok(!unterminatedComment, "DASHBOARD_CSS has an unterminated /* … comment");
    assert.ok(!unterminatedString, "DASHBOARD_CSS has an unterminated string literal");
  });

  it("has balanced braces", () => {
    const { code } = stripCommentsAndStrings(DASHBOARD_CSS);
    let depth = 0;
    let minDepth = 0;
    for (const ch of code) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      if (depth < minDepth) minDepth = depth;
    }
    assert.equal(minDepth >= 0, true, "DASHBOARD_CSS closes a brace that was never opened");
    assert.equal(
      depth,
      0,
      `DASHBOARD_CSS has ${depth > 0 ? `${depth} unclosed` : `${-depth} extra closing`} brace(s) — ` +
        "the rendered dashboard would lose its styles from the imbalance point onward"
    );
  });

  it("declares base layout rules at the top level, not nested under a theme selector", () => {
    // The real failure mode of the missing brace wasn't just imbalance — base
    // rules got nested inside [data-theme=…] and stopped applying by default.
    // Track depth and assert the global reset + body land at depth 0.
    const { code } = stripCommentsAndStrings(DASHBOARD_CSS);
    const baseSelectors = ["*, *::before, *::after", "body {", ".wrap {", ".hero {"];
    for (const sel of baseSelectors) {
      const idx = code.indexOf(sel);
      assert.notEqual(idx, -1, `expected base selector ${JSON.stringify(sel)} in DASHBOARD_CSS`);
      let depth = 0;
      for (let i = 0; i < idx; i++) {
        if (code[i] === "{") depth++;
        else if (code[i] === "}") depth--;
      }
      assert.equal(
        depth,
        0,
        `base selector ${JSON.stringify(sel)} is nested at depth ${depth} (expected 0) — ` +
          "an unclosed theme block is swallowing the base stylesheet"
      );
    }
  });

  it("uses the Paper Command Center palette as the default dashboard theme", () => {
    assert.match(DASHBOARD_CSS, /--bg:\s*#faf6ef;/);
    assert.match(DASHBOARD_CSS, /--surface:\s*#fffaf2;/);
    assert.match(DASHBOARD_CSS, /--surface-alt:\s*#f5f0e8;/);
    assert.match(DASHBOARD_CSS, /--text:\s*#2b2724;/);
    assert.match(DASHBOARD_CSS, /--accent:\s*#e8553d;/);
    assert.match(DASHBOARD_CSS, /--green:\s*#2f9e8f;/);
    assert.match(DASHBOARD_CSS, /--orange:\s*#e0a93b;/);
  });
});
