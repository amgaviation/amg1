"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { ASSIGNABLE_PORTAL_ROLES, isPortalRole, PORTAL_PERMISSIONS, PROFILE_STATUS, type PortalRole } from "@/lib/portal/constants";
import { notifyMissionContactByEmail } from "@/lib/portal/mission-client-notifications";
import { getEmailProvider } from "@/lib/email/provider";
import { defaultSender, replyToAddress } from "@/lib/email/config";
import { WAITLIST_CONTACT_TEMPLATE_KEY, waitlistContactRequestTemplate } from "@/lib/email/templates/access-management";
import { getEmailTemplateCopies } from "@/lib/portal/email-template-registry";
import {
  ensurePortalAuthUserForProfile,
  generatePortalPasswordSetupLink,
  sendPortalPasswordResetEmail,
} from "@/lib/portal/account-setup";
import { COMPLIANCE_POLICY_VERSION } from "@/lib/compliance/config";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";
import {
  dependencyAuditDetail,
  summarizeAircraftDependencies,
  summarizeClientDependencies,
  summarizeCrewDependencies,
  summarizePartnerDependencies,
  summarizeProfileDependencies,
} from "@/lib/portal/record-safety";
import { updateAuthEmailIfPresent } from "@/lib/portal/auth-email-sync";
import {
  assessProfileDeletion,
  isReleasedEmail,
  releaseProfileIdentity,
  type DeletionSkip,
} from "@/lib/portal/account-release";
import { formatCrewComplianceBlockers, listCrewComplianceIssues } from "@/lib/portal/mission-lifecycle";
import { actor, num, safeRedirectPath, str } from "./_helpers";

const INITIAL_SUPER_ADMIN_EMAIL = "tony@amgaviationgroup.com";

function normalizeEmail(formData: FormData, key: string): string {
  return str(formData, key).toLowerCase();
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value: string): string | null {
  if (!value) return null;
  const compact = value.replace(/[\s().-]/g, "");
  return compact.startsWith("+") ? compact : `+${compact}`;
}

function selectedPermissions(formData: FormData): string[] {
  const selected = formData.getAll("permissions").map((value) => String(value));
  return selected.filter((permission) => PORTAL_PERMISSIONS.includes(permission));
}

function allStrings(formData: FormData, key: string): string[] {
  return formData.getAll(key).map((value) => String(value).trim());
}

function splitList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function boolValue(formData: FormData, key: string): boolean {
  const value = str(formData, key).toLowerCase();
  return ["true", "yes", "y", "1", "checked", "on"].includes(value);
}

function dateValue(formData: FormData, key: string): string | null {
  const value = str(formData, key);
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function controlledProfileStatus(value: string) {
  return PROFILE_STATUS.some((item) => item.value === value) ? value : "pending_approval";
}

function canAssignSuperAdmin(actingRole: string, targetEmail: string) {
  return actingRole === "super_admin" && targetEmail.toLowerCase() === INITIAL_SUPER_ADMIN_EMAIL;
}

function isAssignablePortalRole(value: string, actingRole: string): value is PortalRole {
  if (!isPortalRole(value) || value === "super_admin") return false;
  if (value === "admin") return actingRole === "admin" || actingRole === "super_admin";
  return ASSIGNABLE_PORTAL_ROLES.some((role) => role.value === value);
}

async function recordProfileStatusEvent({
  db,
  profileId,
  previousStatus,
  newStatus,
  previousRole,
  newRole,
  businessPurpose,
  note,
  changedBy,
}: {
  db: Awaited<ReturnType<typeof createServiceClient>>;
  profileId: string;
  previousStatus: string | null;
  newStatus: string;
  previousRole?: string | null;
  newRole?: string | null;
  businessPurpose?: string | null;
  note?: string | null;
  changedBy: string;
}) {
  await (db as any).from("portal_user_status_events").insert({
    portal_user_id: profileId,
    previous_status: previousStatus,
    new_status: newStatus,
    previous_role: previousRole ?? null,
    new_role: newRole ?? null,
    business_purpose: businessPurpose ?? null,
    note: note || null,
    changed_by: changedBy,
  });
}

async function ensureUniqueProfileEmail(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  email: string,
  currentId: string | null,
  backTo: string
) {
  const { data: duplicate } = await db
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .neq("status", "deleted")
    .neq("is_deleted", true)
    .maybeSingle();

  if (duplicate && duplicate.id !== currentId) redirect(`${backTo}?error=duplicate`);
}

async function preventAdminSelfOrLastAdminAction(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  actingAdminId: string,
  targetUserId: string,
  backTo: string
) {
  if (targetUserId === actingAdminId) {
    redirect(`${backTo}?error=self`);
  }

  const { data: target } = await db
    .from("profiles")
    .select("id, email, full_name, role, status")
    .eq("id", targetUserId)
    .maybeSingle();

  if (!target) {
    redirect(`${backTo}?error=user`);
  }

  if (target.role === "super_admin") {
    const { data: actorProfile } = await db
      .from("profiles")
      .select("role")
      .eq("id", actingAdminId)
      .maybeSingle();

    if (actorProfile?.role !== "super_admin") {
      redirect(`${backTo}?error=role`);
    }
  }

  if (target.role === "admin") {
    const { count } = await db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("status", "approved")
      .eq("is_active", true);

    if ((count ?? 0) <= 1) {
      redirect(`${backTo}?error=last-admin`);
    }
  }

  return target;
}

// ─── User approvals & role management ───────────────────────────────
export async function approveUser(formData: FormData) {
  const admin = await actor(["admin"], "users.edit");
  const db = await createServiceClient();
  const userId = str(formData, "user_id");
  const role = str(formData, "role");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/user-approvals");
  const note = str(formData, "admin_notes");

  if (!isAssignablePortalRole(role, admin.role)) redirect(`${backTo}?error=role`);

  const { data: profile } = await db
    .from("profiles")
    .select("id, email, full_name, role, status, business_purpose, company_name, phone, home_base, permissions")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) redirect(`${backTo}?error=user`);

  const now = new Date().toISOString();

  const { error: updateError } = await db
    .from("profiles")
    .update({
      role,
      assigned_role: role,
      status: "approved",
      is_active: true,
      is_deleted: false,
      admin_notes: note || null,
      status_updated_at: now,
      status_updated_by: admin.id,
      updated_at: now,
    } as any)
    .eq("id", userId);

  if (updateError) redirect(`${backTo}?error=save`);

  const provisioned = await ensurePortalAuthUserForProfile({
    db,
    profile: { ...profile, role, status: "approved" },
    invitedBy: admin.id,
    sendSetupEmail: true,
  });

  if (!provisioned.ok) {
    redirect(`${backTo}?error=invite`);
  }

  await recordProfileStatusEvent({
    db,
    profileId: provisioned.profileId,
    previousStatus: profile.status,
    newStatus: "approved",
    previousRole: profile.role,
    newRole: role,
    businessPurpose: profile.business_purpose,
    note,
    changedBy: admin.id,
  });

  await logAuditEvent({
    actor: admin,
    action: "user_approved",
    detail: `Approved user ${profile.email}`,
    entityType: "profile",
    entityId: provisioned.profileId,
  });

  await notifyUser({
    userId: provisioned.profileId,
    title: "Access approved",
    body: "Your AMG Connect portal access has been approved. Check your email for the secure setup link.",
    type: "access_approved",
  });

  revalidatePath("/portal/admin/user-approvals");
  revalidatePath("/portal/admin/waitlist");
  revalidatePath("/portal/admin/users");
  redirect(`${backTo}?success=approved`);
}

export async function setUserStatus(formData: FormData) {
  const admin = await actor(["admin"], "users.edit");
  const db = await createServiceClient();
  const userId = str(formData, "user_id");
  const status = str(formData, "status");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/user-approvals");
  const note = str(formData, "admin_notes");

  if (!PROFILE_STATUS.some((item) => item.value === status)) redirect(`${backTo}?error=status`);
  if (status !== "approved") {
    await preventAdminSelfOrLastAdminAction(db, admin.id, userId, backTo);
  }

  let entityId = userId;

  if (status === "approved") {
    const { data: profile } = await db
      .from("profiles")
      .select("id, email, full_name, role, status, business_purpose, company_name, phone, home_base, permissions")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) redirect(`${backTo}?error=user`);

    const provisioned = await ensurePortalAuthUserForProfile({
      db,
      profile,
      invitedBy: admin.id,
      sendSetupEmail: true,
    });

    if (!provisioned.ok) redirect(`${backTo}?error=invite`);
    entityId = provisioned.profileId;
  } else {
    const now = new Date().toISOString();
    const statusPatch: Record<string, unknown> = {
      status,
      is_active: false,
      admin_notes: note || null,
      status_updated_at: now,
      status_updated_by: admin.id,
      updated_at: now,
    };

    if (status === "waitlisted") {
      statusPatch.waitlisted_at = now;
      statusPatch.waitlisted_by = admin.id;
    }
    if (status === "denied") {
      statusPatch.denied_at = now;
      statusPatch.denied_by = admin.id;
    }
    if (status === "suspended") {
      statusPatch.suspended_at = now;
      statusPatch.suspended_by = admin.id;
    }
    if (status === "deleted") {
      statusPatch.deleted_at = now;
      statusPatch.deleted_by = admin.id;
      statusPatch.is_deleted = true;
    }

    await db
      .from("profiles")
      .update(statusPatch as any)
      .eq("id", userId);
  }

  await recordProfileStatusEvent({
    db,
    profileId: entityId,
    previousStatus: null,
    newStatus: status,
    note,
    changedBy: admin.id,
  });

  await logAuditEvent({
    actor: admin,
    action: status === "suspended" ? "user_suspended" : "user_status_changed",
    detail: `Set ${entityId} to ${status}`,
    entityType: "profile",
    entityId,
  });
  revalidatePath("/portal/admin/user-approvals");
  revalidatePath("/portal/admin/waitlist");
  revalidatePath("/portal/admin/users");
  revalidatePath("/portal/admin/clients");
  redirect(`${backTo}?success=status`);
}

export async function waitlistUser(formData: FormData) {
  formData.set("status", "waitlisted");
  await setUserStatus(formData);
}

export async function denyUser(formData: FormData) {
  formData.set("status", "denied");
  await setUserStatus(formData);
}

export async function approveWaitlistedUser(formData: FormData) {
  await approveUser(formData);
}

export async function denyWaitlistedUser(formData: FormData) {
  formData.set("status", "denied");
  formData.set("back_to", safeRedirectPath(str(formData, "back_to"), "/portal/admin/waitlist"));
  await setUserStatus(formData);
}

export async function sendWaitlistContactEmail(formData: FormData) {
  const admin = await actor(["admin"], "users.edit");
  const db = await createServiceClient();
  const userId = str(formData, "user_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/waitlist");

  const { data: profile } = await db
    .from("profiles")
    .select("id, email, full_name, status, business_purpose")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.email || profile.status !== "waitlisted") redirect(`${backTo}?error=user`);

  const waitlistCopies = await getEmailTemplateCopies([WAITLIST_CONTACT_TEMPLATE_KEY]);
  const waitlistOverride = waitlistCopies.get(WAITLIST_CONTACT_TEMPLATE_KEY);
  const template = waitlistContactRequestTemplate(
    { fullName: profile.full_name, email: profile.email },
    waitlistOverride?.overridden ? waitlistOverride : null
  );
  const provider = getEmailProvider();
  const result = await provider.sendEmail({
    from: defaultSender("operations"),
    to: [profile.email],
    replyTo: replyToAddress(),
    subject: template.subject,
    text: template.text,
    html: template.html,
  });

  const now = new Date().toISOString();

  if (!result.ok || result.status !== "sent") {
    await recordProfileStatusEvent({
      db,
      profileId: profile.id,
      previousStatus: profile.status,
      newStatus: profile.status,
      businessPurpose: profile.business_purpose,
      note: `waitlist_contact_request email failed: ${"error" in result ? result.error : result.status}`,
      changedBy: admin.id,
    });
    redirect(`${backTo}?error=email`);
  }

  await db
    .from("profiles")
    .update({
      last_waitlist_email_sent_at: now,
      status_updated_at: now,
      status_updated_by: admin.id,
      updated_at: now,
    } as any)
    .eq("id", profile.id);

  try {
    const threadPublicId = `waitlist-${profile.id}-${Date.now()}`;
    const messagePublicId = `${threadPublicId}-message`;
    const { data: thread } = await (db as any)
      .from("communication_threads")
      .insert({
        public_id: threadPublicId,
        subject: template.subject,
        status: "waiting_on_client",
        priority: "normal",
        channel: "email",
        created_by_user_id: admin.id,
        related_client_id: profile.id,
        last_message_at: now,
      })
      .select("id")
      .maybeSingle();

    if (thread?.id) {
      await (db as any).from("communication_messages").insert({
        thread_id: thread.id,
        public_id: messagePublicId,
        message_type: "email",
        direction: "outbound",
        visibility: "admin_only",
        status: "sent",
        provider: result.provider,
        provider_message_id: result.providerMessageId,
        from_email: "operations@amgaviationgroup.com",
        to_emails: [profile.email],
        reply_to_email: replyToAddress(),
        subject: template.subject,
        body_html: template.html,
        body_text: template.text,
        sent_by_user_id: admin.id,
        created_by_user_id: admin.id,
        sent_at: now,
        email_category: template.templateName,
      });
    }
  } catch {
    // Email delivery succeeded; communications logging should not block the admin workflow.
  }

  await recordProfileStatusEvent({
    db,
    profileId: profile.id,
    previousStatus: profile.status,
    newStatus: profile.status,
    businessPurpose: profile.business_purpose,
    note: `${template.templateName} email sent to ${profile.email}`,
    changedBy: admin.id,
  });

  await logAuditEvent({
    actor: admin,
    action: "waitlist_contact_email_sent",
    detail: `Sent waitlist contact request to ${profile.email}`,
    entityType: "profile",
    entityId: profile.id,
  });

  revalidatePath("/portal/admin/waitlist");
  redirect(`${backTo}?success=email`);
}

export async function setUserRole(formData: FormData) {
  const admin = await actor(["admin"], "users.edit");
  const db = await createServiceClient();
  const userId = str(formData, "user_id");
  const role = str(formData, "role");

  if (!isPortalRole(role)) redirect("/portal/admin/user-approvals?error=role");
  await preventAdminSelfOrLastAdminAction(db, admin.id, userId, "/portal/admin/user-approvals");

  if (role === "super_admin") {
    const { data: targetProfile } = await db.from("profiles").select("email").eq("id", userId).maybeSingle();
    if (!targetProfile?.email || !canAssignSuperAdmin(admin.role, targetProfile.email)) {
      redirect("/portal/admin/user-approvals?error=role");
    }
  }

  await db
    .from("profiles")
    .update({ role, assigned_role: role, status_updated_at: new Date().toISOString(), status_updated_by: admin.id } as any)
    .eq("id", userId);

  await logAuditEvent({
    actor: admin,
    action: "role_changed",
    detail: `Set ${userId} role to ${role}`,
    entityType: "profile",
    entityId: userId,
  });
  await recordComplianceEvidence({
    actor: admin,
    audience: "admin",
    eventType: "role_changed",
    eventArea: "security",
    relatedRecordType: "profile",
    relatedRecordId: userId,
    policyVersion: COMPLIANCE_POLICY_VERSION,
    metadata: { newRole: role },
  });

  revalidatePath("/portal/admin/user-approvals");
  revalidatePath("/portal/admin/users");
  redirect("/portal/admin/user-approvals?success=role");
}

export async function deactivatePortalUser(formData: FormData) {
  const admin = await actor(["admin"], "users.edit");
  const db = await createServiceClient();
  const backTo = "/portal/admin/users";
  const userId = str(formData, "user_id");

  if (!userId) redirect(`${backTo}?error=user`);

  const target = await preventAdminSelfOrLastAdminAction(
    db,
    admin.id,
    userId,
    backTo
  );

  const now = new Date().toISOString();

  const { error } = await db
    .from("profiles")
    .update({
      status: "suspended",
      is_active: false,
      suspended_at: now,
      suspended_by: admin.id,
      status_updated_at: now,
      status_updated_by: admin.id,
      last_login_at: null,
      updated_at: now,
    } as any)
    .eq("id", userId);

  if (error) redirect(`${backTo}?error=deactivate`);

  await recordProfileStatusEvent({
    db,
    profileId: userId,
    previousStatus: target.status,
    newStatus: "suspended",
    changedBy: admin.id,
  });

  await logAuditEvent({
    actor: admin,
    action: "user_suspended",
    detail: `Suspended portal access for ${target.email}`,
    entityType: "profile",
    entityId: userId,
  });

  revalidatePath("/portal/admin/users");
  revalidatePath("/portal/admin/user-approvals");
  redirect(`${backTo}?success=deactivated`);
}

export async function deletePortalUser(formData: FormData) {
  const admin = await actor(["admin"], "users.delete");
  const db = await createServiceClient();
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/users");
  const userId = str(formData, "user_id") || str(formData, "profile_id");

  if (!userId) redirect(`${backTo}?error=user`);

  const target = await preventAdminSelfOrLastAdminAction(
    db,
    admin.id,
    userId,
    backTo
  );

  const dependencies = await summarizeProfileDependencies(db, userId, target.role);

  const release = await releaseProfileIdentity(db, {
    profileId: userId,
    actorId: admin.id,
    targetEmail: target.email,
  });

  if (!release.ok) {
    if (release.stage === "auth-release") {
      redirect(`${backTo}?error=auth-release`);
    }

    await logAuditEvent({
      actor: admin,
      action: "user_delete_failed_email_released",
      detail: `Attempted to delete ${target.email}; email was released but profile deletion failed`,
      entityType: "profile",
      entityId: userId,
    });

    redirect(`${backTo}?error=delete`);
  }

  await recordProfileStatusEvent({
    db,
    profileId: userId,
    previousStatus: target.status,
    newStatus: "deleted",
    changedBy: admin.id,
  });

  await logAuditEvent({
    actor: admin,
    action: "user_soft_deleted_email_released",
    detail: `Soft deleted ${target.email} and released email for future access requests. ${dependencyAuditDetail(dependencies)}`,
    entityType: "profile",
    entityId: userId,
  });

  revalidatePath("/portal/admin/users");
  revalidatePath("/portal/admin/user-approvals");
  redirect(`${backTo}?success=deleted`);
}

// Default landing path per people-tab entity, used when a bulk action can't
// trust the submitted back_to.
const BULK_ACCOUNT_BACK_TO: Record<string, string> = {
  user: "/portal/admin/users",
  client: "/portal/admin/clients",
  crew: "/portal/admin/crew",
  partner: "/portal/admin/partners",
  waitlist: "/portal/admin/waitlist",
  approval: "/portal/admin/user-approvals",
};

/**
 * Bulk soft-delete profile-backed people (users/clients/crew/partners/waitlist/
 * approvals). Each row is guarded (self/last-admin/super_admin) and released via
 * the shared identity-release path so the deleted person can register again.
 * Guard failures skip that row instead of aborting the batch.
 */
export async function bulkDeletePortalAccounts(formData: FormData) {
  const admin = await actor(["admin"], "users.delete");
  const db = await createServiceClient();
  const entity = str(formData, "entity");
  const fallback = BULK_ACCOUNT_BACK_TO[entity] ?? "/portal/admin/users";
  const backTo = safeRedirectPath(str(formData, "back_to"), fallback);

  const ids = Array.from(
    new Set(formData.getAll("ids").map((value) => String(value).trim()).filter(Boolean))
  );

  if (!ids.length) redirect(`${backTo}?error=none-selected`);
  // Serverless-friendly ceiling: each row costs several sequential DB calls.
  if (ids.length > 200) redirect(`${backTo}?error=too-many-selected`);

  const { count: approvedAdminCount } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("status", "approved")
    .eq("is_active", true);
  let remainingApprovedAdmins = approvedAdminCount ?? 0;

  let released = 0;
  const skipped: Record<DeletionSkip | "error", number> = {
    self: 0,
    "not-found": 0,
    "super-admin": 0,
    "last-admin": 0,
    error: 0,
  };

  for (const id of ids) {
    const assessment = await assessProfileDeletion(db, {
      actorId: admin.id,
      actorRole: admin.role,
      targetId: id,
      remainingApprovedAdmins,
    });

    if (!assessment.ok) {
      skipped[assessment.reason] += 1;
      continue;
    }

    const target = assessment.target;
    const dependencies = await summarizeProfileDependencies(db, id, target.role);
    const result = await releaseProfileIdentity(db, {
      profileId: id,
      actorId: admin.id,
      targetEmail: target.email,
    });

    if (!result.ok) {
      skipped.error += 1;
      continue;
    }

    if (target.role === "admin" && target.status === "approved") {
      remainingApprovedAdmins = Math.max(0, remainingApprovedAdmins - 1);
    }

    await recordProfileStatusEvent({
      db,
      profileId: id,
      previousStatus: target.status,
      newStatus: "deleted",
      changedBy: admin.id,
    });

    await logAuditEvent({
      actor: admin,
      action: "user_soft_deleted_email_released",
      detail: `Bulk soft deleted ${target.email} and released email for future access requests. ${dependencyAuditDetail(dependencies)}`,
      entityType: "profile",
      entityId: id,
    });

    released += 1;
  }

  const skippedTotal = Object.values(skipped).reduce((sum, value) => sum + value, 0);

  revalidatePath("/portal/admin/users");
  revalidatePath("/portal/admin/user-approvals");
  revalidatePath("/portal/admin/clients");
  revalidatePath("/portal/admin/crew");
  revalidatePath("/portal/admin/partners");
  revalidatePath("/portal/admin/waitlist");

  const params = new URLSearchParams();
  params.set("bulk", "deleted");
  params.set("released", String(released));
  if (skippedTotal) params.set("skipped", String(skippedTotal));
  redirect(`${backTo}?${params.toString()}`);
}

/**
 * Bulk delete crew-network applications. Removes the application row (cascading
 * its files/status events) and, when the applicant was already provisioned into
 * a crew account, releases that account's identity too.
 */
export async function bulkDeleteNetworkApplications(formData: FormData) {
  const admin = await actor(["admin"], "network_applications.delete");
  const db = await createServiceClient();
  const backTo = safeRedirectPath(
    str(formData, "back_to"),
    "/portal/admin/network-applications"
  );

  const ids = Array.from(
    new Set(formData.getAll("ids").map((value) => String(value).trim()).filter(Boolean))
  );

  if (!ids.length) redirect(`${backTo}?error=none-selected`);
  // Serverless-friendly ceiling: each row costs several sequential DB calls.
  if (ids.length > 200) redirect(`${backTo}?error=too-many-selected`);

  let deleted = 0;
  let releasedAccounts = 0;

  for (const id of ids) {
    const { data: application } = await db
      .from("network_applications")
      .select("id, email, crew_user_id")
      .eq("id", id)
      .maybeSingle();

    if (!application) continue;

    if (application.crew_user_id) {
      const { data: profile } = await db
        .from("profiles")
        .select("id, email")
        .eq("id", application.crew_user_id)
        .maybeSingle();

      if (profile?.email && !isReleasedEmail(profile.email)) {
        const result = await releaseProfileIdentity(db, {
          profileId: profile.id,
          actorId: admin.id,
          targetEmail: profile.email,
        });
        if (result.ok) releasedAccounts += 1;
      }
    }

    const { error } = await db.from("network_applications").delete().eq("id", id);
    if (error) continue;

    await logAuditEvent({
      actor: admin,
      action: "network_application_deleted",
      detail: `Deleted network application ${application.email}${
        application.crew_user_id ? " and released the linked crew account" : ""
      }`,
      entityType: "network_application",
      entityId: id,
    });

    deleted += 1;
  }

  revalidatePath("/portal/admin/network-applications");
  revalidatePath("/portal/admin/crew");

  const params = new URLSearchParams();
  params.set("bulk", "deleted");
  params.set("deleted", String(deleted));
  if (releasedAccounts) params.set("released", String(releasedAccounts));
  redirect(`${backTo}?${params.toString()}`);
}

export async function createPortalUser(formData: FormData) {
  const admin = await actor(["admin"], "users.add");
  const db = await createServiceClient();
  const email = normalizeEmail(formData, "email");
  const fullName = str(formData, "full_name");
  const role = str(formData, "role");
  const status = str(formData, "status") || "pending_approval";
  const phone = normalizePhone(str(formData, "phone"));
  const invitationChannel = str(formData, "invitation_channel") || "email";
  const backTo = "/portal/admin/users";

  if (!email || !fullName || !isPortalRole(role)) redirect(`${backTo}?error=missing`);
  if (role === "super_admin" && !canAssignSuperAdmin(admin.role, email)) redirect(`${backTo}?error=missing`);
  if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) redirect(`${backTo}?error=phone`);

  const { data: duplicate } = await db
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .neq("status", "deleted")
    .neq("is_deleted", true)
    .maybeSingle();

  if (duplicate) redirect(`${backTo}?error=duplicate`);

  const { data: createdProfile, error: profileError } = await db.from("profiles").insert({
    id: crypto.randomUUID(),
    email,
    full_name: fullName,
    role,
    status,
    is_active: status === "approved",
    company_name: str(formData, "company_name") || null,
    phone,
    home_base: str(formData, "home_base").toUpperCase() || null,
    invitation_status: "sent",
    invitation_channel: invitationChannel,
    invitation_sent_at: new Date().toISOString(),
    invited_by: admin.id,
    permissions: role === "admin" ? PORTAL_PERMISSIONS : selectedPermissions(formData),
  }).select("id, email, full_name, role, status, company_name, phone, home_base, permissions").single();

  if (profileError || !createdProfile) redirect(`${backTo}?error=profile`);

  const provisioned = await ensurePortalAuthUserForProfile({
    db,
    profile: createdProfile,
    invitedBy: admin.id,
    sendSetupEmail: true,
  });

  if (!provisioned.ok) redirect(`${backTo}?error=invite`);

  await logAuditEvent({
    actor: admin,
    action: "user_setup_email_sent",
    detail: `Created ${email} as ${role} via ${invitationChannel}`,
    entityType: "profile",
    entityId: provisioned.profileId,
  });

  revalidatePath("/portal/admin/users");
  revalidatePath("/portal/admin/user-approvals");
  redirect(`${backTo}?success=invited`);
}

export async function resendPortalInvitation(formData: FormData) {
  const admin = await actor(["admin"], "users.edit");
  const db = await createServiceClient();
  const userId = str(formData, "user_id");
  const backTo = "/portal/admin/users";

  const { data: profile } = await db
    .from("profiles")
    .select("id, email, full_name, role, status, company_name, phone, home_base, permissions")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.email) redirect(`${backTo}?error=missing`);
  if (isReleasedEmail(profile.email)) redirect(`${backTo}?error=released`);

  const provisioned = await ensurePortalAuthUserForProfile({
    db,
    profile,
    invitedBy: admin.id,
    sendSetupEmail: true,
  });

  if (!provisioned.ok) redirect(`${backTo}?error=invite`);

  await logAuditEvent({
    actor: admin,
    action: "portal_setup_email_resent",
    detail: `Resent portal setup email to ${profile.email}`,
    entityType: "profile",
    entityId: provisioned.profileId,
  });

  revalidatePath("/portal/admin/users");
  redirect(`${backTo}?success=resent`);
}

export async function sendPortalPasswordReset(formData: FormData) {
  const admin = await actor(["admin"], "users.edit");
  const db = await createServiceClient();
  const userId = str(formData, "user_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/users");

  const { data: profile } = await db
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.email || isReleasedEmail(profile.email)) redirect(`${backTo}?error=user`);

  const setupLink = await generatePortalPasswordSetupLink(profile.email);
  if (!setupLink) redirect(`${backTo}?error=reset`);

  const result = await sendPortalPasswordResetEmail({
    email: profile.email,
    name: profile.full_name ?? profile.email,
    setupLink,
  });

  if (result.status !== "sent") redirect(`${backTo}?error=reset`);

  await logAuditEvent({
    actor: admin,
    action: "password_reset_sent_by_admin",
    detail: `Sent password reset email to ${profile.email}`,
    entityType: "profile",
    entityId: profile.id,
  });

  revalidatePath("/portal/admin/users");
  redirect(`${backTo}?success=reset`);
}

export async function changePortalUserPassword(formData: FormData) {
  const admin = await actor(["admin"], "users.edit");
  const db = await createServiceClient();
  const userId = str(formData, "user_id");
  const password = str(formData, "password");
  const confirm = str(formData, "confirm_password");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/users");

  if (!password || password.length < 12) redirect(`${backTo}?error=weakpassword`);
  if (password !== confirm) redirect(`${backTo}?error=mismatch`);

  const { data: profile } = await db
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.email || isReleasedEmail(profile.email)) redirect(`${backTo}?error=user`);
  if (profile.role === "super_admin" && admin.role !== "super_admin") redirect(`${backTo}?error=role`);

  const { error } = await db.auth.admin.updateUserById(userId, { password });
  if (error) redirect(`${backTo}?error=password`);

  await logAuditEvent({
    actor: admin,
    action: "password_changed_by_admin",
    detail: `Changed portal password for ${profile.email}`,
    entityType: "profile",
    entityId: profile.id,
  });

  revalidatePath("/portal/admin/users");
  redirect(`${backTo}?success=password`);
}

export async function updatePortalUser(formData: FormData) {
  const admin = await actor(["admin"], "users.edit");
  const db = await createServiceClient();
  const userId = str(formData, "profile_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/users");
  const email = normalizeEmail(formData, "email");
  const fullName = str(formData, "full_name");
  const role = str(formData, "role");
  const status = str(formData, "status");
  const phone = normalizePhone(str(formData, "phone"));

  if (!userId || !email || !fullName || !isPortalRole(role)) redirect(`${backTo}?error=missing`);
  if (!PROFILE_STATUS.some((item) => item.value === status)) redirect(`${backTo}?error=status`);
  if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) redirect(`${backTo}?error=phone`);
  await ensureUniqueProfileEmail(db, email, userId, backTo);

  if (status !== "approved" || role !== "admin") {
    await preventAdminSelfOrLastAdminAction(db, admin.id, userId, backTo);
  }

  const { data: existing } = await db
    .from("profiles")
    .select("id, email, full_name, role, status, company_name, phone, home_base, permissions")
    .eq("id", userId)
    .maybeSingle();

  if (!existing) redirect(`${backTo}?error=user`);

  if (existing.email !== email) {
    const authEmailSync = await updateAuthEmailIfPresent(db, userId, email);
    if (!authEmailSync.ok) redirect(`${backTo}?error=email`);
  }

  const patch = {
    email,
    full_name: fullName,
    role,
    status,
    is_active: status === "approved",
    company_name: str(formData, "company_name") || null,
    phone,
    home_base: str(formData, "home_base").toUpperCase() || null,
    permissions: role === "admin" ? PORTAL_PERMISSIONS : selectedPermissions(formData),
    updated_at: new Date().toISOString(),
  };

  const { error } = await db.from("profiles").update(patch).eq("id", userId);
  if (error) redirect(`${backTo}?error=save`);

  let entityId = userId;

  if (status === "approved") {
    const provisioned = await ensurePortalAuthUserForProfile({
      db,
      profile: { ...existing, ...patch },
      invitedBy: admin.id,
      sendSetupEmail: existing.status !== "approved",
    });
    if (!provisioned.ok) redirect(`${backTo}?error=invite`);
    entityId = provisioned.profileId;
  }

  await logAuditEvent({
    actor: admin,
    action: "user_profile_updated",
    detail: `Updated portal user ${email}`,
    entityType: "profile",
    entityId,
  });

  revalidatePath("/portal/admin/users");
  revalidatePath("/portal/admin/user-approvals");
  redirect(`${backTo}?success=status`);
}

// ─── Crew & partner assignment ──────────────────────────────────────
export async function assignCrew(formData: FormData) {
  const admin = await actor(["admin"], "missions.edit");
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  const crewIds = allStrings(formData, "crew_id[]").filter(Boolean);
  const roles = allStrings(formData, "crew_role[]");
  const notes = allStrings(formData, "duty_notes[]");

  if (!missionId) redirect(`/portal/admin/trips/${missionId}?error=missing`);

  const assignments = crewIds.map((crewId, index) => ({
    mission_id: missionId,
    crew_id: crewId,
    crew_role: roles[index] || "pic",
    status: "offered",
    duty_notes: notes[index] || null,
  }));

  if (!assignments.length) redirect(`/portal/admin/trips/${missionId}?error=missing`);

  // Never downgrade crew who already accepted (or completed) this mission —
  // the upsert would reset them to "offered". Only offer to the rest.
  const { data: existingAssignments } = await db
    .from("mission_crew_assignments")
    .select("crew_id, status")
    .eq("mission_id", missionId)
    .in("crew_id", crewIds);

  const lockedCrewIds = new Set(
    (existingAssignments ?? [])
      .filter((row) => row.status === "accepted" || row.status === "completed")
      .map((row) => row.crew_id)
  );
  const offers = assignments.filter((assignment) => !lockedCrewIds.has(assignment.crew_id));

  if (!offers.length) redirect(`/portal/admin/trips/${missionId}?error=no-new-offers`);

  // Insurance/credential gate at OFFER time — offering a non-assignment-ready
  // pilot has no emergency case (the audited override exists at the status
  // transition, not here). Blocks the whole batch so the admin sees exactly
  // who is blocking and why.
  const complianceIssues = await listCrewComplianceIssues(db, offers.map((offer) => offer.crew_id));
  if (complianceIssues.length) {
    redirect(
      `/portal/admin/trips/${missionId}?error=crew-compliance&who=${encodeURIComponent(
        formatCrewComplianceBlockers(complianceIssues).join("; ").slice(0, 300)
      )}`
    );
  }

  await db
    .from("mission_crew_assignments")
    .upsert(offers, { onConflict: "mission_id,crew_id" });

  const { data: mission } = await db
    .from("missions")
    .select("ref")
    .eq("id", missionId)
    .maybeSingle();

  await logAuditEvent({
    actor: admin,
    action: "crew_assigned",
    detail: `Offered ${offers.length} crew assignment(s) on ${mission?.ref ?? missionId}`,
    entityType: "mission",
    entityId: missionId,
  });

  for (const assignment of offers) {
    await notifyUser({
      userId: assignment.crew_id,
      title: "New mission offer",
      body: `You have been offered ${mission?.ref ?? "a mission"}.`,
      type: "crew_offer",
      entityType: "mission",
      entityId: missionId,
    });
  }

  await notifyMissionContactByEmail({
    missionId,
    title: "Crew assignment is in progress",
    eventLabel: "Crew Assignment",
    intro:
      "AMG Operations has started the crew assignment process for your request. Crew members have been offered the mission and AMG will continue coordinating availability and operational readiness.",
    details: [
      { label: "Crew Offers Sent", value: offers.length },
      { label: "Crew Roles", value: offers.map((item) => item.crew_role.toUpperCase()).join(", ") },
    ],
  });

  revalidatePath(`/portal/admin/trips/${missionId}`);
  redirect(`/portal/admin/trips/${missionId}?success=crew`);
}

/**
 * Remove a crew member from a mission. Marks the assignment "removed" and,
 * when they were the mission's confirmed pilot, clears assigned_crew_id and
 * reverts the mission from crew_assigned back to approved so ops can re-crew.
 */
export async function unassignCrew(formData: FormData) {
  const admin = await actor(["admin"], "missions.edit");
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  const crewId = str(formData, "crew_id");
  const reason = str(formData, "reason");

  if (!missionId || !crewId) redirect(`/portal/admin/trips/${missionId}?error=missing`);

  const { data: removed } = await db
    .from("mission_crew_assignments")
    .update({ status: "removed" })
    .eq("mission_id", missionId)
    .eq("crew_id", crewId)
    .in("status", ["offered", "accepted"])
    .select("id")
    .maybeSingle();

  if (!removed) redirect(`/portal/admin/trips/${missionId}?error=unassign`);

  const { data: mission } = await db
    .from("missions")
    .select("ref, assigned_crew_id")
    .eq("id", missionId)
    .maybeSingle();

  if (mission?.assigned_crew_id === crewId) {
    // Status predicate on the write so a concurrent admin status change is
    // never clobbered.
    await db
      .from("missions")
      .update({ assigned_crew_id: null, status: "approved" })
      .eq("id", missionId)
      .eq("assigned_crew_id", crewId)
      .eq("status", "crew_assigned");
  }

  await logAuditEvent({
    actor: admin,
    action: "crew_unassigned",
    detail: `Removed crew ${crewId} from ${mission?.ref ?? missionId}${reason ? ` — ${reason}` : ""}`,
    entityType: "mission",
    entityId: missionId,
  });

  await notifyUser({
    userId: crewId,
    title: `You were removed from ${mission?.ref ?? "a mission"}`,
    body: `You were removed from ${mission?.ref ?? "the mission"}.${reason ? ` Reason: ${reason}` : ""}`,
    type: "crew_unassigned",
    entityType: "mission",
    entityId: missionId,
  });

  revalidatePath(`/portal/admin/trips/${missionId}`);
  redirect(`/portal/admin/trips/${missionId}?success=crew-unassigned`);
}

export async function assignPartner(formData: FormData) {
  const admin = await actor(["admin"], "missions.edit");
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  const partnerId = str(formData, "partner_id");
  const serviceType = str(formData, "service_type");

  if (!missionId || !partnerId || !serviceType) {
    redirect(`/portal/admin/trips/${missionId}?error=missing`);
  }

  await db.from("mission_partner_assignments").insert({
    mission_id: missionId,
    partner_id: partnerId,
    service_type: serviceType,
    location: str(formData, "location") || null,
    description: str(formData, "description") || null,
    admin_notes: str(formData, "admin_notes") || null,
    status: "assigned",
  });

  const { data: mission } = await db
    .from("missions")
    .select("ref")
    .eq("id", missionId)
    .maybeSingle();

  await logAuditEvent({
    actor: admin,
    action: "partner_assigned",
    detail: `Assigned partner for ${serviceType} on ${mission?.ref ?? missionId}`,
    entityType: "mission",
    entityId: missionId,
  });

  await notifyUser({
    userId: partnerId,
    title: "New service request",
    body: `${serviceType} requested${mission?.ref ? ` for ${mission.ref}` : ""}.`,
    type: "partner_assigned",
    entityType: "mission",
    entityId: missionId,
  });

  await notifyMissionContactByEmail({
    missionId,
    title: "Partner support has been assigned",
    eventLabel: "Partner Assignment",
    intro:
      "AMG Operations has assigned a partner resource to support your request. AMG will continue coordinating the scope, timing, and any required follow-up.",
    details: [
      { label: "Service Type", value: serviceType },
      { label: "Location", value: str(formData, "location") || null },
    ],
  });

  revalidatePath(`/portal/admin/trips/${missionId}`);
  redirect(`/portal/admin/trips/${missionId}?success=partner`);
}

// ─── Aircraft management ────────────────────────────────────────────
export async function saveAircraft(formData: FormData) {
  const admin = await actor(["admin"], "aircraft.edit");
  const db = await createServiceClient();
  const id = str(formData, "aircraft_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/aircraft");
  const tailNumber = str(formData, "tail_number").toUpperCase().replace(/\s+/g, "");
  const clientId = str(formData, "client_id") || null;

  if (!tailNumber) redirect(`${backTo}?error=missing`);

  if (clientId) {
    const { data: client } = await db
      .from("profiles")
      .select("id, role")
      .eq("id", clientId)
      .maybeSingle();

    if (!client || client.role !== "client") redirect(`${backTo}?error=client`);
  }

  const { data: matches } = await db
    .from("aircraft")
    .select("id")
    .ilike("tail_number", tailNumber)
    .limit(2);

  const existing = (matches ?? []).find((row) => row.id !== id);
  if (existing && existing.id !== id) redirect(`${backTo}?error=duplicate`);

  const payload: Database["public"]["Tables"]["aircraft"]["Insert"] = {
    client_id: clientId,
    tail_number: tailNumber,
    make: str(formData, "make") || null,
    model: str(formData, "model") || null,
    serial_number: str(formData, "serial_number") || null,
    year: num(formData, "year"),
    home_base: str(formData, "home_base").toUpperCase() || null,
    aircraft_category: str(formData, "aircraft_category") || null,
    passenger_capacity: num(formData, "passenger_capacity"),
    required_crew: num(formData, "required_crew") ?? 2,
    maintenance_status: str(formData, "maintenance_status") || "in_service",
    status: str(formData, "status") || "active",
    notes: str(formData, "notes") || null,
  };

  let savedId = id;

  if (id) {
    const { data, error } = await db.from("aircraft").update(payload).eq("id", id).select("id").maybeSingle();
    if (error || !data) redirect(`${backTo}?error=${error ? "save" : "stale"}`);
    savedId = data.id;
  } else {
    const { data, error } = await db.from("aircraft").insert(payload).select("id").single();
    if (error || !data) redirect(`${backTo}?error=save`);
    savedId = data.id;
  }

  await logAuditEvent({
    actor: admin,
    action: id ? "aircraft_updated" : "aircraft_created",
    detail: `${id ? "Updated" : "Created"} ${payload.tail_number}`,
    entityType: "aircraft",
    entityId: savedId || null,
  });

  revalidatePath("/portal/admin/aircraft");
  revalidatePath("/portal/client/aircraft");
  revalidatePath("/portal/client/trips/new");

  if (clientId) {
    await notifyUser({
      userId: clientId,
      title: id ? "Aircraft updated" : "Aircraft added",
      body: `${tailNumber} is now linked to your AMG portal account.`,
      type: "aircraft",
      entityType: "aircraft",
      entityId: savedId || null,
    });
  }

  redirect(`${backTo}?success=aircraft`);
}

export async function archiveAircraft(formData: FormData) {
  const admin = await actor(["admin"], "aircraft.edit");
  const db = await createServiceClient();
  const id = str(formData, "aircraft_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/aircraft");

  if (!id) redirect(`${backTo}?error=missing`);
  const dependencies = await summarizeAircraftDependencies(db, id);

  const { data, error } = await db
    .from("aircraft")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, tail_number")
    .maybeSingle();

  if (error || !data) redirect(`${backTo}?error=${error ? "save" : "stale"}`);

  await logAuditEvent({
    actor: admin,
    action: "aircraft_archived",
    detail: `Archived ${data.tail_number}. ${dependencyAuditDetail(dependencies)}`,
    entityType: "aircraft",
    entityId: id,
  });

  revalidatePath("/portal/admin/aircraft");
  revalidatePath(`/portal/admin/aircraft/${id}`);
  revalidatePath("/portal/client/aircraft");
  revalidatePath("/portal/client/trips/new");
  redirect(`${backTo}?success=${dependencies.some((item) => item.count > 0) ? "archived-linked" : "archived"}`);
}

// ─── Client record management ──────────────────────────────────────
export async function saveClientRecord(formData: FormData) {
  const admin = await actor(["admin"], "clients.edit");
  const db = (await createServiceClient()) as any;
  const id = str(formData, "profile_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/clients");
  const email = normalizeEmail(formData, "email");
  const fullName = str(formData, "full_name");
  const status = controlledProfileStatus(str(formData, "status"));

  if (!email || !validEmail(email) || !fullName) redirect(`${backTo}?error=missing`);
  await ensureUniqueProfileEmail(db, email, id || null, backTo);

  const payload = {
    email,
    full_name: fullName,
    phone: str(formData, "phone") || null,
    company_name: str(formData, "company_name") || null,
    home_base: str(formData, "home_base").toUpperCase() || null,
    preferred_airport: str(formData, "preferred_airport").toUpperCase() || null,
    client_type: str(formData, "client_type") || null,
    billing_preference: str(formData, "billing_preference") || null,
    billing_contact_name: str(formData, "billing_contact_name") || null,
    billing_contact_email: str(formData, "billing_contact_email") || null,
    billing_contact_phone: str(formData, "billing_contact_phone") || null,
    authorized_requesters: splitList(str(formData, "authorized_requesters")),
    service_preferences: str(formData, "service_preferences") || null,
    internal_notes: str(formData, "internal_notes") || null,
    role: "client",
    status,
    is_active: status === "approved",
    updated_at: new Date().toISOString(),
  };

  if (payload.billing_contact_email && !validEmail(payload.billing_contact_email)) {
    redirect(`${backTo}?error=email`);
  }

  let profileId = id;

  if (id) {
    const { data: existing } = await db
      .from("profiles")
      .select("email, role")
      .eq("id", id)
      .maybeSingle();

    if (!existing || existing.role !== "client") redirect(`${backTo}?error=profile`);

    if (existing.email !== email) {
      const authEmailSync = await updateAuthEmailIfPresent(db, id, email);
      if (!authEmailSync.ok) redirect(`${backTo}?error=email`);
    }

    const { data: updatedProfile, error } = await db.from("profiles").update(payload).eq("id", id).select("id").maybeSingle();
    if (error || !updatedProfile) redirect(`${backTo}?error=${error ? "save" : "stale"}`);
  } else {
    const { data: createdProfile, error } = await db.from("profiles").insert({
      ...payload,
      id: crypto.randomUUID(),
      invitation_status: status === "approved" ? "portal_setup_pending" : "profile_created",
      invitation_channel: status === "approved" ? "email" : null,
      invitation_sent_at: null,
      invited_by: admin.id,
    }).select("id, email, full_name, role, status, company_name, phone, home_base, permissions").single();

    if (error || !createdProfile) redirect(`${backTo}?error=save`);
    profileId = createdProfile.id;

    if (status === "approved") {
      const provisioned = await ensurePortalAuthUserForProfile({
        db,
        profile: createdProfile,
        invitedBy: admin.id,
        sendSetupEmail: true,
      });
      if (!provisioned.ok) redirect(`${backTo}?error=invite`);
      profileId = provisioned.profileId;
    }
  }

  await logAuditEvent({
    actor: admin,
    action: id ? "client_record_updated" : "client_record_created",
    detail: `${id ? "Updated" : "Created"} client ${email}`,
    entityType: "profile",
    entityId: profileId || null,
  });

  revalidatePath("/portal/admin/clients");
  revalidatePath("/portal/admin/users");
  redirect(`${backTo}?success=client`);
}

export async function archiveClientRecord(formData: FormData) {
  const admin = await actor(["admin"], "clients.edit");
  const db = await createServiceClient();
  const id = str(formData, "profile_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/clients");

  if (!id) redirect(`${backTo}?error=profile`);
  const dependencies = await summarizeClientDependencies(db, id);

  const { data, error } = await db
    .from("profiles")
    .update({ status: "suspended", is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("role", "client")
    .select("id, email")
    .maybeSingle();

  if (error || !data) redirect(`${backTo}?error=${error ? "save" : "stale"}`);

  await logAuditEvent({
    actor: admin,
    action: "client_record_archived",
    detail: `Archived client ${data.email}. ${dependencyAuditDetail(dependencies)}`,
    entityType: "profile",
    entityId: id,
  });

  revalidatePath("/portal/admin/clients");
  revalidatePath(`/portal/admin/clients/${id}`);
  revalidatePath("/portal/admin/users");
  redirect(`${backTo}?success=${dependencies.some((item) => item.count > 0) ? "archived-linked" : "archived"}`);
}

// ─── Crew record management ────────────────────────────────────────
export async function saveCrewRecord(formData: FormData) {
  const admin = await actor(["admin"], "crew.edit");
  const db = (await createServiceClient()) as any;
  const id = str(formData, "profile_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/crew");
  const email = normalizeEmail(formData, "email");
  const fullName = str(formData, "full_name");
  const status = controlledProfileStatus(str(formData, "status"));
  const availabilityStatus = ["available", "limited", "unavailable"].includes(str(formData, "availability_status"))
    ? str(formData, "availability_status")
    : "available";

  if (!email || !validEmail(email) || !fullName) redirect(`${backTo}?error=missing`);
  await ensureUniqueProfileEmail(db, email, id || null, backTo);

  const profilePayload = {
    email,
    full_name: fullName,
    phone: str(formData, "phone") || null,
    company_name: str(formData, "company_name") || null,
    home_base: str(formData, "home_base").toUpperCase() || null,
    role: "crew",
    status,
    is_active: status === "approved",
    updated_at: new Date().toISOString(),
  };

  let profileId = id;

  if (id) {
    const { data: existing } = await db
      .from("profiles")
      .select("email, role")
      .eq("id", id)
      .maybeSingle();

    if (!existing || existing.role !== "crew") redirect(`${backTo}?error=profile`);

    if (existing.email !== email) {
      const authEmailSync = await updateAuthEmailIfPresent(db, id, email);
      if (!authEmailSync.ok) redirect(`${backTo}?error=email`);
    }

    const { data: updatedProfile, error } = await db.from("profiles").update(profilePayload).eq("id", id).select("id").maybeSingle();
    if (error || !updatedProfile) redirect(`${backTo}?error=${error ? "save" : "stale"}`);
  } else {
    const { data: createdProfile, error } = await db.from("profiles").insert({
      ...profilePayload,
      id: crypto.randomUUID(),
      invitation_status: status === "approved" ? "portal_setup_pending" : "profile_created",
      invitation_channel: status === "approved" ? "email" : null,
      invitation_sent_at: null,
      invited_by: admin.id,
    }).select("id, email, full_name, role, status, company_name, phone, home_base, permissions").single();

    if (error || !createdProfile) redirect(`${backTo}?error=save`);
    profileId = createdProfile.id;

    if (status === "approved") {
      const provisioned = await ensurePortalAuthUserForProfile({
        db,
        profile: createdProfile,
        invitedBy: admin.id,
        sendSetupEmail: true,
      });
      if (!provisioned.ok) redirect(`${backTo}?error=invite`);
      profileId = provisioned.profileId;
    }
  }

  if (!profileId) redirect(`${backTo}?error=save`);

  const { error: crewError } = await db.from("crew_profiles").upsert({
    id: profileId,
    first_name: str(formData, "first_name") || fullName.split(/\s+/)[0] || null,
    last_name: str(formData, "last_name") || fullName.split(/\s+/).slice(1).join(" ") || null,
    display_name: fullName,
    source_email: email,
    address: str(formData, "address") || null,
    city: str(formData, "city") || null,
    state: str(formData, "state").toUpperCase() || null,
    zip: str(formData, "zip") || null,
    country: str(formData, "country") || null,
    company: str(formData, "company_name") || null,
    certificates_ratings: str(formData, "certificates_ratings") || str(formData, "certificate_level") || null,
    aircraft_type_experience: str(formData, "aircraft_type_experience") || str(formData, "preferred_aircraft") || null,
    certificate_level: str(formData, "certificate_level") || null,
    availability_status: availabilityStatus,
    preferred_aircraft: splitList(str(formData, "preferred_aircraft")),
    type_ratings: splitList(str(formData, "type_ratings")),
    preferred_regions: splitList(str(formData, "preferred_regions")),
    total_time: num(formData, "total_time"),
    pic_time: num(formData, "pic_time"),
    multi_time: num(formData, "me_time"),
    me_time: num(formData, "me_time"),
    turbine_time: num(formData, "turbine_time"),
    instrument_time: num(formData, "instrument_time"),
    dual_given_time: num(formData, "dual_given_time"),
    jet_time: num(formData, "jet_time"),
    time_in_type: str(formData, "time_in_type") || null,
    medical: str(formData, "medical") || null,
    passport_mentioned: boolValue(formData, "passport_mentioned"),
    resume_notes: str(formData, "resume_notes") || null,
    needs_manual_review: boolValue(formData, "needs_manual_review"),
    reviewed: boolValue(formData, "reviewed"),
    approved: boolValue(formData, "approved"),
    priority_candidate: boolValue(formData, "priority_candidate"),
    last_contacted: dateValue(formData, "last_contacted"),
    notes: str(formData, "notes") || null,
    insurance_approved: boolValue(formData, "insurance_approved"),
    profile_status: str(formData, "profile_status") || (boolValue(formData, "approved") ? "approved" : "under_review"),
    crew_status: str(formData, "crew_status") || "candidate",
    location_display: [str(formData, "city"), str(formData, "state"), str(formData, "country")].filter(Boolean).join(", ") || null,
    searchable_text: [
      fullName,
      email,
      str(formData, "phone"),
      str(formData, "city"),
      str(formData, "state"),
      str(formData, "certificates_ratings"),
      str(formData, "aircraft_type_experience"),
      str(formData, "medical"),
      str(formData, "resume_notes"),
      str(formData, "notes"),
    ].filter(Boolean).join(" "),
    ops_notes: str(formData, "ops_notes") || null,
    updated_at: new Date().toISOString(),
  });

  if (crewError) redirect(`${backTo}?error=crew-profile`);

  await logAuditEvent({
    actor: admin,
    action: id ? "crew_record_updated" : "crew_record_created",
    detail: `${id ? "Updated" : "Created"} crew ${email}`,
    entityType: "profile",
    entityId: profileId,
  });

  revalidatePath("/portal/admin/crew");
  revalidatePath("/portal/admin/users");
  redirect(`${backTo}?success=crew`);
}

export async function archiveCrewRecord(formData: FormData) {
  const admin = await actor(["admin"], "crew.edit");
  const db = await createServiceClient();
  const id = str(formData, "profile_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/crew");

  if (!id) redirect(`${backTo}?error=profile`);
  const dependencies = await summarizeCrewDependencies(db, id);

  const { data, error } = await db
    .from("profiles")
    .update({ status: "suspended", is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("role", "crew")
    .select("id, email")
    .maybeSingle();

  if (error || !data) redirect(`${backTo}?error=${error ? "save" : "stale"}`);

  await logAuditEvent({
    actor: admin,
    action: "crew_record_archived",
    detail: `Archived crew ${data.email}. ${dependencyAuditDetail(dependencies)}`,
    entityType: "profile",
    entityId: id,
  });

  revalidatePath("/portal/admin/crew");
  revalidatePath(`/portal/admin/crew/${id}`);
  revalidatePath("/portal/admin/users");
  redirect(`${backTo}?success=${dependencies.some((item) => item.count > 0) ? "archived-linked" : "archived"}`);
}

// ─── Partner record management ─────────────────────────────────────
export async function savePartnerRecord(formData: FormData) {
  const admin = await actor(["admin"], "partners.edit");
  const db = (await createServiceClient()) as any;
  const id = str(formData, "profile_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/partners");
  const email = normalizeEmail(formData, "email");
  const fullName = str(formData, "full_name");
  const status = controlledProfileStatus(str(formData, "status"));

  if (!email || !validEmail(email) || !fullName) redirect(`${backTo}?error=missing`);
  await ensureUniqueProfileEmail(db, email, id || null, backTo);

  const profilePayload = {
    email,
    full_name: fullName,
    phone: str(formData, "phone") || null,
    company_name: str(formData, "company_name") || null,
    role: "partner",
    status,
    is_active: status === "approved",
    updated_at: new Date().toISOString(),
  };

  let profileId = id;

  if (id) {
    const { data: existing } = await db
      .from("profiles")
      .select("email, role")
      .eq("id", id)
      .maybeSingle();

    if (!existing || existing.role !== "partner") redirect(`${backTo}?error=profile`);

    if (existing.email !== email) {
      const authEmailSync = await updateAuthEmailIfPresent(db, id, email);
      if (!authEmailSync.ok) redirect(`${backTo}?error=email`);
    }

    const { data: updatedProfile, error } = await db.from("profiles").update(profilePayload).eq("id", id).select("id").maybeSingle();
    if (error || !updatedProfile) redirect(`${backTo}?error=${error ? "save" : "stale"}`);
  } else {
    const { data: createdProfile, error } = await db.from("profiles").insert({
      ...profilePayload,
      id: crypto.randomUUID(),
      invitation_status: status === "approved" ? "portal_setup_pending" : "profile_created",
      invitation_channel: status === "approved" ? "email" : null,
      invitation_sent_at: null,
      invited_by: admin.id,
    }).select("id, email, full_name, role, status, company_name, phone, home_base, permissions").single();

    if (error || !createdProfile) redirect(`${backTo}?error=save`);
    profileId = createdProfile.id;

    if (status === "approved") {
      const provisioned = await ensurePortalAuthUserForProfile({
        db,
        profile: createdProfile,
        invitedBy: admin.id,
        sendSetupEmail: true,
      });
      if (!provisioned.ok) redirect(`${backTo}?error=invite`);
      profileId = provisioned.profileId;
    }
  }

  if (!profileId) redirect(`${backTo}?error=save`);

  const { error: partnerError } = await db.from("partner_profiles").upsert({
    id: profileId,
    company_name: str(formData, "partner_company_name") || str(formData, "company_name") || null,
    primary_contact: str(formData, "primary_contact") || fullName,
    contact_email: str(formData, "contact_email") || email,
    phone: str(formData, "partner_phone") || str(formData, "phone") || null,
    partner_type: str(formData, "partner_type") || null,
    service_type: str(formData, "service_type") || null,
    service_area: str(formData, "service_area") || null,
    service_categories: splitList(str(formData, "service_categories")),
    airports_served: splitList(str(formData, "airports_served")),
    hours_of_operation: str(formData, "hours_of_operation") || null,
    after_hours_support: boolValue(formData, "after_hours_support"),
    notes: str(formData, "notes") || null,
  });

  if (partnerError) redirect(`${backTo}?error=partner-profile`);

  await logAuditEvent({
    actor: admin,
    action: id ? "partner_record_updated" : "partner_record_created",
    detail: `${id ? "Updated" : "Created"} partner ${email}`,
    entityType: "profile",
    entityId: profileId,
  });

  revalidatePath("/portal/admin/partners");
  revalidatePath("/portal/admin/users");
  redirect(`${backTo}?success=partner`);
}

export async function archivePartnerRecord(formData: FormData) {
  const admin = await actor(["admin"], "partners.edit");
  const db = await createServiceClient();
  const id = str(formData, "profile_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/partners");

  if (!id) redirect(`${backTo}?error=profile`);
  const dependencies = await summarizePartnerDependencies(db, id);

  const { data, error } = await db
    .from("profiles")
    .update({ status: "suspended", is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("role", "partner")
    .select("id, email")
    .maybeSingle();

  if (error || !data) redirect(`${backTo}?error=${error ? "save" : "stale"}`);

  await logAuditEvent({
    actor: admin,
    action: "partner_record_archived",
    detail: `Archived partner ${data.email}. ${dependencyAuditDetail(dependencies)}`,
    entityType: "profile",
    entityId: id,
  });

  revalidatePath("/portal/admin/partners");
  revalidatePath(`/portal/admin/partners/${id}`);
  revalidatePath("/portal/admin/users");
  redirect(`${backTo}?success=${dependencies.some((item) => item.count > 0) ? "archived-linked" : "archived"}`);
}

// ─── Document review ────────────────────────────────────────────────
export async function reviewDocument(formData: FormData) {
  const admin = await actor(["admin"], "documents.edit");
  const db = (await createServiceClient()) as any;
  const docId = str(formData, "document_id");
  const decision = str(formData, "decision");

  await db
    .from("documents")
    .update({
      status: decision === "approved" ? "approved" : "rejected",
      review_notes: str(formData, "review_notes") || null,
      rejection_reason: decision === "rejected" ? str(formData, "review_notes") || null : null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", docId);

  // A credential whose expiration date has already passed can be reviewed,
  // but must not come out "approved" — record it as expired instead so it
  // reads as needing renewal.
  const { data: credential } = await db
    .from("crew_credentials")
    .select("id, crew_id, credential_type, expiration_date")
    .eq("document_id", docId)
    .maybeSingle();

  const credentialExpired =
    decision === "approved" &&
    Boolean(credential?.expiration_date) &&
    credential.expiration_date < new Date().toISOString().slice(0, 10);

  await db
    .from("crew_credentials")
    .update({
      status: decision === "approved" ? (credentialExpired ? "expired" : "approved") : "rejected",
      reviewed_by: admin.id,
    })
    .eq("document_id", docId);

  await logAuditEvent({
    actor: admin,
    action: decision === "approved" ? "document_approved" : "document_rejected",
    detail: `${decision} document ${docId}${credentialExpired ? " (credential expired — renewal required)" : ""}`,
    entityType: "document",
    entityId: docId,
  });

  if (credentialExpired && credential?.crew_id) {
    await notifyUser({
      userId: credential.crew_id,
      title: "Credential reviewed — renewal required",
      body: `Your ${credential.credential_type ?? "credential"} document was reviewed, but the credential expired on ${credential.expiration_date} and needs to be renewed before it can be approved.`,
      type: "credential_review",
      entityType: "credential",
      entityId: credential.id,
    });
  }

  revalidatePath("/portal/admin/documents");
  redirect("/portal/admin/documents?success=reviewed");
}

// ─── Expense review ─────────────────────────────────────────────────
export async function reviewExpense(formData: FormData) {
  const admin = await actor(["admin"], "expenses.edit");
  const db = await createServiceClient();
  const expenseId = str(formData, "expense_id");
  const status = str(formData, "status");

  const { data: expense } = await db
    .from("expenses")
    .update({
      status,
      approved_amount: num(formData, "approved_amount"),
      billable_to_client: formData.get("billable_to_client") === "true",
      reimbursable: formData.get("reimbursable") !== "false",
      review_notes: str(formData, "review_notes") || null,
      reviewed_by: admin.id,
    })
    .eq("id", expenseId)
    .select("crew_id, amount, category")
    .maybeSingle();

  await logAuditEvent({
    actor: admin,
    action: `expense_${status}`,
    detail: `${status} expense ${expenseId}`,
    entityType: "expense",
    entityId: expenseId,
  });

  if (expense?.crew_id) {
    await notifyUser({
      userId: expense.crew_id,
      title: `Expense ${status}`,
      body: `Your ${expense.category} expense was ${status}.`,
      type: "expense_review",
    });
  }

  revalidatePath("/portal/admin/expenses");
  redirect("/portal/admin/expenses?success=reviewed");
}
