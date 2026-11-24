export type AccessType =
  | "open"
  | "loi"
  | "invitation-only"
  | "open-calls"
  | "rolling";

export type FoundationCategory =
  | "national-security"
  | "tech-ai"
  | "stem-workforce"
  | "veterans"
  | "cybersecurity"
  | "accelerator";

export interface FoundationContact {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  url?: string;
}

export interface TargetFoundation {
  id: string;
  name: string;
  location: string;
  category: FoundationCategory;
  focusAreas: string[];
  assetsOrScale?: string;
  accessType: AccessType;
  accessSummary: string;
  acceptsUnsolicited: boolean;
  invitationRequired: boolean;
  foundationContact?: FoundationContact;
  website?: string;
  generalEmail?: string;
  generalPhone?: string;
  notes?: string;
}

export interface FoundationOpportunity {
  id: string;
  foundationId: string;
  foundationName: string;
  title: string;
  description: string;
  category: FoundationCategory;
  timing: string;
  deadline?: string | null;
  deadlineSort?: string | null;
  accessType: AccessType;
  invitationRequired: boolean;
  firstStep: string;
  estimatedAward?: string;
  foundationContact?: FoundationContact;
  url?: string;
  status: "open" | "rolling" | "watch" | "annual-cycle";
}

export const CATEGORY_LABELS: Record<FoundationCategory, string> = {
  "national-security": "National Security & Defense",
  "tech-ai": "Tech, AI & Science",
  "stem-workforce": "STEM, Education & Workforce",
  veterans: "Veterans & Military Families",
  cybersecurity: "Cybersecurity",
  accelerator: "Accelerators & Tech Nonprofits",
};

export const ACCESS_LABELS: Record<AccessType, string> = {
  open: "Open application",
  loi: "LOI / concept paper first",
  "invitation-only": "Invitation only",
  "open-calls": "Open calls & RFPs",
  rolling: "Rolling submissions",
};

const JORDAN: FoundationContact = {
  name: "Jordan Lee",
  title: "Program officer (sample)",
  email: "jordan.lee@example.com",
  phone: "(555) 010-0142",
};

export const TARGET_FOUNDATIONS: TargetFoundation[] = [
  {
    id: "cedar-birch",
    name: "Cedar & Birch Family Fund",
    location: "Riverton (fictional)",
    category: "stem-workforce",
    focusAreas: ["STEM workshops", "After-school labs", "Career exposure"],
    assetsOrScale: "Sample scale: about $40M, not a real fund",
    accessType: "loi",
    accessSummary: "Fictional fund. Accepts a two-page concept note by email.",
    acceptsUnsolicited: true,
    invitationRequired: false,
    foundationContact: JORDAN,
    website: "https://example.com/cedar-birch",
    generalEmail: "programs@example.com",
    generalPhone: "(555) 010-0142",
    notes: "Sample record only. Do not mail a real proposal here.",
  },
  {
    id: "northwind",
    name: "Northwind Civic Trust",
    location: "Harbor City (fictional)",
    category: "cybersecurity",
    focusAreas: ["Digital safety", "Small-town libraries", "Volunteer training"],
    assetsOrScale: "Sample scale: about $12M",
    accessType: "open",
    accessSummary: "Fictional trust with a public sample application form.",
    acceptsUnsolicited: true,
    invitationRequired: false,
    foundationContact: {
      name: "Sam Rivera",
      title: "Grants desk (sample)",
      email: "sam.rivera@example.com",
    },
    website: "https://example.com/northwind",
    generalEmail: "hello@example.com",
    generalPhone: "(555) 010-0188",
  },
  {
    id: "harbor-light",
    name: "Harbor Light Family Fund",
    location: "Cedar Falls (fictional)",
    category: "veterans",
    focusAreas: ["Career switching", "Community technology"],
    assetsOrScale: "Sample scale: about $8M",
    accessType: "invitation-only",
    accessSummary: "Fictional invitation-only fund. No unsolicited proposals.",
    acceptsUnsolicited: false,
    invitationRequired: true,
    foundationContact: {
      name: "Avery Chen",
      title: "Director (sample)",
      email: "avery.chen@example.com",
    },
    website: "https://example.com/harbor-light",
    notes: "Included so the invitation-only filter has a sample to hide.",
  },
  {
    id: "lumen-field",
    name: "Lumen Field Foundation",
    location: "Westbridge (fictional)",
    category: "tech-ai",
    focusAreas: ["Community AI literacy", "Teacher stipends"],
    assetsOrScale: "Sample scale: about $25M",
    accessType: "open-calls",
    accessSummary: "Fictional foundation. One open call each spring in this sample.",
    acceptsUnsolicited: false,
    invitationRequired: false,
    website: "https://example.com/lumen-field",
    generalEmail: "calls@example.com",
    generalPhone: "(555) 010-0177",
  },
  {
    id: "marigold",
    name: "Marigold Community Trust",
    location: "Plainfield (fictional)",
    category: "stem-workforce",
    focusAreas: ["Apprenticeships", "Community college partnerships"],
    assetsOrScale: "Sample scale: about $15M",
    accessType: "rolling",
    accessSummary: "Fictional trust. Rolling letters of interest.",
    acceptsUnsolicited: true,
    invitationRequired: false,
    foundationContact: {
      name: "Morgan Blake",
      title: "Program associate (sample)",
      email: "morgan.blake@example.com",
      phone: "(555) 010-0164",
    },
    website: "https://example.com/marigold",
    generalEmail: "morgan.blake@example.com",
  },
  {
    id: "example-accelerator",
    name: "Example Partners Accelerator",
    location: "Riverton (fictional)",
    category: "accelerator",
    focusAreas: ["Nonprofit program design", "Peer cohort"],
    assetsOrScale: "Sample cohort of 8 organizations",
    accessType: "invitation-only",
    accessSummary: "Fictional cohort. Prior grantees nominate the next class.",
    acceptsUnsolicited: false,
    invitationRequired: true,
    website: "https://example.com/example-accelerator",
  },
];

export const FOUNDATION_OPPORTUNITIES: FoundationOpportunity[] = [
  {
    id: "cedar-stem-labs",
    foundationId: "cedar-birch",
    foundationName: "Cedar & Birch Family Fund",
    title: "After-school STEM lab stipends",
    description:
      "Fictional award for a nonprofit that runs weekend STEM labs. Sample range $15,000–$40,000.",
    category: "stem-workforce",
    timing: "Concept notes open",
    deadline: "Rolling sample window",
    deadlineSort: "2026-12-01",
    accessType: "loi",
    invitationRequired: false,
    firstStep: "Email a two-page note to jordan.lee@example.com",
    estimatedAward: "$15,000–$40,000 (sample)",
    foundationContact: JORDAN,
    url: "https://example.com/cedar-birch",
    status: "open",
  },
  {
    id: "northwind-safety",
    foundationId: "northwind",
    foundationName: "Northwind Civic Trust",
    title: "Library digital safety hours",
    description:
      "Fictional grant for volunteer-led digital safety hours in small libraries. Sample cap $25,000.",
    category: "cybersecurity",
    timing: "Open application",
    deadline: null,
    deadlineSort: "2099-12-31",
    accessType: "open",
    invitationRequired: false,
    firstStep: "Start at the sample form on example.com",
    estimatedAward: "Up to $25,000 (sample)",
    url: "https://example.com/northwind",
    status: "open",
  },
  {
    id: "marigold-apprentice",
    foundationId: "marigold",
    foundationName: "Marigold Community Trust",
    title: "Community college apprenticeship bridge",
    description:
      "Fictional rolling award for a nonprofit that places career-switchers with a community college.",
    category: "stem-workforce",
    timing: "Rolling",
    deadline: null,
    deadlineSort: "2099-06-01",
    accessType: "rolling",
    invitationRequired: false,
    firstStep: "Send a letter of interest to morgan.blake@example.com",
    estimatedAward: "$30,000–$60,000 (sample)",
    foundationContact: {
      name: "Morgan Blake",
      email: "morgan.blake@example.com",
    },
    url: "https://example.com/marigold",
    status: "rolling",
  },
  {
    id: "lumen-ai-literacy",
    foundationId: "lumen-field",
    foundationName: "Lumen Field Foundation",
    title: "Teacher stipends for AI literacy",
    description:
      "Fictional spring call. Sample awards of $5,000 per teacher cohort. Not open in this snapshot.",
    category: "tech-ai",
    timing: "Annual sample call",
    deadline: "Watch the sample page each March",
    deadlineSort: "2027-03-01",
    accessType: "open-calls",
    invitationRequired: false,
    firstStep: "Check https://example.com/lumen-field when the sample call opens",
    estimatedAward: "$5,000 per cohort (sample)",
    url: "https://example.com/lumen-field",
    status: "annual-cycle",
  },
  {
    id: "harbor-invite",
    foundationId: "harbor-light",
    foundationName: "Harbor Light Family Fund",
    title: "Career-switcher technology cohort",
    description:
      "Fictional invitation-only cohort. Included so the dashboard can show a closed door.",
    category: "veterans",
    timing: "Invitation only",
    deadline: null,
    deadlineSort: "2099-12-31",
    accessType: "invitation-only",
    invitationRequired: true,
    firstStep: "There is no public application. This sample expects a nomination.",
    foundationContact: {
      name: "Avery Chen",
      email: "avery.chen@example.com",
    },
    url: "https://example.com/harbor-light",
    status: "watch",
  },
  {
    id: "example-cohort",
    foundationId: "example-accelerator",
    foundationName: "Example Partners Accelerator",
    title: "Program-design cohort",
    description:
      "Fictional eight-seat cohort for nonprofit program managers. Nomination only.",
    category: "accelerator",
    timing: "Invitation only",
    deadline: null,
    deadlineSort: "2099-12-31",
    accessType: "invitation-only",
    invitationRequired: true,
    firstStep: "Wait for a sample nomination. Do not apply cold.",
    url: "https://example.com/example-accelerator",
    status: "watch",
  },
];

export function getFoundationById(id: string): TargetFoundation | undefined {
  return TARGET_FOUNDATIONS.find((foundation) => foundation.id === id);
}

export function getSortedOpportunities(): FoundationOpportunity[] {
  return [...FOUNDATION_OPPORTUNITIES].sort((a, b) => {
    const statusOrder = { open: 0, rolling: 1, "annual-cycle": 2, watch: 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    const dateA = a.deadlineSort ?? "2099-12-31";
    const dateB = b.deadlineSort ?? "2099-12-31";
    return dateA.localeCompare(dateB);
  });
}

export function getOpenOpportunityCount(): number {
  return FOUNDATION_OPPORTUNITIES.filter(
    (opportunity) => opportunity.status === "open" || opportunity.status === "rolling",
  ).length;
}

export function getInvitationRequiredCount(): number {
  return FOUNDATION_OPPORTUNITIES.filter((opportunity) => opportunity.invitationRequired)
    .length;
}
