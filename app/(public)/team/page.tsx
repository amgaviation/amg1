import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PhoneLink } from "@/components/site/tracked-link";
import { AFFILIATIONS, SITE, TEAM_ROSTER } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Team — The People Behind Every Mission",
  description:
    "AMG is a small, senior team by design, founded by Antonio Gonzalez in North Lauderdale, FL. You'll know your coordinator by name, and they'll know your airplane by tail number.",
};

export default function TeamPage() {
  return (
    <>
      <section className="oc-shell pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl">
          <p className="oc-eyebrow oc-eyebrow-light">Team</p>
          <h1 className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl">
            The people answering your requests.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">
            AMG is a small, senior team by design. You&apos;ll know your coordinator by name,
            and they&apos;ll know your airplane by tail number.
          </p>
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-shell grid gap-4">
          {TEAM_ROSTER.map((person) => (
            <article key={person.name} className="oc-card-dark grid gap-8 p-8 lg:grid-cols-[minmax(220px,280px)_1fr] lg:p-10">
              {person.photo ? (
                <div className="oc-media aspect-[4/5] overflow-hidden rounded-lg">
                  <Image
                    src={person.photo}
                    alt={person.name}
                    width={560}
                    height={700}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <div>
                <h2 className="oc-display text-3xl text-[var(--oc-paper)]">{person.name}</h2>
                <p className="mt-1 text-sm font-semibold uppercase text-[var(--oc-blue)]">{person.role}</p>
                {person.credentials ? (
                  <p className="oc-mono mt-3 text-sm text-[var(--oc-aluminum)]">{person.credentials}</p>
                ) : null}
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)]">
                  {person.bio}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="oc-section pt-0">
        <div className="oc-shell">
          <div className="flex flex-col gap-6 rounded-xl border border-[var(--oc-line-dark)] bg-white/[0.02] p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {AFFILIATIONS.map((affiliation) => (
                <span
                  key={affiliation}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--oc-line-dark)] bg-white/[0.04] px-3 py-1.5 text-[0.7rem] font-semibold uppercase text-[var(--oc-aluminum)]"
                >
                  <span className="oc-dot" aria-hidden="true" />
                  {affiliation}
                </span>
              ))}
            </div>
            <address className="flex flex-wrap items-center gap-x-6 gap-y-2 not-italic text-sm text-[var(--oc-aluminum)]">
              <span>{SITE.cityState}</span>
              <PhoneLink source="team" className="oc-mono transition-colors hover:text-white" />
            </address>
          </div>

          <div className="mt-14 flex justify-center">
            <Link href="/request" prefetch={false} className="oc-btn oc-btn-light">
              Get a Quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
