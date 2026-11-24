import { CORE_NAICS_CODES } from "./constants";
import type { SamGovOpportunity } from "./types";

const SAM_GOV_BASE = "https://api.sam.gov/opportunities/v2/search";
const SAM_DESC_BASE = "https://api.sam.gov/prod/opportunities/v1/noticedesc";

export interface SamGovSearchOptions {
  naicsCode?: string;
  keyword?: string;
  postedFrom?: string;
  postedTo?: string;
  limit?: number;
  offset?: number;
  procurementType?: string;
}

function formatSamDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function getDefaultDateRange() {
  const postedTo = new Date();
  const postedFrom = new Date();
  postedFrom.setDate(postedFrom.getDate() - 30);
  return {
    postedFrom: formatSamDate(postedFrom),
    postedTo: formatSamDate(postedTo),
  };
}

export async function fetchNoticeDescription(
  noticeId: string,
): Promise<string | null> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({ noticeid: noticeId, api_key: apiKey });
    const response = await fetch(`${SAM_DESC_BASE}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.description === "string" ? data.description : null;
  } catch {
    return null;
  }
}

export async function searchSamGov(
  options: SamGovSearchOptions = {},
): Promise<{ opportunities: SamGovOpportunity[]; totalRecords: number }> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) {
    throw new Error("SAM_GOV_API_KEY is not configured");
  }

  const defaults = getDefaultDateRange();
  const params = new URLSearchParams({
    api_key: apiKey,
    postedFrom: options.postedFrom ?? defaults.postedFrom,
    postedTo: options.postedTo ?? defaults.postedTo,
    limit: String(options.limit ?? 25),
    offset: String(options.offset ?? 0),
    ptype: options.procurementType ?? "o",
  });

  if (options.naicsCode) params.set("ncode", options.naicsCode);
  if (options.keyword) params.set("title", options.keyword);

  const response = await fetch(`${SAM_GOV_BASE}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SAM.gov API error (${response.status}): ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const opportunities: SamGovOpportunity[] = data.opportunitiesData ?? [];

  return {
    opportunities,
    totalRecords: data.totalRecords ?? opportunities.length,
  };
}

export async function searchAllCoreNaics(
  limitPerCode = 10,
): Promise<SamGovOpportunity[]> {
  const seen = new Set<string>();
  const results: SamGovOpportunity[] = [];

  for (const { code } of CORE_NAICS_CODES) {
    try {
      const { opportunities } = await searchSamGov({
        naicsCode: code,
        limit: limitPerCode,
      });

      for (const opp of opportunities) {
        const id = opp.noticeId ?? opp.solicitationNumber;
        if (id && !seen.has(id)) {
          seen.add(id);
          results.push(opp);
        }
      }
    } catch (error) {
      console.error(`SAM.gov search failed for NAICS ${code}:`, error);
    }
  }

  return results;
}

export function mapSamOpportunityToRecord(opp: SamGovOpportunity) {
  const noticeId = opp.noticeId;
  if (!noticeId) return null;

  const poc = Array.isArray(
    (opp as Record<string, unknown>).pointOfContact,
  )
    ? ((opp as Record<string, unknown>).pointOfContact as Record<string, string>[])
    : [];
  const primary = poc.find((p) => p.type === "primary") ?? poc[0];

  return {
    notice_id: noticeId,
    title: opp.title ?? "Untitled Opportunity",
    description: opp.description ?? null,
    solicitation_number: opp.solicitationNumber ?? null,
    agency: opp.fullParentPathName ?? null,
    naics_code: opp.naicsCode ?? null,
    opportunity_type: opp.type ?? null,
    posted_date: opp.postedDate ? new Date(opp.postedDate).toISOString() : null,
    response_deadline: opp.responseDeadLine
      ? new Date(opp.responseDeadLine).toISOString()
      : null,
    set_aside: opp.setAside ?? null,
    sam_url: opp.uiLink ?? `https://sam.gov/opp/${noticeId}/view`,
    raw_data: {
      ...opp,
      poc_name: primary?.fullName ?? null,
      poc_email: primary?.email ?? null,
      poc_phone: primary?.phone ?? null,
    },
    status: "new" as const,
  };
}