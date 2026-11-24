import { FEDERAL_AGENCIES, SEARCH_KEYWORDS } from "./constants";

type Alignable = {
  title: string;
  agency?: string | null;
  description?: string | null;
  response_deadline?: string | null;
  fit_score?: number | null;
  recommendation?: string | null;
  tags?: string[];
  source?: string | null;
  set_aside?: string | null;
  opportunity_type?: string | null;
};

const STRONG_SIGNALS: { pattern: RegExp; weight: number; label: string }[] = [
  { pattern: /cybersecurity|cyber security|information security/i, weight: 14, label: "Cybersecurity" },
  { pattern: /critical infrastructure|ceser|energy security|grid (security|cyber)/i, weight: 14, label: "Critical infrastructure" },
  { pattern: /operational technology|\bot\b|industrial control|ics\b|scada/i, weight: 13, label: "OT/ICS" },
  { pattern: /rural (electric|utility)|municipal (electric|utility)|electric cooperative|co-?op utility/i, weight: 13, label: "Rural/municipal utility" },
  { pattern: /workforce|apprenticeship|job training|upskill|training program/i, weight: 12, label: "Workforce" },
  { pattern: /entrepreneur|accelerator|incubator|mentorship|startup/i, weight: 11, label: "Entrepreneurship" },
  { pattern: /stem|k-12|k-16|education|curriculum|community college/i, weight: 9, label: "STEM education" },
  { pattern: /quantum|artificial intelligence|\bai\b|machine learning|data analytics/i, weight: 11, label: "AI/ML/analytics" },
  { pattern: /afrl|air force research|warfighter|dual[- ]use|tech transition/i, weight: 12, label: "AFRL/Defense tech" },
  { pattern: /program manage|project manage|grant admin|cooperative agreement/i, weight: 12, label: "Program delivery" },
  { pattern: /nonprofit|501\(c\)\(3\)|grant\b/i, weight: 11, label: "Nonprofit grant" },
  { pattern: /national lab|community college|state university/i, weight: 11, label: "Lab/university bridge" },
  { pattern: /public[- ]private|cross[- ]sector|technology transfer|information sharing|isac/i, weight: 10, label: "Sector bridging" },
  { pattern: /innovation/i, weight: 8, label: "Innovation" },
  { pattern: /hiring|personnel|staffing|fte|job placement/i, weight: 7, label: "Staffing/hiring" },
  { pattern: /no (cash )?match|no cost share|matching funds not required|no non-federal match/i, weight: 8, label: "No cash match" },
  { pattern: /indirect cost|facilities and administrative|f&a|idc allowed|full idc/i, weight: 7, label: "IDC allowed" },
  { pattern: /operating (expense|cost|support)|personnel costs? allowed|salary support/i, weight: 7, label: "Operating expenses" },
];

const NEGATIVE_SIGNALS: { pattern: RegExp; weight: number }[] = [
  { pattern: /hvac|janitorial|custodial|landscaping|pest control/i, weight: 25 },
  { pattern: /construction|renovation|roofing|plumbing/i, weight: 18 },
  { pattern: /hardware procurement|spare parts|maintenance contract/i, weight: 18 },
  { pattern: /manufacturing only|production facility|battery manufacturing|rare earth/i, weight: 14 },
  { pattern: /invitation only|by invitation|closed solicitation|pre-selected invitees/i, weight: 20 },
  { pattern: /for[- ]?profit (only|entities only)|commercial organizations only/i, weight: 22 },
];

const FOUNDATION_INVITE_ONLY =
  /invitation only|by invitation|closed solicitation|pre-selected|must be invited|invitees only/i;

const OPEN_SOLICITATION =
  /open solicitation|open competition|full and open|public competition|no invitation required|open call/i;

export function buildAlignmentText(item: Alignable): string {
  return [
    item.title,
    item.agency,
    item.description,
    item.source,
    item.set_aside,
    item.opportunity_type,
    item.tags?.join(" "),
    ...SEARCH_KEYWORDS.filter((kw) =>
      [item.title, item.description, item.agency].some((field) =>
        field?.toLowerCase().includes(kw.split(" ")[0].toLowerCase()),
      ),
    ),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function computeAlignment(item: Alignable): number {
  const text = buildAlignmentText(item);
  let score = 32;

  for (const signal of STRONG_SIGNALS) {
    if (signal.pattern.test(text)) {
      score += signal.weight;
    }
  }

  for (const neg of NEGATIVE_SIGNALS) {
    if (neg.pattern.test(text)) score -= neg.weight;
  }

  if (
    item.agency?.match(
      /energy|education|labor|nsf|national science|agriculture|usda|economic development|delta regional|homeland|ceser/i,
    )
  ) {
    score += 6;
  }
  if (item.source === "grants.gov") score += 8;
  if (item.set_aside?.match(/nonprofit|8\(a\)|small business/i)) score += 4;

  if (FOUNDATION_INVITE_ONLY.test(text)) score -= 25;
  if (OPEN_SOLICITATION.test(text)) score += 4;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function effectiveAlignmentScore(item: Alignable): number {
  const modelScore = item.fit_score;
  const local = computeAlignment(item);
  if (modelScore !== null && modelScore !== undefined) {
    return Math.round(modelScore * 0.7 + local * 0.3);
  }
  return local;
}

export function sortByAlignment<T extends Alignable>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const scoreDiff = effectiveAlignmentScore(b) - effectiveAlignmentScore(a);
    if (scoreDiff !== 0) return scoreDiff;

    const modelDiff = (b.fit_score ?? -1) - (a.fit_score ?? -1);
    if (modelDiff !== 0) return modelDiff;

    const deadlineA = a.response_deadline
      ? new Date(a.response_deadline).getTime()
      : Infinity;
    const deadlineB = b.response_deadline
      ? new Date(b.response_deadline).getTime()
      : Infinity;
    return deadlineA - deadlineB;
  });
}

export function passesMissionFocus(item: Alignable): boolean {
  const text = buildAlignmentText(item);

  for (const neg of NEGATIVE_SIGNALS) {
    if (neg.pattern.test(text)) return false;
  }

  const modelScore = item.fit_score;
  if (modelScore !== null && modelScore !== undefined && modelScore < 25) return false;

  return true;
}

/** True when notice looks like an invitation-only or closed solicitation. */
export function isInvitationOnlySolicitation(item: Alignable): boolean {
  return FOUNDATION_INVITE_ONLY.test(buildAlignmentText(item));
}

/** Invitation-only notices fail this filter. */
export function isOpenSolicitation(item: Alignable): boolean {
  if (isInvitationOnlySolicitation(item)) return false;
  return true;
}

export function matchFederalAgency(item: Alignable): string | null {
  const haystack = [item.agency, item.title, item.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const agency of FEDERAL_AGENCIES) {
    for (const term of agency.match) {
      try {
        if (new RegExp(term, "i").test(haystack)) return agency.id;
      } catch {
        if (haystack.includes(term.toLowerCase())) return agency.id;
      }
    }
  }
  return null;
}

export function isFederalAgencyOpportunity(item: Alignable): boolean {
  return matchFederalAgency(item) !== null;
}
