import { NextResponse } from "next/server";
import { getSessionUser, isApprovedSessionUser } from "@/lib/portal/session";
import { isAdminRole } from "@/lib/portal/constants";

export const dynamic = "force-dynamic";

/**
 * Deployment metadata. Detailed fields (git SHA/branch, environment) fingerprint
 * the deployment, so they are restricted to approved admins; unauthenticated
 * callers get a minimal health response only.
 */
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  const isAdmin = Boolean(user && isAdminRole(user.role) && isApprovedSessionUser(user));

  if (!isAdmin) {
    return NextResponse.json(
      { project: "amg1", status: "ok" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      project: "amg1",
      canonicalDomain: "https://amgaviation.net",
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
      environment: process.env.VERCEL_ENV ?? "local",
      builtAt: process.env.VERCEL_GIT_COMMIT_SHA ? undefined : new Date(0).toISOString(),
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
