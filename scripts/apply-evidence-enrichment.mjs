// Merge the workflow's enriched evidence (/tmp/evidence-enrichment.json) onto the
// current candidate/evidence.yml — by claim id, preserving claim text and
// forbidden_wording — then write back through the schema-validated, atomic
// writeEvidence(). Run: node scripts/apply-evidence-enrichment.mjs
import { readFileSync } from "node:fs";
import {
  loadEvidence,
  validateClaims,
  writeEvidence,
} from "../src/core/profile/evidence-writer.mjs";

const root = process.cwd();
const enriched = JSON.parse(readFileSync("/tmp/evidence-enrichment.json", "utf8")).claims || [];
const schema = JSON.parse(readFileSync("config/evidence.schema.json", "utf8"));
const { claims: current } = loadEvidence({ root });

const byId = new Map(enriched.map((e) => [String(e.id), e]));
let touched = 0;
const merged = current.map((c) => {
  const e = byId.get(String(c.id));
  if (!e) return c;
  touched++;
  return {
    ...c, // keep id, claim, forbidden_wording, links
    evidence: e.evidence && String(e.evidence).trim() ? e.evidence : c.evidence,
    metrics: Array.isArray(e.metrics) ? e.metrics : c.metrics || [],
    role_signals: Array.isArray(e.role_signals) ? e.role_signals : c.role_signals || [],
    allowed_wording: Array.isArray(e.allowed_wording) ? e.allowed_wording : c.allowed_wording || [],
  };
});

const v = validateClaims(merged);
if (!v.ok) {
  console.error("VALIDATION FAILED — not writing:");
  for (const err of v.errors) console.error(`  - [${err.id ?? "?"}] ${err.message}`);
  process.exit(1);
}

const res = writeEvidence({ claims: merged, root, schema });
if (!res || res.ok === false) {
  console.error("WRITE FAILED:", res?.error ? res.error : JSON.stringify(res));
  process.exit(1);
}

const tagged = merged.filter((c) => c.role_signals?.length).length;
const metr = merged.filter((c) => c.metrics?.length).length;
const word = merged.filter((c) => c.allowed_wording?.length).length;
console.log(
  `OK — merged enrichment onto ${touched}/${current.length} claims, wrote ${merged.length}.`
);
console.log(
  `role_signals: ${tagged}/${merged.length} · metrics: ${metr}/${merged.length} · allowed_wording: ${word}/${merged.length}`
);
