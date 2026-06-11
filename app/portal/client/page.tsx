import type { Metadata } from "next";
import { PortalDashboard } from "@/components/site/portal-dashboard";

export const metadata: Metadata = { title: "Client Portal" };

export default function ClientPortalPage() {
  return (
    <PortalDashboard
      role="Client"
      eyebrow="Client Portal"
      title="Owner mission control"
      description="Request trips, manage passengers, view mission status, access documents, and message AMG Operations from a private client workspace."
      image="/images/jet-interior.png"
      metrics={[
        { label: "Upcoming missions", value: "03" },
        { label: "Pending review", value: "01" },
        { label: "Passengers", value: "12" },
        { label: "Documents", value: "08" },
      ]}
      panels={[
        { title: "New Trip Request", body: "Submit departure, arrival, passenger, catering, and timing details for crew review.", icon: "plane" },
        { title: "Mission Status", body: "Track submitted, in-review, scheduled, completed, and cancelled missions.", icon: "calendar" },
        { title: "Passenger Profiles", body: "Maintain passenger data and preferences for faster future requests.", icon: "users" },
        { title: "Documents", body: "Access owner-facing records, aircraft documents, and shared files.", icon: "file" },
        { title: "Crew Review", body: "Owner edits and cancellations notify crew for operational approval where needed.", icon: "check" },
        { title: "Private Support", body: "Message AMG Operations without mixing mission data into scattered texts.", icon: "shield" },
      ]}
    />
  );
}
