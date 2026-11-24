import type { SupabaseClient } from "@supabase/supabase-js";

export interface ExistingOpportunity {
  id: string;
  status: string;
  notice_id: string;
}

/** Match by prefixed notice_id or legacy bare SAM.gov ids. */
export async function findExistingOpportunity(
  supabase: SupabaseClient,
  noticeId: string,
): Promise<ExistingOpportunity | null> {
  const { data: exact } = await supabase
    .from("opportunities")
    .select("id, status, notice_id")
    .eq("notice_id", noticeId)
    .maybeSingle();

  if (exact) return exact;

  if (noticeId.startsWith("sam.gov:")) {
    const bare = noticeId.slice("sam.gov:".length);
    const { data: legacy } = await supabase
      .from("opportunities")
      .select("id, status, notice_id")
      .eq("notice_id", bare)
      .maybeSingle();
    if (legacy) return legacy;
  }

  if (!noticeId.includes(":")) {
    const { data: prefixed } = await supabase
      .from("opportunities")
      .select("id, status, notice_id")
      .eq("notice_id", `sam.gov:${noticeId}`)
      .maybeSingle();
    if (prefixed) return prefixed;
  }

  return null;
}

export function isDismissedStatus(status: string) {
  return status === "archived" || status === "rejected";
}