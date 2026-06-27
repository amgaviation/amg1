import type { Tone } from "@/lib/portal/constants";

export const STATUS_TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  accent: "border-primary/25 bg-blue-50 text-primary",
};

export const STATUS_DOT_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-400",
  info: "bg-primary",
  warn: "bg-amber-500",
  success: "bg-emerald-500",
  danger: "bg-red-500",
  accent: "bg-primary",
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
