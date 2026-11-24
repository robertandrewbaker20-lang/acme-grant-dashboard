import { ORG_PROFILE_SHORT, GRANT_CHECKER_SITES, SEARCH_KEYWORDS } from "./constants";
import { readAppConfig } from "./env";
import { buildSampleRecords } from "./sample-data";
import { createServerClient } from "./supabase/server";
import type { Evaluation, Recommendation } from "./types";

export interface ReportOpportunity {
  id: string;
  title: string;
  agency: string | null;
  source: string | null;
  deadline: string | null;
  fitScore: number | null;
  recommendation: Recommendation | null;
  summary: string | null;
  strengths: string[];
  concerns: string[];
  samUrl: string | null;
  opportunityType: string | null;
  daysLeft: number | null;
}

export interface GrantReportData {
  generatedAt: string;
  profileSummary: string;
  searchKeywords: string[];
  sites: { name: string; url: string; status: string }[];
  stats: {
    evaluated: number;
    recommended: number;
    reviewedNotRecommended: number;
    insufficientTime: number;
  };
  bySource: { source: string; total: number; recommended: number }[];
  recommended: ReportOpportunity[];
  notRecommended: ReportOpportunity[];
  insufficientTime: ReportOpportunity[];
}

export function daysUntil(deadline: string | null, now = new Date()): number | null {
  if (!deadline) return null;
  const end = new Date(deadline);
  if (Number.isNaN(end.getTime())) return null;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

export function partitionReportOpportunities(mapped: ReportOpportunity[]): {
  recommended: ReportOpportunity[];
  notRecommended: ReportOpportunity[];
  insufficientTime: ReportOpportunity[];
} {
  const recommended = mapped
    .filter(
      (item) =>
        item.recommendation === "pursue" ||
        (item.fitScore !== null && item.fitScore >= 60 && item.recommendation !== "pass"),
    )
    .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));

  const recommendedIds = new Set(recommended.map((item) => item.id));

  const insufficientTime = mapped.filter((item) => {
    if (recommendedIds.has(item.id)) return false;
    return item.daysLeft !== null && item.daysLeft >= 0 && item.daysLeft <= 30;
  });

  const insufficientIds = new Set(insufficientTime.map((item) => item.id));

  const notRecommended = mapped
    .filter((item) => !recommendedIds.has(item.id) && !insufficientIds.has(item.id))
    .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
    .slice(0, 40);

  return { recommended, notRecommended, insufficientTime };
}

function mapRow(row: Record<string, unknown>): ReportOpportunity | null {
  const evals = Array.isArray(row.evaluations) ? row.evaluations : [];
  const latest = [...evals].sort(
    (a: Evaluation, b: Evaluation) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0] as Evaluation | undefined;

  if (!latest || latest.fit_score === null || latest.fit_score === undefined) {
    return null;
  }

  const deadline = (row.response_deadline as string | null) ?? null;

  return {
    id: row.id as string,
    title: row.title as string,
    agency: (row.agency as string | null) ?? null,
    source: (row.source as string | null) ?? "sam.gov",
    deadline,
    fitScore: latest.fit_score,
    recommendation: latest.recommendation,
    summary: latest.summary,
    strengths: latest.strengths ?? [],
    concerns: latest.concerns ?? [],
    samUrl: (row.sam_url as string | null) ?? null,
    opportunityType: (row.opportunity_type as string | null) ?? null,
    daysLeft: daysUntil(deadline),
  };
}

export async function buildGrantReport(): Promise<GrantReportData> {
  const generatedAt = new Date().toISOString();
  const empty: GrantReportData = {
    generatedAt,
    profileSummary: ORG_PROFILE_SHORT,
    searchKeywords: SEARCH_KEYWORDS.slice(0, 24),
    sites: GRANT_CHECKER_SITES.map((s) => ({
      name: s.name,
      url: s.url,
      status: s.status,
    })),
    stats: {
      evaluated: 0,
      recommended: 0,
      reviewedNotRecommended: 0,
      insufficientTime: 0,
    },
    bySource: [],
    recommended: [],
    notRecommended: [],
    insufficientTime: [],
  };

  const config = readAppConfig();
  if (!config.ok) throw new Error(config.message);
  if (config.mode === "demo") {
    return finishReport(
      empty,
      buildSampleRecords().map(({ opportunity, evaluation }) => ({
        id: opportunity.id,
        title: opportunity.title,
        agency: opportunity.agency,
        source: opportunity.source ?? "sam.gov",
        deadline: opportunity.response_deadline,
        fitScore: evaluation.fit_score,
        recommendation: evaluation.recommendation,
        summary: evaluation.summary,
        strengths: evaluation.strengths ?? [],
        concerns: evaluation.concerns ?? [],
        samUrl: opportunity.sam_url,
        opportunityType: opportunity.opportunity_type,
        daysLeft: daysUntil(opportunity.response_deadline),
      })),
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      id, title, agency, source, response_deadline, sam_url, opportunity_type, status,
      evaluations(fit_score, recommendation, summary, strengths, concerns, created_at)
    `,
    )
    .not("status", "eq", "rejected")
    .order("posted_date", { ascending: false, nullsFirst: false });

  if (error || !data) return empty;

  const mapped = (data as Record<string, unknown>[])
    .map(mapRow)
    .filter((item): item is ReportOpportunity => item !== null);

  return finishReport(empty, mapped);
}

function finishReport(
  shell: GrantReportData,
  mapped: ReportOpportunity[],
): GrantReportData {
  const { recommended, notRecommended, insufficientTime } =
    partitionReportOpportunities(mapped);

  const sourceMap = new Map<string, { total: number; recommended: number }>();
  for (const item of mapped) {
    const src = item.source ?? "sam.gov";
    const entry = sourceMap.get(src) ?? { total: 0, recommended: 0 };
    entry.total++;
    sourceMap.set(src, entry);
  }
  for (const item of recommended) {
    const src = item.source ?? "sam.gov";
    const entry = sourceMap.get(src) ?? { total: 0, recommended: 0 };
    entry.recommended++;
    sourceMap.set(src, entry);
  }

  return {
    ...shell,
    stats: {
      evaluated: mapped.length,
      recommended: recommended.length,
      reviewedNotRecommended: notRecommended.length,
      insufficientTime: insufficientTime.length,
    },
    bySource: Array.from(sourceMap.entries()).map(([source, counts]) => ({
      source,
      ...counts,
    })),
    recommended,
    notRecommended,
    insufficientTime,
  };
}

export function fitLabel(score: number | null, recommendation: Recommendation | null): string {
  if (score === null) return "Not scored";
  if (score >= 80 || recommendation === "pursue") return "Strong Fit";
  if (score >= 60) return "Good Fit";
  if (score >= 40) return "Partial Fit";
  return "Low Fit";
}

export function scoreOutOfTen(score: number | null): string {
  if (score === null) return "—";
  return `${(score / 10).toFixed(0)}/10`;
}
