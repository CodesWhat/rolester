import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { displayPath, userPath } from "../paths/workspace.mjs";
import { parseYaml } from "../profile/yaml.mjs";

const DEFAULT_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

const CONFIG_FILES = [
  "candidate/profile.yml",
  "candidate/targeting.yml",
  "candidate/honesty.yml",
  "candidate/form-defaults.yml",
  "candidate/modes.yml",
  "candidate/application-limits.yml",
  "candidate/automation.yml",
  "candidate/research-prefs.yml",
  "candidate/stories.yml",
];

const CAPABILITY_LABELS = {
  status_polling: "Status polling",
  authenticated_search: "Authenticated search",
  messaging: "Messaging",
  one_click_apply: "One-click apply",
  mail_access: "Mail access",
  profile_optimize: "Profile optimization",
  profile_apply: "Profile write-back",
};

const PROVIDER_LABELS = {
  extension: "Browser extension",
  playwright: "Playwright profile",
};

function readYamlIfExists(root, relPath) {
  const path = userPath({ repoRoot: root }, relPath);
  if (!existsSync(path)) return null;
  return parseYaml(readFileSync(path, "utf8"));
}

function formatBase(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "Not set";
  if (num >= 1000) return `$${Math.round(num / 1000)}K`;
  return `$${num}`;
}

function compactLocation(location = {}, candidate = {}) {
  const modes = [];
  if (location.remote) modes.push("Remote");
  if (location.hybrid) modes.push("hybrid");
  if (location.onsite) modes.push("on-site");
  const home = String(location.home || candidate.location || "").trim();
  if (!modes.length && !home) return "Not set";
  if (!modes.length) return home;
  return home ? `${modes.join(" / ")} - ${home}` : modes.join(" / ");
}

function workAuthorization(auth = {}) {
  if (auth.work_authorized && auth.requires_sponsorship === false) {
    return "Authorized; no sponsorship";
  }
  if (auth.work_authorized) return "Authorized";
  if (auth.requires_sponsorship) return "Needs sponsorship";
  return "Not set";
}

function enabledCapabilities(automation = {}) {
  const caps = automation.capabilities || {};
  return Object.entries(caps)
    .filter(([, value]) => value?.enabled)
    .map(([key]) => CAPABILITY_LABELS[key] || key.replace(/_/g, " "))
    .sort((a, b) => a.localeCompare(b));
}

export function buildSettingsSnapshot({
  profile = {},
  targeting = {},
  honesty = {},
  automation = {},
  files = [],
} = {}) {
  const candidate = profile.candidate || {};
  const compensation = profile.compensation || {};
  const location = profile.location || {};
  const authorization = profile.authorization || {};
  const sessionProvider = automation?.session?.provider || "not configured";
  // Optional logo.dev publishable token (PRIVATE candidate config; never committed).
  // Absent → dashboard avatars stay initials chips. No hardcoded default.
  const logoToken = automation?.integrations?.logo_dev_token || automation?.logo_dev_token || "";

  return {
    logoToken,
    profile: {
      candidate: candidate.full_name || candidate.preferred_name || "Not set",
      headline: candidate.headline || candidate.domain || "Not set",
      location: compactLocation(location, candidate),
      minimumBase: formatBase(compensation.minimum_base),
      targetBase: formatBase(compensation.target_base),
      expectedBase: formatBase(compensation.expected_base),
      workAuthorization: workAuthorization(authorization),
    },
    targeting: {
      primaryRoles: (targeting.role_buckets || [])
        .filter((bucket) => bucket && (!bucket.priority || bucket.priority === "primary"))
        .flatMap((bucket) => bucket.titles || [])
        .filter(Boolean)
        .slice(0, 4),
      excludedCompanies: (targeting.excluded_companies || []).filter(Boolean).slice(0, 6),
    },
    honesty: {
      boundaries: [
        ...(honesty?.tools?.do_not_claim || []),
        ...(honesty?.claims?.do_not_fabricate || []),
      ]
        .filter(Boolean)
        .slice(0, 5),
    },
    automation: {
      sessionProvider: PROVIDER_LABELS[sessionProvider] || sessionProvider,
      enabledCapabilities: enabledCapabilities(automation),
    },
    files: files.filter(Boolean),
  };
}

export function loadSettingsSnapshot({ root = DEFAULT_ROOT } = {}) {
  const files = CONFIG_FILES.filter((relPath) =>
    existsSync(userPath({ repoRoot: root }, relPath))
  ).map((relPath) => displayPath({ repoRoot: root }, relPath));
  return buildSettingsSnapshot({
    profile: readYamlIfExists(root, "candidate/profile.yml") || {},
    targeting: readYamlIfExists(root, "candidate/targeting.yml") || {},
    honesty: readYamlIfExists(root, "candidate/honesty.yml") || {},
    automation: readYamlIfExists(root, "candidate/automation.yml") || {},
    files,
  });
}
