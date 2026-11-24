import { NextResponse } from "next/server";
import {
  loadSearchProfiles,
  saveSearchProfiles,
} from "@/lib/search-profiles";

export const dynamic = "force-dynamic";

/** Set which profile is active for the next scan. */
export async function POST(request: Request) {
  let body: { profileId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileId = body.profileId?.trim();
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const { data } = await loadSearchProfiles();
  if (!data.profiles.some((p) => p.id === profileId)) {
    return NextResponse.json({ error: "Unknown profileId" }, { status: 404 });
  }

  const next = {
    ...data,
    activeProfileId: profileId,
    updatedAt: new Date().toISOString(),
  };

  const profile = data.profiles.find((p) => p.id === profileId)!;
  const result = await saveSearchProfiles(next, {
    commitMessage: `Set active search profile to “${profile.name}”`,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, data: result.data },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    source: result.source,
    data: result.data,
  });
}
