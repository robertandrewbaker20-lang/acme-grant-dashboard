export class ConfigError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ConfigError";
    this.status = status;
  }
}

export type DataMode = "demo" | "database";

export interface AppConfig {
  ok: true;
  mode: DataMode;
  authRequired: boolean;
}

export interface AppConfigProblem {
  ok: false;
  message: string;
}

function trimmed(name: string): string {
  return process.env[name]?.trim() ?? "";
}

/**
 * Sample data is the default.
 * A live database is used only outside Vercel preview, and only when both
 * database variables are set. Preview deploys stay on sample data so a
 * public preview cannot attach to a private database.
 */
export function readAppConfig(): AppConfig | AppConfigProblem {
  const requested = trimmed("DATA_MODE").toLowerCase();
  if (requested && requested !== "demo" && requested !== "live") {
    return {
      ok: false,
      message: 'DATA_MODE must be "demo" or "live".',
    };
  }

  const preview = process.env.VERCEL_ENV === "preview";
  if (requested === "demo" || preview) {
    return { ok: true, mode: "demo", authRequired: false };
  }

  const url = trimmed("SUPABASE_URL");
  const key = trimmed("SUPABASE_SERVICE_ROLE_KEY");

  if (!url && !key) {
    return { ok: true, mode: "demo", authRequired: false };
  }

  if (!url || !key) {
    return {
      ok: false,
      message:
        "Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or leave both empty to use sample data.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, message: "SUPABASE_URL must be a valid URL." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, message: "SUPABASE_URL must start with http:// or https://." };
  }

  if (key.length < 20) {
    return {
      ok: false,
      message: "SUPABASE_SERVICE_ROLE_KEY is too short to be a real key.",
    };
  }

  if (!trimmed("DASHBOARD_PASSWORD")) {
    return {
      ok: false,
      message: "DASHBOARD_PASSWORD is required when a database is configured.",
    };
  }

  return { ok: true, mode: "database", authRequired: true };
}

export function isDemoMode(): boolean {
  const config = readAppConfig();
  return config.ok && config.mode === "demo";
}

export function isAuthRequired(): boolean {
  const config = readAppConfig();
  return config.ok && config.authRequired;
}

export function assertLiveDatabase(): void {
  const config = readAppConfig();
  if (!config.ok) throw new ConfigError(config.message);
  if (config.mode !== "database") {
    throw new ConfigError(
      "This deployment is showing sample data. A live scan needs a database and API keys, and it does not run on Vercel preview deployments.",
    );
  }
}

export function assertLiveScanConfigured(): void {
  assertLiveDatabase();
  if (!trimmed("SAM_GOV_API_KEY")) {
    throw new ConfigError(
      "SAM_GOV_API_KEY is not set, so a live scan cannot run.",
    );
  }
  if (!trimmed("XAI_API_KEY")) {
    throw new ConfigError(
      "XAI_API_KEY is not set, so fit scoring cannot run.",
    );
  }
}

export function readNonNegativeNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new ConfigError(`${name} must be a non-negative number.`);
  }
  return value;
}

export function readPositiveInteger(name: string, fallback: number): number {
  const value = readNonNegativeNumber(name, fallback);
  if (!Number.isInteger(value) || value < 1) {
    throw new ConfigError(`${name} must be a whole number of at least 1.`);
  }
  return value;
}
