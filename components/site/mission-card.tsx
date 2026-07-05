import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { MissionCaseStudy } from "@/content/missions";

/** Proof card: route, aircraft, timeline, all-in cost (spec §3 §6). */
export function MissionCard({ mission }: { mission: MissionCaseStudy }) {
  const quoteMilestone = mission.timeline.find((t) => t.milestone.toLowerCase().includes("quote"));
  return (
    <Link
      href={`/missions/${mission.slug}`}
      prefetch={false}
      className="oc-card-dark group flex flex-col gap-4 p-6 transition hover:border-[var(--oc-blue)]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="oc-mono text-sm text-[var(--oc-aluminum)]">
          {mission.aircraft} · {mission.route}
        </p>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--oc-blue)] opacity-0 transition group-hover:opacity-100" />
      </div>
      <h3 className="oc-display text-xl text-[var(--oc-paper)]">{mission.missionType}</h3>
      <p className="line-clamp-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{mission.situation}</p>
      <div className="mt-auto flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--oc-line-dark)] pt-4">
        <span className="oc-display text-lg text-[var(--oc-paper)]">{mission.totalCost}</span>
        {quoteMilestone ? (
          <span className="text-xs text-[var(--oc-aluminum-2)]">Quote: {quoteMilestone.when}</span>
        ) : null}
      </div>
    </Link>
  );
}
