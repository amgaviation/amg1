import Link from "next/link";
import { legalDocuments } from "@/lib/compliance/legal-pages";
import { IMG } from "@/lib/site-media";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("legal", {
  title: "AMG Aviation Group - Legal Notices",
  description: "Legal, privacy, cookie, accessibility, portal, document, SMS, email, and compliance notices.",
});

export default function LegalIndexPage() {
  const hero = heroForWebsiteContent("legal", {
    eyebrow: "Administrative",
    title: "Legal Notices",
    lead: "Attorney-review drafts for AMG Aviation Group website, portal, privacy, document, communications, media, and aviation support notices. These pages are administrative notices and are not legal advice.",
    image: IMG.servicesHero,
  });

  return (
    <section className="cinematic-band min-h-screen px-6 pb-24 pt-36 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow text-accent">{hero.eyebrow}</p>
        <h1 className="display-heading mt-5 text-5xl text-white sm:text-6xl">{hero.title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-[var(--oc-aluminum)]">
          {hero.lead}
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {legalDocuments.map((document) => (
            <Link
              key={document.slug}
              href={document.legacyPath ?? `/legal/${document.slug}`}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_44px_rgba(8,20,36,0.06)] transition-colors hover:border-accent"
            >
              <span className="font-display text-lg font-bold uppercase text-slate-950">{document.title}</span>
              <span className="mt-3 block text-sm leading-relaxed text-slate-600">{document.description}</span>
              <span className="mt-4 block text-xs uppercase tracking-[0.16em] text-[var(--oc-muted)]">Updated {document.lastUpdated}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
