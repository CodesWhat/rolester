#!/usr/bin/env node
// Generates a rich demo pipeline (~36 famous fictional companies spread across
// the full funnel) so the tracker Sankey has enough volume to read like a real
// job search. Roster is curated for RECOGNISABLE, sourceable logos — Silicon
// Valley (HBO) + canon sci-fi megacorps. No Marvel/DC, no Harry Potter.
// Writes ONLY to workspace/tracker.json (the gitignored live file the dashboard
// renders); the committed templates/ seed + its test are untouched.
// Re-run any time: `node scripts/seed-demo.mjs`.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { displayPath, userPath } from "../src/core/paths/workspace.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const pathCtx = { repoRoot: ROOT };

const TODAY = new Date("2026-06-12T00:00:00Z");
const dateWeeksAgo = (w) => {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - Math.round(w * 7));
  return d.toISOString().slice(0, 10);
};

// Compensation bands keyed by seniority — keeps comp plausible per role.
const COMP = {
  principal: ["$250–290K", "~$390–470K"],
  staff: ["$215–255K", "~$320–380K"],
  research: ["$195–235K", "~$285–345K"],
  senior: ["$180–215K", "~$250–310K"],
  default: ["$155–190K", "~$200–260K"],
};
const compFor = (role) => {
  const r = role.toLowerCase();
  if (r.includes("principal")) return COMP.principal;
  if (r.includes("staff")) return COMP.staff;
  if (r.includes("research")) return COMP.research;
  if (r.includes("senior")) return COMP.senior;
  return COMP.default;
};

const LOCS = [
  ["Remote (US)", "remote"],
  ["Hybrid · SF", "hybrid"],
  ["Onsite · NYC", "onsite"],
  ["Remote (Global)", "remote"],
  ["Hybrid · Seattle", "hybrid"],
  ["Hybrid · Austin", "hybrid"],
  ["Remote (US)", "remote"],
  ["Onsite · Boston", "onsite"],
];

// [company, domain, role, channel, status, fitScore, weeksAgo, locIdx, note]
// Every company here has a verified, real, sourceable logo (Fandom/brand
// wikis, Wikimedia, official merch). Companies whose "logo" was only fan-made
// merch or never designed on-screen were dropped (Globex, Soylent, Initrode,
// Raviga, Wonka, Cogswell Cogs, Acme). Fit scores are all 60+: a good targeting
// tool surfaces good matches, so the demo pipeline reads as well-targeted.
const ROSTER = [
  // ── accepted ──
  [
    "E Corp",
    "e-corp.com",
    "Staff Software Engineer",
    "referral",
    "accepted",
    95,
    9,
    0,
    "Signed with E Corp — the one everyone calls Evil Corp. Irony noted.",
  ],
  // ── offers ──
  [
    "Aperture Science",
    "aperturescience.com",
    "Forward Deployed Engineer",
    "recruiter",
    "offer",
    92,
    4,
    0,
    "Offer in hand — Enrichment Center launch. The cake is a lie.",
  ],
  [
    "Hooli",
    "hooli.com",
    "Principal Engineer",
    "referral",
    "offer",
    90,
    5,
    1,
    "Offer from Hooli. Gavin Belson wants a signed, framed photo of himself.",
  ],
  // ── final / onsite ──
  [
    "Weyland-Yutani",
    "weylandyutani.com",
    "Staff Engineer, Spaceframe",
    "recruiter",
    "final round",
    88,
    3,
    3,
    "Final loop. 'Building Better Worlds.' Crew-expendability clause under review.",
  ],
  [
    "Cyberdyne Systems",
    "cyberdyne.com",
    "Staff ML Engineer",
    "board",
    "onsite",
    86,
    4,
    1,
    "Onsite done. Neural-net division. Definitely won't go self-aware.",
  ],
  [
    "Pied Piper",
    "piedpiper.com",
    "Senior Software Engineer",
    "referral",
    "final round",
    84,
    3,
    1,
    "Final round. Middle-out compression — allegedly real this time.",
  ],
  // ── interview ──
  [
    "Tyrell Corporation",
    "tyrellcorp.com",
    "Senior Platform Engineer",
    "recruiter",
    "2nd interview",
    82,
    5,
    2,
    "Second interview. More human than human.",
  ],
  [
    "Black Mesa",
    "blackmesa.com",
    "Research Engineer",
    "board",
    "interview loop",
    81,
    5,
    7,
    "Interview loop. Anomalous materials. Hard hats provided.",
  ],
  [
    "Massive Dynamic",
    "massivedynamic.com",
    "Staff Engineer",
    "referral",
    "panel interview",
    78,
    6,
    1,
    "Panel next week. The answer is 42; the questions are classified.",
  ],
  [
    "Abstergo Industries",
    "abstergo.com",
    "Senior Software Engineer",
    "board",
    "interview",
    76,
    4,
    2,
    "First interview. Animus team. Templar-funded, allegedly.",
  ],
  // ── screen ──
  [
    "Omni Consumer Products",
    "ocp.com",
    "Principal Engineer",
    "referral",
    "hiring manager screen",
    79,
    3,
    2,
    "HM screen. They also run the police department now.",
  ],
  [
    "Umbrella Corporation",
    "umbrellacorp.com",
    "Senior Infrastructure Engineer",
    "recruiter",
    "recruiter screen",
    74,
    2,
    3,
    "Recruiter screen. Biohazard-adjacent. Excellent dental.",
  ],
  [
    "Buy n Large",
    "buynlarge.com",
    "Staff Engineer",
    "board",
    "phone screen",
    68,
    4,
    0,
    "Phone screen. They run everything, including the evacuation.",
  ],
  [
    "Vault-Tec",
    "vault-tec.com",
    "Backend Engineer",
    "board",
    "phone screen",
    67,
    4,
    0,
    "Phone screen. Prepare for the future — underground.",
  ],
  [
    "Aviato",
    "aviato.com",
    "Senior Software Engineer",
    "referral",
    "recruiter screen",
    64,
    5,
    1,
    "Recruiter screen. The logo has a bird because Erlich flies.",
  ],
  // ── applied / awaiting ──
  [
    "Nakatomi Corporation",
    "nakatomi.com",
    "Platform Engineer",
    "referral",
    "applied",
    66,
    2,
    2,
    "Applied via a friend on the 30th floor.",
  ],
  [
    "Veridian Dynamics",
    "veridiandynamics.com",
    "Platform Engineer",
    "board",
    "applied",
    65,
    2,
    4,
    "Applied. 'Science. For a better everything.'",
  ],
  [
    "Dharma Initiative",
    "dharmainitiative.com",
    "Research Engineer",
    "board",
    "applied",
    64,
    2,
    3,
    "Applied. Must enter 4 8 15 16 23 42 every 108 minutes.",
  ],
  [
    "InGen",
    "ingen.com",
    "Senior Software Engineer",
    "board",
    "submitted",
    63,
    1,
    2,
    "Submitted. 'We spared no expense.'",
  ],
  [
    "BioSyn",
    "biosyn.com",
    "Backend Engineer",
    "board",
    "applied",
    62,
    1,
    7,
    "Applied. Amber-based genomics. Definitely no locusts.",
  ],
  [
    "Initech",
    "initech.com",
    "Software Engineer",
    "board",
    "applied",
    61,
    2,
    5,
    "Applied. TPS report cover sheet attached this time.",
  ],
  [
    "Bachmanity",
    "bachmanity.com",
    "Software Engineer",
    "referral",
    "applied",
    61,
    3,
    1,
    "Applied. Burned $20K on a party with a live tiger. Solid runway.",
  ],
  [
    "Encom",
    "encom.com",
    "Software Engineer",
    "board",
    "applied",
    60,
    1,
    0,
    "Applied. On the grid.",
  ],
  [
    "MomCorp",
    "momcorp.com",
    "Software Engineer",
    "board",
    "applied",
    60,
    1,
    5,
    "Applied. Mom's Friendly Robot Company. She's watching.",
  ],
  // ── rejected ──
  [
    "Spectre",
    "spectre.com",
    "Senior Software Engineer",
    "recruiter",
    "rejected",
    64,
    6,
    2,
    "Rejected. The org chart is suspiciously octopus-shaped.",
  ],
  [
    "Spacely Sprockets",
    "spacely.com",
    "Senior Engineer",
    "board",
    "rejected",
    63,
    7,
    5,
    "Rejected. Mr. Spacely fired me before the offer. Classic.",
  ],
  [
    "Zorg Industries",
    "zorgindustries.com",
    "Senior Engineer",
    "board",
    "rejected",
    62,
    6,
    2,
    "Rejected. Mr. Zorg was not impressed.",
  ],
  [
    "Cobra",
    "cobra.com",
    "Platform Engineer",
    "board",
    "rejected",
    60,
    9,
    2,
    "Rejected. The recruiter hissed. Literally.",
  ],
  // ── withdrawn ──
  [
    "Monsters Inc",
    "monstersinc.com",
    "Senior Engineer",
    "recruiter",
    "withdrawn",
    67,
    5,
    2,
    "Withdrew — full onsite, and the commute is through a closet.",
  ],
];

// Baked follow-up drafts for overdue applications — rendered by the bell panel.
// keyed by company name (unique in ROSTER).
const FOLLOWUP_DRAFTS = {
  "Massive Dynamic": {
    kind: "post-interview-nudge",
    dueAt: new Date(new Date(TODAY).setUTCDate(TODAY.getUTCDate() - 37)).toISOString(),
    generatedAt: new Date(new Date(TODAY).setUTCDate(TODAY.getUTCDate() - 2)).toISOString(),
    draft: {
      subject: "Following up — Staff Engineer panel at Massive Dynamic",
      body: `Hi,

I wanted to follow up after the panel interview for the Staff Engineer role. I've been looking forward to hearing about next steps — the conversation reinforced my interest in the platform infrastructure work your team is doing.

Please let me know if there's any additional information I can provide or if scheduling needs to shift.

Best,
Jane`,
    },
  },
  "Tyrell Corporation": {
    kind: "post-interview-nudge",
    dueAt: new Date(new Date(TODAY).setUTCDate(TODAY.getUTCDate() - 30)).toISOString(),
    generatedAt: new Date(new Date(TODAY).setUTCDate(TODAY.getUTCDate() - 2)).toISOString(),
    draft: {
      subject: "Following up — Senior Platform Engineer, 2nd interview",
      body: `Hi,

I wanted to check in after our second interview for the Senior Platform Engineer role. I came away from the conversation with a strong sense of the scope and the caliber of the team — both of which are exactly what I'm looking for.

Happy to answer any remaining questions or accommodate a different timeline if that helps.

Best,
Jane`,
    },
  },
  Bachmanity: {
    kind: "app-nudge",
    dueAt: new Date(new Date(TODAY).setUTCDate(TODAY.getUTCDate() - 14)).toISOString(),
    generatedAt: new Date(new Date(TODAY).setUTCDate(TODAY.getUTCDate() - 1)).toISOString(),
    draft: {
      subject: "Following up — Software Engineer application",
      body: `Hi,

I'm writing to follow up on my application for the Software Engineer role at Bachmanity, submitted about three weeks ago. I remain very interested in the position and would welcome the chance to connect.

Please let me know if you need anything further from my end.

Best,
Jane`,
    },
  },
  "Black Mesa": {
    kind: "post-interview-nudge",
    dueAt: new Date(new Date(TODAY).setUTCDate(TODAY.getUTCDate() - 30)).toISOString(),
    generatedAt: new Date(new Date(TODAY).setUTCDate(TODAY.getUTCDate() - 1)).toISOString(),
    draft: {
      subject: "Following up — Research Engineer, interview loop",
      body: `Hi,

I wanted to follow up on my interview loop for the Research Engineer role. I enjoyed every conversation and left with a clear picture of the work ahead — I'm genuinely excited about contributing to the anomalous materials research program.

Please let me know if there are any remaining steps or if the timeline has shifted.

Best,
Jane`,
    },
  },
};

const apps = ROSTER.map(
  ([company, domain, role, channel, status, fit, weeksAgo, locIdx, note], i) => {
    const [base, tc] = compFor(role);
    const [loc, mode] = LOCS[locIdx % LOCS.length];
    const entry = {
      id: `demo-app-${i + 1}`,
      company,
      role,
      status,
      channel,
      appliedAt: dateWeeksAgo(weeksAgo),
      fitScore: fit,
      loc,
      mode,
      base,
      tc,
      note,
      domain,
      link: `https://${domain}/careers`,
      artifacts: {},
      conversations: [],
      demo: true,
    };
    if (FOLLOWUP_DRAFTS[company]) {
      entry.followUp = FOLLOWUP_DRAFTS[company];
    }
    return entry;
  }
);

const path = userPath(pathCtx, "workspace/tracker.json");
const data = JSON.parse(readFileSync(path, "utf8"));
// Migrate the legacy "prospects" key to the canonical "sourced" key so the seed
// passes the tracker schema (config/tracker.schema.json requires "sourced").
if (data.prospects && !data.sourced) {
  data.sourced = data.prospects;
  delete data.prospects;
}
data.applications = apps;
writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);

const tally = (key) =>
  apps.reduce((m, a) => {
    m[a[key]] = (m[a[key]] || 0) + 1;
    return m;
  }, {});
console.log(
  `Wrote ${apps.length} demo applications to ${displayPath(pathCtx, "workspace/tracker.json")}`
);
console.log("by status :", JSON.stringify(tally("status")));
console.log("by channel:", JSON.stringify(tally("channel")));
