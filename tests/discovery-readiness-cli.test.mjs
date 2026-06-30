import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const ROOT = new URL("..", import.meta.url).pathname;

function tempHome() {
  return mkdtempSync(join(tmpdir(), "rolester-readiness-"));
}

function runCli(script, args, home) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: ROOT,
    env: { ...process.env, ROLESTER_HOME: home },
    encoding: "utf8",
  });
}

test("companies --list explains that empty tracked companies means ATS scans are not wired", () => {
  const home = tempHome();
  try {
    const result = runCli("src/cli/companies.mjs", ["--list"], home);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /No tracked companies yet\./);
    assert.match(result.stdout, /Run discover-companies/);
    assert.match(result.stdout, /Ashby, Greenhouse, Lever, Workable, or SmartRecruiters/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("doctor surfaces missing company ATS discovery separately from broad search sources", () => {
  const home = tempHome();
  try {
    mkdirSync(join(home, "config"), { recursive: true });
    writeFileSync(
      join(home, "config", "search-sources.yml"),
      `searches:
  - provider: HiringCafe
    label: Director of IT
    query: Director of IT
    enabled: true
`,
      "utf8"
    );

    const result = runCli("src/cli/doctor.mjs", [], home);

    assert.match(result.stdout, /Search readiness:/);
    assert.match(result.stdout, /Broad sources: 1 enabled search/);
    assert.match(result.stdout, /Company ATS scans: not configured/);
    assert.match(result.stdout, /discover-companies/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("doctor prints the ordered post-onboarding discovery pipeline", () => {
  const home = tempHome();
  try {
    mkdirSync(join(home, "config"), { recursive: true });
    writeFileSync(
      join(home, "config", "search-sources.yml"),
      `searches:
  - provider: HiringCafe
    label: Director of IT
    query: Director of IT
    enabled: true
`,
      "utf8"
    );

    const result = runCli("src/cli/doctor.mjs", [], home);

    assert.match(result.stdout, /Discovery pipeline:/);
    assert.match(
      result.stdout,
      /setup-searches -> research-boards -> discover-companies -> search-jobs/
    );
    assert.match(result.stdout, /Next discovery step: research-boards/);
    assert.match(result.stdout, /then discover-companies before the first sweep/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("searches --list calls out configured searches that have never run", () => {
  const home = tempHome();
  try {
    mkdirSync(join(home, "config"), { recursive: true });
    writeFileSync(
      join(home, "config", "search-sources.yml"),
      `searches:
  - provider: HiringCafe
    label: Director of IT
    query: Director of IT
    enabled: true
`,
      "utf8"
    );

    const result = runCli("src/cli/searches.mjs", ["--list"], home);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /1 enabled search configured/);
    assert.match(result.stdout, /0\/1 have run watermarks/);
    assert.match(result.stdout, /run the search-jobs skill/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("skill handoffs keep post-onboarding discovery in the required order", () => {
  const files = [
    ".agents/skills/ingest-profile/SKILL.md",
    ".agents/skills/setup-searches/SKILL.md",
    ".agents/skills/research-boards/SKILL.md",
  ];

  for (const file of files) {
    const text = readFileSync(join(ROOT, file), "utf8");
    assert.match(
      text,
      /setup-searches -> research-boards -> discover-companies -> search-jobs/,
      file
    );
  }
});

test("user-facing docs use default list commands instead of npm -- --list noise", () => {
  const files = [
    "src/cli/searches.mjs",
    "src/cli/companies.mjs",
    "src/cli/doctor.mjs",
    ".agents/skills/search-jobs/SKILL.md",
    ".agents/skills/setup-searches/SKILL.md",
    ".agents/skills/research-boards/SKILL.md",
    ".agents/skills/discover-companies/SKILL.md",
    "docs/foundations-spec.md",
  ];

  const offenders = files.filter((file) =>
    /npm run (?:searches|companies) -- --list/.test(readFileSync(join(ROOT, file), "utf8"))
  );

  assert.deepEqual(offenders, []);
});
