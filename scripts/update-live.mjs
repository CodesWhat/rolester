#!/usr/bin/env node
// update-live — refresh a live Rolester install from the PUBLISHED npm package.
//
// Rolester's agent path runs in-tree (the agent's native edits are CWD-relative),
// so a live install is a full repo tree with the user's real candidate/ + workspace/
// data co-located. This script updates only the CODE in that tree by fetching the
// published npm tarball and extracting it over the target — the tarball ships code
// only (the package.json `files` whitelist excludes candidate/ and workspace/), so
// the user's live search data is preserved by construction.
//
// It also doubles as a publish-pipeline check: before extracting, it refuses any
// tarball that contains candidate/ or workspace data (a privacy leak in what npm
// shipped), so running it against your own live install dogfoods the release.
//
//   node scripts/update-live.mjs --target <dir> [--tag latest|rc|<version>] [--write]
//
// Dry run by default (prints what it would do + the one-liner to apply). Add
// --write to actually extract over the target. Set ROLESTER_LIVE_DIR instead of
// --target if you prefer.

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function parseArgs(argv) {
  const out = { target: process.env.ROLESTER_LIVE_DIR || null, tag: "latest", write: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target") out.target = argv[++i] || out.target;
    else if (a === "--tag") out.tag = argv[++i] || out.tag;
    else if (a === "--write") out.write = true;
    else if (a === "-h" || a === "--help") out.help = true;
    else if (a.startsWith("-")) {
      /* ignore unknown flag */
    }
  }
  return out;
}

function die(msg) {
  console.error(`update-live: ${msg}`);
  process.exit(1);
}

function readPkgVersion(dir) {
  try {
    return JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).version || "?";
  } catch {
    return null;
  }
}

function looksLikeRolesterTree(dir) {
  // A real install tree has the code entrypoints; we update those, never the data.
  return existsSync(join(dir, "bin", "rolester.mjs")) && existsSync(join(dir, "src"));
}

const opts = parseArgs(process.argv.slice(2));

if (opts.help) {
  console.log(
    "Usage: node scripts/update-live.mjs --target <dir> [--tag latest|rc|<version>] [--write]\n" +
      "  Refreshes CODE in a live Rolester tree from the published npm package.\n" +
      "  candidate/ and workspace/ are never touched (they aren't in the package).\n" +
      "  Dry run unless --write is passed."
  );
  process.exit(0);
}

if (!opts.target) die("no target — pass --target <dir> or set ROLESTER_LIVE_DIR");
if (!existsSync(opts.target)) die(`target does not exist: ${opts.target}`);
if (!looksLikeRolesterTree(opts.target))
  die(
    `target does not look like a Rolester install tree (no bin/rolester.mjs + src/): ${opts.target}`
  );

const spec = `rolester@${opts.tag}`;
console.log(`• Fetching ${spec} from npm…`);

const tmp = mkdtempSync(join(tmpdir(), "rolester-update-"));
let tgz;
try {
  const pack = spawnSync("npm", ["pack", spec, "--pack-destination", tmp], {
    encoding: "utf8",
  });
  if (pack.status !== 0) die(`npm pack failed:\n${pack.stderr || pack.stdout}`);
  const tgzName = readdirSync(tmp).find((f) => f.endsWith(".tgz"));
  if (!tgzName) die("npm pack produced no tarball");
  tgz = join(tmp, tgzName);

  // List the archive and run the privacy guard.
  const list = spawnSync("tar", ["tzf", tgz], { encoding: "utf8" });
  if (list.status !== 0) die(`could not read tarball: ${list.stderr}`);
  const entries = list.stdout
    .split("\n")
    .filter(Boolean)
    .map((p) => p.replace(/^package\//, ""));

  const leaks = entries.filter(
    (p) => /^candidate\//.test(p) || (/^workspace\//.test(p) && !/\.gitkeep$/.test(p))
  );
  if (leaks.length) {
    die(
      `REFUSING — the published package contains user-data paths (a privacy leak):\n` +
        leaks
          .slice(0, 20)
          .map((p) => `    ${p}`)
          .join("\n") +
        `\nThis means the npm release shipped candidate/ or workspace/ content. Fix the ` +
        `package.json "files" whitelist before installing this version anywhere.`
    );
  }

  const publishedVersion =
    entries.includes("package.json") &&
    (() => {
      const show = spawnSync("tar", ["xzfO", tgz, "package/package.json"], { encoding: "utf8" });
      try {
        return JSON.parse(show.stdout).version;
      } catch {
        return null;
      }
    })();
  const currentVersion = readPkgVersion(opts.target);

  console.log(`• Privacy guard passed — tarball is code-only (${entries.length} files).`);
  console.log(`• Target:  ${opts.target}  (currently v${currentVersion ?? "?"})`);
  console.log(
    `• Install: rolester@${opts.tag}${publishedVersion ? ` → v${publishedVersion}` : ""}`
  );

  if (!opts.write) {
    console.log(
      `\nDry run. To apply (code only — candidate/ + workspace/ untouched):\n` +
        `  node scripts/update-live.mjs --target ${opts.target} --tag ${opts.tag} --write`
    );
    process.exit(0);
  }

  console.log(`• Extracting code over target…`);
  const x = spawnSync("tar", ["xzf", tgz, "--strip-components=1", "-C", opts.target], {
    encoding: "utf8",
  });
  if (x.status !== 0) die(`extract failed: ${x.stderr}`);

  console.log(`• Done. Now at v${readPkgVersion(opts.target) ?? "?"}.`);
  console.log(`• Running doctor in the live tree…`);
  const doc = spawnSync("node", [join(opts.target, "src/cli/doctor.mjs")], { stdio: "inherit" });
  if (doc.status !== 0) {
    console.log(
      `  (doctor reported issues — review above; per RELEASE.md, re-run \`rolester ingest\` ` +
        `in update mode if new required config fields were added.)`
    );
  }
} finally {
  try {
    rmSync(tmp, { recursive: true, force: true });
  } catch {
    /* ignore temp cleanup failure */
  }
}
