"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Plane, UsersRound } from "lucide-react";

const AUDIENCES = [
  { icon: Plane, title: "Owners & Representatives", body: "Get a clear path for crew coverage, repositioning, maintenance moves, or recurring help around one aircraft." },
  { icon: BriefcaseBusiness, title: "Flight Departments", body: "Add outside coordination when crew schedules, maintenance timing, or multiple aircraft create extra workload." },
  { icon: BadgeCheck, title: "Charter Operators", body: "Coordinate approved support needs while keeping operator authority and acceptance requirements clear." },
  { icon: UsersRound, title: "Crew Members", body: "Submit credentials and availability so AMG can review fit for future assignments without exposing sensitive personal location data." },
];

export function WhoWeServe() {
  const [active, setActive] = useState(0);
  const current = AUDIENCES[active];
  const Icon = current.icon;

  function go(delta: number) {
    setActive((index) => (index + delta + AUDIENCES.length) % AUDIENCES.length);
  }

  return (
    <section id="audiences" className="public-editorial-section public-audience-section" aria-labelledby="audiences-heading">
      <div className="oc-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
        <div>
          <p className="oc-eyebrow oc-eyebrow-light">Who We Serve</p>
          <h2 id="audiences-heading" className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl">
            Built for people responsible for private aircraft.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--oc-aluminum)] sm:text-lg">
            AMG supports the people who need to keep an aircraft moving, covered, documented, and visible to the right stakeholders.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <button type="button" onClick={() => go(-1)} className="public-arrow-button" aria-label="Previous audience">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => go(1)} className="public-arrow-button" aria-label="Next audience">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div>
          <div className="public-audience-rail" role="tablist" aria-label="AMG public audiences">
            {AUDIENCES.map((item, index) => (
              <button
                key={item.title}
                type="button"
                role="tab"
                aria-selected={active === index}
                aria-controls="audience-panel"
                onClick={() => setActive(index)}
                className="public-audience-tab"
              >
                {item.title}
              </button>
            ))}
          </div>
          <article id="audience-panel" role="tabpanel" className="public-audience-panel">
            <Icon className="h-7 w-7 text-[var(--oc-blue)]" strokeWidth={1.6} />
            <p className="public-audience-panel__index">0{active + 1}</p>
            <h3>{current.title}</h3>
            <p>{current.body}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
