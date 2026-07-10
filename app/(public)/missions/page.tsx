import type { Metadata } from "next";
import { MISSION_CASE_STUDIES } from "@/content/missions";
import { MissionCard } from "@/components/site/mission-card";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { QuoteButton } from "@/components/site/quote-button";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Missions — Case Studies with Real Numbers",
  description:
    "Real coordinated missions: route, aircraft, timeline from request to wheels-up, and the itemized all-in cost. One new case study per month minimum.",
};

export default function MissionsPage() {
  const missions = [...MISSION_CASE_STUDIES].sort((a, b) => b.flownOn.localeCompare(a.flownOn));

  // Activates automatically the day real case studies land in content/missions —
  // no schema is emitted while the collection is empty.
  const missionsSchema = missions.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "AMG Aviation mission case studies",
        description:
          "Coordinated missions with route, request-to-wheels-up timeline, and itemized all-in cost.",
        itemListElement: missions.map((mission, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE.url}/missions/${mission.slug}`,
          name: `${mission.aircraft} · ${mission.route} · ${mission.missionType}`,
        })),
      }
    : null;

  return (
    <>
      {missionsSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(missionsSchema) }}
        />
      ) : null}
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl" data-stagger-container>
          <p className="oc-eyebrow" data-stagger-item>
            Real flights // itemized to the receipt
          </p>
          <HeadlineReveal
            className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
            lines={["Real missions, itemized."]}
          />
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
            Every case study shows the route, the timeline from request to wheels-up, and the
            all-in cost — matching the invoice format. N-numbers available on request.
          </p>
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-shell">
          {missions.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-stagger-container>
              {missions.map((mission) => (
                <MissionCard key={mission.slug} mission={mission} />
              ))}
            </div>
          ) : (
            <div className="oc-card-dark mx-auto max-w-2xl p-8 text-center lg:p-10">
              <h2 className="oc-display text-3xl text-[var(--oc-paper)]">
                First case studies publish at launch.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--oc-aluminum)]">
                We publish only missions we actually flew — route, timeline, and itemized cost.
                Our launch gate is three of them, and at least one new case study lands here
                every month after. No stock stories, ever.
              </p>
            </div>
          )}

          <div className="mt-14 flex justify-center" data-scroll-animate>
            <QuoteButton />
          </div>
        </div>
      </section>
    </>
  );
}
