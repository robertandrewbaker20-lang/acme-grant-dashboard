export interface PartnerType {
  type: string;
  label: string;
  required: boolean;
  evidence: string | null;
}

export interface PartnerRequirements {
  partnersRequired: boolean;
  canApplySolo: boolean;
  summary: string;
  partnerTypes: PartnerType[];
  orgAdvantages: string[];
}

const PARTNER_PATTERNS: {
  type: string;
  label: string;
  patterns: RegExp[];
}[] = [
  {
    type: "university",
    label: "University / college",
    patterns: [
      /universit(y|ies)/i,
      /college partner/i,
      /community college/i,
      /academic (institution|partner)/i,
      /higher education/i,
    ],
  },
  {
    type: "local_gov",
    label: "Local / state government",
    patterns: [
      /local government/i,
      /municipalit(y|ies)/i,
      /county government/i,
      /city government/i,
      /state agency/i,
      /economic development (authority|corporation)/i,
    ],
  },
  {
    type: "industry",
    label: "Industry / prime contractor",
    patterns: [
      /industry partner/i,
      /prime contractor/i,
      /commercial partner/i,
      /private sector partner/i,
      /industry collaborator/i,
    ],
  },
  {
    type: "nonprofit",
    label: "Nonprofit partner",
    patterns: [
      /nonprofit partner/i,
      /501\(c\)\(3\) partner/i,
      /community-based organization/i,
      /cbo partner/i,
    ],
  },
  {
    type: "consortium",
    label: "Consortium / team",
    patterns: [
      /consortium/i,
      /multi-?organizational/i,
      /team of organizations/i,
      /collaborative applicant/i,
      /lead applicant.*partner/i,
    ],
  },
  {
    type: "k12",
    label: "K-12 school district",
    patterns: [
      /school district/i,
      /k-12 partner/i,
      /public school/i,
      /local education agency/i,
      /\blea\b/i,
    ],
  },
];

const SOLO_PATTERNS = [
  /single applicant/i,
  /individual organization/i,
  /may apply (alone|independently)/i,
  /no partners required/i,
  /sole applicant/i,
];

const REQUIRED_PATTERNS = [
  /partner required/i,
  /must partner/i,
  /consortium required/i,
  /collaboration required/i,
  /at least one partner/i,
  /multi-?organizational team required/i,
  /lead organization.*subaward/i,
];

export function parsePartnerRequirements(text: string): PartnerRequirements {
  const partnerTypes: PartnerType[] = [];

  for (const def of PARTNER_PATTERNS) {
    for (const pattern of def.patterns) {
      const match = text.match(pattern);
      if (match) {
        partnerTypes.push({
          type: def.type,
          label: def.label,
          required: REQUIRED_PATTERNS.some((p) => p.test(text)),
          evidence: extractEvidence(text, match.index ?? 0),
        });
        break;
      }
    }
  }

  const partnersRequired =
    REQUIRED_PATTERNS.some((p) => p.test(text)) ||
    /consortium|multi-?organizational/i.test(text) ||
    partnerTypes.some((p) => p.required);

  const canApplySolo =
    SOLO_PATTERNS.some((p) => p.test(text)) ||
    (!partnersRequired && partnerTypes.length === 0);

  const orgAdvantages: string[] = [];
  if (/afrl|air force research/i.test(text)) {
    orgAdvantages.push(
      "The notice mentions Air Force research. This profile does not assume an existing partnership.",
    );
  }
  if (/crada|cooperative research/i.test(text)) {
    orgAdvantages.push(
      "The notice mentions a cooperative research agreement. Confirm whether a nonprofit can join.",
    );
  }
  if (/workforce|stem|training|entrepreneur/i.test(text)) {
    orgAdvantages.push(
      "Training language matches the sample profile's program-management role.",
    );
  }
  if (partnerTypes.some((p) => p.type === "university")) {
    orgAdvantages.push(
      "A college or university is mentioned. The sample profile expects the nonprofit to manage delivery.",
    );
  }

  let summary: string;
  if (!partnersRequired && canApplySolo) {
    summary = "No mandatory partners identified — Acme may be able to apply as lead nonprofit.";
  } else if (partnerTypes.length > 0) {
    const labels = [...new Set(partnerTypes.map((p) => p.label))].join(", ");
    summary = partnersRequired
      ? `Partners likely required — look for: ${labels}.`
      : `Partners may strengthen the proposal: ${labels}.`;
  } else {
    summary =
      "Partner requirements unclear from notice text — review the official solicitation.";
  }

  return {
    partnersRequired,
    canApplySolo,
    summary,
    partnerTypes,
    orgAdvantages,
  };
}

function extractEvidence(text: string, index: number): string {
  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + 120);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}