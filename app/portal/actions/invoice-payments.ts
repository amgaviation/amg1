"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createInvoiceCheckoutSessionForUser } from "@/lib/portal/stripe-invoices";
import { actor, str } from "@/app/portal/actions/_helpers";

function failurePath(invoiceId: string, reason: string) {
  return `/portal/client/billing/${invoiceId}?error=${encodeURIComponent(reason)}`;
}

export async function payInvoiceWithStripe(formData: FormData) {
  const user = await actor(["client", "admin"]);
  const invoiceId = str(formData, "invoice_id");
  const returnTo = str(formData, "return_to") || `/portal/client/billing/${invoiceId}`;
  if (!invoiceId) redirect("/portal/client/billing?error=missing");

  const result = await createInvoiceCheckoutSessionForUser(invoiceId, user);
  if (!result.ok) {
    const base = returnTo.startsWith("/portal/admin/")
      ? `/portal/admin/invoices/${invoiceId}`
      : failurePath(invoiceId, result.reason);
    redirect(base.includes("?") ? base : `${base}?error=${result.reason}`);
  }

  revalidatePath(`/portal/client/billing/${invoiceId}`);
  revalidatePath(`/portal/admin/invoices/${invoiceId}`);
  redirect(result.url);
}
