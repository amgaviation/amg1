import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    project: "amg1",
    canonicalDomain: "https://amgaviation.net",
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
    environment: process.env.VERCEL_ENV ?? "local",
    builtAt: process.env.VERCEL_GIT_COMMIT_SHA ? undefined : new Date(0).toISOString(),
  });
}
