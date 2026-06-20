export type PaymentDataFinding = {
  field: string;
  type: "card_number" | "cvv" | "routing_number" | "bank_account";
};

const CARD_CANDIDATE = /(?:\d[ -]?){13,19}/g;
const CVV_CONTEXT = /\b(?:cvv|cvc|security\s*code|card\s*code)\b[^\d]{0,16}\d{3,4}\b/i;
const ROUTING_CONTEXT = /\b(?:routing|aba)\b[^\d]{0,16}\d{9}\b/i;
const ACCOUNT_CONTEXT = /\b(?:bank\s*)?account(?:\s*number)?\b[^\d]{0,16}\d{8,17}\b/i;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function luhn(value: string) {
  let sum = 0;
  let double = false;
  for (let i = value.length - 1; i >= 0; i -= 1) {
    let digit = Number(value[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return value.length >= 13 && value.length <= 19 && sum % 10 === 0;
}

export function detectProhibitedPaymentData(fields: Record<string, string | null | undefined>): PaymentDataFinding[] {
  const findings: PaymentDataFinding[] = [];

  for (const [field, raw] of Object.entries(fields)) {
    const value = String(raw ?? "");
    if (!value.trim()) continue;

    const candidates = value.match(CARD_CANDIDATE) ?? [];
    if (candidates.some((candidate) => luhn(digitsOnly(candidate)))) {
      findings.push({ field, type: "card_number" });
    }
    if (CVV_CONTEXT.test(value)) findings.push({ field, type: "cvv" });
    if (ROUTING_CONTEXT.test(value)) findings.push({ field, type: "routing_number" });
    if (ACCOUNT_CONTEXT.test(value)) findings.push({ field, type: "bank_account" });
  }

  return findings;
}

export function hasProhibitedPaymentData(fields: Record<string, string | null | undefined>) {
  return detectProhibitedPaymentData(fields).length > 0;
}
