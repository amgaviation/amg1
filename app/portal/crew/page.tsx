import type { Metadata } from "next";
import { PortalDashboard } from "@/components/site/portal-dashboard";

export const metadata: Metadata = { title: "Crew Portal" };

export default function CrewPortalPage() {
  return (
    <PortalDashboard
      role="Crew"
      eyebrow="Crew Portal"
      title="Operational authority"
      description="Pilots and approved crew manage trips, approvals, manifests, aircraft readiness, assignments, availability, and external role access."
      image="/images/operations.png"
      metrics={[
        { label: "Assigned trips", value: "06" },
        { label: "Approvals", value: "02" },
        { label: "Open trip pool", value: "04" },
        { label: "Aircraft records", value: "09" },
      ]}
      panels={[
        { title: "Approvals Queue", body: "Review owner edits, cancellation notices, access requests, and assignment changes.", icon: "check" },
        { title: "Trip Pool", body: "See available missions, interest submissions, crew gaps, and scheduling conflicts.", icon: "calendar" },
        { title: "Manifest Control", body: "View full manifests when permitted and manage privacy-sensitive passenger details.", icon: "users" },
        { title: "Aircraft Readiness", body: "Track aircraft status, notes, maintenance context, and crew-specific documents.", icon: "plane" },
        { title: "Crew Documents", body: "Keep qualification, medical, training, and recurrent records visible to operations.", icon: "file" },
        { title: "Permissions", body: "Crew authority supports role defaults with per-person overrides.", icon: "shield" },
      ]}
    />
  );
}
