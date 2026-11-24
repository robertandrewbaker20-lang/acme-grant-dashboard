import type { OpportunityStatus } from "./types";

export type PipelineColumnId = "new" | "review" | "high_potential" | "decision";

export interface PipelineColumn {
  id: PipelineColumnId;
  label: string;
  subtitle: string;
  emptyTitle: string;
  emptyBody: string;
  dotColor: string;
  headerBg: string;
  borderAccent: string;
  ringColor: string;
  statuses: OpportunityStatus[];
  targetStatus: OpportunityStatus;
}

export const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    id: "new",
    label: "New",
    subtitle: "Fresh intake",
    emptyTitle: "No new grants",
    emptyBody: "Run a scan to pull the latest federal notices into intake.",
    dotColor: "bg-sky-500",
    headerBg: "bg-sky-50/70",
    borderAccent: "border-t-sky-400",
    ringColor: "ring-sky-200",
    statuses: ["new"],
    targetStatus: "new",
  },
  {
    id: "review",
    label: "Under Review",
    subtitle: "Watch & evaluate",
    emptyTitle: "Nothing under review",
    emptyBody:
      "Mark cards as Watch or drag grants here from New to start triage.",
    dotColor: "bg-amber-500",
    headerBg: "bg-amber-50/70",
    borderAccent: "border-t-amber-400",
    ringColor: "ring-amber-200",
    statuses: ["reviewing"],
    targetStatus: "reviewing",
  },
  {
    id: "high_potential",
    label: "High Potential",
    subtitle: "Strong profile fit",
    emptyTitle: "No high-potential grants yet",
    emptyBody:
      "Use High potential on cards with strong match scores (7.0+) to shortlist here.",
    dotColor: "bg-teal-500",
    headerBg: "bg-teal-50/70",
    borderAccent: "border-t-teal-500",
    ringColor: "ring-teal-200",
    statuses: ["qualified"],
    targetStatus: "qualified",
  },
  {
    id: "decision",
    label: "Decision Made",
    subtitle: "Apply or pass",
    emptyTitle: "No decisions recorded",
    emptyBody:
      "Move grants here when you've chosen to apply or pass — keeps the pipeline honest.",
    dotColor: "bg-violet-500",
    headerBg: "bg-violet-50/70",
    borderAccent: "border-t-violet-400",
    ringColor: "ring-violet-200",
    statuses: ["applied", "archived"],
    targetStatus: "applied",
  },
];

export function statusToColumn(status: OpportunityStatus): PipelineColumnId {
  if (status === "applied" || status === "archived") return "decision";
  if (status === "qualified") return "high_potential";
  if (status === "reviewing") return "review";
  return "new";
}

export function columnToStatus(
  columnId: PipelineColumnId,
  previousStatus?: OpportunityStatus,
): OpportunityStatus {
  switch (columnId) {
    case "new":
      return "new";
    case "review":
      return "reviewing";
    case "high_potential":
      return "qualified";
    case "decision":
      return previousStatus === "archived" ? "archived" : "applied";
    default:
      return "new";
  }
}