import { DashboardClientShell } from "@/components/dashboard/dashboard-client-shell";
import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { FoundationsPromoCard } from "@/components/foundations/foundations-client";
import {
  getDashboardStats,
  getKanbanOpportunities,
  getRecentOpportunities,
} from "@/lib/dashboard";
import { readAppConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const config = readAppConfig();
  if (!config.ok) {
    return (
      <AppShell>
        <main className="p-8 text-sm text-red-800">{config.message}</main>
      </AppShell>
    );
  }

  const [stats, opportunities, kanbanCards] = await Promise.all([
    getDashboardStats(),
    getRecentOpportunities(),
    getKanbanOpportunities(),
  ]);

  return (
    <AppShell activeNav="dashboard">
      <main className="flex-1 overflow-auto">
        <DashboardHeader />

        <div className="space-y-6 px-4 py-5 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <FoundationsPromoCard />

          <StatsCards stats={stats} />

          <section>
            <DashboardClientShell
              kanbanCards={kanbanCards}
              opportunities={opportunities}
            />
          </section>
        </div>
      </main>
    </AppShell>
  );
}