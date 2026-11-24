"use client";

import { Radio } from "lucide-react";
import { ACTIVE_SOURCES } from "@/lib/sources";

export function LiveFeedBar({
  sourceFilter,
  onSourceFilterChange,
  countsBySource,
}: {
  sourceFilter: string | null;
  onSourceFilterChange: (source: string | null) => void;
  countsBySource: Record<string, number>;
}) {
  function toggleSource(id: string) {
    onSourceFilterChange(sourceFilter === id ? null : id);
  }

  return (
    <div className="border-b border-slate-200 bg-slate-50 px-8 py-2">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1.5 font-medium text-emerald-700">
          <Radio className="h-3.5 w-3.5" />
          Live Feed: {ACTIVE_SOURCES.length} sources connected
        </span>

        <button
          type="button"
          onClick={() => onSourceFilterChange(null)}
          className={`rounded-full border px-2 py-0.5 transition-colors ${
            sourceFilter === null
              ? "border-blue-300 bg-blue-50 font-semibold text-blue-800"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          All sources
        </button>

        {ACTIVE_SOURCES.map((s) => {
          const active = sourceFilter === s.id;
          const count = countsBySource[s.id] ?? 0;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSource(s.id)}
              title={s.description}
              className={`rounded-full border px-2 py-0.5 transition-colors ${
                active
                  ? "border-blue-400 bg-blue-600 font-semibold text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
              }`}
            >
              {s.label}
              {count > 0 && (
                <span
                  className={`ml-1 ${active ? "text-blue-100" : "text-slate-400"}`}
                >
                  ({count})
                </span>
              )}
            </button>
          );
        })}

        {sourceFilter && (
          <span className="text-slate-400">
            Filtering pipeline &amp; master list
          </span>
        )}
      </div>
    </div>
  );
}