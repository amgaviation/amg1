import type { Metadata } from "next";
import { Mail, MapPin, Send } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { COMPANY } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact AMG Aviation Group for aviation management and AMG Connect portal access.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Start the conversation"
        description="Request AMG support, ask about portal access, or connect with operations about your aircraft and mission workflow."
        image="/images/jet-sky.png"
      />
      <section className="py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <aside className="grid gap-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <Mail className="h-6 w-6 text-accent" />
              <p className="eyebrow mt-5 text-[0.7rem] text-muted-foreground">Email</p>
              <a href={`mailto:${COMPANY.email}`} className="mt-2 block text-lg text-foreground hover:text-accent">{COMPANY.email}</a>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <MapPin className="h-6 w-6 text-accent" />
              <p className="eyebrow mt-5 text-[0.7rem] text-muted-foreground">Base</p>
              <p className="mt-2 text-lg text-foreground">{COMPANY.location}</p>
            </div>
          </aside>
          <form className="rounded-xl border border-border bg-card p-6 lg:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Name" />
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Email" type="email" />
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Company / aircraft" />
              <input className="h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent" placeholder="Role requested" />
            </div>
            <textarea className="mt-5 min-h-40 w-full rounded-lg border border-input bg-background p-4 text-base outline-none focus:border-accent" placeholder="Tell us what you need." />
            <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground">
              Submit Request
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
