"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveSubscriptionPriceMismatch } from "@/lib/portal/stripe-subscriptions";
import { actor, str } from "./_helpers";

const RESOLUTIONS = ["accept_stripe", "keep_local"] as const;
type Resolution = (typeof RESOLUTIONS)[number];

/**
 * Admin resolution of a Stripe price-mismatch hold:
 * - accept_stripe: adopt Stripe's actual price into the portal record.
 * - keep_local: keep the portal price; the record stays flagged until Stripe is fixed.
 */
export async function resolvePriceMismatch(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.edit");
  const subscriptionId = str(formData, "subscription_id");
  const resolution = str(formData, "resolution") as Resolution;
  if (!subscriptionId || !RESOLUTIONS.includes(resolution)) {
    redirect("/portal/admin/subscriptions?error=missing");
  }
  const result = await resolveSubscriptionPriceMismatch(subscriptionId, resolution, admin);
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  revalidatePath("/portal/admin/subscriptions");
  redirect(
    `/portal/admin/subscriptions/${subscriptionId}?${
      result.ok
        ? `success=${resolution === "accept_stripe" ? "price-adopted" : "price-kept"}`
        : `error=${encodeURIComponent(result.reason)}`
    }`,
  );
}
