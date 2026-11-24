// Phase 2.5: Vercel Connect migration stub
// Replace env-var usage in lib/xai-grok.ts with getToken() calls here.

export async function getXaiToken(): Promise<string> {
  // import { getToken } from '@vercel/connect';
  // return await getToken('xai/main', { subject: { type: 'app' } });
  throw new Error(
    "Vercel Connect not yet configured. Use XAI_API_KEY env var (Phase 2 Option A).",
  );
}