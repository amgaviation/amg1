"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { emailChangeRedirectUrl, passwordSetupRedirectUrl } from "@/lib/auth/urls";
import { requireUser } from "@/lib/portal/session";
import { ROLE_HOME, isPortalRole, type PortalRole } from "@/lib/portal/constants";
import { logAuditEvent, notifyAdmins } from "@/lib/portal/audit";
import { safeRedirectPath } from "./_helpers";

const PASSWORD_SETUP_COOKIE = "amg_password_setup_user";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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
  invitation_status: string | null;
}) {
  return (
    isReleasedEmail(profile.email) ||
    profile.invitation_status === "deactivated_email_released" ||
    profile.invitation_status === "deleted_email_released" ||
    (profile.status === "suspended" && profile.is_active === false)
  );
}

async function requestAccessUsingExistingAuthUser({
  userId,
  email,
  password,
  fullName,
  roleValue,
  company,
  phone,
}: {
  userId: string;
  email: string;
  password: string;
  fullName: string;
  roleValue: PortalRole;
  company: string;
  phone: string;
}) {
  const svc = await createServiceClient();

  const fullAuthUpdate = await svc.auth.admin.updateUserById(userId, {
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: roleValue,
    },
  });

  if (fullAuthUpdate.error) {
    const message = fullAuthUpdate.error.message ?? "";

    if (/already|registered|exists/i.test(message)) {
      const passwordOnlyUpdate = await svc.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: roleValue,
        },
      });

      if (passwordOnlyUpdate.error) {
        redirect("/login?mode=request&error=signup");
      }
    } else {
      redirect("/login?mode=request&error=signup");
    }
  }

  const { error: profileError } = await svc
    .from("profiles")
    .update({
      email,
      full_name: fullName,
      role: roleValue,
      company_name: company || null,
      phone: phone || null,
      status: "pending",
      is_active: false,
      invitation_status: "access_requested_after_release",
      invitation_channel: "portal_request",
      invitation_sent_at: null,
      last_login_at: null,
    })
    .eq("id", userId);

  if (profileError) {
    redirect("/login?mode=request&error=signup");
  }

  await notifyAdmins({
    title: "New portal access request",
    body: `${fullName} (${email}) requested ${roleValue} access after a released account record.`,
    type: "access_request",
    entityType: "profile",
    entityId: userId,
  });

  await logAuditEvent({
    actor: { id: userId, email, role: roleValue },
    action: "access_requested_after_release",
    detail: `${fullName} requested ${roleValue} access after account release`,
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
    .select("id, email, status, is_active, invitation_status")
    .ilike("email", pattern)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function signIn(formData: FormData) {
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");

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

  if (profile.status === "pending") {
    await supabase.auth.signOut();
    redirect("/pending-approval");
  }

  if (profile.status === "suspended") {
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

  redirect(ROLE_HOME[role]);
}

export async function signUp(formData: FormData) {
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");
  const fullName = field(formData, "full_name");
  const roleValue = field(formData, "role");
  const company = field(formData, "company_name");
  const phone = field(formData, "phone");

  if (!email || !password || !fullName || !isPortalRole(roleValue) || roleValue === "admin" || roleValue === "super_admin") {
    redirect("/login?mode=request&error=missing");
  }

  if (password.length < 8) {
    redirect("/login?mode=request&error=weakpassword");
  }

  const svc = await createServiceClient();

  const { data: existingProfile } = await svc
    .from("profiles")
    .select("id, email, status, is_active, invitation_status")
    .ilike("email", email)
    .maybeSingle();

  if (existingProfile) {
    if (isReusableReleasedProfile(existingProfile)) {
      await requestAccessUsingExistingAuthUser({
        userId: existingProfile.id,
        email,
        password,
        fullName,
        roleValue,
        company,
        phone,
      });
    }

    redirect(`/login?mode=request&error=account_exists&email=${encodeURIComponent(email)}`);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: roleValue,
      },
    },
  });

  if (error || !data.user) {
    if (error?.message && /already|registered|exists/i.test(error.message)) {
      const releasedProfile = await findReleasedProfileForEmail(email);

      if (releasedProfile && isReusableReleasedProfile(releasedProfile)) {
        await requestAccessUsingExistingAuthUser({
          userId: releasedProfile.id,
          email,
          password,
          fullName,
          roleValue,
          company,
          phone,
        });
      }

      redirect(`/login?mode=request&error=account_exists&email=${encodeURIComponent(email)}`);
    }

    redirect("/login?mode=request&error=signup");
  }

  try {
    await svc
      .from("profiles")
      .update({
        email,
        full_name: fullName,
        role: roleValue,
        company_name: company || null,
        phone: phone || null,
        status: "pending",
        is_active: false,
        invitation_status: "access_requested",
      })
      .eq("id", data.user.id);
  } catch {
    // non-fatal
  }

  await notifyAdmins({
    title: "New portal access request",
    body: `${fullName} (${email}) requested ${roleValue} access.`,
    type: "access_request",
    entityType: "profile",
    entityId: data.user.id,
  });

  await logAuditEvent({
    actor: { id: data.user.id, email, role: roleValue },
    action: "access_requested",
    detail: `${fullName} requested ${roleValue} access`,
    entityType: "profile",
    entityId: data.user.id,
  });

  await supabase.auth.signOut();
  redirect("/login?success=requested");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
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
