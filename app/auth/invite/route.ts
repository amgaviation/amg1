import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error") || url.searchParams.get("error_code");

  if (error || !code) {
    return NextResponse.redirect(new URL("/auth/error", url.origin));
  }

  return NextResponse.redirect(new URL(`/portal-setup?code=${encodeURIComponent(code)}`, url.origin));
}
