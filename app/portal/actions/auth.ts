"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/portal/session";
import { ROLE_HOME, isPortalRole, type PortalRole } from "@/lib/portal/constants";
import { logAuditEvent, notifyAdmins } from "@/lib/portal/audit";

const PASSWORD_SETUP_COOKIE = "amg_password_setup_user";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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

  if (!email || !password || !fullName || !isPortalRole(roleValue) || roleValue === "admin") {
    redirect("/login?mode=request&error=missing");
  }
  if (password.length < 8) {
    redirect("/login?mode=request&error=weakpassword");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: roleValue } },
  });

  if (error || !data.user) {
    redirect("/login?mode=request&error=signup");
  }

  try {
    const svc = await createServiceClient();
    await svc
      .from("profiles")
      .update({
        full_name: fullName,
        role: roleValue,
        company_name: company || null,
        phone: phone || null,
        status: "pending",
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "";
  const origin = appUrl
    ? appUrl.startsWith("http")
      ? appUrl
      : `https://${appUrl}`
    : "";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin.replace(/\/+$/, "")}/auth/password-setup` : undefined,
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
  const backTo = field(formData, "back_to") || ROLE_HOME[user.role];

  if (!nextEmail) redirect(`${backTo}?accountError=missing-email`);
  if (nextEmail === user.email.toLowerCase()) redirect(`${backTo}?accountError=same-email`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "";
  const origin = appUrl
    ? appUrl.startsWith("http")
      ? appUrl
      : `https://${appUrl}`
    : "";

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    email: nextEmail,
  });

  if (error) redirect(`${backTo}?accountError=email-failed`);

  await logAuditEvent({
    actor: { id: user.id, email: user.email, role: user.role },
    action: "user_email_change_requested",
    detail: `Requested email change to ${nextEmail}${origin ? ` via ${origin}` : ""}`,
    entityType: "profile",
    entityId: user.id,
  });

  redirect(`${backTo}?accountSuccess=email`);
}

export async function updatePortalPassword(formData: FormData) {
  const user = await requireUser();
  const password = field(formData, "password");
  const confirm = field(formData, "confirm_password");
  const backTo = field(formData, "back_to") || ROLE_HOME[user.role];

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
