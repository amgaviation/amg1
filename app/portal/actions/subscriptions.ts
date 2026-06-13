"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, num, str } from "./_helpers";

function money(formData: FormData, key: string) {
  return num(formData, key) ?? 0;
}

export async function createSubscriptionPlan(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = (await createServiceClient()) as any;
  const name = str(formData, "name");
  const tierName = str(formData, "tier_name") || "Standard";
  if (!name) redirect("/portal/admin/subscriptions?error=missing-plan");

  const { data: plan, error } = await db
    .from("subscription_plans")
    .insert({
      name,
      aircraft_category: str(formData, "aircraft_category") || null,
      description: str(formData, "description") || null,
      status: str(formData, "status") || "active",
      base_admin_fee_monthly: money(formData, "base_admin_fee_monthly"),
      base_admin_fee_annual: money(formData, "base_admin_fee_annual"),
      annual_discount_percent: num(formData, "annual_discount_percent") ?? 0,
      default_terms: str(formData, "default_terms") || null,
    })
    .select("id, name")
    .single();
  if (error || !plan) redirect("/portal/admin/subscriptions?error=plan-save");

  await db.from("subscription_plan_tiers").insert({
    plan_id: plan.id,
    name: tierName,
    included_flights: num(formData, "included_flights") ?? 0,
    included_mx_repositions: num(formData, "included_mx_repositions") ?? 0,
    included_admin_hours: num(formData, "included_admin_hours") ?? 0,
    crew_day_rate: num(formData, "crew_day_rate"),
    lodging_policy: str(formData, "lodging_policy") || null,
    travel_policy: str(formData, "travel_policy") || null,
    priority_level: str(formData, "priority_level") || null,
    monthly_price: money(formData, "monthly_price"),
    annual_price: money(formData, "annual_price"),
  });

  await logAuditEvent({
    actor: admin,
    action: "subscription_plan_created",
    detail: `Created plan ${plan.name}`,
    entityType: "subscription_plan",
    entityId: plan.id,
  });
  revalidatePath("/portal/admin/subscriptions");
  redirect("/portal/admin/subscriptions?success=plan");
}

export async function createClientSubscription(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = (await createServiceClient()) as any;
  const clientId = str(formData, "client_id");
  const planId = str(formData, "plan_id");
  const tierId = str(formData, "tier_id");
  if (!clientId || !planId) redirect("/portal/admin/subscriptions/new?error=missing");

  const { data: tier } = tierId
    ? await db.from("subscription_plan_tiers").select("*").eq("id", tierId).maybeSingle()
    : { data: null };
  const { data: subscription, error } = await db
    .from("client_subscriptions")
    .insert({
      client_id: clientId,
      aircraft_id: str(formData, "aircraft_id") || null,
      plan_id: planId,
      tier_id: tierId || null,
      status: str(formData, "status") || "active",
      billing_cadence: str(formData, "billing_cadence") || "monthly",
      start_date: str(formData, "start_date") || new Date().toISOString().slice(0, 10),
      end_date: str(formData, "end_date") || null,
      renewal_date: str(formData, "renewal_date") || null,
      monthly_price: money(formData, "monthly_price") || Number(tier?.monthly_price ?? 0),
      annual_price: money(formData, "annual_price") || Number(tier?.annual_price ?? 0),
      custom_price: num(formData, "custom_price"),
      included_flights: num(formData, "included_flights") ?? Number(tier?.included_flights ?? 0),
      included_mx_repositions: num(formData, "included_mx_repositions") ?? Number(tier?.included_mx_repositions ?? 0),
      included_admin_hours: num(formData, "included_admin_hours") ?? Number(tier?.included_admin_hours ?? 0),
      credit_balance: money(formData, "credit_balance"),
      notes: str(formData, "notes") || null,
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (error || !subscription) redirect("/portal/admin/subscriptions/new?error=save");

  await logAuditEvent({
    actor: admin,
    action: "client_subscription_created",
    detail: `Created subscription for client ${clientId}`,
    entityType: "client_subscription",
    entityId: subscription.id,
  });
  await notifyUser({
    userId: clientId,
    title: "Subscription activated",
    body: "Your AMG subscription is now available in the client portal.",
    type: "subscription_updated",
    entityType: "client_subscription",
    entityId: subscription.id,
  });
  revalidatePath("/portal/admin/subscriptions");
  revalidatePath("/portal/client/subscriptions");
  redirect(`/portal/admin/subscriptions/${subscription.id}?success=created`);
}

export async function updateSubscriptionStatus(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = (await createServiceClient()) as any;
  const subscriptionId = str(formData, "subscription_id");
  const status = str(formData, "status");
  if (!subscriptionId || !status) redirect("/portal/admin/subscriptions?error=missing");

  const { data: subscription, error } = await db
    .from("client_subscriptions")
    .update({
      status,
      end_date: status === "cancelled" || status === "expired" ? str(formData, "end_date") || new Date().toISOString().slice(0, 10) : str(formData, "end_date") || null,
      renewal_date: str(formData, "renewal_date") || null,
      notes: str(formData, "notes") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .select("id, client_id")
    .single();
  if (error || !subscription) redirect(`/portal/admin/subscriptions/${subscriptionId}?error=status`);

  await logAuditEvent({
    actor: admin,
    action: "client_subscription_status_updated",
    detail: `Set subscription to ${status}`,
    entityType: "client_subscription",
    entityId: subscriptionId,
  });
  await notifyUser({
    userId: subscription.client_id,
    title: "Subscription updated",
    body: `Your AMG subscription status is now ${status.replace(/_/g, " ")}.`,
    type: "subscription_updated",
    entityType: "client_subscription",
    entityId: subscriptionId,
  });
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  revalidatePath("/portal/client/subscriptions");
  redirect(`/portal/admin/subscriptions/${subscriptionId}?success=status`);
}

export async function addSubscriptionUsage(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = (await createServiceClient()) as any;
  const subscriptionId = str(formData, "subscription_id");
  const clientId = str(formData, "client_id");
  if (!subscriptionId || !clientId) redirect("/portal/admin/subscriptions?error=missing");

  const quantity = num(formData, "quantity") ?? 0;
  const coveredQuantity = num(formData, "covered_quantity") ?? 0;
  const overageQuantity = Math.max(quantity - coveredQuantity, num(formData, "overage_quantity") ?? 0);
  const unitRate = money(formData, "unit_rate");
  const { error } = await db.from("subscription_usage_events").insert({
    subscription_id: subscriptionId,
    client_id: clientId,
    mission_id: str(formData, "mission_id") || null,
    usage_type: str(formData, "usage_type") || "other",
    quantity,
    unit: str(formData, "unit") || null,
    covered_quantity: coveredQuantity,
    overage_quantity: overageQuantity,
    unit_rate: unitRate,
    covered_amount: 0,
    overage_amount: overageQuantity * unitRate,
    notes: str(formData, "notes") || null,
    created_by: admin.id,
  });
  if (error) redirect(`/portal/admin/subscriptions/${subscriptionId}?error=usage`);

  await logAuditEvent({
    actor: admin,
    action: "subscription_usage_added",
    detail: `Added ${quantity} ${str(formData, "usage_type") || "usage"} units`,
    entityType: "client_subscription",
    entityId: subscriptionId,
  });
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  revalidatePath("/portal/client/subscriptions");
  redirect(`/portal/admin/subscriptions/${subscriptionId}?success=usage`);
}

export async function addSubscriptionCredit(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = (await createServiceClient()) as any;
  const subscriptionId = str(formData, "subscription_id");
  const clientId = str(formData, "client_id");
  const amount = money(formData, "amount");
  if (!subscriptionId || !clientId || amount === 0) redirect("/portal/admin/subscriptions?error=missing");

  const { error } = await db.from("subscription_credits").insert({
    subscription_id: subscriptionId,
    client_id: clientId,
    source_type: str(formData, "source_type") || "manual",
    amount,
    description: str(formData, "description") || null,
    expires_at: str(formData, "expires_at") || null,
    created_by: admin.id,
  });
  if (error) redirect(`/portal/admin/subscriptions/${subscriptionId}?error=credit`);

  const { data: current } = await db
    .from("client_subscriptions")
    .select("credit_balance")
    .eq("id", subscriptionId)
    .maybeSingle();
  await db
    .from("client_subscriptions")
    .update({ credit_balance: Number(current?.credit_balance ?? 0) + amount, updated_at: new Date().toISOString() })
    .eq("id", subscriptionId);

  await logAuditEvent({
    actor: admin,
    action: "subscription_credit_added",
    detail: `Added credit ${amount}`,
    entityType: "client_subscription",
    entityId: subscriptionId,
  });
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  revalidatePath("/portal/client/subscriptions");
  redirect(`/portal/admin/subscriptions/${subscriptionId}?success=credit`);
}
