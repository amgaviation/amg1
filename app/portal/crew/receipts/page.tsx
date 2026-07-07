import { requireRole } from "@/lib/portal/session";
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
  const user = await requireRole("crew");
  const params = await searchParams;
  return <VendorReceiptsList user={user} params={params} />;
}
