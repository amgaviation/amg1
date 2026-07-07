import { requireRole } from "@/lib/portal/session";
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
  const user = await requireRole("partner");
  const params = await searchParams;
  return <VendorReceiptsList user={user} params={params} />;
}
