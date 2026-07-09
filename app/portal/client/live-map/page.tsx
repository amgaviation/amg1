import { requireRole } from "@/lib/portal/session";
import { PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { getClientMap } from "@/lib/portal/crew-map";
import { CrewMap } from "@/components/portal/crew-map/crew-map";
import { ChipRow } from "@/components/portal/crew-map/widgets";
import { fmtHours } from "@/lib/portal/crew-map-view";
import { stateName } from "@/lib/portal/us-geo";

export const metadata = { title: "Crew Availability — Client Portal" };
export const dynamic = "force-dynamic";

export default async function ClientLiveMapPage() {
  await requireRole("client");
  const agg = await getClientMap();
  const states = agg.by_state.length;

  return (
    <>
      <PageHeader
        eyebrow="AMG Network"
        title="Crew Availability"
        description="Vetted crew capacity across the network right now — how many are available, their combined flight experience, and where. Coverage is shown by state to protect crew privacy."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Crew available now" value={agg.online_count} icon="users" tone="accent" detail="ready for assignment" />
        <StatCard
          label="Combined flight experience"
          value={fmtHours(agg.total_online_hours)}
          icon="gauge"
          detail="hours across online crew"
        />
        <StatCard
          label="States covered"
          value={states}
          icon="mapPin"
          detail={`${agg.type_ratings_online.length} type rating${agg.type_ratings_online.length === 1 ? "" : "s"} available`}
        />
      </div>

      <CrewMap variant="client" initialClient={agg} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Availability by state" icon="mapPin" description="Where vetted crew are available right now.">
          {agg.by_state.length ? (
            <ul className="grid gap-1.5">
              {agg.by_state.map((s) => (
                <li key={s.state} className="flex items-center justify-between text-sm text-[var(--deck-text)]">
                  <span>{stateName(s.state)}</span>
                  <span className="deck-num text-[var(--deck-text-2)]">
                    {s.count} · {fmtHours(s.hours)} hrs
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--deck-text-3)]">No crew online right now.</p>
          )}
        </SectionCard>
        <SectionCard title="Type ratings online" icon="badgeCheck" description="Aircraft the available crew are rated on.">
          <ChipRow items={agg.type_ratings_online} empty="No crew online right now." />
        </SectionCard>
      </div>
    </>
  );
}
