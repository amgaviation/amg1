import Link from "next/link";
import { ArrowRight, ArrowUpRight, Handshake, RadioTower, ShieldCheck, Users } from "lucide-react";
import { COMPANY, PORTAL_ROLES } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

const roleIcons = {
  client: ShieldCheck,
  crew: Users,
  admin: RadioTower,
  partner: Handshake,
};

export function PortalEcosystem() {
  return (
    <section id="portal-ecosystem" className="cinematic-section relative isolate overflow-hidden bg-slate-50 py-24 lg:py-32">
      <div className="absolute inset-0 -z-10 opacity-10" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/jet-interior.png" alt="" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_24%,rgba(56,189,248,0.16),transparent_28rem)]" />

      <div className="mx-auto grid w-full max-w-7xl gap-14 px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-10">
        <Reveal className="lg:sticky lg:top-28 lg:self-start" data-scroll-animate>
          <p className="eyebrow mb-5 text-accent">AMG Connect</p>
          <h2 className="display-heading text-balance text-5xl text-slate-950 sm:text-6xl lg:text-7xl">
            One entry point for the operating network
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Client, crew, partner, and AMG operations access remain connected through the
            secure portal ecosystem already built into this website.
          </p>
          <p className="mt-5 text-sm uppercase text-slate-500">{COMPANY.location}</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-7 py-4 font-display text-sm font-semibold uppercase text-primary-foreground shadow-[0_18px_34px_rgba(59,130,246,0.22)] transition-colors hover:bg-primary/90"
            >
              Portal Login
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-4 font-display text-sm font-semibold uppercase text-slate-800 backdrop-blur transition-colors hover:border-primary hover:text-primary"
            >
              Request Access
            </Link>
          </div>
        </Reveal>

        <div>
          <div className="relative mb-5 aspect-[16/9] overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-[0_24px_70px_rgba(8,20,36,0.16)]" data-scroll-animate>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/heavy-jet.png"
              alt="AMG Aviation Group operations support platform visual"
              className="h-full w-full scale-105 object-cover"
            />
            <div className="absolute inset-x-6 bottom-6 flex items-center justify-between gap-4 border-t border-white/15 pt-4">
              <p className="eyebrow text-[0.68rem] text-white/80">Role-based access</p>
              <ArrowUpRight className="h-5 w-5 text-accent" />
            </div>
          </div>

          <RevealGroup className="grid gap-4 md:grid-cols-2" data-stagger-container>
            {PORTAL_ROLES.map((role) => {
              const Icon = roleIcons[role.id as keyof typeof roleIcons] ?? ShieldCheck;
              return (
                <RevealItem key={role.id} data-stagger-item>
                  <Link
                    href="/login"
                    className="portal-card hover-lift group flex h-full min-h-72 flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(8,20,36,0.08)] hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Icon className="h-6 w-6 text-accent" />
                      <ArrowUpRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                    <h3 className="mt-7 font-display text-3xl font-extrabold uppercase leading-none text-slate-950">
                      {role.title}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-slate-600">{role.access}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {role.actions.map((action) => (
                        <span
                          key={action}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] uppercase text-slate-600"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </Link>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
