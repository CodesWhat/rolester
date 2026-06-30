#!/usr/bin/env node
// One-time migration for the Focus-card "Open dossier" full-page preview.
//
// interview-prep writes prep packets to workspace/interview-prep/<slug>.md and,
// going forward, persists a renderable copy onto the tracker row at
// `app.artifacts.interviewDossier`. This backfills that artifact for existing rows
// by matching each interview-stage application to its prep doc on disk, so the
// dashboard can preview it without the skill re-running.
//
// The dossier body is candidate-private — it lives only in workspace/tracker.json
// (gitignored). It is never committed or sent outbound.
//
// Dry-run by default. Pass --write to persist.
//
//   node scripts/backfill-interview-dossier.mjs           # preview matches
//   node scripts/backfill-interview-dossier.mjs --write   # apply

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TRACKER = join(ROOT, "workspace", "tracker.json");
const PREP_DIR = join(ROOT, "workspace", "interview-prep");
const WRITE = process.argv.includes("--write");

const slugify = (value) =>
  String(value == null ? "" : value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const INTERVIEW_RE = /\b(interview|onsite|on-site|panel|loop|technical|hiring|hm|final|screen)\b/i;
const isInterviewLike = (app) => {
  const text = [app.status, app.role, ...(app.conversations || []).map((c) => c?.kind)]
    .filter(Boolean)
    .join(" ");
  return INTERVIEW_RE.test(text);
};

// Index prep docs: { slug, date, path, file }. Skip README/debrief — the debrief is
// a post-mortem, not the forward-looking dossier; prefer a non-debrief doc when one
// exists for the same slug.
const docs = readdirSync(PREP_DIR)
  .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
  .map((file) => {
    const base = file.replace(/\.md$/, "");
    const dateMatch = base.match(/(\d{4}-\d{2}-\d{2})/);
    const debrief = /-debrief$/.test(base);
    const slug = base.replace(/-debrief$/, "").replace(/-\d{4}-\d{2}-\d{2}$/, "");
    return { file, slug, date: dateMatch ? dateMatch[1] : "", debrief };
  });

const firstHeading = (markdown) => {
  const line = String(markdown)
    .split("\n")
    .find((l) => /^#\s+/.test(l));
  if (!line) return "";
  return line
    .replace(/^#\s+/, "")
    .replace(/\s+[–-]\s+Interview (Debrief|Prep|Packet).*$/i, "")
    .replace(/\s+[–-]\s+\d{4}-\d{2}-\d{2}.*$/, "")
    .trim();
};

const bestDoc = (appSlug) => {
  let best = null;
  for (const doc of docs) {
    if (!appSlug.startsWith(doc.slug) && !doc.slug.startsWith(appSlug)) continue;
    const overlap = Math.min(appSlug.length, doc.slug.length);
    // Prefer non-debrief, then longer slug overlap, then newer date.
    const score =
      (doc.debrief ? 0 : 100000) +
      overlap * 100 +
      Number(doc.date.replace(/-/g, "").slice(2) || 0) / 1e6;
    if (!best || score > best.score) best = { ...doc, score, overlap };
  }
  return best && best.overlap >= 6 ? best : null;
};

const tracker = JSON.parse(readFileSync(TRACKER, "utf8"));
const apps = Array.isArray(tracker.applications) ? tracker.applications : [];

let updated = 0;
const preview = [];
for (const app of apps) {
  if (app.artifacts?.interviewDossier?.markdown) continue;
  if (!isInterviewLike(app)) continue;
  const appSlug = slugify(`${app.company} ${app.role}`);
  const doc = bestDoc(appSlug);
  if (!doc) continue;
  const markdown = readFileSync(join(PREP_DIR, doc.file), "utf8");
  const round =
    [...(app.conversations || [])].reverse().find((c) => INTERVIEW_RE.test(c?.kind || ""))?.kind ||
    "";
  app.artifacts = app.artifacts || {};
  app.artifacts.interviewDossier = {
    title: firstHeading(markdown) || `${app.company} — ${app.role}`,
    round,
    path: `workspace/interview-prep/${doc.file}`,
    generatedAt: doc.date || "",
    markdown,
  };
  updated += 1;
  preview.push(`  ${app.company}: ${doc.file} (${markdown.length} chars)`);
}

console.log(`${updated} row(s) ${WRITE ? "updated" : "would be updated"} (of ${apps.length}).`);
if (preview.length) console.log(preview.join("\n"));

if (WRITE && updated) {
  writeFileSync(TRACKER, `${JSON.stringify(tracker, null, 2)}\n`);
  console.log(`\nWrote ${TRACKER}. Run: npm run tracker`);
} else if (!WRITE) {
  console.log("\n(dry run — pass --write to persist)");
}
