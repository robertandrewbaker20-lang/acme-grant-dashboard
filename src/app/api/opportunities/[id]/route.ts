import { NextRequest, NextResponse } from "next/server";
import { readAppConfig } from "@/lib/env";
import { columnToStatus, type PipelineColumnId } from "@/lib/pipeline";
import { createServerClient } from "@/lib/supabase/server";
import type { OpportunityStatus } from "@/lib/types";

const STATUSES: OpportunityStatus[] = [
  "new",
  "reviewing",
  "qualified",
  "applied",
  "rejected",
  "archived",
];

const COLUMNS: PipelineColumnId[] = [
  "new",
  "review",
  "high_potential",
  "decision",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || id.length > 80) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { status, column } = body as {
    status?: unknown;
    column?: unknown;
  };

  let newStatus: OpportunityStatus | undefined;
  if (typeof status === "string") {
    if (!STATUSES.includes(status as OpportunityStatus)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    newStatus = status as OpportunityStatus;
  }

  if (column !== undefined) {
    if (typeof column !== "string" || !COLUMNS.includes(column as PipelineColumnId)) {
      return NextResponse.json({ error: "Invalid column." }, { status: 400 });
    }
    newStatus = columnToStatus(column as PipelineColumnId);
  }

  if (!newStatus) {
    return NextResponse.json(
      { error: "Provide a status or a column." },
      { status: 400 },
    );
  }

  const config = readAppConfig();
  if (!config.ok) {
    return NextResponse.json({ error: config.message }, { status: 400 });
  }

  if (config.mode === "demo") {
    return NextResponse.json(
      {
        error:
          "Sample data is read-only. Pipeline changes are not saved, and a reload shows the original fictional notices.",
      },
      { status: 409 },
    );
  }

  const supabase = createServerClient();
  const updates: Record<string, unknown> = { status: newStatus };

  if (newStatus === "archived") {
    updates.archived_at = new Date().toISOString();
  } else {
    updates.archived_at = null;
  }

  let { data, error } = await supabase
    .from("opportunities")
    .update(updates)
    .eq("id", id)
    .select("id, status")
    .single();

  if (error?.message?.includes("archived_at")) {
    ({ data, error } = await supabase
      .from("opportunities")
      .update({ status: newStatus })
      .eq("id", id)
      .select("id, status")
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, persisted: true, opportunity: data });
}
