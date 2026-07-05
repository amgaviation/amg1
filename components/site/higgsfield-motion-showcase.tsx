"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Cpu, Gauge, Power, Radar, ScanLine, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const featureAssets = [
  {
    title: "Aircraft Movement",
    eyebrow: "Mission Motion",
    metric: "24 fps",
    body: "Loop-ready aviation motion for operational feature cards and premium page moments.",
    src: "/videos/flightdeck/jet-cruise-dusk.mp4",
    poster: "/images/flightdeck/cockpit-dusk.webp",
    icon: Cpu,
  },
  {
    title: "Runway Readiness",
    eyebrow: "Aircraft State",
    metric: "24 fps",
    body: "Motion treatment for support paths, service cards, and aircraft status stories.",
    src: "/videos/flightdeck/jet-cruise-dusk.mp4",
    poster: "/images/flightdeck/runway-dusk.webp",
    icon: Gauge,
  },
  {
    title: "Route Analysis",
    eyebrow: "Flight Logic",
    metric: "4 sec",
    body: "Aerospace motion tuned for compact cards, dense dashboards, and support review contexts.",
    src: "/videos/flightdeck/jet-cruise-dusk.mp4",
    poster: "/images/flightdeck/stratosphere.webp",
    icon: Zap,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function HiggsfieldMotionShowcase() {
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const cockpitVideoRef = useRef<HTMLVideoElement | null>(null);
  const [heroProgress, setHeroProgress] = useState(0);
  const [cockpitActive, setCockpitActive] = useState(false);

  useEffect(() => {
    let animationFrame = 0;

    const updateHero = () => {
      const section = heroSectionRef.current;
      const video = heroVideoRef.current;

      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const progress = clamp((viewport - rect.top) / (rect.height + viewport), 0, 1);
      setHeroProgress(progress);

      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = clamp(video.duration * progress, 0, Math.max(video.duration - 0.05, 0));
      }
    };

    const onScroll = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateHero);
    };

    updateHero();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const video = cockpitVideoRef.current;

    if (!video) return;

    if (cockpitActive) {
      video.currentTime = 0;
      void video.play();
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [cockpitActive]);

  const heroScale = 1 + heroProgress * 0.1;
  const heroY = -heroProgress * 42;

  return (
    <div className="bg-[var(--amg-ink)] text-white">
      <section
        ref={heroSectionRef}
        className="relative min-h-[130svh] overflow-hidden border-b border-white/[0.10]"
      >
        <div className="sticky top-0 min-h-svh overflow-hidden">
          <video
            ref={heroVideoRef}
            muted
            playsInline
            preload="metadata"
            poster="/images/flightdeck/cockpit-dusk.webp"
            className="absolute inset-0 h-full w-full object-cover opacity-[0.55]"
            style={{ transform: `translate3d(0, ${heroY}px, 0) scale(${heroScale})` }}
          >
            <source src="/videos/flightdeck/jet-cruise-dusk.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(59,130,246,0.18),transparent_28%),linear-gradient(180deg,rgba(5,11,20,0.45),rgba(5,11,20,0.94))]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--amg-ink)] to-transparent" />

          <div className="relative mx-auto flex min-h-svh max-w-7xl items-end px-6 pb-16 pt-32 lg:px-10">
            <div className="max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 backdrop-blur-xl">
                <ScanLine className="h-4 w-4 text-accent" />
                <span className="eyebrow text-[0.68rem] text-accent">Kling 3.0 Hero System</span>
              </div>
              <h1 className="font-display text-6xl font-extrabold uppercase leading-none text-white sm:text-7xl lg:text-8xl">
                Stealth-grade aviation motion
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Scroll-linked aerospace video, glass cockpit telemetry, and propulsion micro-motion for AMG Aviation Group.
              </p>

              <div className="mt-10 grid max-w-3xl grid-cols-3 overflow-hidden rounded-lg border border-white/[0.10] bg-white/[0.05] backdrop-blur-xl">
                {[
                  ["Scroll", `${Math.round(heroProgress * 100)}%`],
                  ["Asset", "8K"],
                  ["Motion", "24fps"],
                ].map(([label, value]) => (
                  <div key={label} className="border-r border-white/[0.10] p-4 last:border-r-0">
                    <p className="font-display text-3xl font-extrabold uppercase text-white">{value}</p>
                    <p className="eyebrow mt-2 text-[0.58rem] text-[var(--oc-aluminum-2)]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-accent">Vibe Motion Cards</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold uppercase leading-none text-white sm:text-5xl">
              Propulsion intelligence
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-300">
            Looping turbine motion assets are bound to pointer and keyboard focus states for premium card interactions.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {featureAssets.map((asset) => {
            const Icon = asset.icon;
            return (
              <article
                key={asset.title}
                className="group overflow-hidden rounded-lg border border-white/[0.10] bg-white/[0.06]"
                onMouseEnter={(event) => {
                  const video = event.currentTarget.querySelector("video");
                  if (video) void video.play();
                }}
                onMouseLeave={(event) => {
                  const video = event.currentTarget.querySelector("video");
                  if (video) {
                    video.pause();
                    video.currentTime = 0;
                  }
                }}
                onFocus={(event) => {
                  const video = event.currentTarget.querySelector("video");
                  if (video) void video.play();
                }}
                onBlur={(event) => {
                  const video = event.currentTarget.querySelector("video");
                  if (video) {
                    video.pause();
                    video.currentTime = 0;
                  }
                }}
                tabIndex={0}
              >
                <div className="relative aspect-[16/11] overflow-hidden">
                  <video
                    muted
                    playsInline
                    loop
                    preload="metadata"
                    poster={asset.poster}
                    className="h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105 group-focus:scale-105"
                  >
                    <source src={asset.src} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--amg-ink)] via-[rgba(5,11,20,0.32)] to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full border border-white/[0.10] bg-black/30 p-3 backdrop-blur-xl">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow text-[0.62rem] text-accent">{asset.eyebrow}</p>
                      <h3 className="mt-3 font-display text-2xl font-bold uppercase leading-none text-white">
                        {asset.title}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-[var(--oc-aluminum-2)]">{asset.metric}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{asset.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-24 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
        <div className="flex flex-col justify-center">
          <p className="eyebrow text-accent">Cockpit Telemetry</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold uppercase leading-none text-white sm:text-5xl">
            Glass display activation
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-300">
            The cockpit sequence uses a click state to transition from standby into active radar and flight telemetry.
          </p>
          <button
            type="button"
            onClick={() => setCockpitActive((value) => !value)}
            className={cn(
              "mt-8 inline-flex h-12 w-fit items-center gap-3 rounded-full border px-5 font-display text-xs font-semibold uppercase tracking-widest transition",
              cockpitActive
                ? "border-accent bg-accent text-accent-foreground"
                : "border-white/15 bg-white/[0.06] text-white hover:border-accent"
            )}
          >
            <Power className="h-4 w-4" />
            {cockpitActive ? "Telemetry Active" : "Activate Display"}
          </button>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-white/[0.10] bg-white/[0.06] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.16),transparent_36%)]" />
          <div className="relative overflow-hidden rounded-md border border-white/[0.10] bg-black">
            <video
              ref={cockpitVideoRef}
              muted
              playsInline
              preload="metadata"
              poster="/images/flightdeck/cabin-night.webp"
              className={cn(
                "aspect-video w-full object-cover transition duration-500",
                cockpitActive ? "scale-100 opacity-90" : "scale-[1.02] opacity-[0.35]"
              )}
            >
              <source src="/videos/flightdeck/jet-cruise-dusk.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0">
              <div className="absolute inset-x-6 top-6 flex items-center justify-between text-xs text-accent">
                <span className="font-mono">AMG-MFD / NAV</span>
                <span className="font-mono">{cockpitActive ? "TRACKING" : "STANDBY"}</span>
              </div>
              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-3">
                {[
                  ["ALT", cockpitActive ? "410" : "---"],
                  ["SPD", cockpitActive ? "482" : "---"],
                  ["HDG", cockpitActive ? "086" : "---"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-white/[0.10] bg-black/35 p-3 backdrop-blur-md">
                    <p className="font-mono text-lg text-white">{value}</p>
                    <p className="eyebrow mt-1 text-[0.52rem] text-[var(--oc-aluminum-2)]">{label}</p>
                  </div>
                ))}
              </div>
              <Radar
                className={cn(
                  "absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 text-accent transition",
                  cockpitActive ? "opacity-80" : "opacity-20"
                )}
              />
            </div>
          </div>
          <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--oc-aluminum-2)]">
            <span className="inline-flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              Vibe Motion telemetry sequence
            </span>
            <span className="font-mono">2-4 sec / click activated</span>
          </div>
        </div>
      </section>
    </div>
  );
}
