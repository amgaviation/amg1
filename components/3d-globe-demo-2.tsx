"use client";

import { useState } from "react";
import { Globe3D } from "@/components/ui/3d-globe";
import type { CrewGlobeMarker } from "@/components/sections/crew-globe-data";

type Globe3DDemoSecondProps = {
  markers: CrewGlobeMarker[];
};

export default function Globe3DDemoSecond({ markers }: Globe3DDemoSecondProps) {
  const [activeMarker, setActiveMarker] = useState<CrewGlobeMarker | null>(markers[0] ?? null);
  const [selectedMarker, setSelectedMarker] = useState<CrewGlobeMarker | null>(null);

  return (
    <div className="relative min-h-[34rem] overflow-hidden rounded-[1.25rem] border border-[var(--oc-line-dark)] bg-[rgba(11,26,43,0.72)] shadow-[var(--oc-shadow)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(59,130,246,0.22),transparent_24rem),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015))]" />
      <Globe3D
        className="absolute inset-x-0 bottom-0 top-0 h-full"
        markers={markers}
        config={{
          atmosphereColor: "#7fb7ff",
          atmosphereIntensity: 1,
          atmosphereBlur: 3.8,
          showAtmosphere: true,
          showWireframe: true,
          wireframeColor: "#7fb7ff",
          bumpScale: 2.8,
          autoRotateSpeed: 0.16,
          ambientIntensity: 0.74,
          pointLightIntensity: 1.9,
          enableZoom: false,
          enablePan: false,
          initialView: {
            lat: 39.8283,
            lng: -98.5795,
            altitude: 3.5,
          },
        }}
        selectedMarker={selectedMarker}
        onMarkerClick={(marker) => {
          setActiveMarker(marker as CrewGlobeMarker);
          setSelectedMarker(marker as CrewGlobeMarker);
        }}
        onMarkerHover={(marker) => {
          const hoveredMarker = marker as CrewGlobeMarker | null;
          setSelectedMarker(hoveredMarker);
          if (hoveredMarker) setActiveMarker(hoveredMarker);
        }}
      />

      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-xl border border-white/[0.10] bg-[rgba(5,11,20,0.62)] p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md sm:inset-x-auto sm:left-5 sm:max-w-sm">
        <p className="oc-kicker text-[var(--oc-aluminum-2)]">Region Detail</p>
        <h3 className="mt-3 text-lg font-semibold">{activeMarker?.label ?? "Crew coverage point"}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--oc-aluminum)]">
          {activeMarker?.airportCode ? `${activeMarker.airportCode} · ` : ""}
          {activeMarker?.airportName ?? "Public-use airport"} · {activeMarker?.crewCount ?? 1} crew record
          {(activeMarker?.crewCount ?? 1) === 1 ? "" : "s"} represented. Final assignment review required.
        </p>
      </div>
    </div>
  );
}
