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
