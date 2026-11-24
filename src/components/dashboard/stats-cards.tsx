import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Sparkles,
  Zap,
} from "lucide-react";
import type { DashboardStats } from "@/lib/types";

function MetricCard({
  label,
  value,
  sub,
  tooltip,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  tooltip?: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div
      className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
      title={tooltip}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-3xl">
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ stats }: { stats: DashboardStats }) {
  const { funnel } = stats;
  const total =
    funnel.new +
      funnel.underReview +
      funnel.highPotential +
      funnel.decisionMade || 1;

  const stages = [
    { label: "New", count: funnel.new, color: "bg-sky-500" },
    { label: "Review", count: funnel.underReview, color: "bg-amber-400" },
    { label: "High fit", count: funnel.highPotential, color: "bg-teal-500" },
    { label: "Decided", count: funnel.decisionMade, color: "bg-violet-500" },
  ];

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5 lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Decision funnel
          </p>
          <p
            className="mt-1 text-sm text-slate-600"
            title="Counts reflect pipeline lanes — drag cards on the Kanban to move grants between stages"
          >
            {stats.total} tracked in pipeline
          </p>
        </div>
        {stats.funnel.underReview > 0 && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            {stats.funnel.underReview} under review
          </span>
        )}
      </div>

      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        {stages.map((stage) =>
          stage.count > 0 ? (
            <div
              key={stage.label}
              className={`${stage.color} transition-all duration-500`}
              style={{ width: `${(stage.count / total) * 100}%` }}
              title={`${stage.label}: ${stage.count}`}
            />
          ) : null,
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stages.map((stage) => (
          <div key={stage.label} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${stage.color}`} />
            <div>
              <p className="text-xs font-medium text-slate-600">{stage.label}</p>
              <p className="text-sm font-semibold tabular-nums text-slate-900">
                {stage.count}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickSignal({ stats }: { stats: DashboardStats }) {
  const hasScores = stats.highMatch > 0;
  const hasDeadlines = stats.deadlinesNext30 > 0;
  const hasInternal = stats.internalReviewDue > 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-sm sm:p-5 lg:col-span-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Quick signal
          </p>
          <p className="mt-2 text-base font-medium leading-snug sm:text-lg">
            {!hasScores && !hasDeadlines ? (
              <>
                Run a scan to score new grants, then triage{" "}
                <span className="text-sky-300">{stats.funnel.new} in intake</span>{" "}
                into review lanes.
              </>
            ) : hasInternal ? (
              <>
                <span className="text-violet-300">
                  {stats.internalReviewDue} internal reviews
                </span>{" "}
                due before submission in the next 14 days — plus{" "}
                <span className="text-amber-300">{stats.deadlinesNext14}</span>{" "}
                submission deadlines overall.
              </>
            ) : !hasScores ? (
              <>
                <span className="text-amber-300">{stats.deadlinesNext30} deadlines</span>{" "}
                in the next 30 days — run a scan to generate match scores.
              </>
            ) : (
              <>
                Focus on{" "}
                <span className="text-teal-300">{stats.highMatch} high-match</span>
                {stats.highMatchNew > 0 && (
                  <>
                    {" "}
                    (
                    <span className="text-sky-300">
                      {stats.highMatchNew} new this week
                    </span>
                    )
                  </>
                )}{" "}
                grants with{" "}
                <span className="text-amber-300">{stats.deadlinesNext14} deadlines</span>{" "}
                in the next two weeks.
              </>
            )}
          </p>
        </div>
        <Zap className="h-5 w-5 shrink-0 text-teal-400" />
      </div>
    </div>
  );
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      <MetricCard
        label="High-match & new"
        value={stats.highMatch}
        sub={
          stats.highMatchNew > 0
            ? `${stats.highMatchNew} new this week · ${stats.newLast7Days} total new (7d)`
            : `${stats.newLast7Days} new opportunities (7d) · score ≥ 7.0`
        }
        tooltip="Combined view: total high-match grants (Acme Match ≥ 7.0) with new-opportunity context. Subtext shows how many high-match items arrived in the last 7 days."
        icon={Sparkles}
        accent="bg-teal-50 text-teal-600"
      />
      <MetricCard
        label="Internal review due"
        value={stats.internalReviewDue}
        sub="Under review · submission ≤ 14 days"
        tooltip="Grants currently in the Review pipeline lane with a submission deadline within 14 days — prioritize internal decision before the external due date."
        icon={ClipboardCheck}
        accent="bg-violet-50 text-violet-600"
      />
      <MetricCard
        label="Submission deadlines"
        value={stats.deadlinesNext30}
        sub={`${stats.deadlinesNext14} due within 14 days`}
        tooltip="External application / response deadlines. Primary count is the next 30 days; subtext is the tighter 14-day window."
        icon={CalendarClock}
        accent="bg-amber-50 text-amber-600"
      />
      <MetricCard
        label="Under review"
        value={stats.funnel.underReview}
        sub="In pipeline triage"
        icon={ClipboardList}
        accent="bg-sky-50 text-sky-600"
      />
      <FunnelBar stats={stats} />
      <QuickSignal stats={stats} />
    </div>
  );
}
