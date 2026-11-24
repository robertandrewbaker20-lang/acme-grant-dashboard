import {
  extractGrantsGovOppId,
  fetchGrantsGovOpportunityDetails,
  getGrantsGovAwardBlock,
  grantsGovDescriptionFromDetails,
  hasGrantsGovAwardData,
  mergeGrantsGovDetailsIntoRaw,
  stripGrantsGovHtml,
  type GrantsGovDetailsResponse,
} from "./grants-gov-details";
import { fetchNoticeDescription } from "./sam-gov";
import { createServerClient } from "./supabase/server";
import type { Opportunity } from "./types";

export interface OpportunityEnrichment {
  descriptionText: string | null;
  rawData: Record<string, unknown>;
}

export async function enrichOpportunity(
  opportunity: Opportunity,
): Promise<OpportunityEnrichment> {
  const raw = (opportunity.raw_data ?? {}) as Record<string, unknown>;
  const source = opportunity.source ?? "sam.gov";

  if (source === "grants.gov") {
    return enrichGrantsGov(opportunity, raw);
  }

  const descriptionText = await fetchNoticeDescription(opportunity.notice_id);
  return { descriptionText, rawData: raw };
}

async function enrichGrantsGov(
  opportunity: Opportunity,
  raw: Record<string, unknown>,
): Promise<OpportunityEnrichment> {
  if (hasGrantsGovAwardData(raw)) {
    const block = getGrantsGovAwardBlock(raw as GrantsGovDetailsResponse);
    const html = block?.synopsisDesc ?? block?.forecastDesc;
    return {
      descriptionText: html
        ? stripGrantsGovHtml(html)
        : opportunity.description,
      rawData: raw,
    };
  }

  const oppId = extractGrantsGovOppId(opportunity.notice_id);
  if (!oppId) {
    return { descriptionText: opportunity.description, rawData: raw };
  }

  const details = await fetchGrantsGovOpportunityDetails(oppId);
  if (!details) {
    return { descriptionText: opportunity.description, rawData: raw };
  }

  const mergedRaw = mergeGrantsGovDetailsIntoRaw(raw, details);
  const descriptionText = grantsGovDescriptionFromDetails(details);
  const deadline = parseGrantsGovDeadline(details);

  try {
    const supabase = createServerClient();
    await supabase
      .from("opportunities")
      .update({
        raw_data: mergedRaw,
        description: descriptionText ?? opportunity.description,
        ...(deadline ? { response_deadline: deadline } : {}),
      })
      .eq("id", opportunity.id);
  } catch {
    // Non-fatal — still return enriched in-memory data
  }

  return {
    descriptionText: descriptionText ?? opportunity.description,
    rawData: mergedRaw,
  };
}

function parseGrantsGovDeadline(details: GrantsGovDetailsResponse): string | null {
  const block = getGrantsGovAwardBlock(details);
  const dateStr = block?.responseDate ?? block?.archiveDate;
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}