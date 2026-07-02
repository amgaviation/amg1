import { cookies } from "next/headers";
import { PortalIntroGate } from "@/components/portal/PortalIntroGate";
import { PORTAL_INTRO_PENDING_COOKIE } from "@/lib/portal/intro";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialIntroPending =
    cookieStore.get(PORTAL_INTRO_PENDING_COOKIE)?.value === "1";

  return (
    <PortalIntroGate initialIntroPending={initialIntroPending}>
      {children}
    </PortalIntroGate>
  );
}
