import type { NormalizedOpportunity, SourceFetchResult } from "./types";

const DARPA_RSS = "https://www.darpa.mil/rss/opportunities.xml";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRssItems(xml: string): Array<{
  title: string;
  description: string;
  pubDate: string;
  guid: string;
  link: string;
  creator: string;
}> {
  const items: Array<{
    title: string;
    description: string;
    pubDate: string;
    guid: string;
    link: string;
    creator: string;
  }> = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return m?.[1]?.trim() ?? "";
    };

    const title = get("title");
    if (!title) continue;

    items.push({
      title,
      description: stripHtml(get("description")),
      pubDate: get("pubDate"),
      guid: get("guid") || title,
      link: get("link") || "https://www.darpa.mil/work-with-us/opportunities",
      creator: get("dc:creator"),
    });
  }

  return items;
}

export async function fetchDarpaOpportunities(): Promise<SourceFetchResult> {
  const errors: string[] = [];

  try {
    const response = await fetch(DARPA_RSS, {
      headers: { Accept: "application/rss+xml" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return {
        source: "darpa",
        opportunities: [],
        errors: [`darpa RSS: HTTP ${response.status}`],
      };
    }

    const xml = await response.text();
    const items = parseRssItems(xml).slice(0, 25);

    const opportunities: NormalizedOpportunity[] = items.map((item) => ({
      notice_id: `darpa:${item.guid.replace(/\s+/g, "-")}`,
      source: "darpa",
      title: item.title,
      description: item.description,
      solicitation_number: null,
      agency: "Defense Advanced Research Projects Agency (DARPA)",
      naics_code: null,
      opportunity_type: "R&D Opportunity",
      posted_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      response_deadline: null,
      set_aside: null,
      sam_url: item.link,
      raw_data: {
        ...item,
        pointOfContact: item.creator
          ? [{ type: "primary", fullName: "DARPA Outreach", email: item.creator, phone: "" }]
          : [],
      },
      status: "new",
    }));

    return { source: "darpa", opportunities, errors };
  } catch (error) {
    errors.push(`darpa: ${error instanceof Error ? error.message : "fetch failed"}`);
    return { source: "darpa", opportunities: [], errors };
  }
}