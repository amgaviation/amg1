import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site-config";

export const metadata = {
  title: "Payment Not Completed - AMG Aviation Group",
  // Post-checkout landing page — never a search result.
  robots: { index: false, follow: false },
};

export default async function StripePaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice_id?: string }>;
}) {
  const params = await searchParams;
  const invoicePath = params.invoice_id ? `/portal/client/billing/${params.invoice_id}` : "/portal/client/billing";

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto max-w-xl space-y-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber/10 text-amber">
          <CircleAlert className="h-6 w-6" />
        </div>
        <div>
          <p className="eyebrow text-[0.62rem] text-accent">AMG Billing</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold uppercase leading-none">Payment Not Completed</h1>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Payment was not completed. You can return to the invoice and try again or contact AMG Operations.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="rounded-full">
            <Link href={invoicePath}>Return to Invoice</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <a href={`mailto:${SITE.email}`}>Contact AMG Operations</a>
          </Button>
        </div>
      </section>
    </main>
  );
}
