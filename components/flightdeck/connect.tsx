"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./reveal";

gsap.registerPlugin(ScrollTrigger);

const ROWS = [
  ["REQ-2041", "Crew coverage", "IN REVIEW"],
  ["REQ-2038", "Ferry / repositioning", "PROPOSAL SENT"],
  ["REQ-2035", "Maintenance movement", "SCHEDULED"],
] as const;

/**
 * AMG CONNECT — stylized console preview (deliberately an illustration,
 * not a product screenshot) with entry points into the portal.
 */
export default function Connect() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(".cx-in", {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: "top 72%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="connect" ref={root} className="relative bg-canvas py-28 md:py-36">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-2 md:px-10">
        <div>
          <p className="cx-in microlabel-green mb-6">AMG CONNECT // MISSION RECORD</p>
          <h2 className="cx-in display-lg font-display font-medium text-t1">
            One record.
            <br />
            Zero guesswork.
          </h2>
          <p className="cx-in mt-6 max-w-md text-[13px] leading-relaxed text-t2">
            Approved owners, flight departments, crew, and partners follow
            requests, messages, documents, quotes, and invoices in AMG Connect
            — every update tied to the mission record, visible to the roles
            that need it.
          </p>
          <div className="cx-in mt-8 flex flex-wrap items-center gap-6">
            <Link
              href="/login"
              prefetch={false}
              className="group flex items-center gap-2 rounded-full bg-instrument py-2 pl-6 pr-2 font-mono text-xs font-medium uppercase tracking-widecap text-canvas shadow-[0_0_40px_rgba(0,232,135,0.28)] transition-shadow hover:shadow-[0_0_60px_rgba(0,232,135,0.45)]"
            >
              Member login
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-instrument transition-transform duration-500 ease-out-expo group-hover:rotate-45">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </span>
            </Link>
            <Link
              href="/amg-connect"
              prefetch={false}
              className="fd-navlink font-mono text-[11px] uppercase tracking-widecap text-t2 transition-colors hover:text-t1"
            >
              Explore the portal
            </Link>
          </div>
        </div>

        {/* stylized console preview */}
        <div className="cx-in hud-frame relative overflow-hidden border border-grid-silver bg-[#0A1322] p-5">
          <div className="mb-4 flex items-center justify-between border-b border-grid-silver pb-3">
            <span className="microlabel-green">AMG CONNECT // OPS VIEW</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-instrument" />
              <span className="microlabel">LINK ACTIVE</span>
            </span>
          </div>
          <div className="grid gap-2">
            {ROWS.map(([id, kind, status]) => (
              <div
                key={id}
                className="flex items-center justify-between gap-4 border border-grid-silver bg-canvas/60 px-4 py-3"
              >
                <span className="font-mono text-[11px] text-t3">{id}</span>
                <span className="flex-1 truncate text-[13px] text-t1">{kind}</span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-widecap ${
                    status === "SCHEDULED" ? "text-instrument" : "text-amber"
                  }`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["MESSAGES", "DOCUMENTS", "INVOICES"].map((label) => (
              <div
                key={label}
                className="border border-grid-silver bg-canvas/40 px-3 py-2 text-center"
              >
                <span className="microlabel">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-right font-mono text-[9px] uppercase tracking-widecap text-t3">
            Illustrative preview — not live data
          </p>
        </div>
      </div>
    </section>
  );
}
