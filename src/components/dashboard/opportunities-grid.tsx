"use client";

import { OpportunityCard } from "@/components/opportunity/opportunity-card";
import { toCardData } from "@/lib/opportunity-ui";
import type { OpportunityWithScore } from "@/lib/types";

export function OpportunitiesGrid({
  opportunities,
}: {
  opportunities: OpportunityWithScore[];
}) {
  if (opportunities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 p-12 text-center">
        <p className="text-sm font-medium text-slate-600">No opportunities yet</p>
        <p className="mt-2 text-xs text-slate-400">
          Run a scan to populate the master list with evaluated grants.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {opportunities.map((opp) => (
        <OpportunityCard key={opp.id} data={toCardData(opp)} variant="grid" />
      ))}
    </div>
  );
}