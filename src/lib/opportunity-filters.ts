import { SEARCH_KEYWORDS } from "./constants";
import {
  computeAlignment,
  isOpenSolicitation,
  passesMissionFocus,
  sortByAlignment,
} from "./alignment";
import { getDeadlineUrgency } from "./opportunity-ui";
import type { KanbanCard, OpportunityWithScore } from "./types";

export type ScoreThreshold = "all" | "50" | "70" | "80";
export type UrgencyFilter = "all" | "overdue" | "critical" | "soon";

export interface DashboardFilters {
  search: string;
  source: string | null;
  scoreThreshold: ScoreThreshold;
  urgency: UrgencyFilter;
  programArea: string | null;
  missionFocus: boolean;
  /** When true, hide invitation-only / closed foundation solicitations. */
  openSolicitationOnly: boolean;
}

export const DEFAULT_FILTERS: DashboardFilters = {
  search: "",
  source: null,
  scoreThreshold: "all",
  urgency: "all",
  programArea: null,
  missionFocus: true,
  openSolicitationOnly: true,
};

export const PROGRAM_AREAS = [
  {
    id: "innovation",
    label: "Innovation",
    match: ["innovation", "innovative", "accelerator", "incubator", "startup"],
  },
  {
    id: "cyber",
    label: "Cybersecurity",
    match: ["cyber", "critical infrastructure", "ot", "ics", "scada"],
  },
  {
    id: "energy",
    label: "Energy",
    match: ["energy", "utility", "grid", "electric", "ceser"],
  },
  {
    id: "workforce",
    label: "Workforce",
    match: ["workforce", "bootcamp", "accelerator", "placement", "training"],
  },
  {
    id: "stem",
    label: "STEM",
    match: ["stem", "education", "school", "training"],
  },
  {
    id: "ai",
    label: "AI",
    match: ["ai", "artificial intelligence", "machine learning", "data analytics"],
  },
  {
    id: "defense",
    label: "Defense",
    match: ["defense", "dod", "darpa", "diu", "afwerx", "afrl"],
  },
] as const;

type Filterable = KanbanCard | OpportunityWithScore;

function normalizeSource(source: string | null | undefined) {
  return source ?? "sam.gov";
}

function searchableText(item: Filterable): string {
  const tags = "tags" in item ? item.tags.join(" ") : "";
  return [
    item.title,
    item.agency,
    item.source,
    item.description,
    tags,
    "naics_code" in item ? item.naics_code : "",
    "opportunity_type" in item ? item.opportunity_type : "",
    "set_aside" in item ? item.set_aside : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesSmartSearch(item: Filterable, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;

  const haystack = searchableText(item);
  const tokens = trimmed.split(/\s+/).filter(Boolean);

  return tokens.every(
    (token) =>
      haystack.includes(token) ||
      SEARCH_KEYWORDS.some(
        (kw) => kw.includes(token) && haystack.includes(kw.split(" ")[0]),
      ),
  );
}

function matchesScore(item: Filterable, threshold: ScoreThreshold): boolean {
  if (threshold === "all") return true;
  const min = Number(threshold) * 10;
  if (item.fit_score !== null && item.fit_score >= min) return true;
  if (item.fit_score === null) {
    return computeAlignment(item) >= min * 0.75;
  }
  return false;
}

function matchesUrgency(item: Filterable, filter: UrgencyFilter): boolean {
  if (filter === "all") return true;
  const level = getDeadlineUrgency(item.response_deadline).level;
  if (filter === "overdue") return level === "overdue";
  if (filter === "critical") return level === "overdue" || level === "critical";
  if (filter === "soon") {
    return level === "overdue" || level === "critical" || level === "soon";
  }
  return true;
}

function matchesProgramArea(item: Filterable, areaId: string | null): boolean {
  if (!areaId) return true;
  const area = PROGRAM_AREAS.find((a) => a.id === areaId);
  if (!area) return true;
  const haystack = searchableText(item);
  return area.match.some((term) => haystack.includes(term));
}

function matchesSource(item: Filterable, source: string | null): boolean {
  if (!source) return true;
  return normalizeSource(item.source) === source;
}

function matchesMissionFocus(item: Filterable, enabled: boolean): boolean {
  if (!enabled) return true;
  return passesMissionFocus(item);
}

function matchesOpenSolicitation(item: Filterable, enabled: boolean): boolean {
  if (!enabled) return true;
  return isOpenSolicitation(item);
}

export function applyDashboardFilters<T extends Filterable>(
  items: T[],
  filters: DashboardFilters,
): T[] {
  const filtered = items.filter(
    (item) =>
      matchesSource(item, filters.source) &&
      matchesSmartSearch(item, filters.search) &&
      matchesScore(item, filters.scoreThreshold) &&
      matchesUrgency(item, filters.urgency) &&
      matchesProgramArea(item, filters.programArea) &&
      matchesMissionFocus(item, filters.missionFocus) &&
      matchesOpenSolicitation(item, filters.openSolicitationOnly),
  );

  return sortByAlignment(filtered);
}

export function countActiveFilters(filters: DashboardFilters): number {
  let count = 0;
  if (filters.source) count++;
  if (filters.scoreThreshold !== "all") count++;
  if (filters.urgency !== "all") count++;
  if (filters.programArea) count++;
  if (filters.search.trim()) count++;
  if (!filters.missionFocus) count++;
  if (!filters.openSolicitationOnly) count++;
  return count;
}
