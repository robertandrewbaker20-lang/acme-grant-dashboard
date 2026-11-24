import sampleFile from "../../data/sample-opportunities.json";
import type {
  Evaluation,
  KanbanCard,
  Opportunity,
  OpportunityStatus,
  OpportunityWithScore,
  Recommendation,
} from "./types";
import { statusToColumn } from "./pipeline";
import {
  buildOpportunityTags,
  fundingPreview,
  truncateText,
} from "./opportunity-ui";
import { summarizeOpportunities } from "./stats";
import type { DashboardStats } from "./types";

export interface SampleNotice {
  id: string;
  noticeId: string;
  title: string;
  agency: string;
  source: string;
  description: string;
  naicsCode: string | null;
  opportunityType: string | null;
  setAside: string | null;
  deadlineOffsetDays: number;
  postedOffsetDays: number;
  createdOffsetDays: number;
  status: OpportunityStatus;
  fitScore: number;
  recommendation: Recommendation;
  summary: string;
  strengths: string[];
  concerns: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  url: string;
}

export interface SampleRecord {
  opportunity: Opportunity;
  evaluation: Evaluation;
}

function shift(now: Date, days: number): string {
  const next = new Date(now);
  next.setDate(next.getDate() + days);
  next.setHours(17, 0, 0, 0);
  return next.toISOString();
}

export function getSampleNotices(): SampleNotice[] {
  return sampleFile.notices as SampleNotice[];
}

export function buildSampleRecords(now = new Date()): SampleRecord[] {
  return getSampleNotices().map((notice) => {
    const createdAt = shift(now, notice.createdOffsetDays);
    const opportunity: Opportunity = {
      id: notice.id,
      notice_id: notice.noticeId,
      title: notice.title,
      description: notice.description,
      solicitation_number: notice.noticeId,
      agency: notice.agency,
      naics_code: notice.naicsCode,
      opportunity_type: notice.opportunityType,
      posted_date: shift(now, notice.postedOffsetDays),
      response_deadline: shift(now, notice.deadlineOffsetDays),
      set_aside: notice.setAside,
      sam_url: notice.url,
      source: notice.source,
      raw_data: {
        pointOfContact: [
          {
            type: "primary",
            fullName: notice.contactName,
            email: notice.contactEmail,
            phone: notice.contactPhone,
          },
        ],
        placeOfPerformance: {
          city: "Riverton",
          state: "Example",
          zip: "00000",
        },
      },
      status: notice.status,
      created_at: createdAt,
      updated_at: createdAt,
    };

    const evaluation: Evaluation = {
      id: `${notice.id}-score`,
      opportunity_id: notice.id,
      fit_score: notice.fitScore,
      recommendation: notice.recommendation,
      summary: notice.summary,
      strengths: notice.strengths,
      concerns: notice.concerns,
      stage: 1,
      created_at: createdAt,
    };

    return { opportunity, evaluation };
  });
}

export function toScoredOpportunities(
  records: SampleRecord[],
): OpportunityWithScore[] {
  return records.map(({ opportunity, evaluation }) => ({
    ...opportunity,
    fit_score: evaluation.fit_score,
    recommendation: evaluation.recommendation,
    fitFactors: (evaluation.strengths ?? []).slice(0, 3),
  }));
}

export function toKanbanCards(records: SampleRecord[]): KanbanCard[] {
  return toScoredOpportunities(records)
    .filter((item) => item.status !== "rejected")
    .map((item) => ({
      id: item.id,
      title: item.title,
      agency: item.agency,
      response_deadline: item.response_deadline,
      fit_score: item.fit_score,
      recommendation: item.recommendation,
      fitFactors: item.fitFactors,
      source: item.source ?? "sam.gov",
      description: truncateText(item.description, 160),
      fundingLabel: fundingPreview({
        description: item.description,
        raw_data: item.raw_data,
      }),
      tags: buildOpportunityTags(item),
      status: item.status,
      officialUrl: item.sam_url,
      column: statusToColumn(item.status),
    }));
}

export function summarizeSample(now = new Date()): DashboardStats {
  return summarizeOpportunities(toScoredOpportunities(buildSampleRecords(now)), now);
}

export function findSampleRecord(
  id: string,
  now = new Date(),
): SampleRecord | null {
  return buildSampleRecords(now).find((record) => record.opportunity.id === id) ?? null;
}
