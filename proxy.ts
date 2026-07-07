import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  PORTAL_INTRO_PENDING_COOKIE,
  PORTAL_INTRO_PENDING_COOKIE_MAX_AGE_SECONDS,
  isApprovedPortalIntroStatus,
} from "@/lib/portal/intro";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (request.nextUrl.pathname.startsWith("/portal")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "missing-supabase-env");
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims verifies the session JWT locally against the project's
  // asymmetric signing key (JWKS cached per instance) instead of calling the
  // Auth server, and still performs the token refresh when the access token
  // has expired. This removes a blocking network round trip from EVERY portal
  // navigation and prefetch. Authorization (suspended/pending status) is
  // enforced by the page guards against the profiles table, so a revoked but
  // unexpired token cannot reach anything the DB status doesn't allow.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? null;

  if (userId) {
    if (request.nextUrl.searchParams.get("intro") === "1") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", userId)
        .maybeSingle();

      if (isApprovedPortalIntroStatus(profile?.status)) {
        const url = request.nextUrl.clone();
        url.searchParams.delete("intro");
        const redirectResponse = NextResponse.redirect(url);

        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie);
        });
        redirectResponse.cookies.set(PORTAL_INTRO_PENDING_COOKIE, "1", {
          path: "/portal",
          maxAge: PORTAL_INTRO_PENDING_COOKIE_MAX_AGE_SECONDS,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

        return redirectResponse;
      }
    }

    return supabaseResponse;
  }

  if (request.nextUrl.pathname.startsWith("/portal")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/portal/:path*"],
};
