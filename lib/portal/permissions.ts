import "server-only";

import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireUser, type SessionUser } from "@/lib/portal/session";
import type { PortalRole } from "@/lib/portal/constants";
import {
  defaultFlags,
  isMatrixRole,
  isPermissionModule,
  PERMISSION_ACTIONS,
  PERMISSION_MODULE_KEYS,
  type ActionFlags,
  type MatrixRole,
  type PermissionAction,
  type PermissionModule,
} from "@/lib/portal/permissions-catalog";

export const ROLE_PERMISSIONS_CACHE_TAG = "role-permissions";

export type PermissionMatrix = Record<MatrixRole, Partial<Record<PermissionModule, ActionFlags>>>;

type RolePermissionRow = {
  role: string;
  module: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

function rowToFlags(row: RolePermissionRow): ActionFlags {
  return { view: row.can_view, add: row.can_add, edit: row.can_edit, delete: row.can_delete };
}

/**
 * Load every role_permissions row into a role → module → flags map.
 * Returns null when the table is unreachable (missing migration, no service
 * key) so callers fall back to the code defaults instead of failing.
 */
async function fetchPermissionMatrix(): Promise<PermissionMatrix | null> {
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("role_permissions")
      .select("role, module, can_view, can_add, can_edit, can_delete");
    if (error || !data) return null;

    const matrix: PermissionMatrix = { client: {}, crew: {}, partner: {}, admin: {} };
    for (const row of data as RolePermissionRow[]) {
      if (!isMatrixRole(row.role) || !isPermissionModule(row.module)) continue;
      matrix[row.role][row.module] = rowToFlags(row);
    }
    return matrix;
  } catch {
    return null;
  }
}

const loadPermissionMatrix = unstable_cache(fetchPermissionMatrix, ["role-permissions-matrix"], {
  tags: [ROLE_PERMISSIONS_CACHE_TAG],
  revalidate: 300,
});

/** Effective flags for one role/module: DB row → code default → deny. */
export async function effectiveFlags(role: PortalRole, module: PermissionModule): Promise<ActionFlags> {
  if (role === "super_admin") return { view: true, add: true, edit: true, delete: true };
  const matrix = await loadPermissionMatrix();
  const row = isMatrixRole(role) ? matrix?.[role]?.[module] : undefined;
  return row ?? defaultFlags(role, module);
}

/** Can this role perform this action on this module? super_admin always can. */
export async function can(
  role: PortalRole,
  module: PermissionModule,
  action: PermissionAction
): Promise<boolean> {
  const flags = await effectiveFlags(role, module);
  return flags[action];
}

/**
 * Effective flags for every module for one role, resolved in a single matrix
 * load — used by nav filtering and the settings page so hot paths pay for at
 * most one (cached) DB read per request.
 */
export async function permissionsForRole(
  role: PortalRole
): Promise<Record<PermissionModule, ActionFlags>> {
  const matrix = role === "super_admin" ? null : await loadPermissionMatrix();
  const result = {} as Record<PermissionModule, ActionFlags>;
  for (const module of PERMISSION_MODULE_KEYS) {
    if (role === "super_admin") {
      result[module] = { view: true, add: true, edit: true, delete: true };
    } else {
      result[module] = (isMatrixRole(role) ? matrix?.[role]?.[module] : undefined) ?? defaultFlags(role, module);
    }
  }
  return result;
}

export function noAccessPath(module: PermissionModule, action: PermissionAction = "view"): string {
  return `/portal/no-access?module=${encodeURIComponent(module)}&action=${encodeURIComponent(action)}`;
}

/**
 * Page guard: require an authenticated, approved user whose role has the
 * given module permission. Redirects to the no-access notice otherwise.
 */
export async function requirePermission(
  module: PermissionModule,
  action: PermissionAction = "view"
): Promise<SessionUser> {
  const user = await requireUser();
  if (!(await can(user.role, module, action))) {
    redirect(noAccessPath(module, action));
  }
  return user;
}

export { PERMISSION_ACTIONS };
export type { PermissionAction, PermissionModule, ActionFlags };
