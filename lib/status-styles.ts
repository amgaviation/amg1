import type { Tone } from "@/lib/portal/constants";

export const STATUS_TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-slate-400/28 bg-slate-400/10 text-slate-200",
  info: "border-primary/38 bg-primary/12 text-blue-100",
  warn: "border-amber-400/32 bg-amber-400/10 text-amber-100",
  success: "border-emerald-400/32 bg-emerald-400/10 text-emerald-100",
  danger: "border-red-400/34 bg-red-400/10 text-red-100",
  accent: "border-primary/45 bg-primary/14 text-blue-100",
};

export const STATUS_DOT_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-300",
  info: "bg-primary",
  warn: "bg-amber-300",
  success: "bg-emerald-300",
  danger: "bg-red-300",
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
