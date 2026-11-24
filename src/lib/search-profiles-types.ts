import {
  ORG_PROFILE,
  ORG_PROFILE_SHORT,
  SAM_AGENCY_QUERIES,
  SEARCH_KEYWORDS,
} from "./constants";
import {
  ALL_DOMAIN_ID,
  ALL_WEBSITE_ID,
  domainById,
  SEARCH_DOMAINS,
  websiteById,
} from "./search-catalog";

/** Path of the versioned file in the GitHub repo. */
export const SEARCH_PROFILES_REPO_PATH = "data/search-profiles.json";

/** The three fixed profile boxes on the Search criteria page. */
export type ProfileKind = "default" | "website" | "domain";

export const FIXED_PROFILE_IDS = {
  default: "default",
  website: "website",
  domain: "domain",
} as const;

export interface SearchProfile {
  id: string;
  kind: ProfileKind;
  name: string;
  description: string;
  /** Who we are — About Acme for this search focus. */
  aboutOrg: string;
  /** Keywords used for Grants.gov and related searches. */
  searchKeywords: string[];
  /** Agency / title queries used for SAM.gov style searches. */
  agencyQueries: string[];
  /** What opportunities we want to find. */
  lookingFor: string;
  /** How to score / match opportunities. */
  matchCriteria: string;
  /** Explicit poor-fit guidance. */
  poorFit: string;
  /**
   * Organization website profile: selected site ids.
   * Includes "all" or specific catalog ids + custom ids prefixed with custom:
   */
  selectedWebsites: string[];
  /** User-added websites (id, name, url). */
  customWebsites: { id: string; name: string; url: string }[];
  /**
   * Domain profile: selected domain ids.
   * Includes "all" or specific catalog ids + custom:
   */
  selectedDomains: string[];
  /** User-added domains with keywords. */
  customDomains: {
    id: string;
    name: string;
    keywords: string[];
    agencyQueries: string[];
  }[];
  updatedAt: string;
}

export interface SearchProfilesFile {
  version: number;
  activeProfileId: string;
  updatedAt: string;
  profiles: SearchProfile[];
}

export interface SaveProfilesResult {
  ok: boolean;
  source: "github" | "local" | "memory";
  commitSha?: string;
  message: string;
  data: SearchProfilesFile;
}

function emptyLists(p: Partial<SearchProfile>): Pick<
  SearchProfile,
  | "selectedWebsites"
  | "customWebsites"
  | "selectedDomains"
  | "customDomains"
  | "searchKeywords"
  | "agencyQueries"
> {
  return {
    searchKeywords: Array.isArray(p.searchKeywords)
      ? p.searchKeywords.map(String).filter(Boolean)
      : [],
    agencyQueries: Array.isArray(p.agencyQueries)
      ? p.agencyQueries.map(String).filter(Boolean)
      : [],
    selectedWebsites: Array.isArray(p.selectedWebsites)
      ? p.selectedWebsites.map(String)
      : [ALL_WEBSITE_ID],
    customWebsites: Array.isArray(p.customWebsites)
      ? p.customWebsites
          .filter((c) => c && typeof c === "object")
          .map((c) => ({
            id: String(c.id),
            name: String(c.name ?? ""),
            url: String(c.url ?? ""),
          }))
      : [],
    selectedDomains: Array.isArray(p.selectedDomains)
      ? p.selectedDomains.map(String)
      : [ALL_DOMAIN_ID],
    customDomains: Array.isArray(p.customDomains)
      ? p.customDomains
          .filter((c) => c && typeof c === "object")
          .map((c) => ({
            id: String(c.id),
            name: String(c.name ?? ""),
            keywords: Array.isArray(c.keywords)
              ? c.keywords.map(String).filter(Boolean)
              : [],
            agencyQueries: Array.isArray(c.agencyQueries)
              ? c.agencyQueries.map(String).filter(Boolean)
              : [],
          }))
      : [],
  };
}

function inferKind(id: string, name: string): ProfileKind {
  if (id === "website" || /organization website|website/i.test(name)) {
    return "website";
  }
  if (id === "domain" || /^domain/i.test(name)) return "domain";
  return "default";
}

export function createEmptyProfile(name = "New profile"): SearchProfile {
  const now = new Date().toISOString();
  return {
    id: `custom-${Date.now().toString(36)}`,
    kind: "default",
    name,
    description: "",
    aboutOrg: ORG_PROFILE_SHORT,
    searchKeywords: [...SEARCH_KEYWORDS.slice(0, 12)],
    agencyQueries: [...SAM_AGENCY_QUERIES.slice(0, 8)],
    lookingFor: "",
    matchCriteria:
      "1. No cash match\n2. Indirect costs allowed\n3. Funds operating expenses\n4. 501(c)(3) lead applicant",
    poorFit: "",
    selectedWebsites: [ALL_WEBSITE_ID],
    customWebsites: [],
    selectedDomains: [ALL_DOMAIN_ID],
    customDomains: [],
    updatedAt: now,
  };
}

function baseAbout(): string {
  return ORG_PROFILE;
}

function baseMatch(): string {
  return `Score highly when:
1. 501(c)(3) may serve as lead applicant
2. No cash match required
3. Indirect costs (IDC / F&A) allowed
4. Funds operating expenses / personnel (not only capital)
5. Acme can administer, PM, and hire delivery staff
6. Partner model fits (labs, universities, utilities as subrecipients or beneficiaries)

Flag partner requirements, match, and IDC explicitly in strengths/concerns.`;
}

function basePoorFit(): string {
  return `Pass on:
- Pure basic science / wet-lab R&D with no PM or bridging role
- HVAC, janitorial, construction, commodity procurement
- Manufacturing-only capital projects
- For-profit-only eligibility
- Invitation-only foundation grants`;
}

export function defaultSearchProfilesFile(): SearchProfilesFile {
  const now = new Date().toISOString();
  return {
    version: 2,
    activeProfileId: FIXED_PROFILE_IDS.default,
    updatedAt: now,
    profiles: [
      {
        id: FIXED_PROFILE_IDS.default,
        kind: "default",
        name: "Default / Full profile",
        description:
          "Full profile mission across cyber, energy, workforce, and program management.",
        aboutOrg: baseAbout(),
        searchKeywords: [...SEARCH_KEYWORDS],
        agencyQueries: [...SAM_AGENCY_QUERIES],
        lookingFor:
          "Nonprofit-eligible grants and cooperative agreements where Acme can lead, administer, and project-manage.",
        matchCriteria: baseMatch(),
        poorFit: basePoorFit(),
        selectedWebsites: [ALL_WEBSITE_ID],
        customWebsites: [],
        selectedDomains: [ALL_DOMAIN_ID],
        customDomains: [],
        updatedAt: now,
      },
      {
        id: FIXED_PROFILE_IDS.website,
        kind: "website",
        name: "Organization website",
        description:
          "Limit search to selected grant websites / portals (or All).",
        aboutOrg: ORG_PROFILE_SHORT,
        searchKeywords: [...SEARCH_KEYWORDS.slice(0, 12)],
        agencyQueries: [...SAM_AGENCY_QUERIES.slice(0, 8)],
        lookingFor:
          "Opportunities posted on the selected organization websites.",
        matchCriteria: baseMatch(),
        poorFit: basePoorFit(),
        selectedWebsites: [ALL_WEBSITE_ID],
        customWebsites: [],
        selectedDomains: [ALL_DOMAIN_ID],
        customDomains: [],
        updatedAt: now,
      },
      {
        id: FIXED_PROFILE_IDS.domain,
        kind: "domain",
        name: "Domain",
        description:
          "Focus search and matching on selected topic domains (or All).",
        aboutOrg: ORG_PROFILE_SHORT,
        searchKeywords: [...SEARCH_KEYWORDS.slice(0, 12)],
        agencyQueries: [...SAM_AGENCY_QUERIES.slice(0, 8)],
        lookingFor: "Opportunities aligned with the selected topic domains.",
        matchCriteria: baseMatch(),
        poorFit: basePoorFit(),
        selectedWebsites: [ALL_WEBSITE_ID],
        customWebsites: [],
        selectedDomains: [ALL_DOMAIN_ID],
        customDomains: [],
        updatedAt: now,
      },
    ],
  };
}

/** Ensure the three fixed boxes always exist; migrate older multi-profile files. */
export function ensureFixedProfiles(
  data: SearchProfilesFile,
): SearchProfilesFile {
  const defaults = defaultSearchProfilesFile();
  const byId = new Map(data.profiles.map((p) => [p.id, p]));

  const profiles = defaults.profiles.map((template) => {
    const existing = byId.get(template.id);
    if (!existing) return template;
    return {
      ...template,
      ...existing,
      id: template.id,
      kind: template.kind,
      name: template.name,
      ...emptyLists(existing),
    };
  });

  const activeProfileId = profiles.some((p) => p.id === data.activeProfileId)
    ? data.activeProfileId
    : FIXED_PROFILE_IDS.default;

  return {
    version: 2,
    activeProfileId,
    updatedAt: data.updatedAt || new Date().toISOString(),
    profiles,
  };
}

export function normalizeProfilesFile(raw: unknown): SearchProfilesFile {
  const fallback = defaultSearchProfilesFile();
  if (!raw || typeof raw !== "object") return fallback;

  const data = raw as Partial<SearchProfilesFile>;
  const profiles = Array.isArray(data.profiles)
    ? data.profiles
        .filter((p) => p && typeof p === "object" && p.id && p.name)
        .map((p) => {
          const partial = p as Partial<SearchProfile>;
          const kind =
            partial.kind === "default" ||
            partial.kind === "website" ||
            partial.kind === "domain"
              ? partial.kind
              : inferKind(String(partial.id), String(partial.name));
          return {
            id: String(partial.id),
            kind,
            name: String(partial.name || "Untitled"),
            description: String(partial.description ?? ""),
            aboutOrg: String(partial.aboutOrg ?? ""),
            lookingFor: String(partial.lookingFor ?? ""),
            matchCriteria: String(partial.matchCriteria ?? ""),
            poorFit: String(partial.poorFit ?? ""),
            updatedAt: String(partial.updatedAt ?? new Date().toISOString()),
            ...emptyLists(partial),
          } satisfies SearchProfile;
        })
    : fallback.profiles;

  if (profiles.length === 0) return fallback;

  return ensureFixedProfiles({
    version: typeof data.version === "number" ? data.version : 2,
    activeProfileId: String(
      data.activeProfileId ?? FIXED_PROFILE_IDS.default,
    ),
    updatedAt: String(data.updatedAt ?? new Date().toISOString()),
    profiles,
  });
}

/** Resolve effective keywords / agency queries from website & domain selections. */
export function resolveProfileSearchParams(profile: SearchProfile): {
  searchKeywords: string[];
  agencyQueries: string[];
  enabledSourceIds: string[] | null;
} {
  if (profile.kind === "default") {
    return {
      searchKeywords:
        profile.searchKeywords.length > 0
          ? profile.searchKeywords
          : [...SEARCH_KEYWORDS],
      agencyQueries:
        profile.agencyQueries.length > 0
          ? profile.agencyQueries
          : [...SAM_AGENCY_QUERIES],
      enabledSourceIds: null,
    };
  }

  if (profile.kind === "website") {
    const selected = profile.selectedWebsites ?? [];
    const isAll = selected.includes(ALL_WEBSITE_ID) || selected.length === 0;

    if (isAll) {
      return {
        searchKeywords:
          profile.searchKeywords.length > 0
            ? profile.searchKeywords
            : [...SEARCH_KEYWORDS],
        agencyQueries:
          profile.agencyQueries.length > 0
            ? profile.agencyQueries
            : [...SAM_AGENCY_QUERIES],
        enabledSourceIds: null,
      };
    }

    const keywords = new Set<string>();
    const agency = new Set<string>();
    const sources = new Set<string>();

    for (const id of selected) {
      const catalog = websiteById(id);
      if (catalog) {
        catalog.keywords?.forEach((k) => keywords.add(k));
        catalog.sourceIds?.forEach((s) => sources.add(s));
        agency.add(catalog.name);
        continue;
      }
      const custom = profile.customWebsites.find((c) => c.id === id);
      if (custom) {
        if (custom.name) {
          keywords.add(custom.name);
          agency.add(custom.name);
        }
      }
    }

    profile.searchKeywords.forEach((k) => keywords.add(k));
    profile.agencyQueries.forEach((a) => agency.add(a));

    return {
      searchKeywords: [...keywords],
      agencyQueries: [...agency],
      enabledSourceIds: sources.size > 0 ? [...sources] : null,
    };
  }

  // domain
  const selected = profile.selectedDomains ?? [];
  const isAll = selected.includes(ALL_DOMAIN_ID) || selected.length === 0;

  if (isAll) {
    const keywords = new Set<string>();
    const agency = new Set<string>();
    for (const d of SEARCH_DOMAINS) {
      d.keywords.forEach((k) => keywords.add(k));
      d.agencyQueries.forEach((a) => agency.add(a));
    }
    return {
      searchKeywords: [...keywords],
      agencyQueries: [...agency],
      enabledSourceIds: null,
    };
  }

  const keywords = new Set<string>();
  const agency = new Set<string>();
  for (const id of selected) {
    const catalog = domainById(id);
    if (catalog) {
      catalog.keywords.forEach((k) => keywords.add(k));
      catalog.agencyQueries.forEach((a) => agency.add(a));
      continue;
    }
    const custom = profile.customDomains.find((c) => c.id === id);
    if (custom) {
      custom.keywords.forEach((k) => keywords.add(k));
      custom.agencyQueries.forEach((a) => agency.add(a));
      if (custom.name) keywords.add(custom.name);
    }
  }

  return {
    searchKeywords: [...keywords],
    agencyQueries: [...agency],
    enabledSourceIds: null,
  };
}

/** Compose the full text block Grok uses for scoring. */
export function buildEvaluationProfileText(profile: SearchProfile): string {
  const resolved = resolveProfileSearchParams(profile);
  const websiteLine =
    profile.kind === "website"
      ? `Selected websites: ${
          profile.selectedWebsites.includes(ALL_WEBSITE_ID)
            ? "All"
            : profile.selectedWebsites
                .map((id) => {
                  const w =
                    websiteById(id) ??
                    profile.customWebsites.find((c) => c.id === id);
                  return w?.name ?? id;
                })
                .join(", ")
        }`
      : "";
  const domainLine =
    profile.kind === "domain"
      ? `Selected domains: ${
          profile.selectedDomains.includes(ALL_DOMAIN_ID)
            ? "All"
            : profile.selectedDomains
                .map((id) => {
                  const d =
                    domainById(id) ??
                    profile.customDomains.find((c) => c.id === id);
                  return d?.name ?? id;
                })
                .join(", ")
        }`
      : "";

  return [
    `ACTIVE SEARCH PROFILE: ${profile.name}`,
    profile.description ? `Focus: ${profile.description}` : "",
    websiteLine,
    domainLine,
    "",
    "ABOUT THE ORGANIZATION (for this search)",
    profile.aboutOrg,
    "",
    "WHAT WE ARE LOOKING FOR",
    profile.lookingFor,
    "",
    "MATCH / SCORING CRITERIA",
    profile.matchCriteria,
    "",
    "POOR FIT (score low / pass)",
    profile.poorFit,
    "",
    `Search keywords in use: ${resolved.searchKeywords.join(", ")}`,
    `Agency queries in use: ${resolved.agencyQueries.join(", ")}`,
  ]
    .filter((line) => line !== undefined && line !== "")
    .join("\n")
    .trim();
}

export function getProfileById(
  data: SearchProfilesFile,
  id: string | null | undefined,
): SearchProfile {
  return (
    data.profiles.find((p) => p.id === id) ??
    data.profiles.find((p) => p.id === data.activeProfileId) ??
    data.profiles[0]
  );
}

export function getActiveProfile(data: SearchProfilesFile): SearchProfile {
  return getProfileById(data, data.activeProfileId);
}

export function validateProfilesFile(data: SearchProfilesFile): string | null {
  if (!data.profiles?.length) return "At least one profile is required.";
  for (const id of Object.values(FIXED_PROFILE_IDS)) {
    if (!data.profiles.some((p) => p.id === id)) {
      return `Missing required profile: ${id}`;
    }
  }
  if (!data.profiles.some((p) => p.id === data.activeProfileId)) {
    return "activeProfileId must match a profile.";
  }
  return null;
}

/** Parse a free-text keyword field into a clean string array. */
export function parseKeywordList(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function keywordsToText(list: string[]): string {
  return list.join("\n");
}

export function slugifyId(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || `custom-${Date.now().toString(36)}`
  );
}
