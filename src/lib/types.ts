export type OpportunityStatus =
  | "new"
  | "reviewing"
  | "qualified"
  | "rejected"
  | "applied"
  | "archived";

export type Recommendation = "pursue" | "review" | "pass";

export interface Opportunity {
  id: string;
  notice_id: string;
  title: string;
  description: string | null;
  solicitation_number: string | null;
  agency: string | null;
  naics_code: string | null;
  opportunity_type: string | null;
  posted_date: string | null;
  response_deadline: string | null;
  set_aside: string | null;
  sam_url: string | null;
  source?: string | null;
  raw_data?: Record<string, unknown>;
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
}

export interface OpportunityWithScore extends Opportunity {
  fit_score: number | null;
  recommendation: Recommendation | null;
  fitFactors: string[];
}

export interface Evaluation {
  id: string;
  opportunity_id: string;
  fit_score: number | null;
  recommendation: Recommendation;
  summary: string | null;
  strengths: string[] | null;
  concerns: string[] | null;
  stage: number;
  created_at: string;
}

export interface SamGovOpportunity {
  noticeId?: string;
  title?: string;
  solicitationNumber?: string;
  fullParentPathName?: string;
  postedDate?: string;
  type?: string;
  naicsCode?: string;
  description?: string;
  responseDeadLine?: string;
  setAside?: string;
  uiLink?: string;
}

import type { PipelineColumnId } from "./pipeline";

export type { PipelineColumnId };

export interface KanbanCard {
  id: string;
  title: string;
  agency: string | null;
  response_deadline: string | null;
  fit_score: number | null;
  recommendation: Recommendation | null;
  fitFactors: string[];
  source: string | null;
  description: string | null;
  fundingLabel: string | null;
  tags: string[];
  status: OpportunityStatus;
  officialUrl: string | null;
  column: PipelineColumnId;
}

export interface DashboardFunnel {
  new: number;
  underReview: number;
  highPotential: number;
  decisionMade: number;
}

export interface DashboardStats {
  total: number;
  newLast7Days: number;
  newLast30Days: number;
  highMatch: number;
  /** High-match grants that are also newly ingested (last 7 days). */
  highMatchNew: number;
  deadlinesNext14: number;
  deadlinesNext30: number;
  /** Opportunities in reviewing status with a submission deadline within 14 days. */
  internalReviewDue: number;
  funnel: DashboardFunnel;
}