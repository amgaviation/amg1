export const NETWORK_APPLICATION_STATUSES = [
  "awaiting_review",
  "in_review",
  "additional_information_needed",
  "approved",
  "denied",
  "waitlist",
  "other",
] as const;

export type NetworkApplicationStatus = (typeof NETWORK_APPLICATION_STATUSES)[number];

export const NETWORK_STATUS_LABELS: Record<NetworkApplicationStatus, string> = {
  awaiting_review: "Awaiting review",
  in_review: "In review",
  additional_information_needed: "Additional information needed",
  approved: "Approved",
  denied: "Denied",
  waitlist: "Waitlist",
  other: "Other",
};

export const NETWORK_STATUS_TONES: Record<NetworkApplicationStatus, "neutral" | "info" | "warn" | "success" | "danger" | "accent"> = {
  awaiting_review: "info",
  in_review: "accent",
  additional_information_needed: "warn",
  approved: "success",
  denied: "danger",
  waitlist: "neutral",
  other: "neutral",
};

/**
 * Pre-made denial reasons offered in the deny flow. Edit freely — the chosen
 * (or custom-typed) reason is stored on the application and inserted into the
 * denial email verbatim.
 */
export const NETWORK_DENIAL_REASONS = [
  "Total flight time does not meet our current minimum requirements.",
  "Certificate or type ratings do not match our current fleet and operational needs.",
  "Application is incomplete — required documentation or information was not provided.",
  "Current medical certificate class does not meet the requirements for this position.",
  "Experience profile does not align with the positions we are currently staffing.",
  "We were unable to verify the references or employment history provided.",
  "Position applied for has been filled.",
  "Base/location requirements could not be met for our current operational needs.",
] as const;

export const NETWORK_APPLICATION_SOURCES = ["application", "manual", "csv_import", "xlsx_import"] as const;
export type NetworkApplicationSource = (typeof NETWORK_APPLICATION_SOURCES)[number];

export const NETWORK_SOURCE_LABELS: Record<NetworkApplicationSource, string> = {
  application: "Web Application",
  manual: "Manually Added",
  csv_import: "CSV Import",
  xlsx_import: "XLSX Import",
};
