import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";

export function LegalPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="cinematic-band relative isolate min-h-screen overflow-hidden px-6 pb-24 pt-36 lg:px-10">
      <div className="absolute inset-0 -z-10 opacity-20" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/jet-interior.png" alt="" className="h-full w-full object-cover" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.42fr_0.58fr]">
        <aside className="lg:sticky lg:top-32 lg:self-start" data-scroll-animate>
          <p className="eyebrow mb-5 inline-flex items-center gap-3 text-accent">
            <span className="h-px w-10 bg-accent/70" />
            {eyebrow}
          </p>
          <h1 className="display-heading text-balance text-5xl text-white sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <div className="mt-8 hidden rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-[0_16px_44px_rgba(0,0,0,0.22)] backdrop-blur lg:block">
            <FileText className="h-5 w-5 text-accent" />
            <p className="mt-4 text-sm leading-relaxed text-[var(--amg-text-secondary)]">
              Administrative language for website use, portal access, and support request review.
            </p>
            <Link href="/contact" className="mt-5 inline-flex min-h-11 items-center gap-2 font-display text-xs font-semibold uppercase text-accent hover:text-primary">
              Contact AMG
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
        <article className="rounded-lg border border-white/10 bg-[#07111F]/92 p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10" data-scroll-animate>
          <div className="space-y-6 text-base leading-relaxed text-[var(--amg-text-secondary)]">
            {children}
          </div>
        </article>
      </div>
    </section>
  );
}
