import type { NormalizedOpportunity, SourceFetchResult } from "./types";

const DIU_OPEN_URL = "https://www.diu.mil/work-with-us/open-solicitations";

function parseDiuChallenges(html: string): Array<{
  title: string;
  deadline: string | null;
  overview: string;
  submitUrl: string | null;
}> {
  const challenges: Array<{
    title: string;
    deadline: string | null;
    overview: string;
    submitUrl: string | null;
  }> = [];

  const sections = html.split(/<h4[^>]*>/i).slice(1);

  for (const section of sections) {
    const titleMatch = section.match(/^([^<]+)/);
    const title = titleMatch?.[1]?.trim();
    if (!title || title.toLowerCase().includes("sorry")) continue;

    const deadlineMatch = section.match(
      /Responses Due By[\s\S]{0,200}?(\d{4}-\d{2}-\d{2})/i,
    );
    const overviewMatch = section.match(
      /<strong>Overview:<\/strong>[\s\S]{0,800}?<\/p>/i,
    );
    const submitMatch = section.match(/href="([^"]*submit-solution[^"]*)"/i);

    challenges.push({
      title,
      deadline: deadlineMatch?.[1] ?? null,
      overview: overviewMatch
        ? overviewMatch[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "",
      submitUrl: submitMatch?.[1]
        ? submitMatch[1].startsWith("http")
          ? submitMatch[1]
          : `https://www.diu.mil${submitMatch[1]}`
        : null,
    });
  }

  return challenges;
}

export async function fetchDiuOpportunities(): Promise<SourceFetchResult> {
  const errors: string[] = [];

  try {
    const response = await fetch(DIU_OPEN_URL, {
      headers: { Accept: "text/html" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return {
        source: "diu",
        opportunities: [],
        errors: [`diu: HTTP ${response.status}`],
      };
    }

    const html = await response.text();
    const challenges = parseDiuChallenges(html);

    const opportunities: NormalizedOpportunity[] = challenges.map((c, i) => ({
      notice_id: `diu:${c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${i}`,
      source: "diu",
      title: c.title,
      description: c.overview || null,
      solicitation_number: null,
      agency: "Defense Innovation Unit (DIU)",
      naics_code: null,
      opportunity_type: "Challenge / CSO",
      posted_date: new Date().toISOString(),
      response_deadline: c.deadline
        ? new Date(c.deadline).toISOString()
        : null,
      set_aside: null,
      sam_url: c.submitUrl ?? DIU_OPEN_URL,
      raw_data: { ...c, source: "diu" },
      status: "new",
    }));

    return { source: "diu", opportunities, errors };
  } catch (error) {
    errors.push(`diu: ${error instanceof Error ? error.message : "fetch failed"}`);
    return { source: "diu", opportunities: [], errors };
  }
}