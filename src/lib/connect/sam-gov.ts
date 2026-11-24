// Phase 2.5: Vercel Connect migration stub
// Replace env-var usage in lib/sam-gov.ts with getToken() calls here.

export async function getSamGovToken(): Promise<string> {
  // import { getToken } from '@vercel/connect';
  // return await getToken('samgov/main', { subject: { type: 'app' } });
  throw new Error(
    "Vercel Connect not yet configured. Use SAM_GOV_API_KEY env var (Phase 2 Option A).",
  );
}