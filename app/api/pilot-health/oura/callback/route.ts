import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { requirePilotHealthOwnerNavigation } from "@/lib/pilot-health/guard";
import {
  OURA_SCOPES,
  OURA_STATE_COOKIE,
  exchangeOuraCode,
  getOuraConfig,
  resolveOuraRedirectUri,
} from "@/lib/pilot-health/oura";
import { saveOuraConnection } from "@/lib/pilot-health/connection";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Oura OAuth callback. Every failure path redirects back to the workspace
 * with a coarse machine-readable code — provider response bodies, tokens, and
 * authorization codes are never logged, persisted in plaintext, or surfaced.
 */

function workspaceRedirect(origin: string, code: string) {
  const response = NextResponse.redirect(
    new URL(`/portal/admin/pilot-health?oura=${code}`, origin)
  );
  // The state is one-shot: clear it on every outcome.
  response.cookies.set(OURA_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/pilot-health/oura",
    maxAge: 0,
  });
  return response;
}

function statesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const gate = await requirePilotHealthOwnerNavigation(requestUrl);
  if (gate.response) return gate.response;

  const config = getOuraConfig();
  if (!config) return workspaceRedirect(requestUrl.origin, "not_configured");

  // The user declined on Oura's consent screen, or Oura reported an error.
  const providerError = requestUrl.searchParams.get("error");
  if (providerError) {
    return workspaceRedirect(
      requestUrl.origin,
      providerError === "access_denied" ? "denied" : "provider_error"
    );
  }

  const expectedState = request.cookies.get(OURA_STATE_COOKIE)?.value ?? "";
  const receivedState = requestUrl.searchParams.get("state") ?? "";
  if (!statesMatch(expectedState, receivedState)) {
    return workspaceRedirect(requestUrl.origin, "state_mismatch");
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) return workspaceRedirect(requestUrl.origin, "missing_code");

  let tokens;
  try {
    tokens = await exchangeOuraCode(code, resolveOuraRedirectUri(config, requestUrl), config);
  } catch {
    // OuraTokenError and anything unexpected redirect identically — the
    // browser never learns more than "the exchange failed".
    return workspaceRedirect(requestUrl.origin, "exchange_failed");
  }

  try {
    const db = await createServiceClient();
    await saveOuraConnection(db, gate.user.id, tokens, config, OURA_SCOPES);
  } catch {
    return workspaceRedirect(requestUrl.origin, "save_failed");
  }

  return workspaceRedirect(requestUrl.origin, "connected");
}
