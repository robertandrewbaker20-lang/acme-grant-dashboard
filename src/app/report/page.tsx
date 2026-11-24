import Link from "next/link";
import { AppShell } from "@/components/dashboard/app-shell";
import { ReportActions } from "@/components/report/report-actions";
import {
  buildGrantReport,
  fitLabel,
  scoreOutOfTen,
  type ReportOpportunity,
} from "@/lib/report";
import { formatShortDate } from "@/lib/opportunity-ui";

export const dynamic = "force-dynamic";

function ScorePill({ score, recommendation }: { score: number | null; recommendation: string | null }) {
  const label = fitLabel(score, recommendation as "pursue" | "review" | "pass" | null);
  const high = (score ?? 0) >= 70;
  return (
    <div
      className={`inline-flex flex-col items-center rounded-xl px-3 py-2 text-center ${
        high ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800"
      }`}
    >
      <span className="text-lg font-bold tabular-nums">{scoreOutOfTen(score)}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-90">
        {label}
      </span>
    </div>
  );
}

function OpportunityBlock({
  item,
  detailed,
}: {
  item: ReportOpportunity;
  detailed?: boolean;
}) {
  return (
    <article className="break-inside-avoid rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:shadow-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            {item.agency ?? item.source ?? "Federal"}
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug text-slate-900">
            {item.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>
              Deadline:{" "}
              <strong className="text-slate-700">
                {item.deadline ? formatShortDate(item.deadline) : "Not specified"}
              </strong>
            </span>
            {item.daysLeft !== null && item.daysLeft >= 0 && (
              <span>{item.daysLeft} days left</span>
            )}
            {item.samUrl && (
              <a
                href={item.samUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 underline-offset-2 hover:underline print:hidden"
              >
                Official notice
              </a>
            )}
          </div>
        </div>
        <ScorePill score={item.fitScore} recommendation={item.recommendation} />
      </div>

      {item.summary && (
        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {detailed ? "Why it fits" : "Assessment"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{item.summary}</p>
        </div>
      )}

      {detailed && item.strengths.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Strengths
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {item.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {detailed && item.concerns.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Watch-outs
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {item.concerns.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default async function ReportPage() {
  const report = await buildGrantReport();
  const generatedLabel = new Date(report.generatedAt).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <AppShell>
      <main className="flex-1 overflow-auto">
        <div className="border-b border-[var(--border)] bg-[var(--surface)] print:hidden">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <Link
                href="/"
                className="text-xs font-medium text-teal-700 hover:underline"
              >
                ← Back to dashboard
              </Link>
              <h1 className="mt-1 text-lg font-semibold text-slate-900">
                Grant Opportunities Report
              </h1>
              <p className="text-sm text-slate-500">
                Printable summary of the notices currently loaded
              </p>
            </div>
            <ReportActions />
          </div>
        </div>

        <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
          {/* Cover */}
          <header className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-8 text-white shadow-lg print:border-0 print:bg-slate-900 print:shadow-none">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
              Acme Community Fund
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Grant Opportunities Report
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Generated {generatedLabel}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Evaluated" value={report.stats.evaluated} />
              <Stat label="Recommended" value={report.stats.recommended} accent />
              <Stat
                label="Not recommended"
                value={report.stats.reviewedNotRecommended}
              />
              <Stat
                label="Tight deadline"
                value={report.stats.insufficientTime}
              />
            </div>
          </header>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Profile interpretation
            </h3>
            <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700 shadow-sm">
              {report.profileSummary}
            </p>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Sources
              </h3>
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Source</th>
                      <th className="px-4 py-2">Total</th>
                      <th className="px-4 py-2">Rec.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.bySource.length === 0 ? (
                      <tr>
                        <td className="px-4 py-3 text-slate-500" colSpan={3}>
                          No evaluated opportunities yet — run a scan.
                        </td>
                      </tr>
                    ) : (
                      report.bySource.map((row) => (
                        <tr key={row.source} className="border-t border-slate-100">
                          <td className="px-4 py-2 font-medium text-slate-800">
                            {row.source}
                          </td>
                          <td className="px-4 py-2 tabular-nums">{row.total}</td>
                          <td className="px-4 py-2 tabular-nums text-teal-700">
                            {row.recommended}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-slate-500">
                {report.sites.map((site) => (
                  <li key={site.name}>
                    {site.name} · {site.status.replace("_", " ")}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Search keywords
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {report.searchKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-900"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                Recommended opportunities
              </h3>
              <span className="text-sm tabular-nums text-slate-500">
                {report.recommended.length}
              </span>
            </div>
            {report.recommended.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No recommended grants in the current set. Live scoring runs only
                after a database and API keys are configured.
              </p>
            ) : (
              <div className="space-y-4">
                {report.recommended.map((item) => (
                  <OpportunityBlock key={item.id} item={item} detailed />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Reviewed — not recommended
            </h3>
            {report.notRecommended.length === 0 ? (
              <p className="text-sm text-slate-500">None in this snapshot.</p>
            ) : (
              <div className="space-y-3">
                {report.notRecommended.slice(0, 25).map((item) => (
                  <OpportunityBlock key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Insufficient time to respond
            </h3>
            <p className="text-sm text-slate-500">
              Opportunities with 30 or fewer days remaining that were not flagged as
              recommended pursues.
            </p>
            {report.insufficientTime.length === 0 ? (
              <p className="text-sm text-slate-500">None in this snapshot.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <ul className="divide-y divide-slate-100">
                  {report.insufficientTime.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {item.agency ?? item.source}
                        </p>
                      </div>
                      <span className="shrink-0 tabular-nums text-amber-700">
                        {item.daysLeft ?? "?"}d left
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
            Report generated by Acme Grant Dashboard · Sample scores are stored
            with the fictional notices. A live database can score new notices with
            an external model when an API key is set. · {generatedLabel}
          </footer>
        </div>
      </main>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 ${
        accent ? "bg-teal-500/20 ring-1 ring-teal-400/40" : "bg-white/5"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
