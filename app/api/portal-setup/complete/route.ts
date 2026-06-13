import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = await createServiceClient();
  const { error: updateError } = await db
    .from("profiles")
    .update({
      status: "approved",
      is_active: true,
      invitation_status: "password_created",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  await (db as any)
    .from("public_support_requests")
    .update({
      portal_account_status: "password_created",
      updated_at: new Date().toISOString(),
    })
    .eq("portal_account_user_id", user.id)
    .is("portal_account_status", null);

  await (db as any)
    .from("public_support_requests")
    .update({
      portal_account_status: "password_created",
      updated_at: new Date().toISOString(),
    })
    .eq("portal_account_user_id", user.id)
    .in("portal_account_status", ["created", "portal_setup_sent"]);

  return NextResponse.json({ ok: true });
}
