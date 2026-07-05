import { PortalShell } from "@/components/portal/shell/portal-shell";
import { getSessionUser } from "@/lib/portal/session";
import { countUnread } from "@/lib/portal/queries";
import type { PortalRole } from "@/lib/portal/constants";

/**
 * Server-side shell mount shared by the per-role layouts
 * (app/portal/<role>/layout.tsx). Chrome only — `requireRole()` in each page
 * remains the security boundary; layouts do not re-run on soft navigation and
 * must never be trusted for enforcement. Unauthenticated visitors get bare
 * children and are redirected by the page guards.
 */
export async function RolePortalLayout({
  role,
  children,
}: {
  role: PortalRole;
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) return <>{children}</>;

  let unread = 0;
  try {
    unread = await countUnread(user.id);
  } catch {
    unread = 0;
  }

  return (
    <PortalShell role={role} user={user} unread={unread}>
      {children}
    </PortalShell>
  );
}
