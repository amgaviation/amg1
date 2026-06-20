export const COMPLIANCE_POLICY_VERSION = "2026-06-20-hardening";

export const POLICY_KEYS = {
  privacy: "privacy-policy",
  clientPortalTerms: "client-portal-terms",
  crewPortalTerms: "crew-portal-terms",
  vendorPortalTerms: "vendor-portal-terms",
  documentUploadTerms: "document-upload-terms",
  credentialSubmissionNotice: "credential-submission",
  missionAcceptance: "mission-acceptance",
  quoteTerms: "quote-terms",
  invoiceTerms: "invoice-terms",
  cookiePolicy: "cookie-policy",
  noOnlinePayment: "no-online-payment-notice",
  noEmergencyUse: "no-emergency-use-notice",
} as const;

export const ACKNOWLEDGMENT_TEXT = {
  supportRequest:
    "Submitting a support request does not create an accepted assignment, confirmed service, or operational commitment. AMG reviews the requested support scope, aircraft status, crew availability, owner/operator approval requirements, and applicable operating conditions before any request is presented as accepted. AMG Aviation does not provide emergency response services through this website or portal.",
  documentUpload:
    "Upload only documents you are authorized to provide. Do not upload unnecessary sensitive information. Do not upload full credit card numbers, CVV codes, bank account numbers, routing numbers, or unrelated personal information.",
  credentialUpload:
    "Credential uploads are reviewed for assignment suitability and do not guarantee approval, assignment, compensation, aircraft approval, or future work.",
  quoteApproval:
    "Approving a quote does not override operational review, owner/operator approval, aircraft status, crew availability, or applicable operating conditions. AMG does not process payment card or bank account payments through this website or portal.",
  invoiceNotice:
    "Invoices reflect the items described and do not override operational review, owner/operator approval, aircraft status, crew availability, or other applicable conditions. AMG does not process payment card or bank account payments through this website or portal.",
  portalMessages:
    "Portal messages may include operational updates, document requests, quotes, invoices, and support review information. Unless expressly stated by AMG in writing, a message does not indicate final acceptance of a support request.",
  noOnlinePayment:
    "Do not enter full credit card numbers, CVV codes, bank account numbers, or routing numbers. AMG does not process payment card or bank account payments through this website or portal.",
  internationalBoundary:
    "AMG Aviation's website and portal may be accessible internationally. Service availability, vendor participation, crew availability, regulatory requirements, and operational support may vary by location and remain subject to review.",
  noEmergencyUse:
    "AMG Aviation does not provide emergency response services through this website or portal. Time-sensitive requests remain subject to review, availability, and operational conditions.",
} as const;

export const SENSITIVE_DOCUMENT_CATEGORIES = new Set([
  "pilot_medical",
  "pilot_certificate",
  "payment_authorization",
  "w9",
  "contract",
  "aircraft_document",
  "maintenance_record",
  "inspection_record",
  "billing_document",
]);

export const DOCUMENT_CATEGORIES = [
  "aircraft_document",
  "maintenance_record",
  "inspection_record",
  "squawk",
  "aircraft_photo",
  "pilot_certificate",
  "pilot_medical",
  "resume",
  "rating",
  "insurance",
  "contract",
  "quote",
  "invoice",
  "receipt",
  "w9",
  "payment_authorization",
  "vendor_document",
  "passenger_requester_document",
  "billing_document",
  "other",
] as const;

export const DOCUMENT_ACCESS_LEVELS = [
  "admin_only",
  "client_visible",
  "crew_visible",
  "vendor_visible",
  "billing_only",
  "owner_operator_only",
  "request_specific",
  "aircraft_specific",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
export type DocumentAccessLevel = (typeof DOCUMENT_ACCESS_LEVELS)[number];
