export const CORE_NAICS_CODES = [
  { code: "541715", description: "R&D in Physical, Engineering, and Life Sciences", priority: "core" },
  { code: "541511", description: "Custom Computer Programming Services", priority: "core" },
  { code: "541512", description: "Computer Systems Design Services", priority: "core" },
  { code: "541519", description: "Other Computer Related Services", priority: "core" },
  { code: "541611", description: "Administrative Management and General Management Consulting", priority: "core" },
  { code: "541690", description: "Other Scientific and Technical Consulting Services", priority: "core" },
  { code: "611420", description: "Computer Training", priority: "core" },
  { code: "928110", description: "National Security", priority: "core" },
] as const;

export const SECONDARY_NAICS_CODES = [
  { code: "611430", description: "Professional and Management Development Training", priority: "secondary" },
  { code: "611710", description: "Educational Support Services", priority: "secondary" },
  { code: "541330", description: "Engineering Services", priority: "secondary" },
  { code: "541380", description: "Testing Laboratories", priority: "secondary" },
  { code: "561311", description: "Employment Placement Agencies", priority: "secondary" },
  { code: "562910", description: "Remediation Services", priority: "secondary" },
  { code: "221113", description: "Nuclear Electric Power Generation", priority: "secondary" },
  { code: "221122", description: "Electric Power Distribution", priority: "secondary" },
] as const;

export const STEM_NAICS_CODES = [
  { code: "611110", description: "Elementary and Secondary Schools", priority: "stem" },
  { code: "611310", description: "Colleges, Universities, and Professional Schools", priority: "stem" },
  { code: "813410", description: "Civic and Social Organizations", priority: "stem" },
  { code: "923110", description: "Administration of Education Programs", priority: "stem" },
] as const;

export const ALL_NAICS_CODES = [
  ...CORE_NAICS_CODES,
  ...SECONDARY_NAICS_CODES,
  ...STEM_NAICS_CODES,
];

/** Keywords used for Grants.gov / multi-source scans and smart search. */
export const SEARCH_KEYWORDS = [
  "innovation",
  "cybersecurity",
  "critical infrastructure",
  "energy sector",
  "workforce development",
  "workforce training",
  "operational technology",
  "industrial control systems",
  "electric utility",
  "rural electric",
  "energy security",
  "emergency response",
  "artificial intelligence",
  "machine learning",
  "data analytics",
  "technology transfer",
  "startup accelerator",
  "public private partnership",
  "grid cybersecurity",
  "information sharing",
  "program management",
  "project management",
  "nonprofit",
  "cooperative agreement",
  "STEM education",
  "training",
  "entrepreneurship",
  "accelerator",
  "mentorship",
  "AFRL",
  "warfighter",
  "technology transition",
  "CESER",
  "quantum",
  "AI education",
];

/** Federal agencies to highlight on the Federal Funding page and agency-focused scans. */
export const FEDERAL_AGENCIES = [
  {
    id: "doe",
    name: "Department of Energy",
    shortName: "DOE",
    match: [
      "department of energy",
      "doe",
      "ceser",
      "arpa-e",
      "arpa e",
      "eere",
      "grid deployment",
      "office of electricity",
    ],
    url: "https://www.energy.gov/funding-opportunities",
    description:
      "Public energy funding pages, including cybersecurity, grid, and workforce programs.",
  },
  {
    id: "eda",
    name: "Economic Development Administration",
    shortName: "EDA",
    match: ["economic development administration", "eda", "commerce.*economic development"],
    url: "https://www.eda.gov/funding-opportunities/",
    description: "Regional economic development, workforce, and public-private partnership grants.",
  },
  {
    id: "usda",
    name: "USDA",
    shortName: "USDA",
    match: ["usda", "department of agriculture", "rural development", "nifa"],
    url: "https://www.usda.gov/topics/farming/grants-and-loans",
    description: "Rural development and community programs.",
  },
  {
    id: "dra",
    name: "Delta Regional Authority",
    shortName: "DRA",
    match: ["delta regional authority", "dra"],
    url: "https://dra.gov/",
    description: "Regional development grants. Listed because the scanner watches this public agency.",
  },
  {
    id: "dol",
    name: "Department of Labor",
    shortName: "DOL",
    match: [
      "department of labor",
      "employment and training administration",
      "dol",
      "eta ",
    ],
    url: "https://www.dol.gov/agencies/eta/grants",
    description: "Workforce, apprenticeship, and skills-training grants.",
  },
  {
    id: "nsf",
    name: "National Science Foundation",
    shortName: "NSF",
    match: ["national science foundation", "nsf"],
    url: "https://www.nsf.gov/funding/",
    description: "Education, research capacity, and public-interest technology programs.",
  },
] as const;

export const SAM_AGENCY_QUERIES = [
  "Department of Energy",
  "CESER",
  "National Science Foundation",
  "Economic Development Administration",
  "Department of Labor",
  "USDA",
  "Delta Regional Authority",
  "AFRL",
  "Air Force Research Laboratory",
  "AFWERX",
  "DARPA",
  "DIU",
  "cybersecurity",
  "workforce development",
  "innovation",
];

/**
 * Public sites the dashboard can scan or open for review.
 */
export const GRANT_CHECKER_SITES = [
  { name: "Grants.gov", url: "https://grants.gov", status: "connected" as const },
  { name: "NSF", url: "https://www.nsf.gov/funding/", status: "via_grants" as const },
  {
    name: "ARPA-E",
    url: "https://arpa-e-foa.energy.gov/",
    status: "manual" as const,
  },
  {
    name: "DOE Infrastructure Exchange",
    url: "https://infrastructure-exchange.energy.gov/",
    status: "manual" as const,
  },
  {
    name: "DOE EERE Exchange",
    url: "https://eere-exchange.energy.gov/",
    status: "manual" as const,
  },
] as const;

export const ORG_PROFILE = `
Acme Community Fund is a fictional 501(c)(3) used as the sample applicant in this demo.
It is not a real organization. It runs community technology training, digital safety
workshops, and workforce programs, and it is strongest as a lead applicant that
administers the award and hires the people who deliver the work.

Core competencies in this sample profile:
- Grant administration and project management
- Workforce training and STEM workshops
- Digital safety and cybersecurity education for small organizations
- Partnerships with community colleges, school districts, and local utilities

Eligibility preferences used by the scorer:
1. No cash match required
2. Indirect costs allowed
3. Funds operating expenses and personnel, not only construction
4. A nonprofit may be the lead applicant

Ideal sample opportunity types:
- Grants and cooperative agreements
- Workforce, STEM, and community technology training
- Cybersecurity education and tabletop exercises
- Programs where the nonprofit manages delivery and partners provide a site or students

Poor fit:
- Janitorial, construction, and commodity procurement
- Manufacturing-only projects
- For-profit-only eligibility
- Invitation-only awards
`.trim();

export const ORG_PROFILE_SHORT = `
Acme Community Fund is a fictional nonprofit in the sample data. It trains people,
runs digital safety workshops, and manages grant-funded programs with local partners.
`.trim();

export const SESSION_COOKIE = "acme_grant_session";
