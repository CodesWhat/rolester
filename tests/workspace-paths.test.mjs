import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  dataPath,
  dataRel,
  privateDataRoot,
  resolveUserPaths,
  userPath,
} from "../src/core/paths/workspace.mjs";

function tempRepo() {
  return mkdtempSync(join(tmpdir(), "rolester-paths-"));
}

test("privateDataRoot defaults new installs to .rolester", () => {
  const repoRoot = tempRepo();
  try {
    assert.equal(privateDataRoot({ repoRoot }), join(repoRoot, ".rolester"));
    assert.equal(dataRel("candidate/profile.yml"), ".rolester/candidate/profile.yml");
    assert.equal(
      dataPath({ repoRoot }, "workspace/tracker.json"),
      join(repoRoot, ".rolester", "workspace", "tracker.json")
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("privateDataRoot honors ROLESTER_HOME for portable/private instance data", () => {
  const repoRoot = tempRepo();
  const home = join(tempRepo(), "instance");
  try {
    const env = { ROLESTER_HOME: home };
    assert.equal(privateDataRoot({ repoRoot, env }), home);
    assert.equal(
      dataPath({ repoRoot, env }, "candidate/profile.yml"),
      join(home, "candidate", "profile.yml")
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  }
});

test("resolveUserPaths prefers legacy repo-root data only when it already exists", () => {
  const repoRoot = tempRepo();
  try {
    mkdirSync(join(repoRoot, "candidate"), { recursive: true });
    mkdirSync(join(repoRoot, "workspace"), { recursive: true });
    mkdirSync(join(repoRoot, "config"), { recursive: true });
    mkdirSync(join(repoRoot, ".internal"), { recursive: true });
    writeFileSync(join(repoRoot, "workspace", "tracker.json"), "{}\n");
    writeFileSync(join(repoRoot, "config", "search-sources.yml"), "searches: []\n");

    const paths = resolveUserPaths({ repoRoot });
    assert.equal(paths.candidateDir, join(repoRoot, "candidate"));
    assert.equal(paths.workspaceDir, join(repoRoot, "workspace"));
    assert.equal(paths.generatedConfigDir, join(repoRoot, "config"));
    assert.equal(paths.internalDir, join(repoRoot, ".internal"));
    assert.equal(paths.usingLegacy, true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("resolveUserPaths uses .rolester for new repos and creates no directories by resolving", () => {
  const repoRoot = tempRepo();
  try {
    mkdirSync(join(repoRoot, "workspace", "jobs"), { recursive: true });
    writeFileSync(join(repoRoot, "workspace", "jobs", ".gitkeep"), "");

    const paths = resolveUserPaths({ repoRoot });
    assert.equal(paths.candidateDir, join(repoRoot, ".rolester", "candidate"));
    assert.equal(paths.workspaceDir, join(repoRoot, ".rolester", "workspace"));
    assert.equal(paths.generatedConfigDir, join(repoRoot, ".rolester", "config"));
    assert.equal(paths.internalDir, join(repoRoot, ".rolester", "internal"));
    assert.equal(paths.usingLegacy, false);
    assert.equal(existsSync(join(repoRoot, ".rolester")), false);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("userPath maps known private path prefixes and leaves product paths in repo", () => {
  const repoRoot = tempRepo();
  try {
    const ctx = { repoRoot };
    assert.equal(
      userPath(ctx, "candidate/evidence.yml"),
      join(repoRoot, ".rolester", "candidate", "evidence.yml")
    );
    assert.equal(
      userPath(ctx, "workspace/jobs/acme.md"),
      join(repoRoot, ".rolester", "workspace", "jobs", "acme.md")
    );
    assert.equal(
      userPath(ctx, "config/search-sources.yml"),
      join(repoRoot, ".rolester", "config", "search-sources.yml")
    );
    assert.equal(
      userPath(ctx, ".internal/tracker-dev.pid"),
      join(repoRoot, ".rolester", "internal", "tracker-dev.pid")
    );
    assert.equal(
      userPath(ctx, "templates/profile.example.yml"),
      join(repoRoot, "templates", "profile.example.yml")
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
