import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Streams a portal user's profile picture. Any authenticated portal user may
 * view any avatar (they appear in shell chrome, messages, and rosters).
 * Paths are versioned per upload, so the response is safely long-cached.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = await createServiceClient();
  const { data: profile } = await db
    .from("profiles")
    .select("avatar_path")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.avatar_path) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const { data: file, error } = await db.storage.from("documents").download(profile.avatar_path);
  if (error || !file) {
    return NextResponse.json({ error: "unavailable" }, { status: 404 });
  }

  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      "Content-Type": file.type || "image/jpeg",
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
