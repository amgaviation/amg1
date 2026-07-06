import { PortalShell } from "@/components/portal/shell/portal-shell";
import { getSessionUser } from "@/lib/portal/session";
import { countUnread } from "@/lib/portal/queries";
import { permissionsForRole } from "@/lib/portal/permissions";
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

  // Unread badge and nav filtering (role-permission matrix view flags) are
  // independent — resolve them concurrently. Both fail open: the shell is
  // chrome only, pages and actions enforce.
  const [unread, moduleView] = await Promise.all([
    countUnread(user.id).catch(() => 0),
    permissionsForRole(user.role)
      .then((perms) =>
        Object.fromEntries(
          Object.entries(perms).map(([moduleKey, flags]) => [moduleKey, flags.view])
        )
      )
      .catch(() => undefined),
  ]);

  return (
    <PortalShell role={role} user={user} unread={unread} moduleView={moduleView}>
      {children}
    </PortalShell>
  );
}
