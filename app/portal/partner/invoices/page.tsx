import { requireRolePermission } from "@/lib/portal/permissions";
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
  const user = await requireRolePermission("partner", "contractor_billing");
  const params = await searchParams;
  return <VendorInvoicesList user={user} params={params} />;
}
