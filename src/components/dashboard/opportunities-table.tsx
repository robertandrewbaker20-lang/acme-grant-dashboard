"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Eye, Sparkles, ThumbsDown } from "lucide-react";
import { MatchScoreBadge } from "@/components/ui/match-score-badge";
import { useScan } from "@/components/dashboard/scan-context";
import {
  formatShortDate,
  getDeadlineUrgency,
  resolveMatchScoreState,
  sourceBadge,
} from "@/lib/opportunity-ui";
import type { OpportunityWithScore } from "@/lib/types";

const statusStyles: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-amber-100 text-amber-800",
  qualified: "bg-teal-100 text-teal-800",
  rejected: "bg-slate-100 text-slate-600",
  applied: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-100 text-slate-500",
};

type BulkAction = "high_potential" | "review" | "pass";

export function OpportunitiesTable({
  opportunities,
}: {
  opportunities: OpportunityWithScore[];
}) {
  const router = useRouter();
  const { isScanning } = useScan();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const allSelected =
    opportunities.length > 0 && selected.size === opportunities.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(opportunities.map((o) => o.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkAction(action: BulkAction) {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const body =
        action === "pass"
          ? { status: "archived" as const }
          : { column: action === "high_potential" ? "high_potential" : "review" };

      const results = await Promise.all(
        [...selected].map(async (id) => {
          const res = await fetch(`/api/opportunities/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          return { ok: res.ok, error: data.error };
        }),
      );
      const failed = results.find((result) => !result.ok);
      if (failed) {
        setNotice(failed.error ?? "Could not update the selected notices.");
        return;
      }
      setNotice(null);
      setSelected(new Set());
      router.refresh();
    } finally {
      setBulkLoading(false);
    }
  }

  if (opportunities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-500">No opportunities match your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notice && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {notice}
        </p>
      )}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3">
          <span className="text-sm font-medium text-slate-800">
            {selected.size} selected
          </span>
          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => bulkAction("high_potential")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            High potential
          </button>
          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => bulkAction("review")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            Watch
          </button>
          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => bulkAction("pass")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            Pass
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Title</th>
                <th className="hidden px-4 py-3 font-medium text-slate-600 sm:table-cell">
                  Source
                </th>
                <th className="hidden px-4 py-3 font-medium text-slate-600 md:table-cell">
                  Agency
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Match</th>
                <th className="hidden px-4 py-3 font-medium text-slate-600 lg:table-cell">
                  Posted
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Deadline</th>
                <th className="hidden px-4 py-3 font-medium text-slate-600 sm:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-slate-600" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.map((opp) => {
                const source = sourceBadge(opp.source);
                const scoreState = resolveMatchScoreState(opp.fit_score, isScanning);
                const urgency = getDeadlineUrgency(opp.response_deadline);
                const isSelected = selected.has(opp.id);

                return (
                  <tr
                    key={opp.id}
                    className={`group transition-colors ${isSelected ? "bg-teal-50/50" : "hover:bg-teal-50/30"}`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(opp.id)}
                        aria-label={`Select ${opp.title}`}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <Link
                        href={`/opportunities/${opp.id}`}
                        className="font-medium text-slate-900 transition-colors group-hover:text-teal-700"
                      >
                        <span className="line-clamp-2">{opp.title}</span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${source.className}`}
                      >
                        {source.label}
                      </span>
                    </td>
                    <td className="hidden max-w-[180px] truncate px-4 py-3 text-slate-600 md:table-cell">
                      {opp.agency ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <MatchScoreBadge
                        score={opp.fit_score}
                        recommendation={opp.recommendation}
                        state={scoreState}
                        size="sm"
                      />
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">
                      {formatShortDate(opp.posted_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${urgency.textClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${urgency.dotClass}`} />
                        {formatShortDate(opp.response_deadline)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[opp.status] ?? statusStyles.new}`}
                      >
                        {opp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/opportunities/${opp.id}`}
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900"
                      >
                        View
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
