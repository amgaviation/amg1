import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const PASSWORD_SETUP_COOKIE = "amg_password_setup_user";

const ALLOWED_TYPES = new Set<EmailOtpType>([
  "email",
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
]);

function safeInternalPath(value: string | null, fallback: string) {
  if (!value) return fallback;

  try {
    const parsed = new URL(value, "https://amg.local");
    if (parsed.origin !== "https://amg.local") return fallback;
    if (!parsed.pathname.startsWith("/")) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const redirectTo = url.searchParams.get("redirect_to");

  if (!tokenHash || !type || !ALLOWED_TYPES.has(type)) {
    return NextResponse.redirect(new URL("/auth/error", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(new URL("/auth/error", url.origin));
  }

  if (type === "recovery") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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

  if (type === "invite") {
    return NextResponse.redirect(new URL("/portal-setup", url.origin));
  }

  if (type === "email" || type === "signup") {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/pending-approval?verified=1", url.origin));
  }

  if (type === "email_change") {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?success=email-updated", url.origin));
  }

  return NextResponse.redirect(new URL(safeInternalPath(redirectTo, "/portal"), url.origin));
}
