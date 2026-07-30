import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { requirePilotHealthOwnerNavigation } from "@/lib/pilot-health/guard";
import {
  OURA_AUTHORIZE_URL,
  OURA_SCOPES,
  OURA_STATE_COOKIE,
  getOuraConfig,
  resolveOuraRedirectUri,
} from "@/lib/pilot-health/oura";

/**
 * Begin the Oura OAuth flow for the Pilot Health owner. Generates a one-shot
 * state, pins it in a short-lived HttpOnly cookie, and hands the browser to
 * Oura's authorization page. Fails closed when the integration is not
 * configured.
 */

const STATE_COOKIE_MAX_AGE_SECONDS = 600;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const gate = await requirePilotHealthOwnerNavigation(requestUrl);
  if (gate.response) return gate.response;

  const config = getOuraConfig();
  if (!config) {
    return NextResponse.redirect(
      new URL("/portal/admin/pilot-health?oura=not_configured", requestUrl.origin)
    );
  }

  const state = randomBytes(32).toString("hex");
  const authorizeUrl = new URL(OURA_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", resolveOuraRedirectUri(config, requestUrl));
  authorizeUrl.searchParams.set("scope", OURA_SCOPES.join(" "));
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  // SameSite=Lax survives the top-level GET navigation back from Oura while
  // staying invisible to scripts and cross-site subrequests.
  response.cookies.set(OURA_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/pilot-health/oura",
    maxAge: STATE_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
