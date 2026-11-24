import {
  extractGrantsGovOppId,
  fetchGrantsGovOpportunityDetails,
  grantsGovDescriptionFromDetails,
  mergeGrantsGovDetailsIntoRaw,
} from "./grants-gov-details";
import { findExistingOpportunity, isDismissedStatus } from "./opportunity-lookup";
import { loadActiveSearchProfile } from "./search-profiles";
import { fetchAllSources } from "./sources";
import { assertLiveScanConfigured } from "./env";
import { createServerClient } from "./supabase/server";
import { canRunEvaluation, getUsageLimits } from "./usage-limits";
import { evaluateOpportunity } from "./xai-grok";

export interface ScanResult {
  fetched: number;
  inserted: number;
  evaluated: number;
  skippedDismissed: number;
  bySource: Record<string, number>;
  errors: string[];
  profileId?: string;
  profileName?: string;
}

export async function runDailyScan(options?: {
  profileId?: string;
}): Promise<ScanResult> {
  const result: ScanResult = {
    fetched: 0,
    inserted: 0,
    evaluated: 0,
    skippedDismissed: 0,
    bySource: {},
    errors: [],
  };

  assertLiveScanConfigured();

  const activeProfile = await loadActiveSearchProfile();
  // If a specific profile was requested for this scan, load full file and pick it
  let profile = activeProfile;
  if (options?.profileId && options.profileId !== activeProfile.id) {
    const { loadSearchProfiles, getProfileById } = await import("./search-profiles");
    const { data } = await loadSearchProfiles();
    profile = getProfileById(data, options.profileId);
  }
  result.profileId = profile.id;
  result.profileName = profile.name;

  const supabase = createServerClient();
  let opportunities;

  try {
    const { resolveProfileSearchParams } = await import("./search-profiles-types");
    const resolved = resolveProfileSearchParams(profile);
    const all = await fetchAllSources({
      searchKeywords: resolved.searchKeywords,
      agencyQueries: resolved.agencyQueries,
      enabledSourceIds: resolved.enabledSourceIds,
    });
    opportunities = all.opportunities;
    result.fetched = opportunities.length;
    result.bySource = all.bySource;
    result.errors.push(...all.errors);
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : "Multi-source fetch failed",
    );
    return result;
  }

  const limits = getUsageLimits();
  let evaluationsThisScan = 0;
  let evaluationBlocked = false;

  for (const record of opportunities) {
    const existing = await findExistingOpportunity(supabase, record.notice_id);

    if (existing) {
      if (isDismissedStatus(existing.status)) {
        result.skippedDismissed++;
      }
      continue;
    }

    let recordToInsert = record;
    if (record.source === "grants.gov") {
      const oppId = extractGrantsGovOppId(record.notice_id);
      if (oppId) {
        const details = await fetchGrantsGovOpportunityDetails(oppId);
        if (details) {
          recordToInsert = {
            ...record,
            description: grantsGovDescriptionFromDetails(details) ?? record.description,
            raw_data: mergeGrantsGovDetailsIntoRaw(
              record.raw_data as Record<string, unknown>,
              details,
            ),
          };
        }
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from("opportunities")
      .insert({
        notice_id: recordToInsert.notice_id,
        source: recordToInsert.source,
        title: recordToInsert.title,
        description: recordToInsert.description,
        solicitation_number: recordToInsert.solicitation_number,
        agency: recordToInsert.agency,
        naics_code: recordToInsert.naics_code,
        opportunity_type: recordToInsert.opportunity_type,
        posted_date: recordToInsert.posted_date,
        response_deadline: recordToInsert.response_deadline,
        set_aside: recordToInsert.set_aside,
        sam_url: recordToInsert.sam_url,
        raw_data: recordToInsert.raw_data,
        status: recordToInsert.status,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      result.errors.push(`Insert failed for ${record.notice_id}`);
      continue;
    }

    result.inserted++;

    if (
      evaluationBlocked ||
      evaluationsThisScan >= limits.maxEvaluationsPerScan
    ) {
      continue;
    }

    const gate = await canRunEvaluation();
    if (!gate.allowed) {
      if (!evaluationBlocked) {
        result.errors.push(gate.reason ?? "xAI usage limit reached");
        evaluationBlocked = true;
      }
      continue;
    }

    try {
      const evaluation = await evaluateOpportunity(inserted, 1, profile);
      evaluationsThisScan++;
      result.evaluated++;

      await supabase.from("evaluations").insert({
        opportunity_id: inserted.id,
        ...evaluation,
        raw_response: evaluation,
      });

      if (evaluation.recommendation === "pursue" || evaluation.fit_score >= 70) {
        const status =
          evaluation.recommendation === "pursue" ? "qualified" : "reviewing";
        await supabase
          .from("opportunities")
          .update({ status })
          .eq("id", inserted.id);
      } else if (evaluation.recommendation === "pass") {
        await supabase
          .from("opportunities")
          .update({ status: "rejected" })
          .eq("id", inserted.id);
      }
    } catch (error) {
      result.errors.push(
        `Evaluation failed for ${record.notice_id}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  return result;
}