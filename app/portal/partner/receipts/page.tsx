import { requireRolePermission } from "@/lib/portal/permissions";
import {
  VendorReceiptsList,
  type VendorReceiptsParams,
} from "@/components/portal/vendor-receipts-list";

export const metadata = { title: "Receipts - Partner Portal" };

export default async function PartnerReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<VendorReceiptsParams>;
}) {
  const user = await requireRolePermission("partner", "contractor_billing");
  const params = await searchParams;
  return <VendorReceiptsList user={user} params={params} />;
}
