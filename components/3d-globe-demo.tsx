"use client";

import { useState } from "react";
import { Globe3D } from "@/components/ui/3d-globe";
import type { CrewGlobeMarker } from "@/components/sections/crew-globe-data";

type Globe3DDemoProps = {
  markers: CrewGlobeMarker[];
};

export default function Globe3DDemo({ markers }: Globe3DDemoProps) {
  const [activeMarker, setActiveMarker] = useState<CrewGlobeMarker | null>(markers[0] ?? null);

  return (
    <div className="relative min-h-[30rem] overflow-hidden rounded-[1.25rem] border border-[var(--oc-line)] bg-[var(--oc-paper)] shadow-[var(--oc-shadow)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_42%,rgba(47,107,174,0.22),transparent_22rem),linear-gradient(135deg,rgba(11,26,43,0.04),rgba(11,26,43,0))]" />
      <div className="relative z-10 grid min-h-[30rem] gap-5 p-5 md:grid-cols-[1fr_0.72fr] md:p-7">
        <div className="relative min-h-[21rem] overflow-hidden rounded-xl border border-[var(--oc-line)] bg-[rgba(11,26,43,0.84)]">
          <Globe3D
            className="absolute inset-0 h-full"
            markers={markers}
            config={{
              radius: 1.7,
              atmosphereColor: "#7fb7ff",
              atmosphereIntensity: 0.8,
              atmosphereBlur: 3.4,
              showAtmosphere: true,
              showWireframe: true,
              wireframeColor: "#7fb7ff",
              bumpScale: 5,
              autoRotateSpeed: 0.14,
              ambientIntensity: 0.72,
              pointLightIntensity: 1.7,
              enableZoom: true,
              enablePan: false,
              minDistance: 1.25,
              maxDistance: 3.4,
              initialView: {
                lat: 39.8283,
                lng: -98.5795,
                altitude: 1.65,
              },
            }}
            onMarkerClick={(marker) => setActiveMarker(marker as CrewGlobeMarker)}
            onMarkerHover={(marker) => setActiveMarker((marker as CrewGlobeMarker | null) ?? activeMarker)}
          />
        </div>

        <div className="grid content-between gap-4">
          <div>
            <p className="oc-kicker text-[var(--oc-blue)]">Coordination Layer</p>
            <h3 className="oc-display mt-4 text-3xl text-[var(--oc-ink)]">Region, role, readiness.</h3>
            <p className="mt-4 text-sm leading-relaxed text-[var(--oc-muted)]">
              Public airport coverage points can be organized without exposing personal addresses or contact information.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-5">
            <p className="oc-kicker text-[var(--oc-muted)]">Active Review Point</p>
            <h4 className="mt-3 text-base font-semibold text-[var(--oc-ink)]">{activeMarker?.label ?? "Operating region"}</h4>
            <p className="mt-2 text-sm leading-relaxed text-[var(--oc-muted)]">
              {activeMarker?.airportCode ?? "Airport"} · {activeMarker?.sourceLocation ?? "Source market"} · documentation and assignment suitability reviewed before support proceeds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
