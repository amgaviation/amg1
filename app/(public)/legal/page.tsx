import type { Metadata } from "next";
import Link from "next/link";
import { legalDocuments } from "@/lib/compliance/legal-pages";

export const metadata: Metadata = {
  title: "AMG Aviation Group - Legal Notices",
  description: "Legal, privacy, cookie, accessibility, portal, document, SMS, email, and compliance notices.",
};

export default function LegalIndexPage() {
  return (
    <section className="cinematic-band min-h-screen px-6 pb-24 pt-36 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow text-accent">Administrative</p>
        <h1 className="display-heading mt-5 text-5xl text-slate-950 sm:text-6xl">Legal Notices</h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-600">
          Attorney-review drafts for AMG Aviation Group website, portal, privacy, document, communications, media,
          and aviation support notices. These pages are administrative notices and are not legal advice.
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
              <span className="mt-4 block text-xs uppercase tracking-[0.16em] text-slate-400">Updated {document.lastUpdated}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
