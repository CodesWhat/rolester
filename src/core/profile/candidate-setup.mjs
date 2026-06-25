// candidate-setup.mjs — creates and validates the candidate user-layer files.
// Zero runtime dependencies; uses only node:fs, node:path, node:url plus
// the two foundation modules below.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { displayPath, userPath } from "../paths/workspace.mjs";
import { validate } from "./schema-validator.mjs";
import { parseYaml } from "./yaml.mjs";

// ---------------------------------------------------------------------------
// Repo-root default (this file lives at src/core/profile/)
// ---------------------------------------------------------------------------

const DEFAULT_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

// ---------------------------------------------------------------------------
// CANDIDATE_FILES — the mapping table
// ---------------------------------------------------------------------------

export const CANDIDATE_FILES = [
  {
    name: "profile",
    candidatePath: "candidate/profile.yml",
    templatePath: "templates/profile.example.yml",
    schemaPath: "config/profile.schema.json",
  },
  {
    name: "targeting",
    candidatePath: "candidate/targeting.yml",
    templatePath: "templates/targeting.example.yml",
    schemaPath: "config/targeting.schema.json",
  },
  {
    name: "evidence",
    candidatePath: "candidate/evidence.yml",
    templatePath: "templates/evidence.example.yml",
    schemaPath: "config/evidence.schema.json",
  },
  {
    name: "honesty",
    candidatePath: "candidate/honesty.yml",
    templatePath: "templates/honesty.example.yml",
    schemaPath: "config/honesty.schema.json",
  },
  {
    name: "form-defaults",
    candidatePath: "candidate/form-defaults.yml",
    templatePath: "templates/form-defaults.example.yml",
    schemaPath: "config/form-defaults.schema.json",
  },
];

// Optional schema-validated config. New scaffolds get these files, but existing
// workspaces do not fail loadCandidate/doctor if they are absent; the owning
// helper supplies defaults.
export const OPTIONAL_CANDIDATE_FILES = [
  {
    name: "modes",
    candidatePath: "candidate/modes.yml",
    templatePath: "templates/modes.example.yml",
    schemaPath: "config/modes.schema.json",
  },
];

// Freeform candidate files scaffolded alongside the schema-validated config above
// but NOT YAML/schema-validated by loadCandidate. SOURCE_RESUME.md is the source
// résumé seed that tailor-application falls back to when no prior tailored file
// exists (tailor-application STEP 4).
export const COPY_ONLY_CANDIDATE_FILES = [
  {
    name: "source-resume",
    candidatePath: "candidate/SOURCE_RESUME.md",
    templatePath: "templates/SOURCE_RESUME.md",
  },
];

// ---------------------------------------------------------------------------
// ensureCandidateFiles
// ---------------------------------------------------------------------------

/**
 * Ensure the candidate/ directory exists and copy each template to its
 * candidate path ONLY IF the candidate file does not already exist.
 *
 * @param {{ root?: string }} [options]
 * @returns {{ created: string[], existing: string[] }}
 *   Arrays of candidate paths relative to root.
 */
export function ensureCandidateFiles({ root = DEFAULT_ROOT } = {}) {
  const candidateDir = userPath({ repoRoot: root }, "candidate");
  mkdirSync(candidateDir, { recursive: true });

  const created = [];
  const existing = [];

  for (const entry of [
    ...CANDIDATE_FILES,
    ...OPTIONAL_CANDIDATE_FILES,
    ...COPY_ONLY_CANDIDATE_FILES,
  ]) {
    const dest = userPath({ repoRoot: root }, entry.candidatePath);
    const display = displayPath({ repoRoot: root }, entry.candidatePath);
    if (existsSync(dest)) {
      existing.push(display);
    } else {
      const src = join(root, entry.templatePath);
      copyFileSync(src, dest);
      created.push(display);
    }
  }

  return { created, existing };
}

// ---------------------------------------------------------------------------
// loadCandidate
// ---------------------------------------------------------------------------

/**
 * Read and validate each candidate file against its JSON Schema.
 *
 * @param {{ root?: string }} [options]
 * @returns {{ ok: boolean, files: Array<{ name, path, exists, valid, errors }> }}
 */
export function loadCandidate({ root = DEFAULT_ROOT } = {}) {
  const files = [];

  for (const entry of CANDIDATE_FILES) {
    const candidatePath = userPath({ repoRoot: root }, entry.candidatePath);
    const schemaPath = join(root, entry.schemaPath);
    const display = displayPath({ repoRoot: root }, entry.candidatePath);

    if (!existsSync(candidatePath)) {
      files.push({
        name: entry.name,
        path: display,
        exists: false,
        valid: false,
        errors: [{ path: "", message: "file missing" }],
      });
      continue;
    }

    const text = readFileSync(candidatePath, "utf8");
    const data = parseYaml(text);
    const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
    const { valid, errors } = validate(data, schema);

    files.push({
      name: entry.name,
      path: display,
      exists: true,
      valid,
      errors,
    });
  }

  const ok = files.every((f) => f.exists && f.valid);
  return { ok, files };
}

// ---------------------------------------------------------------------------
// lintPlaceholders
// ---------------------------------------------------------------------------

// Patterns to detect leftover placeholder strings (case-insensitive).
const PLACEHOLDER_PATTERNS = [
  /\bTODO\b/i,
  /\bTBD\b/i,
  /\bFIXME\b/i,
  /lorem ipsum/i,
  /\bplaceholder\b/i,
  /\[company\]/i,
  /\[role\]/i,
  /\[candidate\]/i,
  /\[insert[^\]]*\]/i,
  /\{company\}/i,
  /\{role\}/i,
  /\{candidate\}/i,
  /<insert[^>]*>/i,
  /<company>/i,
  /<role>/i,
  /<candidate>/i,
  /Jane Candidate/i,
  /jane@example\.com/i,
  /\+1-555-0100/i,
  /janecandidate/i,
];

/**
 * Scan each existing candidate file for leftover placeholder strings.
 *
 * @param {{ root?: string }} [options]
 * @returns {{ clean: boolean, findings: Array<{ file, line, text }> }}
 *   file is relative to root; line is 1-based; text is the trimmed line.
 */
export function lintPlaceholders({ root = DEFAULT_ROOT } = {}) {
  const findings = [];

  for (const entry of CANDIDATE_FILES) {
    const fullPath = userPath({ repoRoot: root }, entry.candidatePath);
    if (!existsSync(fullPath)) continue;
    const display = displayPath({ repoRoot: root }, entry.candidatePath);

    const text = readFileSync(fullPath, "utf8");
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed === "") continue;
      for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(lines[i])) {
          findings.push({
            file: display,
            line: i + 1,
            text: trimmed,
          });
          break; // one finding per line
        }
      }
    }
  }

  return { clean: findings.length === 0, findings };
}
