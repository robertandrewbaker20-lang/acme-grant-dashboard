import { SEARCH_KEYWORDS } from "../constants";
import type { NormalizedOpportunity, SourceFetchResult } from "./types";

const GRANTS_GOV_SEARCH =
  "https://apply07.grants.gov/grantsws/rest/opportunities/search";

interface GrantsGovHit {
  id: string;
  number: string;
  title: string;
  agency: string;
  agencyCode: string;
  openDate: string;
  closeDate: string;
  oppStatus: string;
  docType: string;
}

export async function fetchGrantsGovOpportunities(
  keywordOverride?: string[],
): Promise<SourceFetchResult> {
  const opportunities: NormalizedOpportunity[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  const keywords = (keywordOverride?.length ? keywordOverride : SEARCH_KEYWORDS).slice(
    0,
    12,
  );

  for (const keyword of keywords) {
    try {
      const response = await fetch(GRANTS_GOV_SEARCH, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          keyword,
          rows: 15,
          startRecordNum: 0,
          oppStatuses: "posted|forecasted",
        }),
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        errors.push(`grants.gov (${keyword}): HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      const hits: GrantsGovHit[] = data.oppHits ?? [];

      for (const hit of hits) {
        if (seen.has(hit.id)) continue;
        seen.add(hit.id);

        opportunities.push({
          notice_id: `grants.gov:${hit.id}`,
          source: "grants.gov",
          title: hit.title,
          description: null,
          solicitation_number: hit.number,
          agency: hit.agency,
          naics_code: null,
          opportunity_type: hit.docType ?? hit.oppStatus,
          posted_date: hit.openDate
            ? new Date(hit.openDate).toISOString()
            : null,
          response_deadline: hit.closeDate
            ? new Date(hit.closeDate).toISOString()
            : null,
          set_aside: null,
          sam_url: `https://www.grants.gov/search-results-detail/${hit.id}`,
          raw_data: { ...hit, source: "grants.gov" },
          status: "new",
        });
      }
    } catch (error) {
      errors.push(
        `grants.gov (${keyword}): ${error instanceof Error ? error.message : "fetch failed"}`,
      );
    }
  }

  return { source: "grants.gov", opportunities, errors };
}
