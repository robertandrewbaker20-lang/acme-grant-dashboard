const GRANTS_GOV_DETAILS =
  "https://apply07.grants.gov/grantsws/rest/opportunity/details";

export interface GrantsGovAwardBlock {
  awardCeiling?: string | number;
  awardFloor?: string | number;
  awardCeilingFormatted?: string;
  awardFloorFormatted?: string;
  estimatedFunding?: string | number;
  estimatedFundingFormatted?: string;
  numberOfAwards?: string;
  agencyContactName?: string;
  agencyContactEmail?: string;
  agencyContactPhone?: string;
  synopsisDesc?: string;
  forecastDesc?: string;
  responseDate?: string;
  responseDateDesc?: string;
  archiveDate?: string;
  postingDate?: string;
}

export interface GrantsGovDetailsResponse {
  id?: number;
  opportunityNumber?: string;
  opportunityTitle?: string;
  docType?: string;
  forecast?: GrantsGovAwardBlock;
  synopsis?: GrantsGovAwardBlock;
  agencyDetails?: { agencyName?: string };
}

export function extractGrantsGovOppId(noticeId: string): string | null {
  if (noticeId.startsWith("grants.gov:")) {
    return noticeId.slice("grants.gov:".length);
  }
  return /^\d+$/.test(noticeId) ? noticeId : null;
}

export function stripGrantsGovHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function parseGrantsGovAwardValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/[$,\s]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getGrantsGovAwardBlock(
  details: GrantsGovDetailsResponse,
): GrantsGovAwardBlock | null {
  return details.synopsis ?? details.forecast ?? null;
}

export function hasGrantsGovAwardData(raw: Record<string, unknown>): boolean {
  const synopsis = raw.synopsis as GrantsGovAwardBlock | undefined;
  const forecast = raw.forecast as GrantsGovAwardBlock | undefined;
  const block = synopsis ?? forecast;
  return Boolean(
    block &&
      (block.awardCeiling !== undefined ||
        block.awardFloor !== undefined ||
        block.estimatedFunding !== undefined),
  );
}

export async function fetchGrantsGovOpportunityDetails(
  oppId: string,
): Promise<GrantsGovDetailsResponse | null> {
  try {
    const response = await fetch(GRANTS_GOV_DETAILS, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: `oppId=${encodeURIComponent(oppId)}`,
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;
    const data = (await response.json()) as GrantsGovDetailsResponse;
    return data?.id ? data : null;
  } catch {
    return null;
  }
}

export function mergeGrantsGovDetailsIntoRaw(
  existing: Record<string, unknown>,
  details: GrantsGovDetailsResponse,
): Record<string, unknown> {
  const block = getGrantsGovAwardBlock(details);
  return {
    ...existing,
    ...details,
    source: "grants.gov",
    award: block
      ? {
          awardCeiling: block.awardCeiling ?? block.awardCeilingFormatted,
          awardFloor: block.awardFloor ?? block.awardFloorFormatted,
          estimatedFunding:
            block.estimatedFunding ?? block.estimatedFundingFormatted,
          numberOfAwards: block.numberOfAwards,
        }
      : existing.award,
    pointOfContact: block?.agencyContactName
      ? [
          {
            type: "primary",
            fullName: block.agencyContactName,
            email: block.agencyContactEmail ?? "",
            phone: block.agencyContactPhone ?? "",
          },
        ]
      : existing.pointOfContact,
  };
}

export function grantsGovDescriptionFromDetails(
  details: GrantsGovDetailsResponse,
): string | null {
  const block = getGrantsGovAwardBlock(details);
  if (!block) return null;
  const html = block.synopsisDesc ?? block.forecastDesc;
  if (!html) return null;
  return stripGrantsGovHtml(html);
}