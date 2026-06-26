import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceInquiryForm } from "@/components/site/service-inquiry-form";
import { COMPANY } from "@/lib/content";
import { IMG } from "@/lib/site-media";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";
import { normalizeServiceInquirySearchParams } from "@/lib/public-inquiries";

export const metadata = metadataForWebsiteContent("contact", {
  title: "Contact AMG Aviation Group | Aviation Support Capabilities",
  description:
    "Contact AMG Aviation Group for general inquiries, plan questions, pilot network communication, vendor coordination, and aviation support routing.",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const context = normalizeServiceInquirySearchParams(params);
  const hero = heroForWebsiteContent("contact", {
    eyebrow: "AMG Contact",
    title: "Start a Service Inquiry",
    lead: "Choose the service path and send the minimum context AMG needs to qualify and route your inquiry.",
    image: IMG.contactSupport,
  });

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[var(--oc-navy)] pb-12 pt-[calc(var(--public-header-height)+4rem)] lg:pb-16 lg:pt-[calc(var(--public-header-height)+5rem)]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_8%,rgba(47,107,174,0.12),transparent_28rem)]" />
        <div className="oc-shell">
          <div className="mx-auto max-w-4xl text-center">
            <p className="oc-eyebrow text-[var(--oc-blue)]">{hero.eyebrow}</p>
            <h1 className="oc-display mt-5 text-[clamp(2.75rem,7vw,5.25rem)] text-[var(--oc-paper)]">
              {hero.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
              {hero.lead}
            </p>
            <p className="mx-auto mt-5 max-w-3xl rounded-2xl border border-white/[0.14] bg-white/[0.08] p-4 text-sm leading-relaxed text-[var(--oc-aluminum)] backdrop-blur">
              Public inquiries are reviewed before any support path is accepted, quoted, scheduled, assigned, or operationally approved.
            </p>
          </div>
        </div>
      </section>

      <section className="oc-shell py-14 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.55fr] lg:items-start">
          <ServiceInquiryForm context={context} />
          <aside className="grid gap-5 lg:sticky lg:top-[calc(var(--public-header-height)+2rem)]">
            <div className="rounded-2xl border border-[var(--oc-line)] bg-white/[0.72] p-6 shadow-[var(--oc-shadow)] backdrop-blur-xl">
              <p className="oc-eyebrow text-[var(--oc-blue)]">AMG Contact</p>
              <h2 className="mt-4 text-2xl font-semibold text-[var(--oc-ink)]">What happens next</h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--oc-muted)]">
                AMG reviews the selected service, timing, aircraft context when relevant, and contact information. If the inquiry is within scope, AMG follows up for the next qualified step.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--oc-muted)]">{COMPANY.requestDisclaimer}</p>
              <div className="mt-5 rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-4">
                <Mail className="h-5 w-5 text-[var(--oc-blue)]" />
                <p className="mt-3 text-xs font-semibold uppercase text-[var(--oc-muted)]">Direct contact</p>
                <a href={`mailto:${COMPANY.email}`} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--oc-ink)] hover:text-[var(--oc-blue)]">
                  {COMPANY.email}
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--oc-line)] bg-[var(--oc-navy)] p-6 text-white shadow-[var(--oc-shadow)]">
              <p className="oc-eyebrow oc-eyebrow-light">AMG Connect</p>
              <h2 className="mt-4 text-2xl font-semibold text-[var(--oc-paper)]">Detailed trip work happens after qualification.</h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--oc-aluminum)]">
                Passenger, FBO, customs, baggage, catering, crew credential, and fulfillment details belong in the authenticated portal or direct AMG follow-up.
              </p>
              <Button asChild className="mt-6 min-h-11 rounded-full bg-white text-[var(--oc-navy)] hover:bg-white/90">
                <Link href="/login" prefetch={false}>Member Login</Link>
              </Button>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
