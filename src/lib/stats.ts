import type { DashboardStats, OpportunityWithScore } from "./types";

type StatsInput = Pick<
  OpportunityWithScore,
  "status" | "created_at" | "response_deadline" | "fit_score"
>;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function inRange(value: string | null, start: Date, end: Date): boolean {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= start && parsed <= end;
}

/** Same counts the dashboard shows, computed from opportunity rows. */
export function summarizeOpportunities(
  items: StatsInput[],
  now = new Date(),
): DashboardStats {
  const day7 = addDays(now, -7);
  const day30 = addDays(now, -30);
  const day14 = addDays(now, 14);
  const day30ahead = addDays(now, 30);

  const funnel = { new: 0, underReview: 0, highPotential: 0, decisionMade: 0 };
  for (const item of items) {
    if (item.status === "rejected") continue;
    switch (item.status) {
      case "new":
        funnel.new++;
        break;
      case "reviewing":
        funnel.underReview++;
        break;
      case "qualified":
        funnel.highPotential++;
        break;
      case "applied":
      case "archived":
        funnel.decisionMade++;
        break;
    }
  }

  const scored = items.filter(
    (item) => item.status !== "rejected" && item.status !== "archived",
  );
  const highMatchRows = scored.filter((item) => (item.fit_score ?? 0) >= 70);

  return {
    total: items.length,
    newLast7Days: items.filter((item) => inRange(item.created_at, day7, now))
      .length,
    newLast30Days: items.filter((item) => inRange(item.created_at, day30, now))
      .length,
    highMatch: highMatchRows.length,
    highMatchNew: highMatchRows.filter((item) =>
      inRange(item.created_at, day7, now),
    ).length,
    deadlinesNext14: items.filter((item) =>
      inRange(item.response_deadline, now, day14),
    ).length,
    deadlinesNext30: items.filter((item) =>
      inRange(item.response_deadline, now, day30ahead),
    ).length,
    internalReviewDue: items.filter(
      (item) =>
        item.status === "reviewing" &&
        inRange(item.response_deadline, now, day14),
    ).length,
    funnel,
  };
}

export { startOfDay };
