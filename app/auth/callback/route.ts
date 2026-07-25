import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isPortalRole } from "@/lib/portal/constants";
import { logAuditEvent, notifyAdmins } from "@/lib/portal/audit";
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

/**
 * A first Google sign-in is an access request, so tell someone about it.
 *
 * The write is its own concurrency control: the `.is("invitation_status", null)`
 * predicate means exactly one call can flip the column, so a retried handshake
 * announces once rather than on every attempt.
 *
 * Non-fatal throughout. invitation_status is absent in some environments — see
 * isMissingProfileInvitationColumnError in actions/auth.ts — and failing to
 * announce a request is not a reason to fail the sign-in.
 */
async function announceOAuthAccessRequest(userId: string, email: string, fullName: string) {
  try {
    const svc = await createServiceClient();
    const { data: claimed } = await (svc as any)
      .from("profiles")
      .update({
        invitation_status: "access_request_received",
        invitation_channel: "google_oauth",
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .is("invitation_status", null)
      .select("id")
      .maybeSingle();

    if (!claimed) return;

    await notifyAdmins({
      title: "New portal access request",
      body: `${fullName || email} signed in with Google and is awaiting approval.`,
      type: "access_request",
      entityType: "profile",
      entityId: userId,
    });
    await logAuditEvent({
      actor: { id: userId, email, role: "client" },
      action: "access_requested",
      detail: `${fullName || email} requested portal access via Google`,
      entityType: "profile",
      entityId: userId,
    });
  } catch {
    // non-fatal
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

    // The approval gate, matching signIn in actions/auth.ts.
    //
    // This route used to hand back a session and redirect, leaving status to
    // the page guards. That was survivable while nothing linked here — recovery,
    // invite and email change each have their own route. Google OAuth makes this
    // the main entry door, and a pending or suspended user would otherwise walk
    // away holding a live session cookie: bounced from pages, but still carrying
    // credentials every app/api/** handler has to keep refusing. Refuse once, at
    // the door, and drop the session.
    //
    // UNCONDITIONAL, deliberately. Gating this on `next.startsWith("/portal")`
    // is fail-open, because `next` is caller-supplied and the session cookies
    // are already written by the time we read it: anyone refused here could
    // re-issue GET /auth/callback?code=…&next=/ from their own browser — they
    // hold both the code and the PKCE verifier — skip every check below, and
    // keep a valid `authenticated` JWT usable directly against PostgREST. The
    // destination must not decide whether the caller is allowed in.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // The exchange succeeded but the user could not be resolved. Refuse
      // rather than fall through holding whatever the exchange just wrote.
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=invalid", url.origin));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status, last_login_at")
      .eq("id", user.id)
      .maybeSingle();

    const email = user.email ?? "";
    const meta = user.user_metadata ?? {};
    const fullName =
      (typeof meta.full_name === "string" ? meta.full_name : "") ||
      (typeof meta.name === "string" ? meta.name : "");

    if (!profile) {
      // handle_new_user provisions on insert into auth.users, so a missing row
      // means that trigger did not run. Fail closed rather than admit an
      // identity no profile governs.
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=invalid", url.origin));
    }

    if (
      profile.status === "pending" ||
      profile.status === "pending_approval" ||
      profile.status === "waitlisted" ||
      profile.status === "denied"
    ) {
      await announceOAuthAccessRequest(user.id, email, fullName);
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/pending-approval", url.origin));
    }

    if (profile.status === "suspended" || profile.status === "deleted") {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/access-denied", url.origin));
    }

    if (profile.status !== "approved") {
      // Allowlist, matching requireUser: an unrecognised status is a refusal,
      // not a pass.
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/access-denied", url.origin));
    }

    // First sign-in only, and never for admins (see auth.ts signIn).
    const isAdmin = profile.role === "admin" || profile.role === "super_admin";
    shouldPlayPortalIntro = Boolean(
      isPortalRole(profile.role) &&
        isApprovedPortalIntroStatus(profile.status) &&
        !profile.last_login_at &&
        !isAdmin,
    );

    // The same bookkeeping a password sign-in performs, so an OAuth login is
    // not invisible in the audit trail.
    await Promise.all([
      (async () => {
        try {
          const svc = await createServiceClient();
          await svc
            .from("profiles")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", user.id);
        } catch {
          // non-fatal
        }
      })(),
      logAuditEvent({
        actor: {
          id: user.id,
          email,
          role: isPortalRole(profile.role) ? profile.role : "client",
        },
        action: "user_login",
        detail: "Signed in to portal via Google",
      }),
    ]);
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
