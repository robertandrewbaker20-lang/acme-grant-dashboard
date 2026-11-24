"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Filter,
  Search,
  X,
} from "lucide-react";
import { FoundationContactSection } from "./foundation-contact-section";
import {
  ACCESS_LABELS,
  CATEGORY_LABELS,
  TARGET_FOUNDATIONS,
  type FoundationCategory,
  type TargetFoundation,
} from "@/lib/family-foundations";

const CATEGORY_OPTIONS: Array<{ value: FoundationCategory | "all"; label: string }> = [
  { value: "all", label: "All categories" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value: value as FoundationCategory,
    label,
  })),
];

function AccessBadge({ foundation }: { foundation: TargetFoundation }) {
  if (foundation.invitationRequired) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 ring-1 ring-rose-200">
        Invitation required
      </span>
    );
  }
  if (foundation.acceptsUnsolicited) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
        Accepts unsolicited
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
      LOI / open calls only
    </span>
  );
}

export function TargetOrganizationsPanel({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FoundationCategory | "all">("all");
  const [accessFilter, setAccessFilter] = useState<"all" | "open" | "invitation">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TARGET_FOUNDATIONS.filter((f) => {
      if (category !== "all" && f.category !== category) return false;
      if (accessFilter === "open" && f.invitationRequired) return false;
      if (accessFilter === "invitation" && !f.invitationRequired) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q) ||
        f.focusAreas.some((area) => area.toLowerCase().includes(q)) ||
        f.accessSummary.toLowerCase().includes(q)
      );
    });
  }, [search, category, accessFilter]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-label="Close organizations list"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-[var(--border)] bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Target family foundations
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {TARGET_FOUNDATIONS.length} organizations we are actively pursuing ·{" "}
              {TARGET_FOUNDATIONS.filter((f) => !f.invitationRequired).length} accept
              unsolicited or LOI-first outreach
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search foundations, locations, focus areas…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-teal-500/0 transition focus:border-teal-300 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as FoundationCategory | "all")
                  }
                  className="bg-transparent text-sm outline-none"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <select
                value={accessFilter}
                onChange={(e) =>
                  setAccessFilter(e.target.value as typeof accessFilter)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="all">All access types</option>
                <option value="open">Open / LOI-first</option>
                <option value="invitation">Invitation required</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Showing {filtered.length} of {TARGET_FOUNDATIONS.length}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="space-y-4">
            {filtered.map((foundation) => (
              <article
                key={foundation.id}
                className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {foundation.name}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {CATEGORY_LABELS[foundation.category]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{foundation.location}</p>
                    {foundation.assetsOrScale && (
                      <p className="mt-1 text-xs text-slate-500">
                        {foundation.assetsOrScale}
                      </p>
                    )}
                  </div>
                  <AccessBadge foundation={foundation} />
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {foundation.focusAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-md bg-teal-50 px-2 py-0.5 text-xs text-teal-800"
                    >
                      {area}
                    </span>
                  ))}
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  <span className="font-medium text-slate-900">How to access: </span>
                  {foundation.accessSummary}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {ACCESS_LABELS[foundation.accessType]}
                </p>

                {foundation.notes && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {foundation.notes}
                  </p>
                )}

                <div className="mt-4">
                  <FoundationContactSection
                    contact={foundation.foundationContact}
                    website={foundation.website}
                    generalEmail={foundation.generalEmail}
                    generalPhone={foundation.generalPhone}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
