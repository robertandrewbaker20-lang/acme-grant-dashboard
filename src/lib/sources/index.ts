import { fetchAfwerxOpportunities } from "./afwerx";
import { fetchDarpaOpportunities } from "./darpa";
import { fetchDiuOpportunities } from "./diu";
import { fetchGrantsGovOpportunities } from "./grants-gov";
import { fetchSamGovSource } from "./sam-source";
import type { NormalizedOpportunity, SourceFetchResult } from "./types";

export const ACTIVE_SOURCES = [
  { id: "sam.gov", label: "SAM.gov", description: "Federal contract opportunities" },
  { id: "grants.gov", label: "Grants.gov", description: "Federal grant programs" },
  { id: "darpa", label: "DARPA", description: "R&D opportunities RSS feed" },
  { id: "diu", label: "DIU", description: "Defense Innovation Unit challenges" },
  { id: "afwerx", label: "AFWERX", description: "Air Force innovation via SAM.gov" },
] as const;

export interface SourceFetchOptions {
  searchKeywords?: string[];
  agencyQueries?: string[];
  /** When set, only run fetchers whose source id is in this list. */
  enabledSourceIds?: string[] | null;
}

export async function fetchAllSources(
  options?: SourceFetchOptions,
): Promise<{
  opportunities: NormalizedOpportunity[];
  errors: string[];
  bySource: Record<string, number>;
}> {
  const enabled = options?.enabledSourceIds
    ? new Set(options.enabledSourceIds)
    : null;

  type SourceId = (typeof ACTIVE_SOURCES)[number]["id"];

  const allFetchers: Array<{
    id: SourceId;
    run: () => Promise<SourceFetchResult>;
  }> = [
    {
      id: "sam.gov",
      run: () => fetchSamGovSource(options?.agencyQueries),
    },
    {
      id: "grants.gov",
      run: () => fetchGrantsGovOpportunities(options?.searchKeywords),
    },
    { id: "darpa", run: fetchDarpaOpportunities },
    { id: "diu", run: fetchDiuOpportunities },
    { id: "afwerx", run: fetchAfwerxOpportunities },
  ];

  const fetchers = enabled
    ? allFetchers.filter((f) => enabled.has(f.id))
    : allFetchers;

  // If website filter left no connected feeds, still hit grants.gov + sam with keywords
  const toRun =
    fetchers.length > 0
      ? fetchers
      : allFetchers.filter((f) => f.id === "grants.gov" || f.id === "sam.gov");

  const results = await Promise.all(
    toRun.map((f) =>
      f.run().catch(
        (e): SourceFetchResult => ({
          source: f.id,
          opportunities: [],
          errors: [e instanceof Error ? e.message : "Unknown source error"],
        }),
      ),
    ),
  );

  const seen = new Set<string>();
  const opportunities: NormalizedOpportunity[] = [];
  const errors: string[] = [];
  const bySource: Record<string, number> = {};

  for (const result of results) {
    bySource[result.source] = 0;
    errors.push(...result.errors);

    for (const opp of result.opportunities) {
      if (seen.has(opp.notice_id)) continue;
      seen.add(opp.notice_id);
      opportunities.push(opp);
      bySource[result.source] = (bySource[result.source] ?? 0) + 1;
    }
  }

  return { opportunities, errors, bySource };
}
