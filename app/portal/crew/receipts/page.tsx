import { requireRolePermission } from "@/lib/portal/permissions";
import {
  VendorReceiptsList,
  type VendorReceiptsParams,
} from "@/components/portal/vendor-receipts-list";

export const metadata = { title: "Receipts - Crew Portal" };

export default async function CrewReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<VendorReceiptsParams>;
}) {
  const user = await requireRolePermission("crew", "contractor_billing");
  const params = await searchParams;
  return <VendorReceiptsList user={user} params={params} />;
}
