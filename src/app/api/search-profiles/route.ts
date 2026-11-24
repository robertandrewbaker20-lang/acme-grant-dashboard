import { NextResponse } from "next/server";
import {
  loadSearchProfiles,
  saveSearchProfiles,
  type SearchProfilesFile,
  validateProfilesFile,
} from "@/lib/search-profiles";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, source } = await loadSearchProfiles();
  return NextResponse.json({ data, source });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body as {
    data?: SearchProfilesFile;
    commitMessage?: string;
  };

  if (!payload.data) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const validationError = validateProfilesFile(payload.data);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const result = await saveSearchProfiles(payload.data, {
    commitMessage: payload.commitMessage,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.message,
        data: result.data,
        source: result.source,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    source: result.source,
    commitSha: result.commitSha,
    data: result.data,
  });
}
