import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("local user data roots are excluded from git, docker, and Vercel surfaces", async () => {
  const gitignore = await readText(".gitignore");
  const dockerignore = await readText(".dockerignore");
  const vercelignore = await readText(".vercelignore");

  assert.match(gitignore, /^\.rolester\/$/m);
  assert.match(gitignore, /^\/candidate\/$/m);
  assert.match(gitignore, /^workspace\/tracker\.\*$/m);
  assert.match(gitignore, /^config\/search-sources\.yml$/m);
  assert.match(gitignore, /^config\/sourced-scan\.json$/m);

  for (const pattern of [
    ".rolester",
    ".internal",
    "candidate",
    "workspace/jobs",
    "workspace/research",
    "workspace/network-leads",
  ]) {
    assert.match(dockerignore, new RegExp(`^${escapeRegExp(pattern)}$`, "m"));
  }
  assert.doesNotMatch(dockerignore, /^\*\.png$/m);
  assert.match(dockerignore, /^tracker-\*\.png$/m);

  for (const pattern of [".rolester", ".internal", "candidate", "workspace", ".agents", "config"]) {
    assert.match(vercelignore, new RegExp(`^${escapeRegExp(pattern)}$`, "m"));
  }
});

test("npm package allowlist names app files, not broad private-data roots", async () => {
  const pkg = JSON.parse(await readText("package.json"));
  const files = pkg.files || [];

  assert.ok(files.includes("bin"));
  assert.ok(files.includes("src"));
  assert.ok(files.includes("config/*.schema.json"));
  assert.ok(files.includes("config/*.example.*"));
  assert.ok(files.includes(".agents/skills/apply-job/SKILL.md"));
  assert.ok(files.includes(".agents/skills/calendar-sync/SKILL.md"));
  assert.ok(files.includes(".agents/skills/relationship-sourcing/SKILL.md"));
  for (const entry of files.filter((item) => item.startsWith(".agents/skills/"))) {
    await assert.doesNotReject(readText(entry), `${entry} should exist before packaging`);
  }

  assert.ok(!files.includes("config"));
  assert.ok(!files.includes(".agents"));
  assert.ok(!files.includes(".agents/skills/*/SKILL.md"));
  assert.ok(!files.includes("docs"));
  assert.ok(!files.includes("candidate"));
  assert.ok(!files.includes("workspace"));
  assert.ok(!files.some((entry) => entry.includes("search-sources.yml")));
});

test("tracked app files do not contain known production personal sentinels", () => {
  const banned = [
    ["Scott", "Benson"].join(" "),
    "Bloomfield",
    "$" + "145K",
    "145" + "000",
    "sctt" + "bnsn",
    ["Work", "OS"].join(""),
    ["work", "os"].join(""),
    "Pw" + "C",
    "pwc",
    "workos" + ".com",
    "pwc" + ".com",
    "shopify" + ".com",
    ["Anna", "Meyer"].join(" "),
    ["Robert", "Choe"].join(" "),
    ["Alex", "Aberg"].join(" "),
    ["Juniper", "Square"].join(" "),
    "Sabri" + "na",
    "225" + "000",
    "220" + "000",
    "225" + "K",
  ];
  const pattern = banned.map(escapeEgrep).join("|");

  try {
    const output = execFileSync(
      "git",
      [
        "grep",
        "-n",
        "-I",
        "-E",
        pattern,
        "--",
        ".",
        ":!candidate/**",
        ":!workspace/**",
        ":!tests/release-safety.test.mjs",
      ],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
    assert.fail(`Tracked personal sentinel(s) found:\n${output}`);
  } catch (err) {
    if (err.status === 1) return;
    throw err;
  }
});

test("shipped docs/SOURCES.md carries no candidate-discovered (vetted) boards", async () => {
  // research-boards must persist discovered boards to the user's gitignored
  // config/search-sources.yml + workspace/research log — NEVER to this shipped, published
  // doc. Discovered boards are recorded with Status `vetted`; a `vetted` row here means one
  // user's targeting (their domain/role-specific niche boards) leaked into the package.
  // This is the guard for the research-boards → docs/SOURCES.md write-back leak.
  const sources = await readText("docs/SOURCES.md");
  assert.doesNotMatch(
    sources,
    /\|\s*vetted\s*\|/,
    "docs/SOURCES.md has a `vetted` registry row — a candidate-discovered board leaked into the shipped doc. research-boards must write discovered boards to the gitignored config/search-sources.yml only, never here."
  );
});

test("operational scripts do not hardcode an absolute personal-home path", async () => {
  const { readdirSync, statSync } = await import("node:fs");
  const scriptsDir = join(root, "scripts");

  // Walk scripts/ recursively (catches untracked one-off repair/ingest scripts
  // too — those are the ones most likely to grow a hardcoded /Users/<name> path).
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else files.push(full);
    }
  };
  try {
    walk(scriptsDir);
  } catch (err) {
    if (err.code === "ENOENT") return; // no scripts/ dir → nothing to scan
    throw err;
  }

  // A literal home root like /Users/sbenson/ or /home/scott/. The portable forms
  // ($HOME, ${HOME}, ~, and import.meta.url-relative paths) never match.
  const homePath = /\/(?:Users|home)\/[A-Za-z0-9._-]+/;
  const offenders = [];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    text.split("\n").forEach((line, i) => {
      if (homePath.test(line))
        offenders.push(`${file.slice(root.length)}:${i + 1}: ${line.trim()}`);
    });
  }

  assert.deepEqual(
    offenders,
    [],
    `Hardcoded personal-home path(s) in scripts/ — use $HOME, ~, or an import.meta.url-relative root:\n${offenders.join("\n")}`
  );
});

function readText(relPath) {
  return readFile(join(root, relPath), "utf8");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeEgrep(value) {
  return String(value).replace(/[.[\]{}()*+?^$\\|]/g, "\\$&");
}
