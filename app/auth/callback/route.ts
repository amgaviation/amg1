import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPortalRole } from "@/lib/portal/constants";
import { PORTAL_INTRO_PENDING_COOKIE, isApprovedPortalIntroStatus } from "@/lib/portal/intro";
import { portalIntroPendingCookieOptions } from "@/lib/portal/intro-server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/portal";
  try {
    const parsed = new URL(value, "https://amg.local");
    if (parsed.origin !== "https://amg.local") return "/portal";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/portal";
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error") || url.searchParams.get("error_code");
  const next = safeNextPath(url.searchParams.get("next"));
  let shouldPlayPortalIntro = false;

  if (error) {
    return NextResponse.redirect(new URL("/auth/error", url.origin));
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(new URL("/auth/error", url.origin));
    }

    if (next.startsWith("/portal")) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, status, last_login_at")
          .eq("id", user.id)
          .maybeSingle();

        // First sign-in only, and never for admins (see auth.ts signIn).
        const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";
        shouldPlayPortalIntro = Boolean(
          profile &&
            isPortalRole(profile.role) &&
            isApprovedPortalIntroStatus(profile.status) &&
            !profile.last_login_at &&
            !isAdmin,
        );
      }
    }
  }

  const response = NextResponse.redirect(new URL(next, url.origin));

  if (shouldPlayPortalIntro) {
    response.cookies.set(
      PORTAL_INTRO_PENDING_COOKIE,
      "1",
      portalIntroPendingCookieOptions,
    );
  }

  return response;
}
