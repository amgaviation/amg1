"use client";

import { useState } from "react";
import { Globe3D } from "@/components/ui/3d-globe";
import type { CrewGlobeMarker } from "@/components/sections/crew-globe-data";

type Globe3DDemoThirdProps = {
  markers: CrewGlobeMarker[];
  regionCount: number;
};

export default function Globe3DDemoThird({ markers, regionCount }: Globe3DDemoThirdProps) {
  const [activeMarker, setActiveMarker] = useState<CrewGlobeMarker | null>(markers[0] ?? null);

  return (
    <div className="relative min-h-[28rem] overflow-hidden rounded-[1.25rem] border border-[var(--oc-line-dark)] bg-[rgba(250,248,242,0.045)] shadow-[var(--oc-shadow)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_38%,rgba(59,130,246,0.24),transparent_20rem),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.015))]" />
      <div className="relative z-10 grid min-h-[28rem] gap-4 p-5 md:grid-cols-[0.72fr_1fr] md:p-7">
        <div className="flex flex-col justify-between gap-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-md">
            <p className="oc-kicker text-[var(--oc-aluminum-2)]">Network Status</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <p className="oc-display text-4xl text-white">{markers.length}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[var(--oc-aluminum)]">Public airport markers</p>
              </div>
              <div>
                <p className="oc-display text-4xl text-white">{regionCount}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[var(--oc-aluminum)]">States represented</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[rgba(11,26,43,0.58)] p-5 backdrop-blur-md">
            <p className="oc-kicker text-[var(--oc-aluminum-2)]">Selected Point</p>
            <h3 className="mt-3 text-lg font-semibold text-white">{activeMarker?.label ?? "Operating region"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--oc-aluminum)]">
              {activeMarker?.airportCode ? `${activeMarker.airportCode} · ` : ""}
              {activeMarker?.airportName ?? "Public-use airport"} · {activeMarker?.crewCount ?? 1} crew record
              {(activeMarker?.crewCount ?? 1) === 1 ? "" : "s"} represented.
            </p>
          </div>
        </div>

        <div className="relative min-h-[20rem] overflow-hidden rounded-xl border border-white/10 bg-[rgba(5,11,20,0.28)]">
          <Globe3D
            className="absolute inset-0 h-full"
            markers={markers}
            config={{
              radius: 1.45,
              atmosphereColor: "#7fb7ff",
              atmosphereIntensity: 18,
              atmosphereBlur: 3.6,
              showAtmosphere: true,
              showWireframe: true,
              wireframeColor: "#7fb7ff",
              bumpScale: 4,
              autoRotateSpeed: 0.2,
              ambientIntensity: 0.72,
              pointLightIntensity: 1.8,
              enableZoom: false,
              enablePan: false,
              initialView: {
                lat: 39.8283,
                lng: -98.5795,
                altitude: 1.9,
              },
            }}
            onMarkerClick={(marker) => setActiveMarker(marker as CrewGlobeMarker)}
            onMarkerHover={(marker) => setActiveMarker((marker as CrewGlobeMarker | null) ?? activeMarker)}
          />
        </div>
      </div>
    </div>
  );
}
