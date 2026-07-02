"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { emailChangeRedirectUrl, passwordSetupRedirectUrl } from "@/lib/auth/urls";
import { normalizeEmailVerificationToken } from "@/lib/auth/email-verification";
import { requireUser } from "@/lib/portal/session";
import { ROLE_HOME, isBusinessPurpose, isPortalRole, type BusinessPurpose, type PortalRole } from "@/lib/portal/constants";
import { isApprovedPortalIntroStatus } from "@/lib/portal/intro";
import { clearPortalIntroPending, markPortalIntroPending } from "@/lib/portal/intro-server";
import { logAuditEvent, notifyAdmins } from "@/lib/portal/audit";
import { getSiteUrl } from "@/lib/site-url";
import { safeRedirectPath } from "./_helpers";

const PASSWORD_SETUP_COOKIE = "amg_password_setup_user";
const PUBLIC_ACCESS_REQUEST_MESSAGES = {
  approved: "An AMG portal account already exists for this email. Please sign in or contact AMG Operations.",
  pending: "AMG already has a pending portal access request for this email.",
  waitlisted: "This portal access request is currently under AMG review. Please contact AMG Operations for more information.",
  suspended: "Portal access for this email is currently suspended. Please contact AMG Operations for more information.",
};

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function temporaryAccessRequestPassword() {
  return `AMG-${randomUUID()}!`;
}

function normalizeBusinessPurpose(value: string): BusinessPurpose {
  const normalized = value.toLowerCase().trim();
  return isBusinessPurpose(normalized) ? normalized : "other";
}

function isMissingProfileInvitationColumnError(error: { message?: string | null; code?: string | null } | null) {
  const message = error?.message ?? "";
  return error?.code === "PGRST204" || /invitation_|schema cache|column .* does not exist/i.test(message);
}

function accessRequestProfilePayload({
  id,
  email,
  fullName,
  businessPurpose,
  company,
  phone,
  includeInvitationMetadata,
}: {
  id?: string;
  email: string;
  fullName: string;
  businessPurpose: BusinessPurpose;
  company: string;
  phone: string;
  includeInvitationMetadata: boolean;
}) {
  return {
    ...(id ? { id } : {}),
    email,
    full_name: fullName,
    role: "client",
    company_name: company || null,
    phone: phone || null,
    status: "pending_approval",
    is_active: false,
    business_purpose: businessPurpose,
    requested_role: null,
    assigned_role: null,
    status_updated_at: new Date().toISOString(),
    ...(includeInvitationMetadata
      ? {
          invitation_status: "access_request_received",
          invitation_channel: "portal_request",
          invitation_sent_at: null,
          last_login_at: null,
        }
      : {}),
  };
}

function isReleasedEmail(email: string) {
  return email.includes("+released-") || email.includes("__released__");
}

function releasedEmailPattern(originalEmail: string) {
  const [local, ...domainParts] = originalEmail.toLowerCase().split("@");
  const domain = domainParts.join("@");

  if (!local || !domain) return null;

  return `${local}+released-%@${domain}`;
}

function isReusableReleasedProfile(profile: {
  email: string;
  status: string | null;
  is_active: boolean | null;
  is_deleted?: boolean | null;
  invitation_status?: string | null;
}) {
  return (
    profile.status === "deleted" ||
    profile.is_deleted === true ||
    isReleasedEmail(profile.email) ||
    profile.invitation_status === "deactivated_email_released" ||
    profile.invitation_status === "deleted_email_released"
  );
}

async function requestAccessUsingExistingAuthUser({
  userId,
  email,
  fullName,
  businessPurpose,
  company,
  phone,
}: {
  userId: string;
  email: string;
  fullName: string;
  businessPurpose: BusinessPurpose;
  company: string;
  phone: string;
}) {
  const svc = await createServiceClient();

  const { error: profileError } = await svc
    .from("profiles")
    .update(accessRequestProfilePayload({
      email,
      fullName,
      businessPurpose,
      company,
      phone,
      includeInvitationMetadata: true,
    }) as any)
    .eq("id", userId);

  if (profileError) {
    if (!isMissingProfileInvitationColumnError(profileError)) {
      redirect("/login?mode=request&error=signup");
    }

    const { error: fallbackProfileError } = await svc
      .from("profiles")
      .update(accessRequestProfilePayload({
        email,
        fullName,
        businessPurpose,
        company,
        phone,
        includeInvitationMetadata: false,
      }) as any)
      .eq("id", userId);

    if (fallbackProfileError) {
      redirect("/login?mode=request&error=signup");
    }
  }

  await notifyAdmins({
    title: "New portal access request",
    body: `${fullName} (${email}) submitted a portal access request for ${businessPurpose}.`,
    type: "access_request",
    entityType: "profile",
    entityId: userId,
  });

  await logAuditEvent({
    actor: { id: userId, email, role: "client" },
    action: "access_requested_after_release",
    detail: `${fullName} submitted a portal access request after account release`,
    entityType: "profile",
    entityId: userId,
  });

  redirect("/login?success=requested");
}

async function findReleasedProfileForEmail(email: string) {
  const svc = await createServiceClient();
  const pattern = releasedEmailPattern(email);

  if (!pattern) return null;

  const { data } = await svc
    .from("profiles")
    .select("id, email, status, is_active, is_deleted, invitation_status")
    .ilike("email", pattern)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function signIn(formData: FormData) {
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");

  await clearPortalIntroPending();

  if (!email || !password) redirect("/login?error=missing");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) redirect("/login?error=invalid");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    redirect("/login?error=invalid");
  }

  if (profile.status === "pending" || profile.status === "pending_approval" || profile.status === "waitlisted" || profile.status === "denied") {
    await supabase.auth.signOut();
    redirect("/pending-approval");
  }

  if (profile.status === "suspended" || profile.status === "deleted") {
    await supabase.auth.signOut();
    redirect("/access-denied");
  }

  const role: PortalRole = isPortalRole(profile.role) ? profile.role : "client";

  try {
    const svc = await createServiceClient();
    await svc
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", data.user.id);
  } catch {
    // non-fatal
  }

  await logAuditEvent({
    actor: { id: data.user.id, email, role },
    action: "user_login",
    detail: "Signed in to portal",
  });

  if (isApprovedPortalIntroStatus(profile.status)) {
    await markPortalIntroPending();
  }

  redirect(ROLE_HOME[role]);
}

export async function signUp(formData: FormData) {
  const email = field(formData, "email").toLowerCase();
  const fullName = field(formData, "full_name");
  const businessPurpose = normalizeBusinessPurpose(field(formData, "business_purpose"));
  const company = field(formData, "company_name");
  const phone = field(formData, "phone");

  if (!email || !fullName || !businessPurpose) {
    redirect("/login?mode=request&error=missing");
  }

  const svc = await createServiceClient();

  const { data: existingProfile } = await svc
    .from("profiles")
    .select("id, email, status, is_active, is_deleted, invitation_status")
    .ilike("email", email)
    .neq("status", "deleted")
    .neq("is_deleted", true)
    .maybeSingle();

  if (existingProfile) {
    if (existingProfile.status === "deleted" || existingProfile.is_deleted === true) {
      await requestAccessUsingExistingAuthUser({
        userId: existingProfile.id,
        email,
        fullName,
        businessPurpose,
        company,
        phone,
      });
    }

    if (isReusableReleasedProfile(existingProfile)) {
      await requestAccessUsingExistingAuthUser({
        userId: existingProfile.id,
        email,
        fullName,
        businessPurpose,
        company,
        phone,
      });
    }

    if (existingProfile.status === "suspended") {
      redirect("/login?mode=request&error=suspended");
    }

    if (existingProfile.status === "pending_approval" || existingProfile.status === "pending") {
      redirect("/login?mode=request&error=pending_request");
    }

    if (existingProfile.status === "waitlisted") {
      redirect("/login?mode=request&error=waitlisted");
    }

    if (existingProfile.status === "denied") {
      await requestAccessUsingExistingAuthUser({
        userId: existingProfile.id,
        email,
        fullName,
        businessPurpose,
        company,
        phone,
      });
    }

    redirect(`/login?mode=request&error=account_exists&email=${encodeURIComponent(email)}`);
  }

  const releasedProfile = await findReleasedProfileForEmail(email);

  if (releasedProfile && isReusableReleasedProfile(releasedProfile)) {
    await requestAccessUsingExistingAuthUser({
      userId: releasedProfile.id,
      email,
      fullName,
      businessPurpose,
      company,
      phone,
    });
  }

  const supabase = await createClient();
  const temporaryPassword = temporaryAccessRequestPassword();

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password: temporaryPassword,
    options: {
      data: {
        full_name: fullName,
        business_purpose: businessPurpose,
      },
      emailRedirectTo: `${getSiteUrl()}/verify-email?email=${encodeURIComponent(email)}`,
    },
  });

  if (signUpError || !data.user) {
    redirect("/login?mode=request&error=signup");
  }

  const profileId = data.user.id;

  const { error } = await svc.from("profiles").upsert(accessRequestProfilePayload({
    id: profileId,
    email,
    fullName,
    businessPurpose,
    company,
    phone,
    includeInvitationMetadata: true,
  }) as any, { onConflict: "id" });

  if (error) {
    if (!isMissingProfileInvitationColumnError(error)) {
      redirect("/login?mode=request&error=signup");
    }

    const { error: fallbackError } = await svc.from("profiles").upsert(accessRequestProfilePayload({
      id: profileId,
      email,
      fullName,
      businessPurpose,
      company,
      phone,
      includeInvitationMetadata: false,
    }) as any, { onConflict: "id" });

    if (fallbackError) {
      redirect("/login?mode=request&error=signup");
    }
  }

  await notifyAdmins({
    title: "New portal access request",
    body: `${fullName} (${email}) submitted a portal access request for ${businessPurpose}.`,
    type: "access_request",
    entityType: "profile",
    entityId: profileId,
  });

  await logAuditEvent({
    actor: { id: profileId, email, role: "client" },
    action: "access_requested",
    detail: `${fullName} submitted a portal access request for ${businessPurpose}`,
    entityType: "profile",
    entityId: profileId,
  });

  await supabase.auth.signOut();
  redirect(`/verify-email?email=${encodeURIComponent(email)}&success=requested`);
}

export async function verifyPortalEmail(formData: FormData) {
  const email = field(formData, "email").toLowerCase();
  const token = normalizeEmailVerificationToken(field(formData, "token"));
  const emailParam = encodeURIComponent(email);

  if (!email || !token) {
    redirect(`/verify-email?email=${emailParam}&error=missing`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    const message = error.message ?? "";
    const reason = /expired/i.test(message) ? "expired" : "invalid";
    redirect(`/verify-email?email=${emailParam}&error=${reason}`);
  }

  if (!data.user) {
    redirect(`/verify-email?email=${emailParam}&error=failed`);
  }

  const metadataRole = data.user.user_metadata?.role;
  const role: PortalRole = isPortalRole(metadataRole) ? metadataRole : "client";

  await logAuditEvent({
    actor: { id: data.user.id, email, role },
    action: "user_email_verified",
    detail: "Verified AMG Connect email address",
    entityType: "profile",
    entityId: data.user.id,
  });

  await supabase.auth.signOut();
  redirect("/pending-approval?verified=1");
}

export async function resendPortalVerificationCode(formData: FormData) {
  const email = field(formData, "email").toLowerCase();
  const emailParam = encodeURIComponent(email);

  if (!email) {
    redirect("/verify-email?error=missing");
  }

  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${getSiteUrl()}/verify-email?email=${emailParam}`,
    },
  });

  redirect(`/verify-email?email=${emailParam}&success=resent`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearPortalIntroPending();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = field(formData, "email").toLowerCase();

  if (!email) redirect("/forgot-password?error=missing");

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: passwordSetupRedirectUrl(),
  });

  if (error) redirect("/forgot-password?error=failed");

  redirect("/forgot-password?success=sent");
}

export async function updatePassword(formData: FormData) {
  const password = field(formData, "password");
  const confirm = field(formData, "confirm_password");

  if (!password || password.length < 8) redirect("/reset-password?error=weakpassword");
  if (password !== confirm) redirect("/reset-password?error=mismatch");

  const cookieStore = await cookies();
  const expectedUserId = cookieStore.get(PASSWORD_SETUP_COOKIE)?.value;

  if (!expectedUserId) redirect("/forgot-password?error=failed");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== expectedUserId) {
    cookieStore.delete(PASSWORD_SETUP_COOKIE);
    await supabase.auth.signOut();
    redirect("/forgot-password?error=failed");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) redirect("/reset-password?error=failed");

  cookieStore.delete(PASSWORD_SETUP_COOKIE);
  await supabase.auth.signOut();

  redirect("/login?success=password-reset");
}

export async function updatePortalEmail(formData: FormData) {
  const user = await requireUser();
  const nextEmail = field(formData, "email").toLowerCase();
  const backTo = safeRedirectPath(field(formData, "back_to"), ROLE_HOME[user.role]);

  if (!nextEmail) redirect(`${backTo}?accountError=missing-email`);
  if (nextEmail === user.email.toLowerCase()) redirect(`${backTo}?accountError=same-email`);

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    email: nextEmail,
  }, {
    emailRedirectTo: emailChangeRedirectUrl(),
  });

  if (error) redirect(`${backTo}?accountError=email-failed`);

  await logAuditEvent({
    actor: { id: user.id, email: user.email, role: user.role },
    action: "user_email_change_requested",
    detail: `Requested email change to ${nextEmail}`,
    entityType: "profile",
    entityId: user.id,
  });

  redirect(`${backTo}?accountSuccess=email`);
}

export async function updatePortalPassword(formData: FormData) {
  const user = await requireUser();
  const password = field(formData, "password");
  const confirm = field(formData, "confirm_password");
  const backTo = safeRedirectPath(field(formData, "back_to"), ROLE_HOME[user.role]);

  if (!password || password.length < 8) redirect(`${backTo}?accountError=weakpassword`);
  if (password !== confirm) redirect(`${backTo}?accountError=mismatch`);

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) redirect(`${backTo}?accountError=password-failed`);

  await logAuditEvent({
    actor: { id: user.id, email: user.email, role: user.role },
    action: "user_password_changed",
    detail: "Updated portal password from settings",
    entityType: "profile",
    entityId: user.id,
  });

  redirect(`${backTo}?accountSuccess=password`);
}
