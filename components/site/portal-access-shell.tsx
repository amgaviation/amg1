import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export function PortalAccessShell({
  eyebrow,
  title,
  description,
  children,
  backHref = "/login",
  backLabel = "Back to login",
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <section className="access-cinema cinematic-band relative isolate min-h-[100svh] overflow-hidden px-6 pb-16 pt-[calc(var(--public-header-height)+3rem)] lg:px-10">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image src="/images/site/map-operations.jpg" alt="" fill priority loading="eager" fetchPriority="high" sizes="100vw" className="scale-105 object-cover opacity-[0.35]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/40" />
      </div>

      <div className="mx-auto grid min-h-[calc(100svh-var(--public-header-height)-7rem)] max-w-7xl items-center gap-10 lg:grid-cols-[1fr_32rem]">
        <div className="hidden max-w-3xl lg:block" data-scroll-animate>
          <p className="eyebrow mb-6 inline-flex items-center gap-3 text-accent">
            <span className="h-px w-12 bg-accent/70" />
            AMG Connect
          </p>
          <h1 className="display-heading text-balance text-7xl text-foreground xl:text-8xl">
            Secure portal operations
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Role-based access keeps client, crew, partner, and AMG operations work inside the approved portal flow.
          </p>
        </div>

        <section className="portal-entry-card glass-panel rounded-lg p-6 sm:p-8" data-scroll-animate>
          <div className="mb-7 flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow text-accent">{eyebrow}</p>
              <h2 className="mt-4 display-heading text-balance text-4xl text-foreground sm:text-5xl">
                {title}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
            <ShieldCheck className="hidden h-7 w-7 shrink-0 text-accent sm:block" />
          </div>
          {children}
          <Link href={backHref} className="mt-7 inline-flex items-center gap-2 text-sm text-accent hover:text-foreground">
            {backLabel}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    </section>
  );
}
