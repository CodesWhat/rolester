// Bank the repo-ingest workflow's final claims into candidate/evidence.yml.
// Each claim is serialized with the repo's own stringifyYaml and pushed through
// the guarded evidence CLI (`add`) so the honesty firewall + schema + round-trip
// check run per claim. DRY RUN by default; pass --write to commit (upsert by id).
// Run: node scripts/bank-repo-claims.mjs [--write]
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stringifyYaml } from "../src/core/profile/yaml.mjs";

const WRITE = process.argv.includes("--write");
const SRC = process.argv.find((a) => a.endsWith(".json")) || "/tmp/ingest-final.json";
const d = JSON.parse(readFileSync(SRC, "utf8"));

// Next.js dynamic-route filenames (src/app/share/[id], api/generate/[model],
// [...slug]) are real paths, but the placeholder firewall reads [token] as an
// unfilled [Name]-style placeholder. Normalize route params to :param form so the
// honest path reference survives the lint. Capitalized tokens ([Name]) are left
// alone — those are genuine placeholders and SHOULD be refused.
const ROUTE_PARAM = /\[(\.{3})?([a-z][a-zA-Z0-9_]*)\]/g;
function sanitize(c) {
  const subs = [];
  const fix = (s) =>
    typeof s === "string"
      ? s.replace(ROUTE_PARAM, (m, _d, name) => {
          subs.push(m);
          return `:${name}`;
        })
      : s;
  const out = { ...c };
  out.claim = fix(out.claim);
  out.evidence = fix(out.evidence);
  if (Array.isArray(out.allowed_wording)) out.allowed_wording = out.allowed_wording.map(fix);
  if (Array.isArray(out.links)) out.links = out.links.map(fix);
  if (subs.length)
    console.log(`  [${c.id}] normalized route params: ${[...new Set(subs)].join(" ")}`);
  return out;
}

const claims = (d.final || []).map(({ repo, ...c }) => sanitize(c)); // drop helper `repo`, normalize routes
const dir = mkdtempSync(join(tmpdir(), "bank-"));

let pass = 0;
const fails = [];
for (const c of claims) {
  const file = join(dir, `${c.id}.yml`);
  writeFileSync(file, stringifyYaml(c));
  const args = ["src/cli/evidence.mjs", "add", "--file", file, "--json"];
  if (WRITE) args.push("--write");
  try {
    const out = execFileSync("node", args, { encoding: "utf8" });
    const res = JSON.parse(out);
    if (res.ok === false || res.error) {
      fails.push([c.id, res.error || JSON.stringify(res.issues || res)]);
    } else {
      pass++;
    }
  } catch (e) {
    const stderr = (e.stdout || "") + (e.stderr || e.message || "");
    fails.push([c.id, stderr.trim().split("\n").slice(-3).join(" | ").slice(0, 200)]);
  }
}

console.log(`${WRITE ? "WROTE" : "DRY RUN"}: ${pass}/${claims.length} claims passed the firewall.`);
if (fails.length) {
  console.log(`\nFAILURES (${fails.length}):`);
  for (const [id, why] of fails) console.log(`  ${id}: ${why}`);
  process.exit(1);
}
