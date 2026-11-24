import { NextResponse } from "next/server";
import { ConfigError, assertLiveScanConfigured } from "@/lib/env";
import { runDailyScan } from "@/lib/scan";

export async function POST(request: Request) {
  let profileId: string | undefined;
  try {
    const text = await request.text();
    if (text.trim()) {
      const body = JSON.parse(text) as unknown;
      if (body && typeof body === "object" && "profileId" in body) {
        const value = (body as { profileId?: unknown }).profileId;
        if (value !== undefined && typeof value !== "string") {
          return NextResponse.json(
            { error: "profileId must be a string." },
            { status: 400 },
          );
        }
        profileId = value;
      }
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    assertLiveScanConfigured();
    const result = await runDailyScan(profileId ? { profileId } : undefined);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ConfigError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
