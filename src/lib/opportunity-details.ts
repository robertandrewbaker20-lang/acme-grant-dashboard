import { ALL_NAICS_CODES } from "./constants";
import { parsePartnerRequirements, type PartnerRequirements } from "./partner-requirements";
import {
  getGrantsGovAwardBlock,
  parseGrantsGovAwardValue,
  type GrantsGovDetailsResponse,
} from "./grants-gov-details";
import type { Evaluation, Opportunity, Recommendation } from "./types";

export interface PointOfContact {
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
}

export interface FundingRange {
  floor: number | null;
  ceiling: number | null;
  floorLabel: string;
  ceilingLabel: string;
}

export interface LoiInfo {
  required: boolean;
  dueDate: string | null;
  summary: string;
}

export interface OpportunityDetail {
  opportunity: Opportunity;
  evaluation: Evaluation | null;
  alignmentScore: number | null;
  alignmentLabel: string;
  pipelineLane: string;
  category: string;
  recordId: string;
  primaryPoc: PointOfContact | null;
  secondaryPocs: PointOfContact[];
  applicationDueDate: string | null;
  loi: LoiInfo;
  funding: FundingRange;
  descriptionText: string | null;
  placeOfPerformance: string | null;
  setAsideDescription: string | null;
  consortiumStatus: string;
  matchRequirements: string;
  trackingCycle: string;
  webinarDetails: string;
  missionAbstract: string;
  nofoSummary: string;
  partners: PartnerRequirements;
}

export type { PartnerRequirements };

type RawSam = Record<string, unknown>;

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function parsePocList(raw: RawSam): PointOfContact[] {
  const contacts = raw.pointOfContact;
  if (!Array.isArray(contacts)) return [];

  return contacts
    .map((c) => {
      const contact = c as Record<string, string>;
      const name = contact.fullName?.trim();
      if (!name) return null;
      return {
        name,
        email: contact.email?.trim() || null,
        phone: contact.phone?.trim() ? formatPhone(contact.phone.trim()) : null,
        type: contact.type ?? "primary",
      };
    })
    .filter((c): c is PointOfContact => c !== null);
}

function parseMoney(value: string): number | null {
  const match = value.match(/\$?\s*([\d,]+(?:\.\d+)?)\s*(million|billion|m|b)?/i);
  if (!match) return null;
  let amount = parseFloat(match[1].replace(/,/g, ""));
  const unit = match[2]?.toLowerCase();
  if (unit === "million" || unit === "m") amount *= 1_000_000;
  if (unit === "billion" || unit === "b") amount *= 1_000_000_000;
  return Number.isFinite(amount) ? amount : null;
}

function formatMoney(amount: number | null): string {
  if (amount === null) return "Not specified";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function mergeFundingFromRaw(
  raw: RawSam,
  fallback: FundingRange,
): FundingRange {
  const grantsBlock = getGrantsGovAwardBlock(raw as GrantsGovDetailsResponse);
  if (grantsBlock) {
    const ceiling =
      parseGrantsGovAwardValue(
        grantsBlock.awardCeiling ?? grantsBlock.awardCeilingFormatted,
      ) ?? fallback.ceiling;
    const floor =
      parseGrantsGovAwardValue(
        grantsBlock.awardFloor ?? grantsBlock.awardFloorFormatted,
      ) ?? fallback.floor;
    if (ceiling !== null || floor !== null) {
      return {
        floor,
        ceiling,
        floorLabel: formatMoney(floor),
        ceilingLabel: formatMoney(ceiling),
      };
    }
  }

  const fundingFromRaw = raw.award as Record<string, unknown> | null;
  if (fundingFromRaw) {
    const ceiling =
      parseMoney(String(fundingFromRaw.awardCeiling ?? fundingFromRaw.ceiling ?? "")) ??
      fallback.ceiling;
    const floor =
      parseMoney(String(fundingFromRaw.awardFloor ?? fundingFromRaw.floor ?? "")) ??
      fallback.floor;
    return {
      floor,
      ceiling,
      floorLabel: formatMoney(floor),
      ceilingLabel: formatMoney(ceiling),
    };
  }

  return fallback;
}

export function parseFundingFromText(text: string): FundingRange {
  const ceilingPatterns = [
    /(?:maximum|ceiling|not to exceed|up to|award amount|total.*funding)[^.;\n]{0,80}\$[\d,]+(?:\.\d+)?\s*(?:million|billion)?/gi,
    /\$[\d,]+(?:\.\d+)?\s*(?:million|billion)?[^.\n]{0,40}(?:maximum|ceiling)/gi,
  ];
  const floorPatterns = [
    /(?:minimum|floor|at least)[^.;\n]{0,80}\$[\d,]+(?:\.\d+)?\s*(?:million|billion)?/gi,
  ];

  let ceiling: number | null = null;
  let floor: number | null = null;

  for (const pattern of ceilingPatterns) {
    const match = text.match(pattern);
    if (match?.[0]) {
      ceiling = parseMoney(match[0]);
      if (ceiling) break;
    }
  }

  for (const pattern of floorPatterns) {
    const match = text.match(pattern);
    if (match?.[0]) {
      floor = parseMoney(match[0]);
      if (floor) break;
    }
  }

  return {
    floor,
    ceiling,
    floorLabel: formatMoney(floor),
    ceilingLabel: formatMoney(ceiling),
  };
}

export function parseLoiFromText(text: string): LoiInfo {
  const lower = text.toLowerCase();
  const required =
    /letter of intent|loi required|intent to apply|pre-proposal required/i.test(
      text,
    ) && !/no letter of intent|loi not required|no loi/i.test(lower);

  const dueMatch = text.match(
    /(?:letter of intent|loi)[^.;\n]{0,120}(?:due|deadline)[^.;\n]{0,60}(\d{1,2}\/\d{1,2}\/\d{2,4}|\w+ \d{1,2},? \d{4})/i,
  );

  if (!required) {
    return {
      required: false,
      dueDate: null,
      summary: "No LOI mandated prior to full proposal submit.",
    };
  }

  return {
    required: true,
    dueDate: dueMatch?.[1] ?? null,
    summary: dueMatch
      ? `Letter of intent due ${dueMatch[1]}`
      : "Letter of intent required — see official notice for date.",
  };
}

function getPipelineLane(status: Opportunity["status"]): string {
  switch (status) {
    case "reviewing":
      return "UNDER REVIEW";
    case "qualified":
      return "HIGH POTENTIAL";
    case "applied":
      return "DECISION — APPLY";
    case "archived":
      return "DECISION — PASS";
    case "rejected":
      return "PASSED";
    default:
      return "NEW";
  }
}

function getCategory(naicsCode: string | null): string {
  if (!naicsCode) return "GENERAL";
  const match = ALL_NAICS_CODES.find((n) => n.code === naicsCode);
  if (!match) return `NAICS ${naicsCode}`;
  const words = match.description.split(" ");
  return words.slice(0, 2).join(" ").toUpperCase();
}

function alignmentLabel(
  score: number | null,
  recommendation: Recommendation | null,
): string {
  if (score === null) return "Not yet scored";
  const outOfTen = (score / 10).toFixed(1);
  if (score >= 80) return `High alignment priority (${outOfTen}/10)`;
  if (score >= 50) return `Moderate alignment (${outOfTen}/10)`;
  if (recommendation === "pass") return `Low alignment — not recommended (${outOfTen}/10)`;
  if (recommendation === "pursue") return `Recommended to pursue (${outOfTen}/10)`;
  return `Under review (${outOfTen}/10)`;
}

export function buildOpportunityDetail(
  opportunity: Opportunity,
  evaluation: Evaluation | null,
  descriptionText: string | null,
): OpportunityDetail {
  const raw = (opportunity.raw_data ?? {}) as RawSam;
  const pocs = parsePocList(raw);
  const primaryPoc = pocs.find((p) => p.type === "primary") ?? pocs[0] ?? null;
  const secondaryPocs = pocs.filter((p) => p !== primaryPoc);

  const combinedText = [
    opportunity.description,
    descriptionText,
    evaluation?.summary,
  ]
    .filter(Boolean)
    .join("\n");

  let funding = parseFundingFromText(combinedText);
  funding = mergeFundingFromRaw(raw, funding);

  const loi = parseLoiFromText(combinedText);
  const pop = raw.placeOfPerformance as Record<string, string> | undefined;
  const placeOfPerformance = pop
    ? [pop.streetAddress, pop.city, pop.state, pop.zip].filter(Boolean).join(", ")
    : null;

  const score = evaluation?.fit_score ?? null;

  return {
    opportunity,
    evaluation,
    alignmentScore: score,
    alignmentLabel: alignmentLabel(score, evaluation?.recommendation ?? null),
    pipelineLane: getPipelineLane(opportunity.status),
    category: getCategory(opportunity.naics_code),
    recordId:
      opportunity.notice_id.length <= 24
        ? opportunity.notice_id
        : opportunity.notice_id.slice(0, 12),
    primaryPoc,
    secondaryPocs,
    applicationDueDate: opportunity.response_deadline,
    loi,
    funding,
    descriptionText,
    placeOfPerformance,
    setAsideDescription:
      (raw.typeOfSetAsideDescription as string) ??
      opportunity.set_aside ??
      "No set-aside specified",
    consortiumStatus: parsePartnerRequirements(combinedText).summary,
    matchRequirements: /matching funds|cost share|non-federal match/i.test(
      combinedText,
    )
      ? "Matching funds may be required — review official notice"
      : "No non-federal matching funds identified in notice text",
    trackingCycle: /annual/i.test(combinedText)
      ? "Annual competitive cycle"
      : "Competitive opportunity — see official notice for cycle",
    webinarDetails: /webinar|briefing|information session|industry day/i.test(
      combinedText,
    )
      ? "Informational session referenced in notice — check SAM.gov link"
      : "No agency briefings recorded in scraped notice",
    missionAbstract:
      descriptionText?.slice(0, 600) ??
      opportunity.description ??
      `No extended scope narrative available. Open the official ${opportunity.source === "grants.gov" ? "Grants.gov" : "SAM.gov"} notice for full details.`,
    nofoSummary:
      evaluation?.summary ??
      "No pre-scraped Notice of Funding Opportunity rule highlights recorded. Check official website link above.",
    partners: parsePartnerRequirements(combinedText),
  };
}

