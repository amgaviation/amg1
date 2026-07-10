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

/** The anatomy every published case study will carry (mirrors the invoice). */
const FILE_FIELDS = [
  { label: "Route", width: "58%" },
  { label: "Aircraft", width: "42%" },
  { label: "Request → wheels-up", width: "66%" },
  { label: "All-in cost, itemized", width: "50%" },
] as const;

/** Reserved ledger slots — the launch gate is three flown missions. */
const RESERVED = ["M-001", "M-002", "M-003"] as const;

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

          {missions.length === 0 ? (
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3" data-stagger-item>
              <span className="microlabel-amber">Publishing gate</span>
              <span className="flex items-center gap-2" aria-hidden="true">
                {RESERVED.map((slot) => (
                  <span
                    key={slot}
                    className="h-2.5 w-2.5 rotate-45 border border-[rgba(169,180,198,0.4)] bg-transparent"
                  />
                ))}
              </span>
              <span className="font-mono text-[11px] uppercase [letter-spacing:0.16em] text-[var(--oc-aluminum)]">
                3 flown missions · then one new entry per month, minimum
              </span>
            </div>
          ) : null}
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
            <>
              {/* The ledger, before its first entry: three reserved mission
                  files drawn as skeleton frames — the format is the promise,
                  and nothing in them is invented. */}
              <div className="mb-6 flex items-baseline justify-between gap-4" data-scroll-animate>
                <p className="oc-eyebrow">The mission ledger // first entries reserved</p>
                <p className="microlabel hidden sm:block">No stock stories, ever</p>
              </div>
              <div
                className="grid gap-4 md:grid-cols-3"
                data-stagger-container
                role="img"
                aria-label="Three reserved case-study slots, empty until the first real missions publish: each will show route, aircraft, request-to-wheels-up timeline, and the itemized all-in cost."
              >
                {RESERVED.map((slot, index) => (
                  <div
                    key={slot}
                    data-stagger-item
                    className="rounded-xl border border-dashed border-[rgba(169,180,198,0.28)] bg-[rgba(10,19,34,0.4)] p-6"
                    aria-hidden="true"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                        {slot}
                      </span>
                      <span className="rounded-full border border-[rgba(169,180,198,0.25)] px-2.5 py-1 font-mono text-[9px] uppercase [letter-spacing:0.18em] text-[var(--oc-aluminum-2)]">
                        Reserved
                      </span>
                    </div>
                    <div className="pub-draw-rule mt-4" aria-hidden="true" />
                    <dl className="mt-5 grid gap-4">
                      {FILE_FIELDS.map((field) => (
                        <div key={field.label}>
                          <dt className="font-mono text-[9px] uppercase [letter-spacing:0.18em] text-[var(--oc-aluminum-2)]">
                            {field.label}
                          </dt>
                          <dd
                            className="mt-1.5 h-2 rounded-full bg-[linear-gradient(90deg,rgba(169,180,198,0.18),rgba(169,180,198,0.05))]"
                            style={{ width: field.width, opacity: 1 - index * 0.18 }}
                          />
                        </div>
                      ))}
                    </dl>
                    <p className="mt-6 border-t border-[rgba(169,180,198,0.14)] pt-3 font-mono text-[9px] uppercase leading-relaxed [letter-spacing:0.16em] text-[var(--oc-aluminum-2)]">
                      Publishes when flown
                    </p>
                  </div>
                ))}
              </div>

              <div className="mx-auto mt-10 max-w-2xl text-center" data-scroll-animate>
                <p className="text-base leading-relaxed text-[var(--oc-aluminum)]">
                  We publish only missions we actually flew — route, timeline, and itemized cost.
                  Our launch gate is three of them, and at least one new case study lands here
                  every month after. No stock stories, ever.
                </p>
              </div>
            </>
          )}

          <div className="mt-14 flex flex-col items-center gap-4" data-scroll-animate>
            {missions.length === 0 ? (
              <p className="microlabel">The ledger fills with flown missions</p>
            ) : null}
            <QuoteButton />
          </div>
        </div>
      </section>
    </>
  );
}
