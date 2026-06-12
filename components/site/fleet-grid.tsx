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

export function FleetGrid() {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All"
      ? FLEET
      : FLEET.filter((a) => a.category === filter);

  return (
    <div>
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
                : "border-border text-foreground/70 hover:border-accent hover:text-foreground"
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
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(7,17,31,0.98)_48%,rgba(56,189,248,0.1))] p-6">
              <div className="absolute inset-x-6 top-6 h-px bg-accent/30" />
              <div className="absolute bottom-6 right-6 h-24 w-24 rounded-full border border-accent/20" />
              <p className="font-display text-5xl font-extrabold uppercase leading-none text-accent/25">
                {aircraft.name}
              </p>
              <span className="absolute left-4 top-4 rounded-full border border-border bg-background/70 px-3 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-accent backdrop-blur">
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
              <div className="mt-6 grid grid-cols-2 gap-2 border-t border-border pt-6">
                {aircraft.factors.map((factor) => (
                  <span
                    key={factor}
                    className="rounded-full border border-border px-3 py-2 text-xs text-foreground/75"
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
