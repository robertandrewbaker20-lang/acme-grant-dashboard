"use client";

import { useState } from "react";
import { Building2, HeartHandshake, List } from "lucide-react";
import { FoundationOpportunityCard } from "./foundation-opportunity-card";
import { TargetOrganizationsPanel } from "./target-organizations-panel";
import {
  getInvitationRequiredCount,
  getOpenOpportunityCount,
  getSortedOpportunities,
  TARGET_FOUNDATIONS,
} from "@/lib/family-foundations";

export function FoundationBoard() {
  const [showOrgs, setShowOrgs] = useState(false);
  const opportunities = getSortedOpportunities();
  const openCount = getOpenOpportunityCount();
  const inviteCount = getInvitationRequiredCount();

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Upcoming opportunities
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
              {opportunities.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Tracked foundation windows</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Open / rolling now
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-900">
              {openCount}
            </p>
            <p className="mt-1 text-xs text-emerald-700">No invitation needed to start</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
              Invitation required
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-rose-900">
              {inviteCount}
            </p>
            <p className="mt-1 text-xs text-rose-700">Warm intro or networking track</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Upcoming foundation opportunities
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Sorted by actionability — open and rolling first, then annual cycles and
              watch-list RFPs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowOrgs(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <List className="h-4 w-4" />
            View all {TARGET_FOUNDATIONS.length} target organizations
          </button>
        </div>

        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <FoundationOpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
            />
          ))}
        </div>
      </div>

      {showOrgs && <TargetOrganizationsPanel onClose={() => setShowOrgs(false)} />}
    </>
  );
}

export function FoundationsPromoCard() {
  const openCount = getOpenOpportunityCount();

  return (
    <a
      href="/foundations"
      className="group relative block overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-6 text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:p-8"
    >
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-teal-400/20 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-violet-200" />
            <span className="text-xs font-bold uppercase tracking-widest text-violet-200">
              Private philanthropy
            </span>
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            Family & Private Foundation Funding
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-violet-100 sm:text-base">
            {openCount} open or rolling sample awards, plus invitation-only
            records so the closed-door cases stay visible. Every name here is fictional.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-violet-800 shadow-md transition group-hover:bg-violet-50">
            <Building2 className="h-5 w-5" />
            Open foundations hub
          </span>
          <span className="text-xs text-violet-200">
            {TARGET_FOUNDATIONS.length} sample organizations · invitation flags · example.com contacts
          </span>
        </div>
      </div>
    </a>
  );
}
