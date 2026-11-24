import {
  Calendar,
  ExternalLink,
  Lock,
  Unlock,
} from "lucide-react";
import { FoundationContactSection } from "./foundation-contact-section";
import {
  CATEGORY_LABELS,
  getFoundationById,
  type FoundationOpportunity,
} from "@/lib/family-foundations";

const STATUS_STYLES = {
  open: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rolling: "bg-sky-50 text-sky-800 ring-sky-200",
  "annual-cycle": "bg-violet-50 text-violet-800 ring-violet-200",
  watch: "bg-amber-50 text-amber-800 ring-amber-200",
} as const;

const STATUS_LABELS = {
  open: "Open now",
  rolling: "Rolling",
  "annual-cycle": "Annual cycle",
  watch: "Watch for RFP",
} as const;

export function FoundationOpportunityCard({
  opportunity,
}: {
  opportunity: FoundationOpportunity;
}) {
  const foundation = getFoundationById(opportunity.foundationId);
  const website = opportunity.url ?? foundation?.website;

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLES[opportunity.status]}`}
            >
              {STATUS_LABELS[opportunity.status]}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {CATEGORY_LABELS[opportunity.category]}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-slate-900 sm:text-lg">
            {opportunity.title}
          </h3>
          <p className="mt-0.5 text-sm font-medium text-teal-800">
            {opportunity.foundationName}
          </p>
        </div>

        {opportunity.invitationRequired ? (
          <div className="flex shrink-0 items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 ring-1 ring-rose-200">
            <Lock className="h-4 w-4 text-rose-600" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-rose-800">
                Invitation required
              </p>
              <p className="text-[11px] text-rose-700">Warm intro needed</p>
            </div>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
            <Unlock className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                Can apply directly
              </p>
              <p className="text-[11px] text-emerald-700">No invite needed</p>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-700">
        {opportunity.description}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            Timing
          </div>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {opportunity.timing}
          </p>
          {opportunity.deadline && (
            <p className="mt-1 text-xs text-slate-600">{opportunity.deadline}</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            First step
          </p>
          <p className="mt-1 text-sm text-slate-800">{opportunity.firstStep}</p>
          {opportunity.estimatedAward && (
            <p className="mt-1 text-xs font-medium text-teal-700">
              Typical award: {opportunity.estimatedAward}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <FoundationContactSection
          contact={opportunity.foundationContact ?? foundation?.foundationContact}
          website={website}
          generalEmail={foundation?.generalEmail}
          generalPhone={foundation?.generalPhone}
        />
      </div>

      {opportunity.url && (
        <a
          href={opportunity.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          View opportunity
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </article>
  );
}
