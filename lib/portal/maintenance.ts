export type MaintenanceProfile = {
  role?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  is_deleted?: boolean | null;
};

/** Fail closed: maintenance stays enabled until explicitly disabled. */
export function isMaintenanceMode(value: string | undefined) {
  return value !== "false";
}

/** Fail closed: public signup stays disabled until explicitly enabled. */
export function isPublicSignupEnabled(value: string | undefined) {
  return value === "enabled";
}

export function isEmergencyMaintenanceAdminPath(pathname: string) {
  return (
    pathname === "/portal/admin" ||
    pathname.startsWith("/portal/admin/") ||
    pathname === "/portal/super-admin" ||
    pathname.startsWith("/portal/super-admin/")
  );
}

export function canUsePortalDuringMaintenance(
  profile: MaintenanceProfile | null,
  pathname: string,
) {
  if (!profile || !isEmergencyMaintenanceAdminPath(pathname)) return false;

  return (
    profile.status === "approved" &&
    profile.is_active === true &&
    profile.is_deleted !== true &&
    (profile.role === "admin" || profile.role === "super_admin")
  );
}

export function canUsePrivateApiDuringMaintenance(profile: MaintenanceProfile | null) {
  if (!profile) return false;
  return (
    profile.status === "approved" &&
    profile.is_active === true &&
    profile.is_deleted !== true &&
    (profile.role === "admin" || profile.role === "super_admin")
  );
}
