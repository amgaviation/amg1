import { featuredCrewRegions, crewGlobeMarkers } from "@/components/sections/crew-globe-data";

type GlobeFallbackProps = {
  tone?: "dark" | "light";
  label?: string;
};

export function GlobeFallback({ tone = "dark", label = "Crew operating regions" }: GlobeFallbackProps) {
  const dark = tone === "dark";

  return (
    <div
      className={
        dark
          ? "rounded-[1.25rem] border border-white/10 bg-[rgba(11,26,43,0.72)] p-6 text-white shadow-[var(--oc-shadow)]"
          : "rounded-[1.25rem] border border-[var(--oc-line)] bg-[var(--oc-paper)] p-6 text-[var(--oc-ink)] shadow-[var(--oc-shadow)]"
      }
    >
      <p className={dark ? "oc-kicker text-[var(--oc-aluminum-2)]" : "oc-kicker text-[var(--oc-blue)]"}>{label}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div>
          <p className="oc-display text-4xl">{crewGlobeMarkers.length}</p>
          <p className={dark ? "mt-1 text-xs uppercase text-[var(--oc-aluminum)]" : "mt-1 text-xs uppercase text-[var(--oc-muted)]"}>
            Public-safe points
          </p>
        </div>
        <div>
          <p className="oc-display text-4xl">{featuredCrewRegions.length}</p>
          <p className={dark ? "mt-1 text-xs uppercase text-[var(--oc-aluminum)]" : "mt-1 text-xs uppercase text-[var(--oc-muted)]"}>
            Regions shown
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {featuredCrewRegions.map((region) => (
          <span
            key={region}
            className={
              dark
                ? "rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-[var(--oc-aluminum)]"
                : "rounded-full border border-[var(--oc-line)] bg-[var(--oc-ivory)] px-3 py-1 text-xs text-[var(--oc-muted)]"
            }
          >
            {region}
          </span>
        ))}
      </div>
    </div>
  );
}
