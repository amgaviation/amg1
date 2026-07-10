import Link from "next/link";
import { permissionsForRole, requireRolePermission } from "@/lib/portal/permissions";
import { MATRIX_ROLES, type ActionFlags, type MatrixRole, type PermissionModule } from "@/lib/portal/permissions-catalog";
import { saveRolePermissions } from "@/app/portal/actions/permissions";
import { PermissionsMatrix } from "@/components/portal/admin/permissions-matrix";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";

export const metadata = { title: "Role Permissions - Admin Portal" };

export default async function RolePermissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRolePermission("admin", "settings");
  const params = await searchParams;
  const canEdit = user.role === "super_admin";

  const initial = {} as Record<MatrixRole, Record<PermissionModule, ActionFlags>>;
  for (const role of MATRIX_ROLES) {
    initial[role] = await permissionsForRole(role);
  }

  return (
    <>
      {params.success === "saved" ? (
        <Notice tone="success">Permissions saved. Changes apply to every portal session immediately.</Notice>
      ) : null}
      {params.success === "no-changes" ? <Notice tone="info">No permission changes to save.</Notice> : null}
      {params.success === "saved-audit-failed" ? (
        <Notice tone="warn">
          Permissions saved and active, but the audit-log entry could not be written. Re-save to
          retry, or note this change manually for the compliance record.
        </Notice>
      ) : null}
      {params.error === "super-admin-only" ? (
        <Notice tone="danger">Only the Super Admin can change role permissions.</Notice>
      ) : null}
      {params.error === "save-failed" ? (
        <Notice tone="danger">The permission update could not be saved. No changes were applied.</Notice>
      ) : null}

      <PageHeader
        eyebrow="Website Governance"
        title="Role Permissions"
        description="Control what each portal role can view, add, edit, and delete, module by module."
      />

      <SectionCard title="Permission Matrix" icon="shield">
        <div className="mb-4 grid gap-1 text-xs text-[var(--deck-text-2)]">
          <p>View covers lists, search, and detail pages. Copy/duplicate follows Add.</p>
          <p>
            The Super Admin always has full access and never appears here, so governance can never be
            locked out. Ownership rules (own records only) still apply on top of these switches.
          </p>
          <p>
            Saving applies to all active portal sessions immediately — there is no preview. Removing
            View from the AMG Operations row hides that area from every admin; the Super Admin can
            restore access here or with Restore defaults.
          </p>
        </div>
        <PermissionsMatrix initial={initial} canEdit={canEdit} action={saveRolePermissions} />
      </SectionCard>

      <p className="text-sm">
        <Link href="/portal/admin/settings" className="text-[var(--deck-accent-ink)] hover:underline">
          ← Back to settings
        </Link>
      </p>
    </>
  );
}
