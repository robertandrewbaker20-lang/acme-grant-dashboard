"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  countActiveFilters,
  DEFAULT_FILTERS,
  PROGRAM_AREAS,
  type DashboardFilters,
  type ScoreThreshold,
  type UrgencyFilter,
} from "@/lib/opportunity-filters";

const SCORE_OPTIONS: { id: ScoreThreshold; label: string }[] = [
  { id: "all", label: "Any score" },
  { id: "50", label: "5.0+" },
  { id: "70", label: "7.0+" },
  { id: "80", label: "8.0+" },
];

const URGENCY_OPTIONS: { id: UrgencyFilter; label: string }[] = [
  { id: "all", label: "Any deadline" },
  { id: "overdue", label: "Overdue" },
  { id: "critical", label: "≤ 7 days" },
  { id: "soon", label: "≤ 30 days" },
];

export function DashboardFilters({
  filters,
  onChange,
  resultCount,
  totalCount,
  showSourceFilter = false,
}: {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  resultCount: number;
  totalCount: number;
  /** Source chips live on Federal Funding — keep off main dashboard by default. */
  showSourceFilter?: boolean;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  function update<K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K],
  ) {
    onChange({ ...filters, [key]: value });
  }

  function clearAll() {
    onChange(DEFAULT_FILTERS);
  }

  const filterControls = (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => update("missionFocus", !filters.missionFocus)}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            filters.missionFocus
              ? "border-teal-300 bg-teal-50 text-teal-800 ring-1 ring-teal-200"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${filters.missionFocus ? "bg-teal-500" : "bg-slate-300"}`}
          />
          Mission focus
          <span className="hidden font-normal text-slate-500 sm:inline">
            — hides obvious misfits, ranks best fit first
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            update("openSolicitationOnly", !filters.openSolicitationOnly)
          }
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            filters.openSolicitationOnly
              ? "border-violet-300 bg-violet-50 text-violet-900 ring-1 ring-violet-200"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
          title="Limit foundation-style grants to open solicitations (no invitation required)"
        >
          <span
            className={`h-2 w-2 rounded-full ${filters.openSolicitationOnly ? "bg-violet-500" : "bg-slate-300"}`}
          />
          Open solicitation
          <span className="hidden font-normal text-slate-500 sm:inline">
            — no invitation required
          </span>
        </button>
      </div>

      {showSourceFilter && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          Source filters are available on the Federal Funding page.
        </div>
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <FilterGroup label="Match">
          {SCORE_OPTIONS.map((opt) => (
            <Pill
              key={opt.id}
              active={filters.scoreThreshold === opt.id}
              onClick={() => update("scoreThreshold", opt.id)}
            >
              {opt.label}
            </Pill>
          ))}
        </FilterGroup>

        <FilterGroup label="Deadline">
          {URGENCY_OPTIONS.map((opt) => (
            <Pill
              key={opt.id}
              active={filters.urgency === opt.id}
              onClick={() => update("urgency", opt.id)}
            >
              {opt.label}
            </Pill>
          ))}
        </FilterGroup>

        <FilterGroup label="Program">
          <Pill
            active={!filters.programArea}
            onClick={() => update("programArea", null)}
          >
            All areas
          </Pill>
          {PROGRAM_AREAS.map((area) => (
            <Pill
              key={area.id}
              active={filters.programArea === area.id}
              onClick={() =>
                update(
                  "programArea",
                  filters.programArea === area.id ? null : area.id,
                )
              }
              highlight={area.id === "innovation"}
            >
              {area.label}
            </Pill>
          ))}
        </FilterGroup>
      </div>
    </>
  );

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder="Search title, agency, keywords…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/15"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSheetOpen((o) => !o)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold lg:hidden ${
              activeCount > 0
                ? "border-teal-300 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <SlidersHorizontal className="hidden h-3.5 w-3.5 lg:block" />
            <span
              className="tabular-nums"
              title={`${resultCount} grants match current filters · ${totalCount} total tracked`}
            >
              <span className="font-semibold text-slate-800">{resultCount}</span>
              {resultCount !== totalCount && <span> of {totalCount}</span>} shown
            </span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 font-medium text-slate-600 hover:bg-slate-50"
              >
                <X className="h-3 w-3" />
                Clear ({activeCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {sheetOpen && (
        <div className="space-y-3 border-t border-slate-100 pt-3 lg:hidden">
          {filterControls}
        </div>
      )}

      <div className="hidden space-y-3 lg:block">{filterControls}</div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
        active
          ? highlight
            ? "bg-violet-700 text-white shadow-sm"
            : "bg-slate-900 text-white shadow-sm"
          : highlight
            ? "bg-violet-100 text-violet-800 hover:bg-violet-200/80"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
      }`}
    >
      {children}
    </button>
  );
}
