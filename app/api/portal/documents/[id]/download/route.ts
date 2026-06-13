import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isPortalRole } from "@/lib/portal/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = (await createServiceClient()) as any;
  const { data: profile } = await db
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !isPortalRole(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: doc, error } = await db
    .from("documents")
    .select("storage_path, storage_bucket, name, visibility, uploaded_by, scope_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed =
    profile.role === "admin" ||
    doc.visibility === "public" ||
    doc.uploaded_by === user.id ||
    doc.scope_id === user.id;
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Generate a signed URL (60 second expiry)
  let { data: signed, error: signedError } = await supabase.storage
    .from((doc as any).storage_bucket || "documents")
    .createSignedUrl(doc.storage_path, 60);
  if (signedError || !signed) {
    const fallback = await supabase.storage
      .from("crew-credentials")
      .createSignedUrl(doc.storage_path, 60);
    signed = fallback.data;
    signedError = fallback.error;
  }

  if (signedError || !signed) {
    return NextResponse.json({ error: "Could not generate download URL" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
