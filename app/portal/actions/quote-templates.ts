"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/portal/audit";
import { actor, str } from "./_helpers";

const TEMPLATES_PATH = "/portal/admin/quotes/templates";

/**
 * Parse the LineItemsEditor array fields into quote_template_line_items rows.
 * Mirrors the quote line-item parser but drops fields the template table does
 * not carry (amount is derived at quote time; per-line notes are not stored).
 */
function templateItemsFromForm(formData: FormData) {
  const categories = formData.getAll("category[]").map((v) => String(v).trim());
  const descriptions = formData.getAll("description[]").map((v) => String(v).trim());
  const quantities = formData.getAll("quantity[]").map((v) => Number(v) || 0);
  const unitPrices = formData.getAll("unit_price[]").map((v) => Number(v) || 0);
  const units = formData.getAll("unit[]").map((v) => String(v).trim());
  const costTypes = formData.getAll("cost_type[]").map((v) => String(v).trim());

  return categories
    .map((category, i) => ({
      category,
      description: descriptions[i] || null,
      quantity: quantities[i] || 1,
      unit: units[i] || null,
      unit_price: unitPrices[i] || 0,
      cost_type: costTypes[i] || null,
      client_visible: formData.get(`client_visible_${i}`) !== "false",
      billable: formData.get(`billable_${i}`) !== "false",
      included_in_total: formData.get(`included_in_total_${i}`) !== "false",
      taxable: formData.get(`taxable_${i}`) === "true",
      sort_order: i,
    }))
    .filter((it) => it.category);
}

export async function createQuoteTemplate(formData: FormData) {
  const admin = await actor(["admin"], "quotes.edit");
  const db = await createServiceClient();

  const name = str(formData, "name");
  if (!name) redirect(`${TEMPLATES_PATH}?error=name`);

  const items = templateItemsFromForm(formData);

  const { data: template, error } = await db
    .from("quote_templates")
    .insert({
      name,
      description: str(formData, "description") || null,
      client_notes: str(formData, "client_notes") || null,
      internal_notes: str(formData, "internal_notes") || null,
    })
    .select("id, name")
    .single();
  // A failed header insert must not fall through to a line-item insert with an
  // undefined template_id or log a creation event for a template never written.
  if (error || !template) {
    redirect(`${TEMPLATES_PATH}?error=save`);
  }

  if (items.length) {
    const { error: itemsError } = await db
      .from("quote_template_line_items")
      .insert(items.map((it) => ({ ...it, template_id: template.id })));
    if (itemsError) {
      // Roll back the orphaned header so a retry starts clean.
      await db.from("quote_templates").delete().eq("id", template.id);
      redirect(`${TEMPLATES_PATH}?error=save`);
    }
  }

  await logAuditEvent({
    actor: admin,
    action: "quote_template_created",
    detail: `Created quote template "${template.name}" (${items.length} line ${items.length === 1 ? "item" : "items"})`,
    entityType: "quote_template",
    entityId: template.id,
  });
  revalidatePath(TEMPLATES_PATH);
  redirect(`${TEMPLATES_PATH}?success=created`);
}

export async function deleteQuoteTemplate(formData: FormData) {
  const admin = await actor(["admin"], "quotes.edit");
  const db = await createServiceClient();
  const templateId = str(formData, "template_id");
  if (!templateId) redirect(`${TEMPLATES_PATH}?error=missing`);

  const { data: template } = await db
    .from("quote_templates")
    .select("id, name")
    .eq("id", templateId)
    .maybeSingle();
  if (!template) redirect(`${TEMPLATES_PATH}?error=missing`);

  // Line items cascade via the template_id FK (on delete cascade).
  const { error } = await db.from("quote_templates").delete().eq("id", templateId);
  if (error) redirect(`${TEMPLATES_PATH}?error=save`);

  await logAuditEvent({
    actor: admin,
    action: "quote_template_deleted",
    detail: `Deleted quote template "${template.name}"`,
    entityType: "quote_template",
    entityId: templateId,
  });
  revalidatePath(TEMPLATES_PATH);
  redirect(`${TEMPLATES_PATH}?success=deleted`);
}
