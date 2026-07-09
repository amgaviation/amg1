import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export type BillingSettings = {
  id: "global";
  company_name: string;
  company_legal_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  logo_path: string;
  payment_instructions: string | null;
  wire_instructions: string | null;
  ach_instructions: string | null;
  check_instructions: string | null;
  quote_terms: string | null;
  invoice_terms: string | null;
  quote_disclaimer: string | null;
  invoice_disclaimer: string | null;
  receipt_disclaimer: string | null;
  tax_rate: number;
  default_deposit_percent: number;
  auto_send_invoice_on_quote_approval: boolean;
  /** Global switch for the automated overdue-invoice dunning cadence (T+3/T+7/T+14). */
  dunning_enabled: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_BILLING_SETTINGS: BillingSettings = {
  id: "global",
  company_name: "AMG Aviation Group",
  company_legal_name: "AMG Aviation Group",
  company_email: "tony@amgaviationgroup.com",
  company_phone: null,
  company_address: null,
  logo_path: "/images/logo-navy.png",
  payment_instructions:
    "Payment instructions are provided by AMG Aviation Group and may be updated before final invoice settlement.",
  wire_instructions: "Wire transfer details are available from AMG Aviation Group Billing.",
  ach_instructions: "ACH details are available from AMG Aviation Group Billing.",
  check_instructions: "Checks are payable to AMG Aviation Group unless otherwise directed in writing.",
  quote_terms:
    "Quotes are estimates based on currently available support details and are subject to aircraft status, crew availability, owner/operator approval, operating conditions, fuel, taxes, fees, and final AMG review.",
  invoice_terms:
    "Invoices are due according to the terms shown on the invoice. Late, third-party, bank, wire, processing, airport, handling, international, and operational pass-through charges may be billed separately when applicable.",
  quote_disclaimer:
    "This quote does not constitute mission acceptance, aircraft availability, crew assignment, operational authorization, or a binding commitment until the applicable support scope is reviewed and confirmed by AMG Aviation Group in writing.",
  invoice_disclaimer:
    "This invoice reflects services, expenses, and pass-through charges known at issue. Additional verified charges may be invoiced separately.",
  receipt_disclaimer:
    "This receipt confirms payment recorded by AMG Aviation Group and does not waive any outstanding balance, adjustment, or separately billable pass-through charge.",
  tax_rate: 0,
  default_deposit_percent: 0,
  auto_send_invoice_on_quote_approval: false,
  // Safe rollout: client dunning stays off until deliberately enabled.
  dunning_enabled: false,
  updated_by: null,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

export async function getBillingSettings(): Promise<BillingSettings> {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("billing_settings")
    .select("*")
    .eq("id", "global")
    .maybeSingle();

  return { ...DEFAULT_BILLING_SETTINGS, ...(data ?? {}) };
}

export async function saveBillingSettings(
  settings: Partial<BillingSettings> & { updated_by: string },
): Promise<void> {
  const db = (await createServiceClient()) as any;
  await db
    .from("billing_settings")
    .upsert({
      id: "global",
      ...settings,
      updated_at: new Date().toISOString(),
    });
}

export function combinedPaymentInstructions(settings: BillingSettings) {
  return [
    settings.payment_instructions,
    settings.wire_instructions ? `Wire: ${settings.wire_instructions}` : null,
    settings.ach_instructions ? `ACH: ${settings.ach_instructions}` : null,
    settings.check_instructions ? `Check: ${settings.check_instructions}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
