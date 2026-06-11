import type { Metadata } from "next";
import { CrewProfilePanel } from "@/components/portal/crew-profile-panel";
import { requirePortalSession } from "@/lib/portal-session";

export const metadata: Metadata = { title: "Crew Profile — AMG Portal" };

export default async function CrewProfilePage() {
  const session = await requirePortalSession(["crew"]);
  return <CrewProfilePanel session={session} />;
}
