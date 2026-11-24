import { afterEach, describe, expect, it, vi } from "vitest";
import { computeAlignment, passesMissionFocus } from "./alignment";
import { readAppConfig, readPositiveInteger } from "./env";
import {
  getInvitationRequiredCount,
  getOpenOpportunityCount,
  getSortedOpportunities,
} from "./family-foundations";
import { applyDashboardFilters, DEFAULT_FILTERS } from "./opportunity-filters";
import { getDeadlineUrgency } from "./opportunity-ui";
import {
  daysUntil,
  partitionReportOpportunities,
  type ReportOpportunity,
} from "./report";
import { buildSampleRecords, summarizeSample, toScoredOpportunities } from "./sample-data";
import { summarizeOpportunities } from "./stats";

const NOW = new Date("2026-11-24T15:00:00.000Z");

function item(partial: {
  title: string;
  description?: string;
  fit_score?: number | null;
  response_deadline?: string | null;
  source?: string;
  agency?: string;
}) {
  return {
    id: partial.title,
    notice_id: partial.title,
    title: partial.title,
    description: partial.description ?? "",
    solicitation_number: null,
    agency: partial.agency ?? "Department of Labor",
    naics_code: null,
    opportunity_type: "Grant",
    posted_date: null,
    response_deadline: partial.response_deadline ?? null,
    set_aside: null,
    sam_url: null,
    source: partial.source ?? "grants.gov",
    status: "new" as const,
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
    fit_score: partial.fit_score ?? null,
    recommendation: null,
    fitFactors: [],
  };
}

describe("alignment", () => {
  it("scores a workforce cybersecurity grant above a janitorial contract", () => {
    const training = computeAlignment(
      item({
        title: "Community cybersecurity workforce training",
        description: "Nonprofit grant for workforce training. No cash match.",
      }),
    );
    const janitorial = computeAlignment(
      item({
        title: "City hall janitorial services",
        description: "Janitorial and custodial contract.",
      }),
    );
    expect(training).toBeGreaterThan(janitorial);
    expect(janitorial).toBeLessThan(40);
  });

  it("hides janitorial work and low scores when mission focus is on", () => {
    const training = item({
      title: "STEM workforce training",
      description: "Open solicitation for a training program.",
      fit_score: 80,
    });
    const janitorial = item({
      title: "Janitorial contract",
      description: "Janitorial services for a federal building.",
      fit_score: 8,
    });
    expect(passesMissionFocus(training)).toBe(true);
    expect(passesMissionFocus(janitorial)).toBe(false);
  });
});

describe("dashboard filters", () => {
  const soon = new Date();
  soon.setDate(soon.getDate() + 20);
  const past = new Date();
  past.setDate(past.getDate() - 10);
  const rows = [
    item({
      title: "Digital safety workshops",
      description: "Open solicitation for cybersecurity workforce training.",
      fit_score: 88,
      response_deadline: soon.toISOString(),
    }),
    item({
      title: "Janitorial services",
      description: "Janitorial contract.",
      fit_score: 8,
      response_deadline: soon.toISOString(),
      source: "sam.gov",
      agency: "General Services",
    }),
    item({
      title: "Closed round",
      description: "Invitation only. Closed solicitation.",
      fit_score: 70,
      response_deadline: soon.toISOString(),
    }),
  ];

  it("keeps the training grant and hides the other two by default", () => {
    const visible = applyDashboardFilters(rows, DEFAULT_FILTERS);
    expect(visible.map((row) => row.title)).toEqual(["Digital safety workshops"]);
  });

  it("can search by a word in the title", () => {
    const visible = applyDashboardFilters(rows, {
      ...DEFAULT_FILTERS,
      missionFocus: false,
      openSolicitationOnly: false,
      search: "janitorial",
    });
    expect(visible).toHaveLength(1);
    expect(visible[0]?.title).toBe("Janitorial services");
  });

  it("filters overdue deadlines", () => {
    const overdue = item({
      title: "Library lab",
      description: "Open solicitation for a community technology lab.",
      fit_score: 48,
      response_deadline: past.toISOString(),
    });
    const visible = applyDashboardFilters([overdue, rows[0]!], {
      ...DEFAULT_FILTERS,
      missionFocus: false,
      urgency: "overdue",
    });
    expect(visible.map((row) => row.title)).toEqual(["Library lab"]);
  });
});

describe("deadline labels", () => {
  it("marks a past date overdue and a date ten days out as soon", () => {
    expect(
      getDeadlineUrgency("2026-11-20T17:00:00.000Z", NOW).level,
    ).toBe("overdue");
    expect(
      getDeadlineUrgency("2026-12-04T17:00:00.000Z", NOW).level,
    ).toBe("soon");
    expect(daysUntil("2026-12-04T17:00:00.000Z", NOW)).toBe(10);
  });
});

describe("report partition", () => {
  function reportItem(partial: Partial<ReportOpportunity> & Pick<ReportOpportunity, "id">): ReportOpportunity {
    return {
      title: partial.id,
      agency: null,
      source: "grants.gov",
      deadline: null,
      fitScore: 80,
      recommendation: "pursue",
      summary: null,
      strengths: [],
      concerns: [],
      samUrl: null,
      opportunityType: null,
      daysLeft: 40,
      ...partial,
    };
  }

  it("puts pursue scores in recommended and a near-term pass in insufficient time", () => {
    const result = partitionReportOpportunities([
      reportItem({ id: "keep", recommendation: "pursue", fitScore: 88, daysLeft: 40 }),
      reportItem({ id: "soon-pass", recommendation: "pass", fitScore: 20, daysLeft: 12 }),
      reportItem({ id: "low", recommendation: "pass", fitScore: 20, daysLeft: 90 }),
    ]);
    expect(result.recommended.map((item) => item.id)).toEqual(["keep"]);
    expect(result.insufficientTime.map((item) => item.id)).toEqual(["soon-pass"]);
    expect(result.notRecommended.map((item) => item.id)).toEqual(["low"]);
  });
});

describe("sample data", () => {
  it("counts high matches and a review due inside 14 days", () => {
    const stats = summarizeSample(NOW);
    const records = toScoredOpportunities(buildSampleRecords(NOW));
    expect(stats).toEqual(summarizeOpportunities(records, NOW));
    expect(stats.total).toBe(9);
    expect(stats.highMatch).toBeGreaterThan(0);
    expect(stats.internalReviewDue).toBeGreaterThan(0);
    expect(records.some((row) => row.title.includes("Janitorial"))).toBe(true);
  });
});

describe("foundations catalog", () => {
  it("sorts open records before invitation-only watch items", () => {
    const titles = getSortedOpportunities().map((item) => item.status);
    const openIndex = titles.indexOf("open");
    const watchIndex = titles.lastIndexOf("watch");
    expect(openIndex).toBeGreaterThanOrEqual(0);
    expect(watchIndex).toBeGreaterThan(openIndex);
    expect(getOpenOpportunityCount()).toBeGreaterThan(0);
    expect(getInvitationRequiredCount()).toBeGreaterThan(0);
  });
});

describe("environment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses sample data when database variables are missing", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("DATA_MODE", "");
    vi.stubEnv("VERCEL_ENV", "");
    expect(readAppConfig()).toMatchObject({ ok: true, mode: "demo", authRequired: false });
  });

  it("rejects a half-configured database outside preview", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("DATA_MODE", "");
    vi.stubEnv("SUPABASE_URL", "https://db.example.com");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(readAppConfig().ok).toBe(false);
  });

  it("stays on sample data for preview deployments", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("SUPABASE_URL", "https://db.example.com");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "x".repeat(40));
    vi.stubEnv("DASHBOARD_PASSWORD", "secret");
    expect(readAppConfig()).toMatchObject({ ok: true, mode: "demo", authRequired: false });
  });

  it("rejects a non-integer evaluation cap", () => {
    vi.stubEnv("XAI_MAX_EVALUATIONS_PER_SCAN", "1.5");
    expect(() => readPositiveInteger("XAI_MAX_EVALUATIONS_PER_SCAN", 15)).toThrow(
      /whole number/,
    );
  });
});
