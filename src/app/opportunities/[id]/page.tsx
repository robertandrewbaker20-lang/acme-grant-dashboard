import { notFound } from "next/navigation";
import { PortalHeader } from "@/components/portal/portal-header";
import { GrantDetailView } from "@/components/opportunity/grant-detail";
import { getOpportunityDetail } from "@/lib/dashboard";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getOpportunityDetail(id);

  if (!detail) notFound();

  return (
    <>
      <PortalHeader />
      <GrantDetailView detail={detail} />
    </>
  );
}