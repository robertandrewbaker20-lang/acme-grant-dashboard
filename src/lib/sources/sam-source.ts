import { SAM_AGENCY_QUERIES } from "../constants";
import { mapSamOpportunityToRecord, searchAllCoreNaics, searchSamGov } from "../sam-gov";
import type { SamGovOpportunity } from "../types";
import type { NormalizedOpportunity, SourceFetchResult } from "./types";

export function mapSamToNormalized(
  opp: SamGovOpportunity,
): NormalizedOpportunity | null {
  const record = mapSamOpportunityToRecord(opp);
  if (!record) return null;

  return {
    ...record,
    source: "sam.gov",
    notice_id: `sam.gov:${record.notice_id}`,
    raw_data: record.raw_data as Record<string, unknown>,
  };
}

export async function fetchSamGovSource(
  agencyQueryOverride?: string[],
): Promise<SourceFetchResult> {
  const opportunities: NormalizedOpportunity[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  try {
    const core = await searchAllCoreNaics(8);
    for (const opp of core) {
      const normalized = mapSamToNormalized(opp);
      if (normalized && !seen.has(normalized.notice_id)) {
        seen.add(normalized.notice_id);
        opportunities.push(normalized);
      }
    }
  } catch (error) {
    errors.push(`sam.gov NAICS: ${error instanceof Error ? error.message : "failed"}`);
  }

  const agencyQueries = agencyQueryOverride?.length
    ? agencyQueryOverride
    : SAM_AGENCY_QUERIES;

  for (const agency of agencyQueries) {
    try {
      const { opportunities: hits } = await searchSamGov({
        keyword: agency,
        limit: 15,
      });
      for (const opp of hits) {
        const normalized = mapSamToNormalized(opp);
        if (normalized && !seen.has(normalized.notice_id)) {
          seen.add(normalized.notice_id);
          opportunities.push(normalized);
        }
      }
    } catch (error) {
      errors.push(
        `sam.gov (${agency}): ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  }

  return { source: "sam.gov", opportunities, errors };
}
