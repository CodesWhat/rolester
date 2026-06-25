const SUPPORTED_EXTENSIONS = new Set([".md", ".txt"]);

const VERB_CANDIDATES = [
  "built",
  "ran",
  "shipped",
  "led",
  "owned",
  "created",
  "designed",
  "implemented",
  "launched",
  "fixed",
  "cut",
  "reduced",
  "improved",
  "automated",
  "integrated",
];

const CLICHE_SIGNALS = [
  "passionate about",
  "leveraged",
  "spearheaded",
  "proven track record",
  "results-oriented",
  "cutting-edge",
  "innovative",
  "synergy",
  "robust",
  "seamless",
];

export function discoverWritingSamples(files) {
  return files
    .filter((file) => {
      const normalized = file.replace(/\\/g, "/");
      const name = normalized.split("/").pop()?.toLowerCase();
      if (!name || name === "readme.md") return false;
      return SUPPORTED_EXTENSIONS.has(extensionOf(name));
    })
    .sort();
}

export function analyzeWritingSamples(samples) {
  const sourceFiles = samples.map((sample) => sample.path);
  const combined = samples.map((sample) => sample.text || "").join("\n\n");
  const words = combined.match(/\b[\w'-]+\b/g) || [];
  const sentences = combined
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const paragraphs = combined
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const averageSentenceWords = sentences.length
    ? Math.round((words.length / sentences.length) * 10) / 10
    : 0;
  const averageParagraphWords = paragraphs.length ? words.length / paragraphs.length : 0;
  const lower = combined.toLowerCase();

  return {
    sampleCount: samples.length,
    totalWords: words.length,
    averageSentenceWords,
    paragraphShape: paragraphShape(averageParagraphWords),
    firstPerson: /\b(i|i'm|i've|my|mine)\b/i.test(combined) ? "present" : "absent",
    semicolons: combined.includes(";") ? "present" : "absent",
    emDashes: /[—–]/.test(combined) ? "present" : "absent",
    ellipsis: combined.includes("...") || combined.includes("…") ? "present" : "absent",
    punctuation: punctuationSummary(combined),
    preferredVerbs: preferredVerbs(lower),
    avoidSignals: CLICHE_SIGNALS.filter((phrase) => lower.includes(phrase)),
    sourceFiles,
  };
}

export function renderWritingStyleProfile({ date, analysis }) {
  const preferred = analysis.preferredVerbs.length
    ? analysis.preferredVerbs.join(", ")
    : "not enough sample signal";
  const avoid = analysis.avoidSignals.length
    ? analysis.avoidSignals.join(", ")
    : "corporate cliches; unsupported claims; breathless hype";

  return `# Writing Style Profile

_Generated ${date} from workspace/writing-samples/. Re-run \`npm run calibrate:style\` after adding new samples._

Read this before drafting cover letters, essays, outreach, or application answers. This profile governs style only; factual claims still come from the candidate's source resume, the JD, and the honesty boundaries.

## Measured Signals

- Samples: ${analysis.sampleCount}
- Source files: ${analysis.sourceFiles.join(", ") || "none"}
- Total words: ${analysis.totalWords}
- Average sentence length: ${analysis.averageSentenceWords} words
- Paragraph shape: ${analysis.paragraphShape}
- First person: ${analysis.firstPerson}
- Punctuation: ${analysis.punctuation}
- Preferred verbs: ${preferred}
- Avoid: ${avoid}

## Agent Instructions

- Match the candidate's direct, plain, first-person style when the destination is a cover letter, essay, outreach note, or application answer.
- Lead with concrete proof: what they built, what changed, and why it maps to the role.
- Use short paragraphs and clean sentences unless a form explicitly asks for a longer narrative.
- Preserve the repo's voice rule: human, confident, no corporate-speak, no fake humility, no hype.
- Do not import facts from writing samples. Style only.
- If this file has weak sample signal, fall back to \`README.md\` Voice and the honesty boundaries.
`;
}

function extensionOf(file) {
  const dot = file.lastIndexOf(".");
  return dot === -1 ? "" : file.slice(dot);
}

function paragraphShape(averageParagraphWords) {
  if (averageParagraphWords === 0) return "no samples";
  if (averageParagraphWords < 45) return "short";
  if (averageParagraphWords < 90) return "medium";
  return "long";
}

function punctuationSummary(text) {
  const parts = [];
  parts.push(`semicolons ${text.includes(";") ? "present" : "absent"}`);
  parts.push(`em dashes ${/[—–]/.test(text) ? "present" : "absent"}`);
  parts.push(`ellipses ${text.includes("...") || text.includes("…") ? "present" : "absent"}`);
  return parts.join("; ");
}

function preferredVerbs(lowerText) {
  const counts = VERB_CANDIDATES.map((verb) => {
    const re = new RegExp(`\\b${verb}\\b`, "g");
    return [verb, (lowerText.match(re) || []).length];
  })
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([verb]) => verb);
  return counts;
}
