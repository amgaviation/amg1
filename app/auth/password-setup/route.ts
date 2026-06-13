import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error") || url.searchParams.get("error_code");

  if (error) {
    return NextResponse.redirect(new URL("/forgot-password?error=failed", url.origin));
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(new URL("/forgot-password?error=failed", url.origin));
    }
  }

  return NextResponse.redirect(new URL("/reset-password", url.origin));
}
