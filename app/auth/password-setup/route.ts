import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const PASSWORD_SETUP_COOKIE = "amg_password_setup_user";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error") || url.searchParams.get("error_code");
  const supabase = await createClient();

  // A password setup link must never reuse an existing admin/client browser
  // session. Clear any active portal session before exchanging the recovery
  // code so the form updates the account tied to the emailed link.
  await supabase.auth.signOut();

  if (error || !code) {
    return NextResponse.redirect(new URL("/auth/error", url.origin));
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(new URL("/auth/error", url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/error", url.origin));
  }

  // Defense-in-depth mirror of requestPasswordReset: a recovery link must not
  // become a password-setup session for a denied, suspended, deleted, or
  // deactivated account.
  const svc = await createServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("status, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const ineligible =
    profile &&
    (profile.status === "denied" ||
      profile.status === "suspended" ||
      profile.status === "deleted" ||
      profile.is_active === false);

  if (ineligible) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/auth/error", url.origin));
  }

  const response = NextResponse.redirect(new URL("/reset-password?mode=setup", url.origin));
  response.cookies.set(PASSWORD_SETUP_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });

  return response;
}
