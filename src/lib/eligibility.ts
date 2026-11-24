import { ALL_NAICS_CODES } from "./constants";
import type { OpportunityDetail } from "./opportunity-details";

export type EligibilityVerdict =
  | "eligible"
  | "likely_eligible"
  | "verify_manually"
  | "ineligible";

export type CheckStatus = "pass" | "fail" | "unknown" | "review";

export interface EligibilityCheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface EligibilityAssessment {
  verdict: EligibilityVerdict;
  headline: string;
  summary: string;
  checklist: EligibilityCheckItem[];
  blockers: string[];
}

const RESTRICTED_SET_ASIDE =
  /8\s*\(\s*a\s*\)|hubzone|sdvosb|service[- ]disabled veteran|wosb|woman[- ]owned|edwosb|indian (small business|economic)|abilityone|jwod/i;

const NONPROFIT_BLOCKERS = [
  /for[- ]?profit (only|entities only|organizations only)/i,
  /commercial (entities|organizations) only/i,
  /private (sector|business) (only|entities only)/i,
  /not eligible.*nonprofit/i,
  /nonprofits? (are )?not eligible/i,
];

const NONPROFIT_POSITIVE = [
  /nonprofit|501\s*\(\s*c\s*\)\s*\(\s*3\s*\)/i,
  /eligible applicants.*nonprofit/i,
  /nonprofit organizations? (may|can) apply/i,
];

const PROCUREMENT_SIGNALS = [
  /idiq|bpa\b|firm[- ]fixed[- ]price|supply schedule|sewp/i,
  /maintenance contract|preventive maintenance/i,
];

const GEO_PATTERNS = [
  /within the state of ([A-Za-z ]+)/i,
  /must be located in ([A-Za-z ,]+)/i,
  /geographic (area|restriction|limitation)/i,
  /eligible entities.*(?:located|based) in/i,
];

function buildHaystack(detail: OpportunityDetail): string {
  const { opportunity, descriptionText, evaluation } = detail;
  return [
    opportunity.title,
    opportunity.description,
    descriptionText,
    opportunity.set_aside,
    opportunity.opportunity_type,
    evaluation?.summary,
    ...(evaluation?.concerns ?? []),
  ]
    .filter(Boolean)
    .join("\n");
}

function checkEntityType(text: string): EligibilityCheckItem {
  for (const pattern of NONPROFIT_BLOCKERS) {
    const match = text.match(pattern);
    if (match) {
      return {
        id: "entity",
        label: "Nonprofit eligibility",
        status: "fail",
        detail: `Notice restricts applicants: “${match[0]}”. Acme cannot lead as a 501(c)(3).`,
      };
    }
  }

  for (const pattern of NONPROFIT_POSITIVE) {
    const match = text.match(pattern);
    if (match) {
      return {
        id: "entity",
        label: "Nonprofit eligibility",
        status: "pass",
        detail: `Notice references nonprofit eligibility: “${match[0]}”.`,
      };
    }
  }

  return {
    id: "entity",
    label: "Nonprofit eligibility",
    status: "review",
    detail:
      "Confirm the solicitation allows 501(c)(3) nonprofits as lead applicant or prime recipient.",
  };
}

function checkSetAside(
  setAside: string | null | undefined,
  text: string,
): EligibilityCheckItem {
  const value = [setAside, text.match(/set[- ]aside[:\s]+([^\n.;]{3,80})/i)?.[1]]
    .filter(Boolean)
    .join(" ");

  if (!value.trim()) {
    return {
      id: "set_aside",
      label: "Set-aside restrictions",
      status: "pass",
      detail: "No set-aside identified — open competition assumed.",
    };
  }

  if (RESTRICTED_SET_ASIDE.test(value)) {
    return {
      id: "set_aside",
      label: "Set-aside restrictions",
      status: "fail",
      detail: `Restricted set-aside detected (${setAside ?? "see notice"}) — verify Acme qualifies.`,
    };
  }

  if (/nonprofit|501\s*\(\s*c\s*\)/i.test(value)) {
    return {
      id: "set_aside",
      label: "Set-aside restrictions",
      status: "pass",
      detail: `Nonprofit-friendly set-aside: ${setAside ?? value.trim()}.`,
    };
  }

  if (/small business|unrestricted|full and open|no set[- ]aside/i.test(value)) {
    return {
      id: "set_aside",
      label: "Set-aside restrictions",
      status: "review",
      detail: `${setAside ?? "Set-aside noted"} — confirm Acme meets small-business or unrestricted rules.`,
    };
  }

  return {
    id: "set_aside",
    label: "Set-aside restrictions",
    status: "review",
    detail: `${setAside ?? "Set-aside language found"} — confirm Acme qualifies.`,
  };
}

function checkPartners(detail: OpportunityDetail): EligibilityCheckItem {
  const { partners } = detail;

  if (partners.partnersRequired) {
    const labels = [...new Set(partners.partnerTypes.map((p) => p.label))].join(
      ", ",
    );
    return {
      id: "partners",
      label: "Partner requirements",
      status: "review",
      detail: labels
        ? `Partners likely required (${labels}). Confirm teaming plan before applying.`
        : "Partners likely required — identify mandatory teaming roles in the official notice.",
    };
  }

  if (partners.partnerTypes.length > 0) {
    const labels = [...new Set(partners.partnerTypes.map((p) => p.label))].join(
      ", ",
    );
    return {
      id: "partners",
      label: "Partner requirements",
      status: "review",
      detail: `Optional partners mentioned (${labels}). Acme may lead if solicitation allows solo applicants.`,
    };
  }

  if (partners.canApplySolo) {
    return {
      id: "partners",
      label: "Partner requirements",
      status: "pass",
      detail: "No mandatory partners identified — Acme may apply as lead nonprofit.",
    };
  }

  return {
    id: "partners",
    label: "Partner requirements",
    status: "unknown",
    detail:
      "Teaming rules unclear from scraped text — check the solicitation for lead/subaward structure.",
  };
}

function checkInstrumentType(
  opportunityType: string | null | undefined,
  source: string | null | undefined,
  text: string,
): EligibilityCheckItem {
  if (source === "grants.gov") {
    return {
      id: "instrument",
      label: "Funding instrument",
      status: "pass",
      detail: "Grants.gov listing — typically a grant or cooperative agreement, not procurement.",
    };
  }

  for (const pattern of PROCUREMENT_SIGNALS) {
    const match = text.match(pattern);
    if (match) {
      return {
        id: "instrument",
        label: "Funding instrument",
        status: "fail",
        detail: `Procurement-style language detected (“${match[0]}”) — likely not a nonprofit grant pathway.`,
      };
    }
  }

  if (/cooperative agreement|grant\b|assistance listing/i.test(text)) {
    return {
      id: "instrument",
      label: "Funding instrument",
      status: "pass",
      detail: "Grant or cooperative agreement language found.",
    };
  }

  return {
    id: "instrument",
    label: "Funding instrument",
    status: "review",
    detail: `${opportunityType ?? "Opportunity type not specified"} — confirm this is assistance (grant/CA), not a contract.`,
  };
}

function checkGeography(text: string): EligibilityCheckItem {
  for (const pattern of GEO_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        id: "geography",
        label: "Geographic eligibility",
        status: "review",
        detail: `Geographic requirement detected: “${match[0]}”. Confirm Acme or partners meet location rules.`,
      };
    }
  }

  return {
    id: "geography",
    label: "Geographic eligibility",
    status: "unknown",
    detail: "No geographic restrictions detected in scraped notice text.",
  };
}

function checkCostShare(detail: OpportunityDetail): EligibilityCheckItem {
  const text = buildHaystack(detail);
  const matchText = detail.matchRequirements;

  if (
    /no (cash )?match|matching funds not required|no cost share|no non-federal match|match not required/i.test(
      text,
    )
  ) {
    return {
      id: "cost_share",
      label: "No cash match",
      status: "pass",
      detail: "Notice indicates no cash match / cost share required — preferred for Acme.",
    };
  }

  if (/matching funds|cost share|non-federal match|cash match/i.test(text + " " + matchText)) {
    return {
      id: "cost_share",
      label: "No cash match",
      status: "review",
      detail: matchText || "Matching funds or cost share may be required — verify rate and cash vs in-kind.",
    };
  }

  return {
    id: "cost_share",
    label: "No cash match",
    status: "unknown",
    detail: "No matching funds language found — confirm in the official notice.",
  };
}

function checkIndirectCosts(text: string): EligibilityCheckItem {
  if (
    /indirect cost|facilities and administrative|f&a|\bidc\b|negotiated rate|de minimis/i.test(
      text,
    )
  ) {
    if (/indirect costs? (not|are not) allowed|no indirect|idc not allowed/i.test(text)) {
      return {
        id: "indirect_costs",
        label: "Indirect costs allowed",
        status: "fail",
        detail: "Notice appears to disallow indirect costs — flag for finance review.",
      };
    }
    return {
      id: "indirect_costs",
      label: "Indirect costs allowed",
      status: "pass",
      detail: "Indirect / F&A / IDC language found — preferred for Acme as lead applicant.",
    };
  }

  return {
    id: "indirect_costs",
    label: "Indirect costs allowed",
    status: "unknown",
    detail: "No IDC / F&A language in scraped text — confirm allowability in the NOFO budget section.",
  };
}

function checkOperatingExpenses(text: string): EligibilityCheckItem {
  if (
    /capital only|construction only|equipment only|no personnel|salaries not allowed/i.test(
      text,
    )
  ) {
    return {
      id: "operating_expenses",
      label: "Funds operating expenses",
      status: "review",
      detail:
        "Notice may limit spending to capital/equipment — confirm whether personnel and operating costs are allowed.",
    };
  }

  if (
    /operating (expense|cost|support)|personnel cost|salary|staffing|program operations|administrative cost/i.test(
      text,
    )
  ) {
    return {
      id: "operating_expenses",
      label: "Funds operating expenses",
      status: "pass",
      detail: "Notice references personnel, program, or operating costs — good fit for Acme PM delivery.",
    };
  }

  return {
    id: "operating_expenses",
    label: "Funds operating expenses",
    status: "unknown",
    detail: "Confirm budget allows operating expenses and program delivery costs, not only capital.",
  };
}

function checkLeadApplicant(text: string): EligibilityCheckItem {
  if (
    /for[- ]?profit (only|entities only|organizations only)|commercial (entities|organizations) only/i.test(
      text,
    )
  ) {
    return {
      id: "lead_applicant",
      label: "501(c)(3) lead applicant",
      status: "fail",
      detail: "Notice restricts lead applicants away from nonprofits.",
    };
  }

  if (
    /nonprofit.*(lead|prime|applicant)|501\s*\(\s*c\s*\)\s*\(\s*3\s*\).*(eligible|may apply|lead)|eligible applicants.*nonprofit/i.test(
      text,
    )
  ) {
    return {
      id: "lead_applicant",
      label: "501(c)(3) lead applicant",
      status: "pass",
      detail: "Nonprofit / 501(c)(3) may apply as lead — aligns with Acme's preferred role.",
    };
  }

  if (/subrecipient only|must be a university|institutions of higher education only/i.test(text)) {
    return {
      id: "lead_applicant",
      label: "501(c)(3) lead applicant",
      status: "review",
      detail:
        "Lead role may be restricted (e.g. IHE-only). Acme may still partner as subrecipient or co-applicant.",
    };
  }

  return {
    id: "lead_applicant",
    label: "501(c)(3) lead applicant",
    status: "review",
    detail: "Confirm 501(c)(3) nonprofits can serve as lead applicant in the official eligibility section.",
  };
}

function checkNaics(naicsCode: string | null | undefined): EligibilityCheckItem {
  if (!naicsCode) {
    return {
      id: "naics",
      label: "NAICS alignment",
      status: "unknown",
      detail: "No NAICS code on record — verify code requirements in the solicitation.",
    };
  }

  const match = ALL_NAICS_CODES.find((entry) => entry.code === naicsCode);
  if (match) {
    return {
      id: "naics",
      label: "NAICS alignment",
      status: "pass",
      detail: `${naicsCode} (${match.description}) aligns with Acme service areas.`,
    };
  }

  return {
    id: "naics",
    label: "NAICS alignment",
    status: "review",
    detail: `${naicsCode} is outside Acme's core NAICS list — confirm the code is eligible and competitive.`,
  };
}

function deriveVerdict(
  checklist: EligibilityCheckItem[],
  blockers: string[],
  score: number | null,
  recommendation: string | null | undefined,
): Pick<EligibilityAssessment, "verdict" | "headline" | "summary"> {
  const failures = checklist.filter((item) => item.status === "fail");
  const reviews = checklist.filter(
    (item) => item.status === "review" || item.status === "unknown",
  );

  if (blockers.length > 0 || failures.length > 0 || recommendation === "pass") {
    const reason =
      blockers[0] ??
      failures[0]?.detail ??
      "Fit assessment recommends passing on this opportunity.";
    return {
      verdict: "ineligible",
      headline: "Not eligible — blockers found",
      summary: reason,
    };
  }

  if (score === null && !recommendation) {
    return {
      verdict: "verify_manually",
      headline: "Verify eligibility manually",
      summary:
        "No fit assessment yet. Use the checklist below against the official notice before pursuing.",
    };
  }

  if (recommendation === "pursue" && reviews.length === 0) {
    return {
      verdict: "eligible",
      headline: "Eligible to pursue",
      summary:
        "Notice text and fit assessment indicate Acme can likely lead this opportunity. Confirm any items marked for review in the official solicitation.",
    };
  }

  if (
    recommendation === "pursue" ||
    (score !== null && score >= 70 && reviews.length <= 1)
  ) {
    return {
      verdict: "likely_eligible",
      headline: "Likely eligible — confirm remaining items",
      summary:
        "Strong profile fit with a few solicitation details still to verify manually.",
    };
  }

  return {
    verdict: "verify_manually",
    headline: "Verify eligibility manually",
    summary:
      "Eligibility is unclear from scraped data alone. Work through the checklist against the official notice before committing resources.",
  };
}

export function assessEligibility(detail: OpportunityDetail): EligibilityAssessment {
  const text = buildHaystack(detail);
  const { opportunity, evaluation } = detail;
  const score = detail.alignmentScore;
  const recommendation = evaluation?.recommendation;

  const checklist: EligibilityCheckItem[] = [
    checkEntityType(text),
    checkLeadApplicant(text),
    checkSetAside(opportunity.set_aside, text),
    checkPartners(detail),
    checkInstrumentType(opportunity.opportunity_type, opportunity.source, text),
    checkGeography(text),
    checkCostShare(detail),
    checkIndirectCosts(text),
    checkOperatingExpenses(text),
    checkNaics(opportunity.naics_code),
  ];

  const blockers = (evaluation?.concerns ?? []).filter((concern) =>
    /not eligible|for-?profit only|prime only|procurement|maintenance|hvac|ineligible|cannot apply/i.test(
      concern,
    ),
  );

  const derived = deriveVerdict(checklist, blockers, score, recommendation);

  return {
    ...derived,
    checklist,
    blockers,
  };
}

/** @deprecated Use assessEligibility for structured results. */
export function eligibilityStatus(detail: OpportunityDetail): string {
  return assessEligibility(detail).headline;
}