import { readAppConfig } from "./env";
import {
  buildSampleRecords,
  findSampleRecord,
  summarizeSample,
  toKanbanCards,
  toScoredOpportunities,
} from "./sample-data";
import { createServerClient } from "./supabase/server";
import { buildOpportunityDetail, type OpportunityDetail } from "./opportunity-details";
import {
  buildOpportunityTags,
  fundingPreview,
  truncateText,
} from "./opportunity-ui";
import { statusToColumn } from "./pipeline";
import { enrichOpportunity } from "./opportunity-enrichment";
import type {
  DashboardStats,
  Evaluation,
  KanbanCard,
  Opportunity,
  OpportunityWithScore,
} from "./types";

export type { KanbanCard };

export async function getDashboardStats(): Promise<DashboardStats> {
  const config = readAppConfig();
  if (!config.ok) throw new Error(config.message);
  if (config.mode === "demo") return summarizeSample();

  const supabase = createServerClient();
  const now = new Date();
  const day7 = new Date(now);
  day7.setDate(day7.getDate() - 7);
  const day30 = new Date(now);
  day30.setDate(day30.getDate() - 30);
  const day14 = new Date(now);
  day14.setDate(day14.getDate() + 14);
  const day30ahead = new Date(now);
  day30ahead.setDate(day30ahead.getDate() + 30);

  const [
    total,
    newLast7Days,
    newLast30Days,
    deadlinesNext14,
    deadlinesNext30,
    funnelRows,
    scoredRows,
  ] = await Promise.all([
    supabase.from("opportunities").select("*", { count: "exact", head: true }),
    supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .gte("created_at", day7.toISOString()),
    supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .gte("created_at", day30.toISOString()),
    supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .gte("response_deadline", now.toISOString())
      .lte("response_deadline", day14.toISOString()),
    supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .gte("response_deadline", now.toISOString())
      .lte("response_deadline", day30ahead.toISOString()),
    supabase.from("opportunities").select("status").not("status", "eq", "rejected"),
    supabase
      .from("opportunities")
      .select("id, created_at, status, response_deadline, evaluations(fit_score)")
      .not("status", "eq", "rejected")
      .not("status", "eq", "archived"),
  ]);

  const funnel = { new: 0, underReview: 0, highPotential: 0, decisionMade: 0 };
  for (const row of funnelRows.data ?? []) {
    switch (row.status) {
      case "new":
        funnel.new++;
        break;
      case "reviewing":
        funnel.underReview++;
        break;
      case "qualified":
        funnel.highPotential++;
        break;
      case "applied":
      case "archived":
        funnel.decisionMade++;
        break;
    }
  }

  type ScoredRow = {
    id: string;
    created_at?: string;
    status?: string;
    response_deadline?: string | null;
    evaluations?: { fit_score: number | null }[] | { fit_score: number | null };
  };

  const scored = (scoredRows.data ?? []) as ScoredRow[];

  function bestScore(row: ScoredRow): number {
    const evals = Array.isArray(row.evaluations)
      ? row.evaluations
      : row.evaluations
        ? [row.evaluations]
        : [];
    return evals.reduce(
      (max: number, e: { fit_score: number | null }) =>
        Math.max(max, e.fit_score ?? 0),
      0,
    );
  }

  const highMatchRows = scored.filter((row) => bestScore(row) >= 70);
  const highMatch = highMatchRows.length;
  const highMatchNew = highMatchRows.filter((row) => {
    if (!row.created_at) return false;
    return new Date(row.created_at) >= day7;
  }).length;

  // Internal review due: under review with a submission deadline in the next 14 days
  const { data: reviewRows } = await supabase
    .from("opportunities")
    .select("id, response_deadline, status")
    .eq("status", "reviewing")
    .gte("response_deadline", now.toISOString())
    .lte("response_deadline", day14.toISOString());

  const internalReviewDue = (reviewRows ?? []).length;

  return {
    total: total.count ?? 0,
    newLast7Days: newLast7Days.count ?? 0,
    newLast30Days: newLast30Days.count ?? 0,
    highMatch,
    highMatchNew,
    deadlinesNext14: deadlinesNext14.count ?? 0,
    deadlinesNext30: deadlinesNext30.count ?? 0,
    internalReviewDue,
    funnel,
  };
}

export async function getRecentOpportunities(
  limit?: number,
): Promise<OpportunityWithScore[]> {
  const config = readAppConfig();
  if (!config.ok) throw new Error(config.message);
  if (config.mode === "demo") {
    const scored = toScoredOpportunities(buildSampleRecords());
    return limit === undefined ? scored : scored.slice(0, limit);
  }

  const supabase = createServerClient();
  let query = supabase
    .from("opportunities")
    .select(`
      *,
      evaluations(fit_score, recommendation, created_at, strengths)
    `)
    .order("posted_date", { ascending: false, nullsFirst: false });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []).map((row) => {
    const evals = Array.isArray(row.evaluations) ? row.evaluations : [];
    const latest = evals.sort(
      (a: Evaluation, b: Evaluation) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
    const { evaluations, ...opportunity } = row;
    void evaluations;
    return {
      ...(opportunity as Opportunity),
      fit_score: latest?.fit_score ?? null,
      recommendation: latest?.recommendation ?? null,
      fitFactors: (latest?.strengths ?? []).slice(0, 3),
    };
  });
}

export async function getKanbanOpportunities(): Promise<KanbanCard[]> {
  const config = readAppConfig();
  if (!config.ok) throw new Error(config.message);
  if (config.mode === "demo") return toKanbanCards(buildSampleRecords());

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(`
      id, title, agency, response_deadline, status, source, description,
      naics_code, set_aside, opportunity_type, sam_url, raw_data,
      evaluations(fit_score, recommendation, created_at, strengths)
    `)
    .not("status", "eq", "rejected")
    .order("posted_date", { ascending: false, nullsFirst: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const evals = Array.isArray(row.evaluations) ? row.evaluations : [];
    const latest = evals.sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];

    return {
      id: row.id,
      title: row.title,
      agency: row.agency,
      response_deadline: row.response_deadline,
      fit_score: latest?.fit_score ?? null,
      recommendation: latest?.recommendation ?? null,
      fitFactors: (latest?.strengths ?? []).slice(0, 3),
      source: row.source ?? "sam.gov",
      description: truncateText(row.description, 160),
      fundingLabel: fundingPreview({
        description: row.description,
        raw_data: row.raw_data as Record<string, unknown> | undefined,
      }),
      tags: buildOpportunityTags(row),
      status: row.status,
      officialUrl: row.sam_url,
      column: statusToColumn(row.status),
    };
  });
}

export async function getOpportunityDetail(
  id: string,
): Promise<OpportunityDetail | null> {
  const config = readAppConfig();
  if (!config.ok) throw new Error(config.message);
  if (config.mode === "demo") {
    const record = findSampleRecord(id);
    if (!record) return null;
    return buildOpportunityDetail(
      record.opportunity,
      record.evaluation,
      record.opportunity.description,
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(`
      *,
      evaluations(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const evals = Array.isArray(data.evaluations)
    ? (data.evaluations as Evaluation[])
    : [];
  const evaluation =
    evals.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0] ?? null;

  const { evaluations: loadedEvaluations, ...opportunity } = data;
  void loadedEvaluations;
  const enrichment = await enrichOpportunity(opportunity as Opportunity);

  return buildOpportunityDetail(
    {
      ...(opportunity as Opportunity),
      raw_data: enrichment.rawData,
      description:
        enrichment.descriptionText ?? (opportunity as Opportunity).description,
    },
    evaluation,
    enrichment.descriptionText,
  );
}

