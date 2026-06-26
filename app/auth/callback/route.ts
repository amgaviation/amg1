import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  if (error) {
    return NextResponse.redirect(new URL("/auth/error", url.origin));
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(new URL("/auth/error", url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
