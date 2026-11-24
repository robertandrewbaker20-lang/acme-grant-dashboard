"use client";

import { useMemo, useState } from "react";
import { DashboardFilters } from "./dashboard-filters";
import { DashboardTabs } from "./dashboard-tabs";
import {
  applyDashboardFilters,
  DEFAULT_FILTERS,
  type DashboardFilters as Filters,
} from "@/lib/opportunity-filters";
import type { KanbanCard, OpportunityWithScore } from "@/lib/types";

export function FederalClient({
  kanbanCards,
  opportunities,
}: {
  kanbanCards: KanbanCard[];
  opportunities: OpportunityWithScore[];
}) {
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    missionFocus: true,
    openSolicitationOnly: true,
  });

  const filteredKanban = useMemo(
    () => applyDashboardFilters(kanbanCards, filters),
    [kanbanCards, filters],
  );

  const filteredOpportunities = useMemo(
    () => applyDashboardFilters(opportunities, filters),
    [opportunities, filters],
  );

  return (
    <div className="space-y-5">
      <DashboardFilters
        filters={filters}
        onChange={setFilters}
        resultCount={Math.max(
          filteredKanban.length,
          filteredOpportunities.length,
        )}
        totalCount={Math.max(kanbanCards.length, opportunities.length)}
      />
      <DashboardTabs
        kanbanCards={filteredKanban}
        opportunities={filteredOpportunities}
        allKanbanCount={kanbanCards.length}
        allOpportunitiesCount={opportunities.length}
      />
    </div>
  );
}
