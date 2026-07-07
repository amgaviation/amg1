import { requireRole } from "@/lib/portal/session";
import {
  VendorInvoicesList,
  type VendorInvoiceListParams,
} from "@/components/portal/vendor-invoices-list";

export const metadata = { title: "Invoices - Crew Portal" };

export default async function CrewInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<VendorInvoiceListParams>;
}) {
  const user = await requireRole("crew");
  const params = await searchParams;
  return <VendorInvoicesList user={user} params={params} />;
}
