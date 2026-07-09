import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { getAdminMap, getAdminMapStats } from "@/lib/portal/crew-map";
import { CrewMap } from "@/components/portal/crew-map/crew-map";
import { TrendTile, RankBar, ChipRow } from "@/components/portal/crew-map/widgets";
import { adminPinsToBlips, fmtHours } from "@/lib/portal/crew-map-view";

export const metadata = { title: "Live Crew Map — AMG Operations" };
export const dynamic = "force-dynamic";

const plural = (n: number, s: string) => `${n} ${s}${n === 1 ? "" : "s"}`;

export default async function AdminLiveMapPage() {
  await requireRolePermission("admin", "crew");
  const [pins, stats] = await Promise.all([getAdminMap(), getAdminMapStats()]);

  const airports = adminPinsToBlips(pins);
  const topAirports = airports.slice(0, 5);
  const maxCount = topAirports[0]?.count ?? 0;
  const ratings = Array.from(new Set(pins.flatMap((p) => p.type_ratings ?? []).filter(Boolean))).slice(0, 16);

  return (
    <>
      <PageHeader
        eyebrow="AMG Operations"
        title="Live Crew Map"
        description="Vetted crew available for assignment right now — where they are, what they fly, and how the network is trending. Hover a blip for crew detail. Updates live."
      />

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Crew online now"
          value={stats.online_count}
          icon="users"
          tone="accent"
          detail={`${plural(stats.airports_active, "airport")} · ${plural(stats.states_active, "state")}`}
        />
        <StatCard label="Flight hours online" value={fmtHours(stats.hours_online)} icon="gauge" detail="combined crew experience" />
        <StatCard label="Type ratings live" value={stats.type_ratings_count} icon="badgeCheck" detail="distinct ratings available" />
        <StatCard
          label="Open-pool missions"
          value={stats.pool_missions}
          icon="radar"
          tone={stats.pool_missions > 0 ? "warn" : "default"}
          detail="seeking crew"
        />
      </div>

      {/* left rail + map */}
      <div className="grid gap-4 lg:grid-cols-[17rem_1fr]">
        <div className="grid content-start gap-3">
          <TrendTile
            label="Go-active today"
            value={stats.sessions_today}
            icon="history"
            tone="accent"
            spark={stats.sessions_7d}
            detail="sessions started · 7-day trend"
          />
          <TrendTile label="Avg session" value={stats.avg_session_minutes} unit="min" icon="clock" detail="of sessions ended today" />
          <TrendTile
            label="Filled from map"
            value={stats.assignments_from_map_today}
            icon="userCheck"
            tone="success"
            detail="crew assigned today"
          />
          <TrendTile label="Active missions" value={stats.active_missions} icon="plane" detail={`${stats.missions_today} departing today`} />
        </div>
        <CrewMap variant="admin" initialAdmin={pins} />
      </div>

      {/* secondary widgets */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Busiest airports" icon="mapPin" description="Where available crew are concentrated right now.">
          {topAirports.length ? (
            <div className="grid gap-3">
              {topAirports.map((a) => (
                <RankBar key={a.key} label={a.title} sub={a.sub} value={a.count} max={maxCount} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--deck-text-3)]">No crew online right now.</p>
          )}
        </SectionCard>
        <SectionCard title="Type ratings online" icon="badgeCheck" description="Aircraft the available crew are rated on.">
          <ChipRow items={ratings} empty="No crew online right now." />
        </SectionCard>
      </div>
    </>
  );
}
