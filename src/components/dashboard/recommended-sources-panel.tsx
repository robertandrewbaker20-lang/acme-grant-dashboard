"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { RECOMMENDED_SOURCES } from "@/lib/recommended-sources";

export function RecommendedSourcesPanel() {
  const [open, setOpen] = useState(false);
  const manual = RECOMMENDED_SOURCES.filter((s) => s.status !== "connected");

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-slate-50/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-slate-800">Where else to look</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {manual.length} manual sources · workforce, STEM, and energy sites
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
          <p className="mb-4 text-sm text-slate-600">
            Connected feeds run only during a live scan. These links are public
            sites to check by hand. This demo does not submit applications.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {manual.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-3 transition-colors hover:border-teal-200"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 group-hover:text-teal-800">
                    {source.name}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                    {source.why}
                  </p>
                </div>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-teal-600" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}