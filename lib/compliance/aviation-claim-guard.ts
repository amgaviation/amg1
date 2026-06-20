export const PROHIBITED_AVIATION_CLAIMS = [
  "book aircraft",
  "reserve aircraft",
  "charter now",
  "amg fleet",
  "our fleet",
  "operated by amg",
  "amg-operated",
  "guaranteed crew",
  "guaranteed aircraft",
  "instant approval",
  "confirmed instantly",
  "flight confirmed",
  "trip accepted",
  "emergency response guaranteed",
  "available worldwide guaranteed",
  "pay now",
  "buy now",
] as const;

export const ALLOWED_AVIATION_LANGUAGE = [
  "Request Support",
  "Request aircraft support",
  "Support request",
  "Reviewed before acceptance",
  "Aircraft support coordination",
  "Crew coordination",
  "Vendor coordination",
  "Representative aircraft category",
  "Aircraft class reference",
  "Quote review",
  "Invoice review",
  "Portal access",
] as const;

export function findProhibitedAviationClaims(text: string) {
  const lower = text.toLowerCase();
  return PROHIBITED_AVIATION_CLAIMS.filter((phrase) => lower.includes(phrase));
}
