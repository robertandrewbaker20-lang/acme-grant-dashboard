import { ORG_PROFILE } from "./constants";
import {
  buildEvaluationProfileText,
  type SearchProfile,
} from "./search-profiles-types";
import type { Opportunity, Recommendation } from "./types";

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const MODEL = "grok-3";

export interface EvaluationResult {
  fit_score: number;
  recommendation: Recommendation;
  summary: string;
  strengths: string[];
  concerns: string[];
  stage: number;
}

function stageOnePrompt(profileText: string): string {
  return `You are a grant strategist. Evaluate whether this federal opportunity is worth deeper review for the organization described below. Do not invent partnerships, awards, or history that the profile does not state.

${profileText}

Respond ONLY with valid JSON:
{
  "fit_score": <0-100 integer>,
  "recommendation": "<pursue|review|pass>",
  "summary": "<2-3 sentence summary>",
  "strengths": ["<strength>", ...],
  "concerns": ["<concern>", ...]
}

Scoring guide:
- 80-100 pursue: Strong match to the active profile above; 501(c)(3) can lead/PM when required.
- 50-79 review: Partial fit — may need partners or clearer pathway
- 0-49 pass: Wrong entity type, pure procurement, or outside the active profile's looking-for / match criteria

In strengths/concerns, explicitly call out eligibility preferences and partner needs from the profile.

Be strict. Only recommend pursue when the opportunity fits the active search profile.`;
}

function stageTwoPrompt(profileText: string): string {
  return `You are a senior grant compliance reviewer. This opportunity passed initial screening. Provide a rigorous second-pass evaluation for the organization described below. Do not invent partnerships or past awards.

${profileText}

Respond ONLY with valid JSON:
{
  "fit_score": <0-100 integer>,
  "recommendation": "<pursue|review|pass>",
  "summary": "<detailed 3-4 sentence assessment>",
  "strengths": ["<specific strength with evidence>", ...],
  "concerns": ["<specific risk or gap>", ...]
}

Consider match criteria from the profile, deadline feasibility, and budget realism.
In concerns, list required partner types if any.`;
}

function buildOpportunityContext(opportunity: Opportunity): string {
  return [
    `Title: ${opportunity.title}`,
    `Agency: ${opportunity.agency ?? "Unknown"}`,
    `NAICS: ${opportunity.naics_code ?? "Unknown"}`,
    `Type: ${opportunity.opportunity_type ?? "Unknown"}`,
    `Posted: ${opportunity.posted_date ?? "Unknown"}`,
    `Deadline: ${opportunity.response_deadline ?? "Unknown"}`,
    `Set-Aside: ${opportunity.set_aside ?? "None"}`,
    `Solicitation: ${opportunity.solicitation_number ?? "N/A"}`,
    `Description: ${(opportunity.description ?? "No description available").slice(0, 4000)}`,
  ].join("\n");
}

function parseEvaluationResponse(content: string, stage: number): EvaluationResult {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Grok response did not contain valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<EvaluationResult>;
  const recommendation = parsed.recommendation ?? "review";

  if (!["pursue", "review", "pass"].includes(recommendation)) {
    throw new Error(`Invalid recommendation: ${recommendation}`);
  }

  return {
    fit_score: Math.min(100, Math.max(0, Math.round(parsed.fit_score ?? 50))),
    recommendation: recommendation as Recommendation,
    summary: parsed.summary ?? "Evaluation completed.",
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
    stage,
  };
}

export async function evaluateOpportunity(
  opportunity: Opportunity,
  stage: 1 | 2 = 1,
  profile?: SearchProfile | null,
): Promise<EvaluationResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured");
  }

  const profileText = profile
    ? buildEvaluationProfileText(profile)
    : ORG_PROFILE;

  const systemPrompt =
    stage === 1 ? stageOnePrompt(profileText) : stageTwoPrompt(profileText);
  const userPrompt = buildOpportunityContext(opportunity);

  const response = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`xAI API error (${response.status}): ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("xAI returned an empty response");
  }

  return parseEvaluationResponse(content, stage);
}
