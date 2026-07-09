import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMissionCaseStudy, MISSION_CASE_STUDIES } from "@/content/missions";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { QuoteButton } from "@/components/site/quote-button";

export function generateStaticParams() {
  return MISSION_CASE_STUDIES.map((mission) => ({ slug: mission.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mission = getMissionCaseStudy(slug);
  if (!mission) return {};
  return {
    title: `${mission.aircraft} · ${mission.route} · ${mission.missionType}`,
    description: `${mission.missionType} case study: ${mission.totalCost}, timeline from request to wheels-up, itemized costs. ${mission.situation}`.slice(0, 160),
  };
}

export default async function MissionCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mission = getMissionCaseStudy(slug);
  if (!mission) notFound();

  return (
    <>
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl" data-stagger-container>
          <p className="oc-eyebrow" data-stagger-item>
            Mission case study // {mission.route}
          </p>
          <HeadlineReveal
            className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl"
            lines={[`${mission.aircraft} · ${mission.route} · ${mission.missionType}`]}
          />
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
            {mission.situation}
          </p>
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-shell grid gap-4 lg:grid-cols-2" data-stagger-container>
          <div className="hud-frame oc-card-dark overflow-hidden" data-stagger-item>
            <h2 className="border-b border-[var(--oc-line-dark)] px-6 py-4 text-xs font-semibold uppercase [letter-spacing:0.14em] text-[var(--instrument-ink)]">
              Timeline
            </h2>
            <table className="w-full">
              <tbody>
                {mission.timeline.map((entry) => (
                  <tr key={entry.milestone} className="border-t border-[var(--oc-line-dark)] first:border-0">
                    <th scope="row" className="px-6 py-3 text-left text-sm font-normal text-[var(--oc-aluminum)]">
                      {entry.milestone}
                    </th>
                    <td className="oc-mono px-6 py-3 text-right text-sm text-[var(--oc-paper)]">{entry.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="hud-frame oc-card-dark overflow-hidden" data-stagger-item>
            <h2 className="border-b border-[var(--oc-line-dark)] px-6 py-4 text-xs font-semibold uppercase [letter-spacing:0.14em] text-[var(--instrument-ink)]">
              Cost breakdown — as invoiced
            </h2>
            <dl className="px-6 py-2">
              {mission.costBreakdown.map((line) => (
                <div
                  key={line.label}
                  className="flex items-baseline justify-between gap-4 border-b border-dashed border-[var(--oc-line-dark)] py-2.5 last:border-0"
                >
                  <dt className="text-sm text-[var(--oc-aluminum)]">{line.label}</dt>
                  <dd className="oc-mono text-base text-[var(--oc-paper)]">{line.amount}</dd>
                </div>
              ))}
            </dl>
            <p className="oc-display border-t border-[var(--oc-line-dark)] bg-white/[0.04] px-6 py-4 text-2xl text-[var(--oc-paper)]">
              {mission.totalCost}
            </p>
          </div>
        </div>

        <div className="oc-shell mt-4 grid gap-4">
          <div className="oc-card-dark p-6">
            <p className="text-sm leading-relaxed text-[var(--oc-aluminum)]">{mission.pilotLine}</p>
            {mission.ownerWord ? (
              <blockquote className="mt-4 border-l-2 border-[var(--oc-blue)] pl-4 text-base leading-relaxed text-[var(--oc-paper)]">
                {mission.ownerWord}
              </blockquote>
            ) : (
              <p className="mt-3 text-sm text-[var(--oc-aluminum-2)]">Reference available on request.</p>
            )}
            <p className="mt-3 text-sm text-[var(--oc-aluminum-2)]">N-number available on request.</p>
          </div>
        </div>

        <div className="mt-14 flex justify-center" data-scroll-animate>
          <QuoteButton />
        </div>
      </section>
    </>
  );
}
