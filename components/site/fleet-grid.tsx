"use client";

import { useState } from "react";
import { FLEET } from "@/lib/content";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "Single-Engine Piston",
  "Multi-Engine Piston",
  "Turboprop",
  "Single-Engine Jet / VLJ",
  "Light Jet",
  "Midsize Jet",
  "Super-Midsize Jet",
  "Large-Cabin / Heavy Jet",
  "Helicopter",
];

const AIRCRAFT_IMAGES: Record<string, string> = {
  "single-engine-piston": "/images/site/cirrus.webp",
  "multi-engine-piston": "/images/site/diamond-me.jpg",
  turboprop: "/images/site/tbm.jpg",
  "single-engine-jet-vlj": "/images/light-jet.png",
  "light-jet": "/images/site/citation-x.webp",
  "midsize-jet": "/images/mid-jet.png",
  "super-midsize-jet": "/images/heavy-jet.png",
  "large-cabin-heavy-jet": "/images/hero-jet.png",
  helicopter: "/images/site/bell-505.jpg",
};

export function FleetGrid() {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All"
      ? FLEET
      : FLEET.filter((a) => a.category === filter);

  return (
    <div data-scroll-animate>
      <div className="flex flex-wrap gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={cn(
              "rounded-full border px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-widest transition-colors",
              filter === cat
                ? "border-accent bg-accent text-accent-foreground"
                : "border-white/15 bg-white/[0.05] text-foreground/70 backdrop-blur hover:border-accent hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        {filtered.map((aircraft) => (
          <article
            key={aircraft.id}
            className="glass-panel hover-lift overflow-hidden rounded-lg"
          >
            <div className="media-vignette relative aspect-[16/10] overflow-hidden bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={AIRCRAFT_IMAGES[aircraft.id] ?? "/images/hero-jet.png"}
                alt=""
                className="h-full w-full scale-105 object-cover opacity-80"
              />
              <div className="absolute inset-x-6 top-6 h-px bg-accent/40" />
              <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-background/70 px-3 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-accent backdrop-blur">
                {aircraft.category}
              </span>
            </div>
            <div className="p-8">
              <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                {aircraft.name}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {aircraft.support}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2 border-t border-white/[0.10] pt-6">
                {aircraft.factors.map((factor) => (
                  <span
                    key={factor}
                    className="rounded-full border border-white/[0.10] bg-white/[0.05] px-3 py-2 text-xs text-foreground/75"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
