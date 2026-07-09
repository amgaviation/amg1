import { requireRole } from "@/lib/portal/session";
import { PageHeader, StatCard } from "@/components/portal/ui/primitives";
import { getCrewMap, getCrewMapStats, getCrewPresenceState, resolveAirports } from "@/lib/portal/crew-map";
import { CrewMap } from "@/components/portal/crew-map/crew-map";
import { GoActiveControl } from "@/components/portal/crew-map/go-active-control";
import { fmtHours } from "@/lib/portal/crew-map-view";

export const metadata = { title: "Live Crew Map — Crew Portal" };
export const dynamic = "force-dynamic";

export default async function CrewLiveMapPage() {
  const user = await requireRole("crew");
  const [rollups, stats, state] = await Promise.all([
    getCrewMap(),
    getCrewMapStats(),
    getCrewPresenceState(user.id),
  ]);
  const defaults = await resolveAirports(
    [state.homeAirport, state.closestAirport].filter(Boolean) as string[]
  );
  const busiest = stats.busiest_airport;

  return (
    <>
      <PageHeader
        eyebrow="Crew Network"
        title="Live Crew Map"
        description="See how many crew are available at each airport right now, and flip yourself active for assignments."
        actions={<GoActiveControl state={state} defaults={defaults} />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Crew online now"
          value={stats.online_count}
          icon="users"
          tone="accent"
          detail={`across ${stats.airports_active} airport${stats.airports_active === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Busiest airport"
          value={busiest ? busiest.code : "—"}
          icon="mapPin"
          detail={busiest ? `${busiest.count} crew · ${busiest.name ?? ""}`.trim() : "No crew online yet"}
        />
        <StatCard label="Flight hours online" value={fmtHours(stats.hours_online)} icon="gauge" detail="combined crew experience" />
      </div>

      <CrewMap variant="crew" initialCrew={rollups} />
    </>
  );
}
