import { ALL_NAICS_CODES } from "./constants";
import { parseFundingFromText } from "./opportunity-details";
import type { Opportunity, OpportunityStatus, Recommendation } from "./types";

export type UrgencyLevel = "overdue" | "critical" | "soon" | "comfortable" | "none";

export interface DeadlineUrgency {
  level: UrgencyLevel;
  label: string;
  days: number | null;
  dotClass: string;
  textClass: string;
  bgClass: string;
}

export type MatchScoreState = "scored" | "not_scored" | "scoring" | "unavailable";

export interface MatchScoreStyle {
  scoreLabel: string;
  sublabel: string;
  state: MatchScoreState;
  ringClass: string;
  bgClass: string;
  textClass: string;
  tooltip: string;
}

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  pursue: "Recommended to pursue",
  review: "Worth a closer look",
  pass: "Not recommended",
};

const SOURCE_STYLES: Record<string, { label: string; className: string }> = {
  "sam.gov": { label: "SAM.gov", className: "bg-slate-800 text-slate-100" },
  "grants.gov": { label: "Grants.gov", className: "bg-emerald-700 text-emerald-50" },
  darpa: { label: "DARPA", className: "bg-violet-700 text-violet-50" },
  diu: { label: "DIU", className: "bg-indigo-700 text-indigo-50" },
  afwerx: { label: "AFWERX", className: "bg-sky-700 text-sky-50" },
};

export function sourceBadge(source: string | null | undefined) {
  const key = (source ?? "sam.gov").toLowerCase();
  return SOURCE_STYLES[key] ?? {
    label: key.toUpperCase(),
    className: "bg-slate-700 text-slate-100",
  };
}

export function getDeadlineUrgency(
  deadline: string | null,
  today = new Date(),
): DeadlineUrgency {
  if (!deadline) {
    return {
      level: "none",
      label: "Deadline TBD",
      days: null,
      dotClass: "bg-slate-300",
      textClass: "text-slate-500",
      bgClass: "bg-slate-50 border-slate-200",
    };
  }

  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    return {
      level: "none",
      label: "Deadline TBD",
      days: null,
      dotClass: "bg-slate-300",
      textClass: "text-slate-500",
      bgClass: "bg-slate-50 border-slate-200",
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.ceil((end.getTime() - start.getTime()) / msPerDay);

  if (days < 0) {
    return {
      level: "overdue",
      label: `${Math.abs(days)}d overdue`,
      days,
      dotClass: "bg-red-500",
      textClass: "text-red-700",
      bgClass: "bg-red-50 border-red-200",
    };
  }
  if (days === 0) {
    return {
      level: "critical",
      label: "Due today",
      days,
      dotClass: "bg-red-500",
      textClass: "text-red-700",
      bgClass: "bg-red-50 border-red-200",
    };
  }
  if (days <= 7) {
    return {
      level: "critical",
      label: `${days}d left`,
      days,
      dotClass: "bg-amber-500",
      textClass: "text-amber-800",
      bgClass: "bg-amber-50 border-amber-200",
    };
  }
  if (days <= 30) {
    return {
      level: "soon",
      label: `${days}d left`,
      days,
      dotClass: "bg-blue-500",
      textClass: "text-blue-700",
      bgClass: "bg-blue-50 border-blue-200",
    };
  }

  return {
    level: "comfortable",
    label: `${days}d left`,
    days,
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-200",
  };
}

export function getMatchScoreStyle(
  score: number | null,
  recommendation?: Recommendation | null,
  options?: { state?: MatchScoreState },
): MatchScoreStyle {
  const explicitState = options?.state;

  if (explicitState === "scoring") {
    return {
      scoreLabel: "…",
      sublabel: "Scoring",
      state: "scoring",
      ringClass: "ring-slate-200",
      bgClass: "bg-slate-100",
      textClass: "text-slate-500",
      tooltip: "Acme Match Score is being calculated…",
    };
  }

  if (explicitState === "unavailable") {
    return {
      scoreLabel: "N/A",
      sublabel: "Unavailable",
      state: "unavailable",
      ringClass: "ring-slate-200",
      bgClass: "bg-slate-100",
      textClass: "text-slate-500",
      tooltip: "Score unavailable — evaluation could not be completed. Try re-scoring from the detail page.",
    };
  }

  if (score === null) {
    return {
      scoreLabel: "—",
      sublabel: "Not scored",
      state: "not_scored",
      ringClass: "ring-slate-200",
      bgClass: "bg-slate-100",
      textClass: "text-slate-500",
      tooltip: "Not yet scored — run a scan to generate a Acme Match Score.",
    };
  }

  const outOfTen = (score / 10).toFixed(1);
  const recLabel =
    recommendation && recommendation in RECOMMENDATION_LABELS
      ? RECOMMENDATION_LABELS[recommendation]
      : null;

  if (score >= 80) {
    return {
      scoreLabel: outOfTen,
      sublabel: "match",
      state: "scored",
      ringClass: "ring-emerald-200",
      bgClass: "bg-emerald-500",
      textClass: "text-white",
      tooltip: `Acme Match Score ${outOfTen}/10. Strong profile fit — prioritize review.${recLabel ? ` ${recLabel}.` : ""}`,
    };
  }
  if (score >= 50) {
    return {
      scoreLabel: outOfTen,
      sublabel: "match",
      state: "scored",
      ringClass: "ring-amber-200",
      bgClass: "bg-amber-400",
      textClass: "text-amber-950",
      tooltip: `Acme Match Score ${outOfTen}/10. Worth a closer read before committing.${recLabel ? ` ${recLabel}.` : ""}`,
    };
  }

  const passHint =
    recommendation === "pass" ? ` ${RECOMMENDATION_LABELS.pass}.` : "";
  return {
    scoreLabel: outOfTen,
    sublabel: "match",
    state: "scored",
    ringClass: "ring-slate-200",
    bgClass: "bg-slate-400",
    textClass: "text-white",
    tooltip: `Acme Match Score ${outOfTen}/10.${passHint}`,
  };
}

export function resolveMatchScoreState(
  score: number | null,
  isScanning: boolean,
): MatchScoreState {
  if (score !== null) return "scored";
  if (isScanning) return "scoring";
  return "not_scored";
}

export function buildOpportunityTags(opportunity: {
  naics_code?: string | null;
  set_aside?: string | null;
  opportunity_type?: string | null;
  agency?: string | null;
}): string[] {
  const tags: string[] = [];

  if (opportunity.naics_code) {
    const match = ALL_NAICS_CODES.find((n) => n.code === opportunity.naics_code);
    tags.push(match ? match.description.split(" ").slice(0, 3).join(" ") : `NAICS ${opportunity.naics_code}`);
  }
  if (opportunity.set_aside) tags.push(opportunity.set_aside);
  if (opportunity.opportunity_type) tags.push(opportunity.opportunity_type);

  const agency = opportunity.agency?.toLowerCase() ?? "";
  if (agency.includes("defense") || agency.includes("dod")) tags.push("Defense");
  if (agency.includes("energy") || agency.includes("doe")) tags.push("Energy");
  if (agency.includes("education")) tags.push("Education");
  if (agency.includes("labor") || agency.includes("eta")) tags.push("Workforce");
  if (agency.includes("national science") || agency.includes("nsf")) tags.push("NSF");
  if (agency.includes("agriculture") || agency.includes("usda")) tags.push("USDA");
  if (agency.includes("economic development") || agency.includes("eda")) tags.push("EDA");
  if (agency.includes("delta regional")) tags.push("DRA");
  if (agency.includes("innovation") || opportunity.opportunity_type?.toLowerCase().includes("innovation")) {
    tags.push("Innovation");
  }

  return [...new Set(tags)].slice(0, 4);
}

export function fundingPreview(opportunity: {
  description?: string | null;
  raw_data?: Record<string, unknown>;
}): string | null {
  const raw = opportunity.raw_data ?? {};
  const text = [opportunity.description, JSON.stringify(raw)].filter(Boolean).join("\n");
  const funding = parseFundingFromText(text);
  if (funding.ceiling !== null) return funding.ceilingLabel;
  if (funding.floor !== null) return `From ${funding.floorLabel}`;
  return null;
}

export function truncateText(text: string | null | undefined, max = 140): string | null {
  if (!text?.trim()) return null;
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

export function formatShortDate(date: string | null) {
  if (!date) return "TBD";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  qualified: "High potential",
  rejected: "Passed",
  applied: "Applied",
  archived: "Archived",
};

export interface OpportunityCardData {
  id: string;
  title: string;
  agency: string | null;
  response_deadline: string | null;
  fit_score: number | null;
  recommendation: Recommendation | null;
  fitFactors: string[];
  source: string | null;
  description: string | null;
  fundingLabel: string | null;
  tags: string[];
  status: OpportunityStatus;
  officialUrl: string | null;
}

/** Left accent on cards — score beats urgency so the eye finds fit first */
export function getCardAccentClass(
  fitScore: number | null,
  deadline: string | null,
): string {
  if (fitScore !== null && fitScore >= 80) return "border-l-[3px] border-l-emerald-500";
  if (fitScore !== null && fitScore >= 50) return "border-l-[3px] border-l-amber-400";
  const urgency = getDeadlineUrgency(deadline);
  if (urgency.level === "overdue" || urgency.level === "critical") {
    return "border-l-[3px] border-l-red-400";
  }
  if (urgency.level === "soon") return "border-l-[3px] border-l-sky-400";
  return "border-l-[3px] border-l-slate-200";
}

export function toCardData(
  opportunity: Opportunity & {
    fit_score?: number | null;
    recommendation?: Recommendation | null;
  },
): OpportunityCardData {
  return {
    id: opportunity.id,
    title: opportunity.title,
    agency: opportunity.agency,
    response_deadline: opportunity.response_deadline,
    fit_score: opportunity.fit_score ?? null,
    recommendation: opportunity.recommendation ?? null,
    fitFactors:
      "fitFactors" in opportunity && Array.isArray(opportunity.fitFactors)
        ? opportunity.fitFactors
        : [],
    source: opportunity.source ?? "sam.gov",
    description: truncateText(opportunity.description, 160),
    fundingLabel: fundingPreview(opportunity),
    tags: buildOpportunityTags(opportunity),
    status: opportunity.status,
    officialUrl: opportunity.sam_url,
  };
}