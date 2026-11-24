"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Shield,
  Sparkles,
  ThumbsDown,
  Users,
} from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { MatchScoreBadge } from "@/components/ui/match-score-badge";
import { assessEligibility, type CheckStatus } from "@/lib/eligibility";
import type { OpportunityDetail } from "@/lib/opportunity-details";
import {
  formatShortDate,
  getDeadlineUrgency,
  RECOMMENDATION_LABELS,
  resolveMatchScoreState,
  sourceBadge,
} from "@/lib/opportunity-ui";
import type { PipelineColumnId } from "@/lib/pipeline";

const TABS = [
  { id: "summary", label: "Summary & Facts" },
  { id: "partners", label: "Partners" },
  { id: "description", label: "Description" },
  { id: "eligibility", label: "Eligibility" },
  { id: "funder", label: "Funder" },
  { id: "history", label: "Decision History" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ELIGIBILITY_BADGE: Record<
  ReturnType<typeof assessEligibility>["verdict"],
  string
> = {
  eligible: "bg-emerald-50 text-emerald-800",
  likely_eligible: "bg-teal-50 text-teal-800",
  verify_manually: "bg-amber-50 text-amber-900",
  ineligible: "bg-red-50 text-red-800",
};

const CHECK_STATUS_LABEL: Record<CheckStatus, string> = {
  pass: "Looks good",
  fail: "Blocker",
  review: "Verify",
  unknown: "Unknown",
};

const CHECK_STATUS_STYLE: Record<CheckStatus, string> = {
  pass: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  fail: "bg-red-50 text-red-800 ring-red-200",
  review: "bg-amber-50 text-amber-900 ring-amber-200",
  unknown: "bg-slate-100 text-slate-700 ring-slate-200",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-xs font-bold tracking-wider text-slate-500">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FactRow({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: React.ReactNode;
  copyValue?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="flex max-w-[70%] flex-col items-end gap-2 text-right text-sm font-medium text-slate-900">
        {value}
        {copyValue && <CopyButton value={copyValue} label="Copy" />}
      </div>
    </div>
  );
}

/**
 * Tabbed detail layout keeps dense NOFO data approachable —
 * users triage from Summary, then drill into Eligibility only when needed.
 */
export function GrantDetailView({ detail }: { detail: OpportunityDetail }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { opportunity, primaryPoc, secondaryPocs, evaluation } = detail;

  const source = sourceBadge(opportunity.source);
  const urgency = getDeadlineUrgency(detail.applicationDueDate);
  const scoreState = resolveMatchScoreState(detail.alignmentScore, false);
  const eligibility = assessEligibility(detail);
  const displayTitle =
    opportunity.title.length > 120
      ? `${opportunity.title.slice(0, 117)}…`
      : opportunity.title;
  const fitFactors = evaluation?.strengths?.slice(0, 3) ?? [];

  async function setLane(column: PipelineColumnId) {
    setSaving(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ column }),
      });
      if (res.ok) {
        setSaveError(null);
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setSaveError(data.error ?? "Could not update this notice.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-28">
      <div className="border-b border-slate-800/20 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <span className="font-mono text-xs text-slate-500">
            {detail.recordId}
          </span>
        </div>
      </div>

      {/* Hero — dark slate anchors trust; teal/emerald reserved for positive signals */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${source.className}`}>
              {source.label}
            </span>
            <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300">
              {detail.pipelineLane}
            </span>
            <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300">
              {detail.category}
            </span>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold leading-tight tracking-tight md:text-2xl lg:text-3xl">
                {displayTitle}
              </h1>
              {opportunity.title.length > 120 && (
                <p className="mt-2 text-xs text-slate-500" title={opportunity.title}>
                  Full title: {opportunity.title}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-teal-400" />
                  {opportunity.agency ?? "Agency not specified"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-200">
                  <span className={`h-1.5 w-1.5 rounded-full ${urgency.dotClass}`} />
                  <Calendar className="h-3.5 w-3.5" />
                  Due {formatShortDate(detail.applicationDueDate)} · {urgency.label}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
              <MatchScoreBadge
                score={detail.alignmentScore}
                recommendation={evaluation?.recommendation ?? null}
                state={scoreState}
                size="lg"
              />
              <p className="max-w-xs text-right text-xs text-slate-400">
                {detail.alignmentLabel}
              </p>
              {evaluation?.recommendation && (
                <p className="max-w-xs text-right text-xs font-medium text-teal-300">
                  {RECOMMENDATION_LABELS[evaluation.recommendation]}
                </p>
              )}
              {fitFactors.length > 0 && (
                <ul className="max-w-xs space-y-1 text-right text-xs text-slate-300">
                  {fitFactors.map((factor) => (
                    <li key={factor} className="line-clamp-2">
                      • {factor}
                    </li>
                  ))}
                </ul>
              )}
              {opportunity.sam_url && (
                <a
                  href={opportunity.sam_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
                >
                  Official notice
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <nav
          className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm"
          aria-label="Opportunity sections"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 space-y-4">
          {activeTab === "summary" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="KEY FACTS">
                <FactRow label="Record ID" value={detail.recordId} copyValue={opportunity.notice_id} />
                <FactRow
                  label="Solicitation"
                  value={opportunity.solicitation_number ?? "—"}
                  copyValue={opportunity.solicitation_number ?? undefined}
                />
                <FactRow label="Application due" value={formatShortDate(detail.applicationDueDate)} />
                <FactRow label="Award ceiling" value={detail.funding.ceilingLabel} />
                <FactRow label="Award floor" value={detail.funding.floorLabel} />
                <FactRow label="LOI" value={detail.loi.summary} />
                <FactRow label="Partners" value={detail.partners.summary} />
              </Section>
              <Section title="FIT NOTES">
                <p className="rounded-lg bg-slate-900 p-4 text-sm leading-relaxed text-slate-100">
                  {detail.nofoSummary}
                </p>
                {evaluation?.strengths && evaluation.strengths.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {evaluation.strengths.map((item) => (
                      <li key={item} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          )}

          {activeTab === "partners" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="PARTNER REQUIREMENTS">
                <p className="text-sm leading-relaxed text-slate-700">
                  {detail.partners.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      detail.partners.canApplySolo
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {detail.partners.canApplySolo
                      ? "May apply solo as lead"
                      : "Partners likely needed"}
                  </span>
                  {detail.partners.partnersRequired && (
                    <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                      Partners required
                    </span>
                  )}
                </div>

                {detail.partners.partnerTypes.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {detail.partners.partnerTypes.map((partner) => (
                      <li
                        key={`${partner.type}-${partner.label}`}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-teal-600" />
                          <span className="text-sm font-semibold text-slate-900">
                            {partner.label}
                          </span>
                          {partner.required && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              Required
                            </span>
                          )}
                        </div>
                        {partner.evidence && (
                          <p className="mt-2 text-xs leading-relaxed text-slate-500">
                            “{partner.evidence}”
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No specific partner types detected in notice text — open the
                    official solicitation for teaming rules.
                  </p>
                )}
              </Section>

              <Section title="PROFILE NOTES">
                {detail.partners.orgAdvantages.length > 0 ? (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {detail.partners.orgAdvantages.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-2"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    Review whether Acme should lead, subcontract, or partner with
                    a university/local gov based on solicitation rules.
                  </p>
                )}
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Typical teaming</p>
                  <p className="mt-1">
                    Lead as nonprofit PM · hire program staff · partner with
                    community colleges, K-12 districts, or local economic
                    development for geographic/eligibility requirements.
                  </p>
                </div>
              </Section>
            </div>
          )}

          {activeTab === "description" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="MISSION ABSTRACT">
                <p className="text-sm leading-relaxed text-slate-700">
                  {detail.missionAbstract}
                </p>
              </Section>
              <Section title="REQUIREMENTS & LOGISTICS">
                <FactRow label="Match funds" value={detail.matchRequirements} />
                <FactRow label="Consortium" value={detail.consortiumStatus} />
                <FactRow label="Tracking cycle" value={detail.trackingCycle} />
                <FactRow
                  label="Place of performance"
                  value={detail.placeOfPerformance ?? "Not specified"}
                />
                <FactRow label="Webinar / briefing" value={detail.webinarDetails} />
              </Section>
            </div>
          )}

          {activeTab === "eligibility" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="ELIGIBILITY VERDICT">
                <div
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-medium ${ELIGIBILITY_BADGE[eligibility.verdict]}`}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {eligibility.headline}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {eligibility.summary}
                </p>
                <p className="mt-4 text-sm text-slate-600">
                  Set-aside: {detail.setAsideDescription}
                </p>
                {opportunity.naics_code && (
                  <p className="mt-2 text-sm text-slate-600">
                    NAICS: {opportunity.naics_code}
                  </p>
                )}
              </Section>
              <Section title="VERIFY THESE REQUIREMENTS">
                <ul className="space-y-3">
                  {eligibility.checklist.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.label}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${CHECK_STATUS_STYLE[item.status]}`}
                        >
                          {CHECK_STATUS_LABEL[item.status]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {item.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="RISKS & CONCERNS">
                {evaluation?.concerns && evaluation.concerns.length > 0 ? (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {evaluation.concerns.map((item) => (
                      <li key={item} className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    No concerns flagged in the latest fit assessment.
                  </p>
                )}
                {eligibility.blockers.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold tracking-wider text-slate-500">
                      ELIGIBILITY BLOCKERS
                    </p>
                    <ul className="mt-2 space-y-2 text-sm text-red-800">
                      {eligibility.blockers.map((item) => (
                        <li key={item} className="rounded-lg bg-red-50 px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Section>
            </div>
          )}

          {activeTab === "funder" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="FUNDER">
                <FactRow label="Agency" value={opportunity.agency ?? "—"} />
                <FactRow label="Opportunity type" value={opportunity.opportunity_type ?? "—"} />
                <FactRow label="Posted" value={formatShortDate(opportunity.posted_date)} />
              </Section>
              <Section title="POINT OF CONTACT">
                {primaryPoc ? (
                  <div className="space-y-3 text-sm">
                    <p className="font-medium text-slate-900">{primaryPoc.name}</p>
                    {primaryPoc.email && (
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`mailto:${primaryPoc.email}`}
                          className="text-teal-700 hover:underline"
                        >
                          {primaryPoc.email}
                        </a>
                        <CopyButton value={primaryPoc.email} label="Copy email" />
                      </div>
                    )}
                    {primaryPoc.phone && (
                      <p className="text-slate-600">{primaryPoc.phone}</p>
                    )}
                    {secondaryPocs.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="mb-2 text-xs font-semibold text-slate-500">
                          Secondary contacts
                        </p>
                        {secondaryPocs.map((poc) => (
                          <p key={poc.name} className="text-slate-600">
                            {poc.name}
                            {poc.email ? ` · ${poc.email}` : ""}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No point of contact in the scraped notice.
                  </p>
                )}
              </Section>
            </div>
          )}

          {activeTab === "history" && (
            <Section title="DECISION HISTORY">
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Current status
                  </p>
                  <p className="mt-1 text-sm font-medium capitalize text-slate-900">
                    {opportunity.status}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Pipeline lane: {detail.pipelineLane}
                  </p>
                </div>
                {evaluation ? (
                  <div className="rounded-lg border border-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Latest fit assessment
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {evaluation.summary ?? "No summary recorded."}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Recommendation:{" "}
                      <span className="font-semibold text-slate-700">
                        {evaluation.recommendation
                          ? RECOMMENDATION_LABELS[evaluation.recommendation]
                          : "Pending"}
                      </span>
                      {evaluation.fit_score !== null &&
                        ` · ${(evaluation.fit_score / 10).toFixed(1)}/10`}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No evaluation on file yet.
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  Internal team notes will appear here in a future release.
                </p>
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Sticky decision bar — primary actions always one click away */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-900">Quick decision</span>
            <span className="hidden text-slate-400 sm:inline">— updates pipeline lane</span>
          </div>
          {saveError && (
            <p className="text-sm text-amber-800">{saveError}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setLane("high_potential")}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              High potential
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => setLane("decision")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-teal-200 hover:bg-teal-50 disabled:opacity-50"
            >
              Move to apply
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  const res = await fetch(`/api/opportunities/${opportunity.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "archived" }),
                  });
                  if (res.ok) {
                    setSaveError(null);
                    router.refresh();
                  } else {
                    const data = (await res.json().catch(() => ({}))) as { error?: string };
                    setSaveError(data.error ?? "Could not update this notice.");
                  }
                } finally {
                  setSaving(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
            >
              <ThumbsDown className="h-4 w-4" />
              Pass / archive
            </button>
            {opportunity.sam_url && (
              <a
                href={opportunity.sam_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Open official
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}