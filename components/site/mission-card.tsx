import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { MissionCaseStudy } from "@/content/missions";

/** Proof card: route, aircraft, timeline, all-in cost (spec §3 §6). Mirrors the
 *  flight-deck home Proof anatomy — amber mono route, a hairline that grows on
 *  hover, mono total — so the public missions grid reads like home. */
export function MissionCard({ mission }: { mission: MissionCaseStudy }) {
  const quoteMilestone = mission.timeline.find((t) => t.milestone.toLowerCase().includes("quote"));
  return (
    <Link
      href={`/missions/${mission.slug}`}
      prefetch={false}
      data-stagger-item
      className="group pub-card-hover oc-card-dark flex flex-col gap-3 p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] uppercase [letter-spacing:0.16em] text-[var(--amber)]">
          {mission.route}
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--oc-blue)] opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="pub-rule" aria-hidden="true" />
      <h3 className="oc-display text-xl text-[var(--oc-paper)]">{mission.missionType}</h3>
      <p className="oc-mono text-xs text-[var(--oc-aluminum-2)]">{mission.aircraft}</p>
      <p className="line-clamp-3 text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)]">{mission.situation}</p>
      <div className="mt-auto flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--oc-line-dark)] pt-4">
        <span className="oc-display text-lg text-[var(--oc-paper)]">{mission.totalCost}</span>
        {quoteMilestone ? (
          <span className="text-xs text-[var(--oc-aluminum-2)]">Quote: {quoteMilestone.when}</span>
        ) : null}
      </div>
    </Link>
  );
}
