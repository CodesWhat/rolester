import { atomicWriteFile } from "../profile/gate-writer.mjs";

// Canonical writer for workspace/tracker.json from a CLI process.
//
// Two jobs:
//   1. Stamp meta.lastUpdatedAt so the dashboard "last updated" pill reflects
//      the true last data-change time. The pill reads meta.lastUpdatedAt first
//      (see durableUpdatedAt in dashboard-data.js); without a stamp it falls
//      back to scatter-scanning per-row dates or "age since page load".
//   2. Write atomically (tmp file + rename) so a concurrent reader or a racing
//      writer can never observe a truncated file.
//
// Scope: CLI-process writes only (stories sync, strategy-review stamp, …).
// Skill-driven agent edits go through the Edit tool directly — there is no code
// path to intercept those by design (tracker mutations are skill behaviors, the
// CLI stays read/render-only). Those writes are bound by the prose "Tracker
// Write Contract" in AGENTS.md, which requires the same meta.lastUpdatedAt bump.
export function writeTrackerJson(trackerPath, data, options = {}) {
  const { stamp = true, at = null } = options;
  if (stamp && data && typeof data === "object" && !Array.isArray(data)) {
    const prev = data.meta || {};
    data.meta = {
      ...prev,
      lastUpdatedAt: at || new Date().toISOString(),
      version: (Number.isInteger(prev.version) ? prev.version : 0) + 1,
    };
  }
  atomicWriteFile(trackerPath, `${JSON.stringify(data, null, 2)}\n`);
}
