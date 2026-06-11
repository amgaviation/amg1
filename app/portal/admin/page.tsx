import type { Metadata } from "next";
import { PortalDashboard } from "@/components/site/portal-dashboard";

export const metadata: Metadata = { title: "Admin Portal" };

export default function AdminPortalPage() {
  return (
    <PortalDashboard
      role="Admin"
      eyebrow="Admin Portal"
      title="AMG command center"
      description="Admins oversee access requests, user roles, aircraft records, settings, documents, crew assignments, and support activity."
      image="/images/jet-sky.png"
      metrics={[
        { label: "Access requests", value: "05" },
        { label: "Active users", value: "48" },
        { label: "Open support", value: "11" },
        { label: "System alerts", value: "02" },
      ]}
      panels={[
        { title: "Access Requests", body: "Approve, reject, or review owner, crew, maintenance, broker, and operations users.", icon: "shield" },
        { title: "User Permissions", body: "Set role defaults and override permissions per person as the operation changes.", icon: "users" },
        { title: "Support Oversight", body: "Monitor lifecycle status from submitted to crew review, scheduled, completed, or cancelled.", icon: "calendar" },
        { title: "Aircraft Admin", body: "Manage aircraft profiles, readiness, and owner or crew visibility.", icon: "plane" },
        { title: "Documents", body: "Organize operational, owner-facing, and crew-facing documents by access role.", icon: "file" },
        { title: "Audit Trail", body: "Track who changed requests, approvals, assignments, and settings.", icon: "check" },
      ]}
    />
  );
}
