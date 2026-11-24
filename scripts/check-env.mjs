#!/usr/bin/env node
/**
 * Prints which environment variables are set. Never prints values.
 */

const OPTIONAL = [
  "DATA_MODE",
  "DASHBOARD_PASSWORD",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SAM_GOV_API_KEY",
  "XAI_API_KEY",
  "CRON_SECRET",
  "XAI_MONTHLY_BUDGET_USD",
  "XAI_MAX_EVALUATIONS_PER_SCAN",
  "XAI_MAX_EVALUATIONS_PER_DAY",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_REF",
  "GITHUB_TOKEN",
  "GITHUB_REPO",
  "GITHUB_BRANCH",
];

function isSet(name) {
  const value = process.env[name];
  return value != null && String(value).trim() !== "";
}

console.log("Acme grant dashboard — environment check\n");

for (const name of OPTIONAL) {
  console.log(`  ${isSet(name) ? "set" : "empty"}  ${name}`);
}

const mode = (process.env.DATA_MODE ?? "").trim().toLowerCase();
if (mode && mode !== "demo" && mode !== "live") {
  console.error('\nDATA_MODE must be "demo" or "live".');
  process.exit(1);
}

const url = isSet("SUPABASE_URL");
const key = isSet("SUPABASE_SERVICE_ROLE_KEY");
if (url !== key) {
  console.error(
    "\nSet both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or leave both empty.",
  );
  process.exit(1);
}

if (!url || mode === "demo" || process.env.VERCEL_ENV === "preview") {
  console.log("\nMode: sample data. No database is required.");
  process.exit(0);
}

if (!isSet("DASHBOARD_PASSWORD")) {
  console.error("\nDASHBOARD_PASSWORD is required when a database is configured.");
  process.exit(1);
}

console.log("\nMode: live database.");
process.exit(0);
