#!/usr/bin/env node
// Rolester launcher — the `npx rolester <command>` entrypoint.
//
//   rolester start [ai]  One command: scaffold + skills + live dashboard + agent
//   rolester init        Scaffold candidate/ + workspace dirs, print next steps
//   rolester doctor      Environment health check
//   rolester ingest      Guided candidate setup
//   rolester searches    Build/curate the search-source config
//   rolester evaluate    Run the body-read gate on a saved job
//   rolester tracker     One-shot tracker snapshot (use `start` for the live dev server)
//   rolester restore     Recover workspace/tracker.json from a rolling snapshot
//   rolester export      Render a tailored artifact / packet to PDF or DOCX
//   rolester help        Show this list
//
// Each subcommand delegates to the matching src/cli script, forwarding args.

// Node version guard — must run before any ESM import that requires >=18 features.
{
  const major = parseInt(process.versions.node.split(".")[0], 10);
  if (major < 18) {
    process.stderr.write(
      `rolester requires Node.js >= 18 (you have ${process.versions.node}) — please upgrade.\n`
    );
    process.exit(1);
  }
}

import { spawn, spawnSync } from "node:child_process";
import {
  accessSync,
  closeSync,
  constants,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  writeFileSync,
} from "node:fs";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import { displayPath, resolveUserPaths, userPath } from "../src/core/paths/workspace.mjs";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const pathCtx = { repoRoot: root };
const [command, ...rest] = process.argv.slice(2);

const CLIS = {
  doctor: "src/cli/doctor.mjs",
  ingest: "src/cli/ingest.mjs",
  searches: "src/cli/searches.mjs",
  evaluate: "src/cli/evaluate.mjs",
  tracker: "src/cli/tracker.mjs",
  automation: "src/cli/automation.mjs",
  export: "src/cli/export.mjs",
  restore: "src/cli/restore.mjs",
};

const WORKSPACE_DIRS = [
  "workspace/jobs",
  "workspace/tailored",
  "workspace/intake",
  "workspace/scan-results",
  "workspace/comms",
  "workspace/interview-prep",
  "workspace/writing-samples",
  "workspace/research",
  "workspace/network-leads",
];

// The single starter message that hands a freshly-scaffolded workspace to the
// agent. It reads AGENTS.md, verifies skills, and runs ingest-profile from here.
const STARTER_PROMPT = "familiarize yourself and let's get started";

// Agent CLIs we know how to launch, in preference order. Each is started with
// the starter prompt as a single positional argument (the seed-a-session form
// both Claude Code and Codex accept). Declared above the command dispatch so
// runStart can read them on its synchronous (no-await) --no-dashboard path.
const AGENT_CANDIDATES = [
  { name: "Claude Code", bin: "claude" },
  { name: "Codex", bin: "codex" },
];

if (!command || command === "help" || command === "--help" || command === "-h") {
  printHelp();
  process.exit(command ? 0 : 1);
}

if (command === "init") {
  process.exit(runInit(rest));
}

if (command === "start") {
  runStart(rest).then(
    (code) => process.exit(code),
    (err) => {
      console.error(err?.message ? err.message : String(err));
      process.exit(1);
    }
  );
} else {
  const cli = CLIS[command];
  if (!cli) {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
  }
  process.exit(run(join(root, cli), rest));
}

// ---------------------------------------------------------------------------

function runInit(extra) {
  for (const dir of WORKSPACE_DIRS) {
    const abs = userPath(pathCtx, dir);
    if (!existsSync(abs)) mkdirSync(abs, { recursive: true });
  }
  // ingest (default mode) copies candidate templates and prints status + next steps.
  const code = run(join(root, CLIS.ingest), extra);
  if (code === 0) {
    console.log("");
    console.log(
      "Workspace ready. Next: fill candidate/*.yml, then `rolester searches --from-targeting`."
    );
  }
  return code;
}

// Parse `start` args. The first bare word is the agent to launch
// (`rolester start claude`); `--agent <name>` is an equivalent alias. Both
// accept any CLI on your PATH, not just claude/codex.
function parseStartArgs(extra) {
  const out = { agent: null, port: null, noAgent: false, noDashboard: false };
  for (let i = 0; i < extra.length; i++) {
    const a = extra[i];
    if (a === "--no-agent") out.noAgent = true;
    else if (a === "--no-dashboard") out.noDashboard = true;
    else if (a === "--agent") out.agent = extra[++i] || out.agent;
    else if (a === "--port") out.port = extra[++i] || out.port;
    else if (a.startsWith("-")) {
      /* unknown flag — ignore */
    } else if (!out.agent) out.agent = a; // first bare positional = agent name
  }
  return out;
}

// `rolester start [agent]` — the one-command front door:
//   scaffold workspace → install skills → boot the live dashboard (:7777) →
//   hand off to the named agent (or first found on PATH) with the starter prompt.
// Usage: rolester start [claude|codex|<any-cli>]
//        [--agent <name>] [--no-agent] [--no-dashboard] [--port <n>]
async function runStart(extra) {
  const opts = parseStartArgs(extra);
  const wantDashboard = !opts.noDashboard;
  const wantAgent = !opts.noAgent;
  const forcedAgent = opts.agent;

  // 1) Scaffold workspace dirs (idempotent).
  for (const dir of WORKSPACE_DIRS) {
    const abs = userPath(pathCtx, dir);
    if (!existsSync(abs)) mkdirSync(abs, { recursive: true });
  }

  // 2) Install skills so Claude Code sees /apply-job etc. Non-fatal: agents that
  //    read AGENTS.md natively (Codex) work without the shim.
  console.log("• Installing skills…");
  const skillCode = run(join(root, "scripts/install-skills.mjs"), ["--soft"]);
  if (skillCode !== 0) {
    console.log("  (skill shim reported an issue — AGENTS.md-native agents still work)");
  }

  // 3) Seed a tracker so the dashboard can boot. Never clobber real data.
  const trackerJson = userPath(pathCtx, "workspace/tracker.json");
  if (!existsSync(trackerJson)) {
    try {
      mkdirSync(userPath(pathCtx, "workspace"), { recursive: true });
      copyFileSync(join(root, "templates/tracker.json"), trackerJson);
      console.log(
        `• Seeded ${displayPath(pathCtx, "workspace/tracker.json")} (demo data — replaced as you add real roles)`
      );
    } catch {
      /* non-fatal: the dashboard simply won't boot until a tracker exists */
    }
  }

  // 4) Boot the live, hot-reloading dashboard as a durable local service.
  let dash = null;
  if (wantDashboard && existsSync(trackerJson)) {
    dash = await startDashboard(opts.port);
  }

  // 5) Hand off to the agent.
  let exitCode = 0;
  if (wantAgent) {
    const agent = forcedAgent ? resolveForcedAgent(forcedAgent) : findAgent();
    if (agent) {
      console.log(`• Launching ${agent.name}…\n`);
      const res = spawnSync(agent.bin, [STARTER_PROMPT], { stdio: "inherit", cwd: root });
      if (res.error) {
        console.error(`Could not launch ${agent.name}: ${res.error.message}`);
        exitCode = 1;
      } else {
        exitCode = res.status == null ? 0 : res.status;
      }
    } else {
      console.log("");
      if (forcedAgent) {
        console.log(`Couldn't find "${forcedAgent}" on your PATH.`);
      } else {
        console.log("No agent CLI found on PATH (looked for: claude, codex).");
      }
      console.log("Open your agent in this folder and say:\n");
      console.log(`    ${STARTER_PROMPT}\n`);
      if (dash) {
        console.log(
          `The dashboard is running separately; stop it with the PID in ${displayPath(pathCtx, ".internal/tracker-dev.pid")}.`
        );
      }
    }
  } else if (dash) {
    console.log(
      `Dashboard live as a separate process; stop it with the PID in ${displayPath(pathCtx, ".internal/tracker-dev.pid")}.`
    );
  }
  return exitCode;
}

// Spawn the tracker dev server as a detached local process. The PID/log live in
// .internal/ so a future agent can tell whether Rolester already has a server.
async function startDashboard(port) {
  const portCandidate = port ?? process.env.ROLESTER_DEV_PORT ?? 7777;
  const parsedPort = Number(portCandidate);
  const resolvedPort = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 7777;
  const url = `http://localhost:${resolvedPort}`;

  if (await urlResponds(url)) {
    console.log(`• Dashboard already live → ${url}`);
    return { url, existing: true };
  }

  const internalDir = resolveUserPaths(pathCtx).internalDir;
  mkdirSync(internalDir, { recursive: true });
  const pidPath = join(internalDir, "tracker-dev.pid");
  const logPath = join(internalDir, "tracker-dev.log");
  const args = [join(root, "src/cli/tracker-dev.mjs")];
  if (port) args.push("--port", String(port));

  let logFd;
  try {
    logFd = openSync(logPath, "a");
    const child = spawn(process.execPath, args, {
      cwd: root,
      detached: true,
      stdio: ["ignore", logFd, logFd],
    });
    closeSync(logFd);
    logFd = null;
    child.unref();
    writeFileSync(pidPath, `${child.pid}\n`);

    const ready = await waitForUrl(url, 8000);
    const relLog = displayPath(pathCtx, ".internal/tracker-dev.log");
    if (ready) {
      console.log(`• Dashboard live → ${url} (pid ${child.pid}, log ${relLog})`);
    } else {
      console.log(`• Dashboard starting → ${url} (pid ${child.pid}, log ${relLog})`);
    }
    return { url, pid: child.pid, logPath };
  } catch {
    if (logFd != null) {
      try {
        closeSync(logFd);
      } catch {
        /* ignore */
      }
    }
    console.log("• Dashboard could not start — continuing without it");
    return null;
  }
}

async function waitForUrl(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await urlResponds(url)) return true;
    await delay(150);
  }
  return false;
}

async function urlResponds(url, timeoutMs = 500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  timer.unref?.();
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findAgent() {
  for (const cand of AGENT_CANDIDATES) {
    const bin = findOnPath(cand.bin);
    if (bin) return { name: cand.name, bin };
  }
  return null;
}

function resolveForcedAgent(name) {
  const known = AGENT_CANDIDATES.find(
    (c) => c.bin === name || c.name.toLowerCase() === String(name).toLowerCase()
  );
  const bin = findOnPath(name) || (known && findOnPath(known.bin));
  if (!bin) return null;
  return { name: known?.name || name, bin };
}

// Resolve an executable on PATH without running it (no version probes).
function findOnPath(name) {
  if (!name) return null;
  const isWin = process.platform === "win32";
  const exts = isWin ? (process.env.PATHEXT || ".EXE;.CMD;.BAT").split(";") : [""];
  for (const dir of (process.env.PATH || "").split(delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const full = join(dir, name + ext);
      try {
        accessSync(full, isWin ? constants.F_OK : constants.X_OK);
        return full;
      } catch {
        /* keep looking */
      }
    }
  }
  return null;
}

function run(scriptPath, extra) {
  const res = spawnSync(process.execPath, [scriptPath, ...extra], { stdio: "inherit" });
  if (res.error) {
    console.error(res.error.message);
    return 1;
  }
  return res.status == null ? 1 : res.status;
}

function printHelp() {
  console.log(`rolester — agentic job-search workspace

Usage: rolester <command> [options]

Commands:
  start [ai]  Scaffold + install skills + live dashboard + launch your agent
  init        Scaffold candidate/ + workspace dirs, print next steps
  doctor      Environment health check
  ingest      Guided candidate setup (profile, targeting, evidence, ...)
  searches    Build and curate the search-source config
  evaluate    Run the body-read gate on a saved job (GATE/FIT/COMP/ACTION)
  tracker     One-shot tracker snapshot / summary / follow-ups (for the live hot-reloading dev server, use 'rolester start')
  restore     Recover workspace/tracker.json from a rolling snapshot (list / restore by index or name)
  automation  Show/toggle opt-in browser-automation config (defaults OFF)
  export      Render a tailored artifact / packet to PDF or DOCX
  help        Show this list

start [ai]:
  the first bare word picks the agent to launch — claude, codex, or any CLI on
  your PATH (e.g. rolester start claude). Omit it to use the first found.
  --agent <name>      same as the positional, alternate spelling
  --no-agent          scaffold + dashboard only, don't launch an agent
  --no-dashboard      skip the live dashboard
  --port <n>          dashboard port (default 7777)

Run any command with --help for its own options.`);
}
