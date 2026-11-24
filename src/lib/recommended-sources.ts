export interface RecommendedSource {
  id: string;
  name: string;
  url: string;
  why: string;
  status: "connected" | "planned" | "manual";
}

export const RECOMMENDED_SOURCES: RecommendedSource[] = [
  {
    id: "grants.gov",
    name: "Grants.gov",
    url: "https://www.grants.gov",
    why: "Primary federal grant notices. Connected when a live scan is configured.",
    status: "connected",
  },
  {
    id: "sam.gov",
    name: "SAM.gov",
    url: "https://sam.gov",
    why: "Federal notices and contract listings. Connected when a live scan is configured.",
    status: "connected",
  },
  {
    id: "nsf",
    name: "NSF Funding",
    url: "https://www.nsf.gov/funding/",
    why: "Education and research-capacity programs. Open the site and review by hand.",
    status: "manual",
  },
  {
    id: "arpa-e",
    name: "ARPA-E FOA",
    url: "https://arpa-e-foa.energy.gov/",
    why: "Energy research announcements. Manual review for workforce or partnership roles.",
    status: "manual",
  },
  {
    id: "doe-infra",
    name: "DOE Infrastructure Exchange",
    url: "https://infrastructure-exchange.energy.gov/",
    why: "Energy infrastructure announcements, including utility cybersecurity themes.",
    status: "manual",
  },
  {
    id: "doe-eere",
    name: "DOE EERE Exchange",
    url: "https://eere-exchange.energy.gov/",
    why: "Energy efficiency announcements. Screen for training or program-management roles.",
    status: "manual",
  },
  {
    id: "doe",
    name: "DOE Funding Opportunities",
    url: "https://www.energy.gov/funding-opportunities",
    why: "Department of Energy funding index, including energy security programs.",
    status: "manual",
  },
  {
    id: "eda",
    name: "EDA (Commerce)",
    url: "https://www.eda.gov/funding-opportunities/",
    why: "Economic development and workforce grants.",
    status: "manual",
  },
  {
    id: "dol-eta",
    name: "DOL Employment & Training",
    url: "https://www.dol.gov/agencies/eta/grants",
    why: "Workforce, apprenticeship, and upskilling grants.",
    status: "manual",
  },
  {
    id: "usda",
    name: "USDA",
    url: "https://www.usda.gov/topics/farming/grants-and-loans",
    why: "Rural development and community programs.",
    status: "manual",
  },
  {
    id: "dra",
    name: "Delta Regional Authority",
    url: "https://dra.gov/",
    why: "Regional development programs. Manual review.",
    status: "manual",
  },
  {
    id: "aflr",
    name: "AFRL / AFVentures",
    url: "https://afresearchlab.com/technology/af-ventures/",
    why: "Air Force research announcements. Manual review. This demo does not claim a partnership.",
    status: "manual",
  },
];
