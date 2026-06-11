import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Fetch the document record (RLS enforces visibility)
  const { data: doc, error } = await supabase
    .from("documents")
    .select("storage_path, name")
    .eq("id", id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Generate a signed URL (60 second expiry)
  const { data: signed, error: signedError } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 60);

  if (signedError || !signed) {
    return NextResponse.json({ error: "Could not generate download URL" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
