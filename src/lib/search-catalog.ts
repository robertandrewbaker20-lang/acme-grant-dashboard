/**
 * Catalog of grant websites and topic areas used by search profiles.
 * Used by the Search criteria page (Organization website + Domain boxes).
 */

export interface SearchWebsiteOption {
  id: string;
  name: string;
  url: string;
  /** Maps to connected feed source ids when present. */
  sourceIds?: string[];
  /** Extra keywords to inject when this site is selected. */
  keywords?: string[];
}

export interface SearchDomainOption {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  agencyQueries: string[];
}

/** Every website / portal we currently search or track. */
export const SEARCH_WEBSITES: SearchWebsiteOption[] = [
  {
    id: "grants.gov",
    name: "Grants.gov",
    url: "https://www.grants.gov",
    sourceIds: ["grants.gov"],
    keywords: ["grant", "cooperative agreement"],
  },
  {
    id: "sam.gov",
    name: "SAM.gov",
    url: "https://sam.gov",
    sourceIds: ["sam.gov"],
  },
  {
    id: "nsf",
    name: "NSF Funding",
    url: "https://www.nsf.gov/funding/",
    sourceIds: ["grants.gov"],
    keywords: ["National Science Foundation", "NSF"],
  },
  {
    id: "arpa-e",
    name: "ARPA-E FOA",
    url: "https://arpa-e-foa.energy.gov/",
    keywords: ["ARPA-E", "Department of Energy"],
  },
  {
    id: "doe-infra",
    name: "DOE Infrastructure Exchange",
    url: "https://infrastructure-exchange.energy.gov/",
    keywords: ["Department of Energy", "infrastructure", "CESER"],
  },
  {
    id: "doe-eere",
    name: "DOE EERE Exchange",
    url: "https://eere-exchange.energy.gov/",
    keywords: ["EERE", "Department of Energy", "energy efficiency"],
  },
  {
    id: "doe",
    name: "DOE Funding Opportunities",
    url: "https://www.energy.gov/funding-opportunities",
    keywords: ["Department of Energy", "CESER", "energy security"],
  },
  {
    id: "eda",
    name: "EDA (Commerce)",
    url: "https://www.eda.gov/funding-opportunities/",
    keywords: ["Economic Development Administration", "EDA"],
  },
  {
    id: "dol-eta",
    name: "DOL Employment & Training",
    url: "https://www.dol.gov/agencies/eta/grants",
    keywords: ["Department of Labor", "workforce development", "ETA"],
  },
  {
    id: "usda",
    name: "USDA",
    url: "https://www.usda.gov/topics/farming/grants-and-loans",
    keywords: ["USDA", "rural development"],
  },
  {
    id: "dra",
    name: "Delta Regional Authority",
    url: "https://dra.gov/",
    keywords: ["Delta Regional Authority", "DRA"],
  },
  {
    id: "darpa",
    name: "DARPA",
    url: "https://www.darpa.mil",
    sourceIds: ["darpa", "sam.gov"],
    keywords: ["DARPA", "Defense Advanced Research Projects Agency"],
  },
  {
    id: "diu",
    name: "DIU",
    url: "https://www.diu.mil",
    sourceIds: ["diu", "sam.gov"],
    keywords: ["DIU", "Defense Innovation Unit"],
  },
  {
    id: "afwerx",
    name: "AFWERX",
    url: "https://afwerx.com",
    sourceIds: ["afwerx", "sam.gov"],
    keywords: ["AFWERX", "Air Force"],
  },
  {
    id: "afrl",
    name: "AFRL / AFVentures",
    url: "https://afresearchlab.com/technology/af-ventures/",
    sourceIds: ["sam.gov"],
    keywords: ["AFRL", "Air Force Research Laboratory"],
  },
];

/** Topical domains currently used for matching and focused searches. */
export const SEARCH_DOMAINS: SearchDomainOption[] = [
  {
    id: "cyber",
    name: "Cybersecurity",
    description: "Critical infrastructure, OT/ICS, utility cyber, ISAC",
    keywords: [
      "cybersecurity",
      "critical infrastructure",
      "operational technology",
      "industrial control systems",
      "grid cybersecurity",
      "CESER",
      "OT security",
      "ICS training",
    ],
    agencyQueries: ["CESER", "cybersecurity", "critical infrastructure", "CISA"],
  },
  {
    id: "energy",
    name: "Energy & utilities",
    description: "DOE, rural/municipal electric, grid, energy security",
    keywords: [
      "energy sector",
      "electric utility",
      "rural electric",
      "energy security",
      "grid",
      "municipal utility",
    ],
    agencyQueries: ["Department of Energy", "CESER", "rural electric"],
  },
  {
    id: "workforce",
    name: "Workforce development",
    description: "Training, apprenticeships, upskilling, ETA",
    keywords: [
      "workforce development",
      "workforce training",
      "apprenticeship",
      "upskilling",
      "job training",
    ],
    agencyQueries: ["Department of Labor", "workforce development", "ETA"],
  },
  {
    id: "innovation",
    name: "Innovation",
    description: "Accelerators, entrepreneurship, public-private partnerships",
    keywords: [
      "innovation",
      "accelerator",
      "startup accelerator",
      "entrepreneurship",
      "public private partnership",
    ],
    agencyQueries: ["innovation", "accelerator", "entrepreneurship"],
  },
  {
    id: "ai",
    name: "AI & data",
    description: "Artificial intelligence, ML, data analytics",
    keywords: [
      "artificial intelligence",
      "machine learning",
      "data analytics",
      "AI education",
    ],
    agencyQueries: ["artificial intelligence", "machine learning", "NSF"],
  },
  {
    id: "defense",
    name: "Defense & dual-use",
    description: "DARPA, AFRL, AFWERX, DIU, tech transition",
    keywords: [
      "DARPA",
      "AFRL",
      "AFWERX",
      "DIU",
      "warfighter",
      "technology transition",
      "dual-use",
    ],
    agencyQueries: [
      "DARPA",
      "AFRL",
      "AFWERX",
      "DIU",
      "Defense Innovation Unit",
      "warfighter",
    ],
  },
  {
    id: "stem",
    name: "STEM education",
    description: "K-16 STEM, curriculum, university partnerships",
    keywords: ["STEM education", "curriculum", "education", "training"],
    agencyQueries: ["National Science Foundation", "STEM education"],
  },
  {
    id: "program-mgmt",
    name: "Program management",
    description: "Grant admin, project management, cooperative agreements",
    keywords: [
      "program management",
      "project management",
      "cooperative agreement",
      "nonprofit",
      "grant administration",
    ],
    agencyQueries: ["program management", "cooperative agreement"],
  },
  {
    id: "regional",
    name: "Rural and regional",
    description: "Regional authorities, USDA rural development, and similar public programs",
    keywords: [
      "Delta Regional Authority",
      "rural development",
      "USDA",
    ],
    agencyQueries: ["Delta Regional Authority", "USDA", "rural development"],
  },
];

export const ALL_WEBSITE_ID = "all";
export const ALL_DOMAIN_ID = "all";

export function websiteById(id: string): SearchWebsiteOption | undefined {
  return SEARCH_WEBSITES.find((w) => w.id === id);
}

export function domainById(id: string): SearchDomainOption | undefined {
  return SEARCH_DOMAINS.find((d) => d.id === id);
}
