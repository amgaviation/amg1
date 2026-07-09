import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader } from "@/components/portal/ui/primitives";
import { getAdminMap } from "@/lib/portal/crew-map";
import { CrewMap } from "@/components/portal/crew-map/crew-map";

export const metadata = { title: "Live Crew Map — AMG Operations" };
export const dynamic = "force-dynamic";

export default async function AdminLiveMapPage() {
  await requireRolePermission("admin", "crew");
  const pins = await getAdminMap();
  return (
    <>
      <PageHeader
        eyebrow="AMG Operations"
        title="Live Crew Map"
        description="Crew available for assignment right now. Click a pin for contact, ratings, hours, and how long they've been active. Updates live."
      />
      <CrewMap variant="admin" initialAdmin={pins} />
    </>
  );
}
