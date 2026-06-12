"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ROLE_HOME, isPortalRole, type PortalRole } from "@/lib/portal/constants";
import { logAuditEvent, notifyAdmins } from "@/lib/portal/audit";

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

  // The handle_new_user trigger creates the base profile; enrich it and
  // force pending status until an admin approves.
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

  // Do not leave them signed in — access requires approval.
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
    redirectTo: origin ? `${origin}/auth/callback?next=/reset-password` : undefined,
  });

  if (error) redirect("/forgot-password?error=failed");
  redirect("/forgot-password?success=sent");
}

export async function updatePassword(formData: FormData) {
  const password = field(formData, "password");
  const confirm = field(formData, "confirm_password");
  if (!password || password.length < 8) redirect("/reset-password?error=weakpassword");
  if (password !== confirm) redirect("/reset-password?error=mismatch");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/reset-password?error=failed");
  await supabase.auth.signOut();
  redirect("/login?success=password-reset");
}
