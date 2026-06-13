import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export type BillingDocumentType = "quote" | "invoice" | "receipt";

export async function nextBillingDocumentNumber(type: BillingDocumentType) {
  const db = (await createServiceClient()) as any;
  const { data, error } = await db.rpc("next_billing_document_number", {
    p_document_type: type,
  });

  if (error || !data) {
    throw new Error(error?.message ?? `Unable to reserve ${type} number`);
  }

  return String(data);
}
