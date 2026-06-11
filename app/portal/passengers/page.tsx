import type { Metadata } from "next";
import { PassengerManager } from "@/components/portal/passenger-manager";
import { requirePortalSession } from "@/lib/portal-session";

export const metadata: Metadata = { title: "Passengers — AMG Portal" };

export default async function PassengersPage() {
  const session = await requirePortalSession(["client"]);
  return <PassengerManager session={session} />;
}
