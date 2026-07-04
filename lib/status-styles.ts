import type { Tone } from "@/lib/portal/constants";

/**
 * Operations Deck tone classes. Soft tinted chips on the light canvas with
 * text that passes contrast on white. `accent` is the champagne-gold brand
 * tone reserved for in-motion / highlighted states.
 */
export const STATUS_TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-[#DDE2E9] bg-[#F4F6F8] text-[#475467]",
  info: "border-[#C9DAF8] bg-[#EFF4FE] text-[#1D4ED8]",
  warn: "border-[#EAD9AE] bg-[#FBF4E3] text-[#8F5F12]",
  success: "border-[#BFE3D2] bg-[#EAF6F0] text-[#116947]",
  danger: "border-[#EFC7C7] bg-[#FBEFEF] text-[#A82E2E]",
  accent: "border-[var(--deck-gold-line)] bg-[var(--deck-gold-tint)] text-[var(--deck-gold-deep)]",
};

export const STATUS_DOT_CLASSES: Record<Tone, string> = {
  neutral: "bg-[#98A2B3]",
  info: "bg-[#2563EB]",
  warn: "bg-[#D9970F]",
  success: "bg-[#17845A]",
  danger: "bg-[#C03636]",
  accent: "bg-[var(--deck-gold)]",
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
