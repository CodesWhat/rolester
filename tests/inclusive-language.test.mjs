import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";

const forbidden = ["mas", "ter"].join("");
const root = process.cwd();
const skippedExtensions = new Set([
  ".gif",
  ".ico",
  ".jpg",
  ".jpeg",
  ".pdf",
  ".png",
  ".webp",
  ".woff",
  ".woff2",
]);

// Scan only the files that can actually land in the repo: everything git tracks
// plus untracked files that aren't gitignored. This excludes generated build
// output (node_modules/, .next/, out/, .turbo/, .vercel/, …) and local-only trees
// (candidate/, workspace/, .internal/) — none of which ship, and all of which can
// carry the forbidden word inside minified third-party code. Files deleted from
// the working tree are skipped too, so removing an offending file resolves the
// violation instead of resurrecting it from the index.
function collectFiles() {
  const stdout = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  );
  return [...new Set(stdout.split("\0").filter(Boolean))].filter((rel) => {
    if (skippedExtensions.has(path.extname(rel).toLowerCase())) return false;
    // git lists embedded repos / untracked dirs as a single entry; read only
    // regular files (this also drops symlinks-to-dirs and deleted entries).
    try {
      return statSync(path.join(root, rel)).isFile();
    } catch {
      return false;
    }
  });
}

describe("inclusive language", () => {
  it("keeps deprecated control wording out of repo text and file paths", async () => {
    const files = collectFiles();
    const violations = [];

    for (const relativePath of files) {
      if (new RegExp(`\\b${forbidden}\\b`, "i").test(relativePath)) {
        violations.push(`${relativePath}:path`);
      }

      const text = await readFile(path.join(root, relativePath), "utf8");
      text.split(/\r?\n/).forEach((line, index) => {
        if (new RegExp(`\\b${forbidden}\\b`, "i").test(line)) {
          violations.push(`${relativePath}:${index + 1}`);
        }
      });
    }

    assert.deepEqual(violations, []);
  });
});
