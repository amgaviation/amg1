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
    <section id="portal-ecosystem" className="cinematic-section cinematic-band py-28 lg:py-36">
      <div className="absolute inset-0 -z-10 opacity-20" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/jet-interior.png" alt="" className="h-full w-full object-cover" data-parallax="0.05" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_24%,rgba(56,189,248,0.14),transparent_28rem)]" />

      <div className="mx-auto grid w-full max-w-7xl gap-14 px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-10">
        <Reveal className="lg:sticky lg:top-28 lg:self-start" data-scroll-animate>
          <p className="eyebrow mb-5 text-accent">AMG Connect</p>
          <h2 className="display-heading text-balance text-5xl text-foreground sm:text-6xl lg:text-7xl">
            One entry point for the operating network
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Client, crew, partner, and AMG operations access remain connected through the
            secure portal ecosystem already built into this website.
          </p>
          <p className="mt-5 text-sm uppercase text-muted-foreground">{COMPANY.location}</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="magnetic-link inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-7 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
              data-cursor="ENTER"
            >
              Portal Login
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="magnetic-link inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-4 font-display text-sm font-semibold uppercase tracking-widest text-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent"
              data-cursor="REQUEST"
            >
              Request Access
            </Link>
          </div>
        </Reveal>

        <div>
          <div className="media-vignette relative mb-5 aspect-[16/9] overflow-hidden rounded-lg border border-white/10 bg-card" data-scroll-animate>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/heavy-jet.png"
              alt="AMG Aviation Group operations support platform visual"
              className="h-full w-full scale-105 object-cover opacity-90"
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
                    className="portal-card glass-panel hover-lift group flex h-full min-h-72 flex-col rounded-lg p-6 hover:border-accent/60"
                    data-cursor="ENTER"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Icon className="h-6 w-6 text-accent" />
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                    </div>
                    <h3 className="mt-7 font-display text-3xl font-extrabold uppercase leading-none tracking-wide text-foreground">
                      {role.title}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{role.access}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {role.actions.map((action) => (
                        <span
                          key={action}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.68rem] uppercase text-foreground/75"
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
