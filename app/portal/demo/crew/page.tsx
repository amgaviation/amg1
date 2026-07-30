import { requireRole } from "@/lib/portal/session";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { LocalTime } from "@/components/portal/ui/local-time";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import {
  AVAILABILITY_STATUS_LABEL,
  AVAILABILITY_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatMoney } from "@/lib/portal/format";
import { DEMO_CREW, demoDate, type DemoCrewMember } from "@/lib/demo/data";

export const metadata = { title: "Crew - Demo Portal" };

const CREDENTIAL_LABEL: Record<DemoCrewMember["credentialStatus"], string> = {
  approved: "Approved",
  expiring: "Expiring Soon",
  pending_review: "Pending Review",
};

export default async function DemoCrewPage() {
  await requireRole("demo");

  const available = DEMO_CREW.filter((crew) => crew.availability === "available").length;
  const onAssignment = DEMO_CREW.filter((crew) => crew.availability === "unavailable").length;
  const expiring = DEMO_CREW.filter((crew) => crew.credentialStatus !== "approved").length;

  return (
    <>
      <PageHeader
        eyebrow="Demo Sandbox"
        title="Crew Roster"
        description="Simulated contract pilots in the AMG network — type ratings, availability, medical currency, and day rates."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Roster" icon="users" value={DEMO_CREW.length} detail="Contract PICs and SICs across eight bases." />
        <StatCard label="Available Now" icon="check" value={available} detail="Ready for assignment today." />
        <StatCard label="On Assignment" icon="plane" value={onAssignment} detail="Currently flying or repositioned." />
        <StatCard label="Credential Alerts" icon="badgeCheck" value={expiring} detail="Medicals or documents needing attention." tone={expiring ? "warn" : "default"} />
      </div>

      <SectionCard title="Contract Crew" icon="users">
        <DataTable<DemoCrewMember>
          rows={DEMO_CREW}
          getKey={(row) => row.id}
          columns={[
            { header: "Name", cell: (row) => <span className="font-semibold">{row.name}</span>, priority: "primary" },
            { header: "Seat", cell: (row) => row.crewRole.toUpperCase() },
            { header: "Ratings", cell: (row) => <span className="text-xs">{row.ratings.join(" · ")}</span>, hideOnMobile: true },
            { header: "Home Base", cell: (row) => <span className="deck-mono">{row.homeBase}</span> },
            {
              header: "Availability",
              cell: (row) => (
                <StatusBadge
                  label={AVAILABILITY_STATUS_LABEL[row.availability] ?? row.availability}
                  tone={toneFor(AVAILABILITY_STATUS_TONE, row.availability)}
                />
              ),
              priority: "secondary",
            },
            {
              header: "Medical Due",
              cell: (row) => (
                <span className={row.medicalDueDays <= 30 ? "font-medium text-[var(--deck-warn)]" : undefined}>
                  <LocalTime value={demoDate(row.medicalDueDays)} mode="date" />
                </span>
              ),
              hideOnMobile: true,
            },
            {
              header: "Credentials",
              cell: (row) => (
                <StatusBadge
                  label={CREDENTIAL_LABEL[row.credentialStatus]}
                  tone={row.credentialStatus === "approved" ? "success" : row.credentialStatus === "expiring" ? "warn" : "info"}
                />
              ),
            },
            { header: "Missions YTD", cell: (row) => row.missionsYtd, align: "right", hideOnMobile: true },
            { header: "Day Rate", cell: (row) => formatMoney(row.dayRate), align: "right" },
          ]}
        />
      </SectionCard>
    </>
  );
}
