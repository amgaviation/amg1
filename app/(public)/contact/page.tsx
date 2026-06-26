import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactInquiryForm } from "@/components/site/contact-inquiry-form";
import { COMPANY } from "@/lib/content";
import { IMG } from "@/lib/site-media";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("contact", {
  title: "Contact AMG Aviation Group | Aviation Support Capabilities",
  description:
    "Contact AMG Aviation Group for general inquiries, plan questions, pilot network communication, vendor coordination, and aviation support routing.",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; service?: string; aircraft?: string; plan?: string }>;
}) {
  const params = await searchParams;
  if (params.service || params.aircraft || params.plan) {
    const query = new URLSearchParams();
    if (params.service) query.set("service", params.service);
    if (params.aircraft) query.set("aircraft", params.aircraft);
    if (params.plan) query.set("plan", params.plan);
    redirect(`/booking-request?${query.toString()}`);
  }
  const hero = heroForWebsiteContent("contact", {
    eyebrow: "Contact AMG",
    title: "Send a general inquiry.",
    lead: "Use this page for general inquiries, plan questions, crew-network communication, vendor coordination, or administrative requests.",
    image: IMG.contactSupport,
    imageAlt: "Aircraft support request coordination desk",
  });

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[var(--oc-navy)] pb-12 pt-[calc(var(--public-header-height)+4rem)] lg:pb-16 lg:pt-[calc(var(--public-header-height)+5rem)]">
        <Image
          src={hero.image}
          alt={hero.imageAlt ?? "Aircraft support request coordination desk"}
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover opacity-48"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,11,20,0.74),rgba(5,11,20,0.92)),radial-gradient(circle_at_80%_8%,rgba(47,107,174,0.16),transparent_28rem)]" />
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
              Aircraft support requests require the dedicated support form so AMG can review the aircraft, timing, location, and operating need.
            </p>
          </div>
        </div>
      </section>

      <section className="oc-shell py-14 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <aside className="grid gap-5">
            <div className="rounded-2xl border border-[var(--oc-line)] bg-white/[0.72] p-6 shadow-[var(--oc-shadow)] backdrop-blur-xl">
              <p className="oc-eyebrow text-[var(--oc-blue)]">AMG Contact</p>
              <h2 className="mt-4 text-2xl font-semibold text-[var(--oc-ink)]">Inquiry routing</h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--oc-muted)]">
                AMG routes inquiries based on request type, aircraft context when applicable, timing, and the appropriate support path.
              </p>
              <div className="mt-5 rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-4">
                <Mail className="h-5 w-5 text-[var(--oc-blue)]" />
                <p className="mt-3 text-xs font-semibold uppercase text-[var(--oc-muted)]">General inquiries</p>
                <a href={`mailto:${COMPANY.email}`} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--oc-ink)] hover:text-[var(--oc-blue)]">
                  {COMPANY.email}
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--oc-line)] bg-[var(--oc-navy)] p-6 text-white shadow-[var(--oc-shadow)]">
              <p className="oc-eyebrow oc-eyebrow-light">Need aircraft support?</p>
              <h2 className="mt-4 text-2xl font-semibold text-[var(--oc-paper)]">Use the dedicated support request page.</h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--oc-aluminum)]">
                Aircraft movement, crew coordination, maintenance movement, and operational support requests need the structured intake flow.
              </p>
              <Button asChild className="mt-6 min-h-11 rounded-full bg-white text-[var(--oc-navy)] hover:bg-white/90">
                <Link href="/booking-request" prefetch={false}>
                  Request aircraft support
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </aside>

          <ContactInquiryForm success={params.success} error={params.error} />
        </div>
      </section>
    </>
  );
}
