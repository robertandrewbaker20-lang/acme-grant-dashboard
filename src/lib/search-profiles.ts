import { promises as fs } from "fs";
import path from "path";
import { readAppConfig } from "./env";
import {
  defaultSearchProfilesFile,
  getActiveProfile,
  getProfileById,
  normalizeProfilesFile,
  SEARCH_PROFILES_REPO_PATH,
  validateProfilesFile,
  type SaveProfilesResult,
  type SearchProfile,
  type SearchProfilesFile,
} from "./search-profiles-types";

export type {
  SaveProfilesResult,
  SearchProfile,
  SearchProfilesFile,
} from "./search-profiles-types";

export {
  buildEvaluationProfileText,
  createEmptyProfile,
  defaultSearchProfilesFile,
  getActiveProfile,
  getProfileById,
  keywordsToText,
  parseKeywordList,
  SEARCH_PROFILES_REPO_PATH,
  validateProfilesFile,
} from "./search-profiles-types";

function localFilePath(): string {
  // Scope to data/ so Turbopack does not treat the whole project as traced
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "search-profiles.json");
}

// ── Load ───────────────────────────────────────────────────────────────────

async function loadFromLocalFile(): Promise<SearchProfilesFile | null> {
  try {
    const text = await fs.readFile(localFilePath(), "utf8");
    return normalizeProfilesFile(JSON.parse(text));
  } catch {
    return null;
  }
}

function githubConfig(): {
  token: string;
  owner: string;
  repo: string;
  branch: string;
} | null {
  const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim();
  if (!token) return null;

  const repoFull =
    process.env.GITHUB_REPO?.trim() ||
    (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
      : "");

  if (!repoFull.includes("/")) return null;

  const [owner, repo] = repoFull.split("/");
  if (!owner || !repo) return null;

  const branch =
    process.env.GITHUB_BRANCH?.trim() ||
    process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
    "main";

  return { token, owner, repo, branch };
}

async function loadFromGitHub(): Promise<SearchProfilesFile | null> {
  const cfg = githubConfig();
  if (!cfg) return null;

  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${SEARCH_PROFILES_REPO_PATH}?ref=${encodeURIComponent(cfg.branch)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${cfg.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "acme-grant-dashboard",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;
    const body = (await res.json()) as { content?: string; encoding?: string };
    if (!body.content) return null;
    const decoded = Buffer.from(body.content, "base64").toString("utf8");
    return normalizeProfilesFile(JSON.parse(decoded));
  } catch {
    return null;
  }
}

/**
 * Load search profiles: GitHub (latest committed) → local data file → code defaults.
 */
export async function loadSearchProfiles(): Promise<{
  data: SearchProfilesFile;
  source: "github" | "local" | "default";
}> {
  const config = readAppConfig();
  if (config.ok && config.mode === "database") {
    const fromGitHub = await loadFromGitHub();
    if (fromGitHub) return { data: fromGitHub, source: "github" };
  }

  const fromLocal = await loadFromLocalFile();
  if (fromLocal) return { data: fromLocal, source: "local" };

  return { data: defaultSearchProfilesFile(), source: "default" };
}

export async function loadActiveSearchProfile(): Promise<SearchProfile> {
  const { data } = await loadSearchProfiles();
  return getActiveProfile(data);
}

// ── Save ───────────────────────────────────────────────────────────────────

async function saveToLocalFile(data: SearchProfilesFile): Promise<boolean> {
  try {
    const filePath = localFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    return true;
  } catch {
    return false;
  }
}

async function saveToGitHub(
  data: SearchProfilesFile,
  commitMessage: string,
): Promise<{ ok: boolean; sha?: string; message: string }> {
  const cfg = githubConfig();
  if (!cfg) {
    return {
      ok: false,
      message:
        "GITHUB_TOKEN not configured — saved locally only. Add GITHUB_TOKEN to persist to GitHub.",
    };
  }

  const apiBase = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${SEARCH_PROFILES_REPO_PATH}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${cfg.token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "acme-grant-dashboard",
  };

  let existingSha: string | undefined;
  try {
    const getRes = await fetch(
      `${apiBase}?ref=${encodeURIComponent(cfg.branch)}`,
      {
        headers,
        next: { revalidate: 0 },
      },
    );
    if (getRes.ok) {
      const existing = (await getRes.json()) as { sha?: string };
      existingSha = existing.sha;
    }
  } catch {
    // new file
  }

  const content = Buffer.from(
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  ).toString("base64");

  const putRes = await fetch(apiBase, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: commitMessage,
      content,
      branch: cfg.branch,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    return {
      ok: false,
      message: `GitHub save failed (${putRes.status}): ${errText.slice(0, 240)}`,
    };
  }

  const result = (await putRes.json()) as { commit?: { sha?: string } };
  return {
    ok: true,
    sha: result.commit?.sha,
    message: `Committed to ${cfg.owner}/${cfg.repo}@${cfg.branch}`,
  };
}

/**
 * Persist profiles to GitHub (preferred) and/or local data file.
 */
export async function saveSearchProfiles(
  data: SearchProfilesFile,
  options?: { commitMessage?: string },
): Promise<SaveProfilesResult> {
  const normalized = normalizeProfilesFile({
    ...data,
    updatedAt: new Date().toISOString(),
    profiles: data.profiles.map((p) => ({
      ...p,
      updatedAt: p.updatedAt || new Date().toISOString(),
    })),
  });

  const validationError = validateProfilesFile(normalized);
  if (validationError) {
    return {
      ok: false,
      source: "memory",
      message: validationError,
      data: normalized,
    };
  }

  const message =
    options?.commitMessage ??
    `Update search profiles (active: ${normalized.activeProfileId})`;

  const config = readAppConfig();
  if (!config.ok) {
    return {
      ok: false,
      source: "memory",
      message: config.message,
      data: normalized,
    };
  }

  if (config.mode === "demo") {
    const localOk = await saveToLocalFile(normalized);
    if (localOk) {
      return {
        ok: true,
        source: "local",
        message: "Saved data/search-profiles.json on this machine.",
        data: normalized,
      };
    }
    return {
      ok: false,
      source: "memory",
      message:
        "This demo does not save search criteria. They stay as loaded until you run with a database.",
      data: normalized,
    };
  }

  const github = await saveToGitHub(normalized, message);
  const localOk = await saveToLocalFile(normalized);

  if (github.ok) {
    return {
      ok: true,
      source: "github",
      commitSha: github.sha,
      message: github.message + (localOk ? " · local file updated" : ""),
      data: normalized,
    };
  }

  if (localOk) {
    return {
      ok: true,
      source: "local",
      message: `${github.message} Local data/search-profiles.json updated — commit & push to sync GitHub.`,
      data: normalized,
    };
  }

  return {
    ok: false,
    source: "memory",
    message: `${github.message} Could not write local file (read-only filesystem). Configure GITHUB_TOKEN.`,
    data: normalized,
  };
}

// re-export helpers used by scan
export { getProfileById as pickProfile };
