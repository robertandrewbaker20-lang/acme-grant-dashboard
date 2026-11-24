import Link from "next/link";
import { ExternalLink, Landmark } from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import { FederalClient } from "@/components/dashboard/federal-client";
import { FEDERAL_AGENCIES, GRANT_CHECKER_SITES } from "@/lib/constants";
import { getKanbanOpportunities, getRecentOpportunities } from "@/lib/dashboard";
import { isFederalAgencyOpportunity } from "@/lib/alignment";
import { readAppConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function FederalFundingPage() {
  const config = readAppConfig();
  if (!config.ok) {
    return (
      <AppShell>
        <main className="p-8 text-sm text-red-800">{config.message}</main>
      </AppShell>
    );
  }

  const [opportunities, kanbanCards] = await Promise.all([
    getRecentOpportunities(),
    getKanbanOpportunities(),
  ]);

  const federalOpps = opportunities.filter(isFederalAgencyOpportunity);
  const federalKanban = kanbanCards.filter(isFederalAgencyOpportunity);

  return (
    <AppShell>
      <main className="flex-1 overflow-auto">
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-teal-700">
                  <Landmark className="h-5 w-5" />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Federal funding
                  </p>
                </div>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                  Priority federal agencies
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  DOE, EDA, USDA, Delta Regional Authority, DOL, and NSF, plus
                  the public sites a live scan can query. The lists stay off the
                  main dashboard and live here.
                </p>
              </div>
              <Link
                href="/report"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Generate report
              </Link>
            </div>
          </div>
        </header>

        <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Agencies to watch
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {FEDERAL_AGENCIES.map((agency) => (
                <a
                  key={agency.id}
                  href={agency.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                        {agency.shortName}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {agency.name}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-teal-600" />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {agency.description}
                  </p>
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Public source sites
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Connected feeds run only when a live scan is configured. Manual
              sites are links you open and review yourself.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {GRANT_CHECKER_SITES.map((site) => (
                <a
                  key={site.name}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm transition hover:border-teal-200 hover:bg-white"
                >
                  <div>
                    <p className="font-medium text-slate-900">{site.name}</p>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      {site.status === "connected"
                        ? "Connected feed"
                        : site.status === "via_grants"
                          ? "Via Grants.gov keywords"
                          : "Manual review"}
                    </p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Matched opportunities
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {federalOpps.length} opportunities linked to priority federal
                  agencies in the current database.
                </p>
              </div>
            </div>
            <FederalClient
              kanbanCards={federalKanban}
              opportunities={federalOpps}
            />
          </section>
        </div>
      </main>
    </AppShell>
  );
}
