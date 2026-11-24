import { readAppConfig, readNonNegativeNumber, readPositiveInteger } from "./env";
import { createServerClient } from "./supabase/server";

// Conservative estimate per stage-1 Grok evaluation (~2.5k tokens total).
export const ESTIMATED_COST_PER_EVALUATION_USD = 0.008;

export interface UsageLimits {
  monthlyBudgetUsd: number;
  maxEvaluationsPerScan: number;
  maxEvaluationsPerDay: number;
}

export interface UsageSnapshot {
  evaluationsThisMonth: number;
  evaluationsToday: number;
  estimatedSpendUsd: number;
  remainingBudgetUsd: number;
  withinBudget: boolean;
}

export function getUsageLimits(): UsageLimits {
  return {
    monthlyBudgetUsd: readNonNegativeNumber("XAI_MONTHLY_BUDGET_USD", 10),
    maxEvaluationsPerScan: readPositiveInteger("XAI_MAX_EVALUATIONS_PER_SCAN", 15),
    maxEvaluationsPerDay: readPositiveInteger("XAI_MAX_EVALUATIONS_PER_DAY", 25),
  };
}

function monthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function dayStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

export async function getUsageSnapshot(): Promise<UsageSnapshot> {
  const limits = getUsageLimits();

  const config = readAppConfig();
  if (!config.ok) {
    throw new Error(config.message);
  }

  if (config.mode === "demo") {
    return {
      evaluationsThisMonth: 0,
      evaluationsToday: 0,
      estimatedSpendUsd: 0,
      remainingBudgetUsd: limits.monthlyBudgetUsd,
      withinBudget: true,
    };
  }

  const supabase = createServerClient();

  const [monthly, daily] = await Promise.all([
    supabase
      .from("evaluations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart()),
    supabase
      .from("evaluations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", dayStart()),
  ]);

  const evaluationsThisMonth = monthly.count ?? 0;
  const evaluationsToday = daily.count ?? 0;
  const estimatedSpendUsd =
    evaluationsThisMonth * ESTIMATED_COST_PER_EVALUATION_USD;
  const remainingBudgetUsd = Math.max(
    0,
    limits.monthlyBudgetUsd - estimatedSpendUsd,
  );

  return {
    evaluationsThisMonth,
    evaluationsToday,
    estimatedSpendUsd,
    remainingBudgetUsd,
    withinBudget: estimatedSpendUsd < limits.monthlyBudgetUsd,
  };
}

export async function canRunEvaluation(): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const limits = getUsageLimits();
  const usage = await getUsageSnapshot();

  if (!usage.withinBudget) {
    return {
      allowed: false,
      reason: `Monthly xAI budget ($${limits.monthlyBudgetUsd}) reached.`,
    };
  }

  if (usage.evaluationsToday >= limits.maxEvaluationsPerDay) {
    return {
      allowed: false,
      reason: `Daily evaluation limit (${limits.maxEvaluationsPerDay}) reached.`,
    };
  }

  return { allowed: true };
}