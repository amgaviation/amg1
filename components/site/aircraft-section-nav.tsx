"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = { id: string; label: string };

export function AircraftSectionNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0.15, 0.3, 0.5] }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Aircraft categories" className="sticky top-[var(--public-header-height)] z-30 border-y border-slate-200 bg-white/95 shadow-[0_12px_30px_rgba(8,20,36,0.06)] backdrop-blur">
      <div className="mx-auto max-w-7xl overflow-x-auto px-6 lg:px-10">
        <div className="flex min-w-max gap-2 py-4">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase transition-colors",
                active === item.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-slate-200 text-slate-600 hover:border-accent hover:text-accent"
              )}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
