import { requireRole } from "@/lib/portal/session";
import {
  VendorInvoicesList,
  type VendorInvoiceListParams,
} from "@/components/portal/vendor-invoices-list";

export const metadata = { title: "Invoices - Partner Portal" };

export default async function PartnerInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<VendorInvoiceListParams>;
}) {
  const user = await requireRole("partner");
  const params = await searchParams;
  return <VendorInvoicesList user={user} params={params} />;
}
