"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/portal/audit";
import { ROLE_PERMISSIONS_CACHE_TAG } from "@/lib/portal/permissions";
import {
  DEFAULT_PERMISSIONS,
  MATRIX_ROLES,
  PERMISSION_ACTIONS,
  PERMISSION_MODULE_KEYS,
  defaultFlags,
  type ActionFlags,
  type MatrixRole,
  type PermissionModule,
} from "@/lib/portal/permissions-catalog";
import { actor } from "./_helpers";

const PAGE = "/portal/admin/settings/permissions";

type Matrix = Record<MatrixRole, Record<PermissionModule, ActionFlags>>;

function matrixFromForm(formData: FormData): Matrix {
  const matrix = {} as Matrix;
  for (const role of MATRIX_ROLES) {
    matrix[role] = {} as Record<PermissionModule, ActionFlags>;
    for (const module of PERMISSION_MODULE_KEYS) {
      const flags = {} as ActionFlags;
      for (const action of PERMISSION_ACTIONS) {
        flags[action] = formData.get(`perm.${role}.${module}.${action}`) === "on";
      }
      // Dependency rule: any granted action implies view; no view means no actions.
      if (flags.add || flags.edit || flags.delete) flags.view = true;
      matrix[role][module] = flags;
    }
  }
  return matrix;
}

/**
 * Persist the full role-permission matrix. Super admin only — the actor()
 * role gate lets admins through by design, so the role is checked explicitly.
 */
export async function saveRolePermissions(formData: FormData) {
  const user = await actor();
  if (user.role !== "super_admin") redirect(`${PAGE}?error=super-admin-only`);

  const desired: Matrix =
    formData.get("reset") === "defaults" ? DEFAULT_PERMISSIONS : matrixFromForm(formData);

  const db = await createServiceClient();
  const { data: existingRows, error: readError } = await db
    .from("role_permissions")
    .select("role, module, can_view, can_add, can_edit, can_delete");
  if (readError) redirect(`${PAGE}?error=save-failed`);

  const existing = new Map<string, ActionFlags>();
  for (const row of existingRows ?? []) {
    existing.set(`${row.role}.${row.module}`, {
      view: row.can_view,
      add: row.can_add,
      edit: row.can_edit,
      delete: row.can_delete,
    });
  }

  // Old → new per changed cell, for the audit trail.
  const changes: string[] = [];
  const now = new Date().toISOString();
  const upserts = [];
  for (const role of MATRIX_ROLES) {
    for (const module of PERMISSION_MODULE_KEYS) {
      const before = existing.get(`${role}.${module}`) ?? defaultFlags(role, module);
      const after = desired[role][module];
      for (const action of PERMISSION_ACTIONS) {
        if (before[action] !== after[action]) {
          changes.push(`${role}.${module}.${action}: ${before[action]} → ${after[action]}`);
        }
      }
      upserts.push({
        role,
        module,
        can_view: after.view,
        can_add: after.add,
        can_edit: after.edit,
        can_delete: after.delete,
        updated_by: user.id,
        updated_at: now,
      });
    }
  }

  if (!changes.length) redirect(`${PAGE}?success=no-changes`);

  const { error } = await db
    .from("role_permissions")
    .upsert(upserts, { onConflict: "role,module" });
  if (error) {
    console.error("[permissions] save failed", error);
    redirect(`${PAGE}?error=save-failed`);
  }

  const summary =
    changes.length > 40
      ? `${changes.slice(0, 40).join("; ")}; … and ${changes.length - 40} more`
      : changes.join("; ");
  await logAuditEvent({
    actor: user,
    action: "role_permissions_updated",
    detail: `${changes.length} permission cell(s) changed: ${summary}`,
    entityType: "role_permissions",
  });

  updateTag(ROLE_PERMISSIONS_CACHE_TAG);
  revalidatePath(PAGE);
  redirect(`${PAGE}?success=saved`);
}
