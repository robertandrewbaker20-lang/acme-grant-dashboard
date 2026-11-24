import { searchSamGov } from "../sam-gov";
import type { NormalizedOpportunity, SourceFetchResult } from "./types";
import { mapSamToNormalized } from "./sam-source";

const AFWERX_QUERIES = ["AFWERX", "AFRL", "Air Force innovation"];

export async function fetchAfwerxOpportunities(): Promise<SourceFetchResult> {
  const opportunities: NormalizedOpportunity[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const keyword of AFWERX_QUERIES) {
    try {
      const { opportunities: hits } = await searchSamGov({
        keyword,
        limit: 15,
        procurementType: "o",
      });

      for (const hit of hits) {
        const id = hit.noticeId;
        if (!id || seen.has(id)) continue;

        const agency = hit.fullParentPathName ?? "";
        if (
          !/afwerx|air force research|afwer|afrl/i.test(agency) &&
          !/afwerx|air force/i.test(hit.title ?? "")
        ) {
          continue;
        }

        seen.add(id);
        const normalized = mapSamToNormalized(hit);
        if (normalized) {
          opportunities.push({
            ...normalized,
            source: "afwerx",
            notice_id: `afwerx:${id}`,
            agency: agency || "AFWERX / Air Force",
          });
        }
      }
    } catch (error) {
      errors.push(
        `afwerx (${keyword}): ${error instanceof Error ? error.message : "fetch failed"}`,
      );
    }
  }

  return { source: "afwerx", opportunities, errors };
}