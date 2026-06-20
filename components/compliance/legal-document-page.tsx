import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { AMG_LEGAL_CONTACT, getLegalDocument, type LegalDocument } from "@/lib/compliance/legal-pages";

function LegalArticle({ document }: { document: LegalDocument }) {
  return (
    <section className="cinematic-band relative isolate min-h-screen overflow-hidden px-6 pb-24 pt-36 lg:px-10">
      <div className="absolute inset-0 -z-10 opacity-20" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/jet-interior.png" alt="" className="h-full w-full object-cover" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.36fr_0.64fr]">
        <aside className="lg:sticky lg:top-32 lg:self-start" data-scroll-animate>
          <p className="eyebrow mb-5 inline-flex items-center gap-3 text-accent">
            <span className="h-px w-10 bg-accent/70" />
            Administrative
          </p>
          <h1 className="display-heading text-balance text-5xl text-slate-950 sm:text-6xl">
            {document.title}
          </h1>
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_44px_rgba(8,20,36,0.07)]">
            <FileText className="h-5 w-5 text-accent" />
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{document.description}</p>
            <dl className="mt-5 space-y-3 text-xs text-slate-500">
              <div>
                <dt className="font-semibold uppercase tracking-[0.16em] text-slate-400">Effective</dt>
                <dd className="mt-1">{document.effectiveDate}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-[0.16em] text-slate-400">Last Updated</dt>
                <dd className="mt-1">{document.lastUpdated}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-[0.16em] text-slate-400">Questions</dt>
                <dd className="mt-1">
                  <a href={`mailto:${AMG_LEGAL_CONTACT}`} className="text-accent hover:underline">
                    {AMG_LEGAL_CONTACT}
                  </a>
                </dd>
              </div>
            </dl>
            <Link href="/contact" className="mt-5 inline-flex min-h-11 items-center gap-2 font-display text-xs font-semibold uppercase text-accent hover:text-primary">
              Contact AMG
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(8,20,36,0.09)] sm:p-8 lg:p-10" data-scroll-animate>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
            Attorney-review draft. This page is provided for administrative notice and is not legal advice.
          </div>
          <nav aria-label={`${document.title} table of contents`} className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-display text-sm font-bold uppercase text-slate-950">Contents</h2>
            <ol className="mt-3 grid gap-2 sm:grid-cols-2">
              {document.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-sm text-slate-600 hover:text-accent hover:underline">
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-10 space-y-10 text-base leading-relaxed text-slate-600">
            {document.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="font-display text-2xl font-bold uppercase text-slate-950">{section.heading}</h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets ? (
                    <ul className="grid gap-2 pl-5">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="list-disc">{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export function LegalDocumentPage({ slug }: { slug: string }) {
  const document = getLegalDocument(slug);
  if (!document) return null;
  return <LegalArticle document={document} />;
}
