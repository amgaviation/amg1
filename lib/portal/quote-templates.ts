import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Read layer for reusable quote templates. Authorization is enforced by the
 * calling page/action (admin-only); these helpers use the service client so
 * the admin-only RLS on quote_templates does not block the cross-cutting
 * reads, matching the rest of lib/portal.
 */

export type QuoteTemplate = Tables<"quote_templates">;
export type QuoteTemplateLineItem = Tables<"quote_template_line_items">;

export type QuoteTemplateSummary = QuoteTemplate & { lineItemCount: number };

export async function listQuoteTemplates(): Promise<QuoteTemplateSummary[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("quote_templates")
    .select("*, quote_template_line_items(id)")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .returns<(QuoteTemplate & { quote_template_line_items: { id: string }[] })[]>();
  return (data ?? []).map(({ quote_template_line_items, ...template }) => ({
    ...template,
    lineItemCount: quote_template_line_items?.length ?? 0,
  }));
}

export async function getQuoteTemplate(
  id: string
): Promise<(QuoteTemplate & { items: QuoteTemplateLineItem[] }) | null> {
  const db = await createServiceClient();
  const { data: template } = await db
    .from("quote_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!template) return null;
  const { data: items } = await db
    .from("quote_template_line_items")
    .select("*")
    .eq("template_id", id)
    .order("sort_order");
  return { ...template, items: items ?? [] };
}
