import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Payment Received - AMG Aviation Group" };

export default async function StripePaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice_id?: string }>;
}) {
  const params = await searchParams;
  const invoicePath = params.invoice_id ? `/portal/client/billing/${params.invoice_id}` : "/portal/client/billing";

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto max-w-xl space-y-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <p className="eyebrow text-[0.62rem] text-accent">AMG Billing</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold uppercase leading-none">Payment Received</h1>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Payment received. AMG is finalizing the invoice status. You may return to the portal for the latest invoice
          details.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="rounded-full">
            <Link href={invoicePath}>Return to Portal</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact">Contact AMG Operations</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
