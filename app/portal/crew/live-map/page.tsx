import { requireRole } from "@/lib/portal/session";
import { PageHeader } from "@/components/portal/ui/primitives";
import { getCrewMap, getCrewPresenceState, resolveAirports } from "@/lib/portal/crew-map";
import { CrewMap } from "@/components/portal/crew-map/crew-map";
import { GoActiveControl } from "@/components/portal/crew-map/go-active-control";

export const metadata = { title: "Live Crew Map — Crew Portal" };
export const dynamic = "force-dynamic";

export default async function CrewLiveMapPage() {
  const user = await requireRole("crew");
  const [rollups, state] = await Promise.all([getCrewMap(), getCrewPresenceState(user.id)]);
  const defaults = await resolveAirports(
    [state.homeAirport, state.closestAirport].filter(Boolean) as string[]
  );

  return (
    <>
      <PageHeader
        eyebrow="Crew Network"
        title="Live Crew Map"
        description="See how many crew are available at each airport right now, and flip yourself active for assignments."
        actions={<GoActiveControl state={state} defaults={defaults} />}
      />
      <CrewMap variant="crew" initialCrew={rollups} />
    </>
  );
}
