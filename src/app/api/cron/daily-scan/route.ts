import { NextRequest, NextResponse } from "next/server";
import { ConfigError } from "@/lib/env";
import { runDailyScan } from "@/lib/scan";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyScan();
    const ok = result.errors.length === 0;
    return NextResponse.json(
      {
        success: ok,
        timestamp: new Date().toISOString(),
        ...result,
      },
      { status: ok ? 200 : 500 },
    );
  } catch (error) {
    if (error instanceof ConfigError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
