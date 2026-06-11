import type { Metadata } from "next";
import { Mail, Send } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { RevealGroup, RevealItem } from "@/components/site/reveal";
import { COMPANY, CONTACT_CARDS } from "@/lib/content";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Support Request",
  description:
    "Contact AMG Aviation Group for aircraft management support, crew coordination, ferry or repositioning assistance, maintenance flight support, or general operational support.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact AMG"
        title="Start a Support Request"
        description="Use this page to request aircraft management support, crew coordination, ferry or repositioning assistance, maintenance flight support, or general operational support."
        image="/images/jet-sky.png"
      />
      <section className="py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <aside>
            <RevealGroup className="grid gap-4">
              {CONTACT_CARDS.map((card) => (
                <RevealItem key={card.title}>
                  <div className="hover-lift rounded-xl border border-border bg-card p-6 hover:border-accent/60">
                    <p className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">{card.title}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                  </div>
                </RevealItem>
              ))}
              <RevealItem>
                <div className="rounded-xl border border-border bg-card p-6">
                  <Mail className="h-6 w-6 text-accent" />
                  <p className="eyebrow mt-5 text-[0.7rem] text-muted-foreground">Email</p>
                  <a href={`mailto:${COMPANY.email}`} className="mt-2 block text-lg text-foreground hover:text-accent">{COMPANY.email}</a>
                </div>
              </RevealItem>
            </RevealGroup>
          </aside>
          <form className="rounded-xl border border-border bg-card p-6 lg:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Requester name" />
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Email" type="email" />
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Aircraft / type" />
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Tail number if applicable" />
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Owner / operator" />
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Route / airports" />
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Timing" />
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Support type" />
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Crew need" />
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Passenger or non-passenger context" />
            </div>
            <textarea className="mt-5 min-h-40 w-full rounded-lg border border-input bg-background p-4 text-base outline-none focus:border-accent" placeholder="Special instructions, maintenance/ferry/management purpose, required documents, or other support details." />
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{COMPANY.requestDisclaimer}</p>
            <button className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground">
              Start Support Request
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
