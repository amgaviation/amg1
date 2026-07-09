import { requireRole } from "@/lib/portal/session";
import { PageHeader } from "@/components/portal/ui/primitives";
import { getClientMap } from "@/lib/portal/crew-map";
import { CrewMap } from "@/components/portal/crew-map/crew-map";

export const metadata = { title: "Crew Availability — Client Portal" };
export const dynamic = "force-dynamic";

export default async function ClientLiveMapPage() {
  await requireRole("client");
  const aggregates = await getClientMap();
  return (
    <>
      <PageHeader
        eyebrow="AMG Network"
        title="Crew Availability"
        description="Vetted crew capacity available across the network right now — total flight hours online, by state, and the type ratings currently available."
      />
      <CrewMap variant="client" initialClient={aggregates} />
    </>
  );
}
