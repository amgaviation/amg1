import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  PORTAL_INTRO_PENDING_COOKIE,
  PORTAL_INTRO_PENDING_COOKIE_MAX_AGE_SECONDS,
  isApprovedPortalIntroStatus,
} from "@/lib/portal/intro";
import {
  canUsePrivateApiDuringMaintenance,
  canUsePortalDuringMaintenance,
  isMaintenanceMode,
} from "@/lib/portal/maintenance";

function isPrivateApiPath(pathname: string) {
  return (
    pathname === "/api/portal" ||
    pathname.startsWith("/api/portal/") ||
    pathname === "/api/communications" ||
    pathname.startsWith("/api/communications/")
  );
}

function privateApiResponse(response: NextResponse, status: 401 | 503) {
  const denied = NextResponse.json(
    { error: status === 503 ? "Portal maintenance in progress" : "Unauthorized" },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        ...(status === 503 ? { "Retry-After": "300" } : {}),
      },
    },
  );
  response.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie));
  return denied;
}

function redirectWithCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const maintenanceMode = isMaintenanceMode(process.env.AMG_CONNECT_MAINTENANCE_MODE);
  const privateApi = isPrivateApiPath(request.nextUrl.pathname);
  let supabaseResponse = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (privateApi) return privateApiResponse(supabaseResponse, 503);

    if (request.nextUrl.pathname.startsWith("/portal")) {
      if (maintenanceMode) return redirectWithCookies(request, supabaseResponse, "/maintenance");

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
    let maintenanceProfile: {
      role: string | null;
      status: string | null;
      is_active: boolean | null;
      is_deleted: boolean | null;
    } | null = null;

    if (maintenanceMode) {
      const { data } = await supabase
        .from("profiles")
        .select("role, status, is_active, is_deleted")
        .eq("id", userId)
        .maybeSingle();
      maintenanceProfile = data;

      const maintenanceAccessAllowed = privateApi
        ? canUsePrivateApiDuringMaintenance(maintenanceProfile)
        : canUsePortalDuringMaintenance(maintenanceProfile, request.nextUrl.pathname);

      if (!maintenanceAccessAllowed) {
        await supabase.auth.signOut();
        if (privateApi) return privateApiResponse(supabaseResponse, 503);
        return redirectWithCookies(request, supabaseResponse, "/maintenance");
      }
    }

    if (request.nextUrl.searchParams.get("intro") === "1") {
      const profile = maintenanceProfile ?? (
        await supabase
          .from("profiles")
          .select("status")
          .eq("id", userId)
          .maybeSingle()
      ).data;

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

  if (privateApi) {
    return privateApiResponse(supabaseResponse, maintenanceMode ? 503 : 401);
  }

  if (request.nextUrl.pathname.startsWith("/portal")) {
    return redirectWithCookies(
      request,
      supabaseResponse,
      maintenanceMode ? "/maintenance" : "/login",
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/portal/:path*", "/api/portal/:path*", "/api/communications/:path*"],
};
