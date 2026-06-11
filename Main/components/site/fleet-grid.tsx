"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FLEET } from "@/Main/lib/content";
import { cn } from "@/Main/lib/utils";

const CATEGORIES = ["All", "Light Jet", "Mid Jet", "Heavy Jet", "Turboprop"];

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
        <AnimatePresence mode="popLayout">
          {filtered.map((aircraft) => (
            <motion.article
              key={aircraft.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={aircraft.image || "/placeholder.svg"}
                  alt={aircraft.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full border border-border bg-background/70 px-3 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-accent backdrop-blur">
                  {aircraft.category}
                </span>
              </div>
              <div className="p-8">
                <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                  {aircraft.name}
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {aircraft.description}
                </p>
                <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
                  <div>
                    <dt className="eyebrow text-[0.6rem] text-muted-foreground">
                      Range
                    </dt>
                    <dd className="mt-1 font-display text-lg font-bold text-foreground">
                      {aircraft.range}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-[0.6rem] text-muted-foreground">
                      Capacity
                    </dt>
                    <dd className="mt-1 font-display text-lg font-bold text-foreground">
                      {aircraft.pax}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-[0.6rem] text-muted-foreground">
                      Cruise
                    </dt>
                    <dd className="mt-1 font-display text-lg font-bold text-foreground">
                      {aircraft.speed}
                    </dd>
                  </div>
                </dl>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
