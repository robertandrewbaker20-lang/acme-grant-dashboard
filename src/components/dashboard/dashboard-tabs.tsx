"use client";

import { useState, useSyncExternalStore } from "react";
import { CalendarDays, Columns3, LayoutGrid, Table2 } from "lucide-react";
import { GrantsCalendar } from "./grants-calendar";
import { KanbanBoard } from "./kanban-board";
import { OpportunitiesGrid } from "./opportunities-grid";
import { OpportunitiesTable } from "./opportunities-table";
import { RecommendedSourcesPanel } from "./recommended-sources-panel";
import type { KanbanCard, OpportunityWithScore } from "@/lib/types";

function subscribeNarrow(onStoreChange: () => void) {
  const query = window.matchMedia("(max-width: 767px)");
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function readNarrow() {
  return window.matchMedia("(max-width: 767px)").matches;
}

const TABS = [
  { id: "pipeline" as const, label: "Pipeline", icon: Columns3 },
  { id: "table" as const, label: "Master list", icon: LayoutGrid },
  { id: "calendar" as const, label: "Calendar", icon: CalendarDays },
];

export function DashboardTabs({
  kanbanCards,
  opportunities,
  allKanbanCount,
  allOpportunitiesCount,
}: {
  kanbanCards: KanbanCard[];
  opportunities: OpportunityWithScore[];
  allKanbanCount: number;
  allOpportunitiesCount: number;
}) {
  const narrow = useSyncExternalStore(subscribeNarrow, readNarrow, () => false);
  const [chosenTab, setActive] = useState<(typeof TABS)[number]["id"] | null>(null);
  const [chosenList, setListView] = useState<"grid" | "table" | null>(null);
  const active = chosenTab ?? (narrow ? "table" : "pipeline");
  const listView = chosenList ?? (narrow ? "table" : "grid");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-slate-100/80 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 sm:px-4 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <p
          className="text-xs text-slate-500"
          title="Filtered counts — funnel KPIs above reflect all pipeline lanes"
        >
          Pipeline{" "}
          <span className="font-semibold tabular-nums text-slate-800">
            {kanbanCards.length}
          </span>
          {kanbanCards.length !== allKanbanCount && (
            <span className="text-slate-400"> / {allKanbanCount}</span>
          )}
          {" · "}
          Master list{" "}
          <span className="font-semibold tabular-nums text-slate-800">
            {opportunities.length}
          </span>
          {opportunities.length !== allOpportunitiesCount && (
            <span className="text-slate-400"> / {allOpportunitiesCount}</span>
          )}
        </p>
      </div>

      {active === "table" && (
        <div className="flex justify-end">
          <div className="inline-flex rounded-lg border border-[var(--border)] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setListView("grid")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                listView === "grid"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setListView("table")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                listView === "table"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              Table
            </button>
          </div>
        </div>
      )}

      {active === "pipeline" && (
        <div className="space-y-6">
          <KanbanBoard key={kanbanCards.length} initialCards={kanbanCards} />
          <RecommendedSourcesPanel />
        </div>
      )}
      {active === "table" && listView === "grid" && (
        <OpportunitiesGrid opportunities={opportunities} />
      )}
      {active === "table" && listView === "table" && (
        <OpportunitiesTable opportunities={opportunities} />
      )}
      {active === "calendar" && <GrantsCalendar opportunities={opportunities} />}
    </div>
  );
}
