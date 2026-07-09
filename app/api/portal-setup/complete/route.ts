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

  // This endpoint only records that the user finished creating their password.
  // It must NOT be able to approve or reactivate an account — the account must
  // ALREADY be approved and active (an admin does that). Otherwise a user who
  // was later suspended/denied but still holds a valid token could self-restore.
  const { data: profile } = await db
    .from("profiles")
    .select("id, status, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "approved" || profile.is_active !== true) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  // Advance only the setup lifecycle metadata — never status / is_active. The
  // predicate re-asserts approved+active so a concurrent status change means
  // zero rows update and we return 403 rather than silently succeeding.
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await db
    .from("profiles")
    .update({
      invitation_status: "password_created",
      updated_at: now,
    })
    .eq("id", user.id)
    .eq("status", "approved")
    .eq("is_active", true)
    .select("id");

  if (updateError) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  await (db as any)
    .from("public_support_requests")
    .update({
      portal_account_status: "password_created",
      updated_at: now,
    })
    .eq("portal_account_user_id", user.id)
    .is("portal_account_status", null);

  await (db as any)
    .from("public_support_requests")
    .update({
      portal_account_status: "password_created",
      updated_at: now,
    })
    .eq("portal_account_user_id", user.id)
    .in("portal_account_status", ["created", "portal_setup_sent"]);

  return NextResponse.json({ ok: true });
}
