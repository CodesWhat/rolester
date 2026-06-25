// comp-guard.mjs — the shared private-comp-leak backstop.
//
// `current_base` (and the everyday phrasings that disclose it) is a private gate
// input that must never reach any persisted-and-potentially-shared text
// (AGENTS.md → Privacy invariant). Several stores are private yet feed outbound
// surfaces — learning files feed tailoring; research artifacts feed interview-prep
// and the comp gate, and a comp-benchmark file sits right next to the candidate's
// own number. So every such store refuses, at write time, any text that names a
// current-comp input by field or by common phrasing.
//
// This guard is the single source of truth for that rule, shared by
// `learnings.mjs` and `research-store.mjs` so the two can never drift.

export const COMP_LEAK_PATTERNS = [
  /current[_\s-]?base/i,
  /current\s+salary/i,
  /currently\s+(?:earn|earning|make|making|paid|pull(?:ing)?)\b/i,
];

// Returns the first leak match `{ match, index, pattern }`, or null when clean.
// The broad set is right for stores that should NOT discuss compensation at all
// (e.g. learning files): any current-comp phrasing there is suspect.
export function findCompLeak(text) {
  for (const re of COMP_LEAK_PATTERNS) {
    const m = re.exec(text);
    if (m) return { match: m[0], index: m.index, pattern: re.source };
  }
  return null;
}

// The unambiguous private field token. Unlike the broad phrasings above, the
// literal `current_base` key never legitimately appears in research/market prose,
// where "current base" can mean an HQ ("their current base of operations") and
// "current salary" can be a source title — so research/comp-benchmark artifacts,
// which DO discuss compensation, guard on this token alone. The looser candidate-
// disclosure phrasings there are governed by skill prose + a visible Privacy Note.
export const CURRENT_BASE_TOKEN = /current_base/i;

// Returns `{ match, index, pattern }` if the literal current_base field token
// appears (the realistic leak vector: a template interpolating the profile field),
// or null when clean.
export function findCurrentBaseToken(text) {
  const m = CURRENT_BASE_TOKEN.exec(String(text || ""));
  return m ? { match: m[0], index: m.index, pattern: CURRENT_BASE_TOKEN.source } : null;
}
