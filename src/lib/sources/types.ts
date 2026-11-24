import type { OpportunityStatus } from "../types";

export type OpportunitySource =
  | "sam.gov"
  | "grants.gov"
  | "darpa"
  | "diu"
  | "afwerx";

export interface NormalizedOpportunity {
  notice_id: string;
  source: OpportunitySource;
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
  raw_data: Record<string, unknown>;
  status: OpportunityStatus;
}

export interface SourceFetchResult {
  source: OpportunitySource;
  opportunities: NormalizedOpportunity[];
  errors: string[];
}