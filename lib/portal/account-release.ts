import "server-only";

// Reusable "delete a person + release the identifiers that would otherwise block
// them from ever registering again". Extracted from the original single-user
// deletePortalUser flow so both single and bulk deletion share one correct path.
//
// The ONLY hard database gate on re-registration is auth.users.email (Supabase
// builtin unique). profiles.email / network_applications.email are enforced only
// in application code. So "releasing identifiers" means:
//   1. rename the auth login email to a +released- alias (frees the real address),
//   2. flip the profile to deleted / is_deleted (stops the app-level dupe checks),
//   3. neutralize any network_applications row for that email (frees the crew
//      re-add / re-import gate).
// Operational/financial history is intentionally preserved (no cascade).

type PortalDb = any;

/** Build the archival alias used to free the original address, e.g. `you+released-<ts>-<id>@domain`. */
export function releasedEmail(originalEmail: string, userId: string): string {
  const timestamp = Date.now();
  const safeId = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  const [local, ...domainParts] = originalEmail.split("@");
  const domain = domainParts.join("@");

  if (!local || !domain) {
    return `released-${timestamp}-${safeId}@released.amg.invalid`;
  }

  return `${local}+released-${timestamp}-${safeId}@${domain}`;
}

/** True when an address is already an archival alias (idempotency guard). */
export function isReleasedEmail(email: string): boolean {
  return email.includes("+released-") || email.includes("__released__");
}

/** Rename the auth user's email so the original address is free for a fresh signup. */
export async function releaseAuthEmail(
  db: PortalDb,
  userId: string,
  archivedEmail: string
): Promise<boolean> {
  const { error } = await db.auth.admin.updateUserById(userId, {
    email: archivedEmail,
    email_confirm: true,
  });

  // A missing auth user is fine — the profile may be candidate-only (no auth row).
  if (error && !/not found|not.*exist/i.test(error.message)) {
    return false;
  }

  return true;
}

/** Re-point any network application on the original email onto the alias, freeing the crew re-add gate. */
async function neutralizeNetworkApplicationsForEmail(
  db: PortalDb,
  originalEmail: string,
  archivedEmail: string
): Promise<void> {
  if (!originalEmail || isReleasedEmail(originalEmail)) return;
  try {
    await db
      .from("network_applications")
      .update({ email: archivedEmail })
      .ilike("email", originalEmail);
  } catch (error) {
    console.warn("[account-release] network_applications neutralize failed", error);
  }
}

export type ReleaseResult =
  | { ok: true; archivedEmail: string; alreadyReleased: boolean }
  | { ok: false; stage: "auth-release" | "profile-update"; error?: string; archivedEmail: string };

/**
 * Soft-delete a profile and release every identifier that gates re-registration.
 * The caller owns auth/guard checks (self, last-admin, super_admin) and audit
 * logging; this performs the mutation only and reports where it failed.
 */
export async function releaseProfileIdentity(
  db: PortalDb,
  params: { profileId: string; actorId: string; targetEmail: string }
): Promise<ReleaseResult> {
  const { profileId, actorId, targetEmail } = params;
  const alreadyReleased = isReleasedEmail(targetEmail);
  const archivedEmail = alreadyReleased ? targetEmail : releasedEmail(targetEmail, profileId);

  if (!alreadyReleased) {
    const authReleased = await releaseAuthEmail(db, profileId, archivedEmail);
    if (!authReleased) return { ok: false, stage: "auth-release", archivedEmail };
  }

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("profiles")
    .update({
      email: archivedEmail,
      status: "deleted",
      is_active: false,
      is_deleted: true,
      invitation_status: "deleted_email_released",
      deleted_at: now,
      deleted_by: actorId,
      status_updated_at: now,
      status_updated_by: actorId,
      last_login_at: null,
      updated_at: now,
    })
    .eq("id", profileId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, stage: "profile-update", error: error?.message, archivedEmail };
  }

  await neutralizeNetworkApplicationsForEmail(db, targetEmail, archivedEmail);

  return { ok: true, archivedEmail, alreadyReleased };
}

export type ProfileTarget = {
  id: string;
  email: string;
  role: string | null;
  status: string | null;
};

export type DeletionSkip = "self" | "not-found" | "super-admin" | "last-admin";

/**
 * Non-redirecting guard for bulk deletion: decide whether one profile may be
 * deleted by this actor. Batch-aware last-admin protection is the caller's job
 * (pass how many approved admins remain after prior deletions in this batch).
 */
export async function assessProfileDeletion(
  db: PortalDb,
  params: {
    actorId: string;
    actorRole: string | null;
    targetId: string;
    remainingApprovedAdmins: number;
  }
): Promise<{ ok: true; target: ProfileTarget } | { ok: false; reason: DeletionSkip }> {
  const { actorId, actorRole, targetId, remainingApprovedAdmins } = params;

  if (targetId === actorId) return { ok: false, reason: "self" };

  const { data: target } = await db
    .from("profiles")
    .select("id, email, role, status")
    .eq("id", targetId)
    .maybeSingle();

  if (!target) return { ok: false, reason: "not-found" };

  if (target.role === "super_admin" && actorRole !== "super_admin") {
    return { ok: false, reason: "super-admin" };
  }

  if (target.role === "admin" && target.status === "approved" && remainingApprovedAdmins <= 1) {
    return { ok: false, reason: "last-admin" };
  }

  return { ok: true, target: target as ProfileTarget };
}
