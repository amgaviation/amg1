import type { Tone } from "@/lib/portal/constants";

/**
 * Flight Deck Console tone classes. Every tone resolves through the
 * --deck-* tint/line tokens so chips flip correctly between the light and
 * dark portal themes. `accent` is the instrument-blue brand tone reserved
 * for in-motion / highlighted states.
 */
export const STATUS_TONE_CLASSES: Record<Tone, string> = {
  neutral:
    "border-[var(--deck-neutral-line)] bg-[var(--deck-neutral-tint)] text-[var(--deck-text-2)]",
  info: "border-[var(--deck-info-line)] bg-[var(--deck-info-tint)] text-[var(--deck-info)]",
  warn: "border-[var(--deck-warn-line)] bg-[var(--deck-warn-tint)] text-[var(--deck-warn)]",
  success:
    "border-[var(--deck-success-line)] bg-[var(--deck-success-tint)] text-[var(--deck-success)]",
  danger:
    "border-[var(--deck-danger-line)] bg-[var(--deck-danger-tint)] text-[var(--deck-danger)]",
  accent:
    "border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] text-[var(--deck-accent-ink)]",
};

export const STATUS_DOT_CLASSES: Record<Tone, string> = {
  neutral: "bg-[var(--deck-text-3)]",
  info: "bg-[var(--deck-info)]",
  warn: "bg-[var(--deck-warn)]",
  success: "bg-[var(--deck-success)]",
  danger: "bg-[var(--deck-danger)]",
  accent: "bg-[var(--deck-accent)]",
};

export const STATUS_LABEL_TONE = {
  under_review: "info",
  crew_review: "info",
  updated: "info",
  completed: "success",
  paid: "success",
  available: "success",
  active: "success",
  pending: "warn",
  awaiting_review: "warn",
  requires_attention: "warn",
  draft: "neutral",
  inactive: "neutral",
  closed: "neutral",
  archived: "neutral",
  error: "danger",
  critical: "danger",
} as const;
