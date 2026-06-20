export type ConsentCategoryId =
  | "necessary"
  | "analytics"
  | "marketing"
  | "session_recording"
  | "embedded_tools";

export type ConsentCategory = {
  id: ConsentCategoryId;
  label: string;
  description: string;
  required: boolean;
};

export const CONSENT_VERSION = "2026-06-20";
export const CONSENT_STORAGE_KEY = "amg_cookie_consent_v20260620";

export const consentCategories: ConsentCategory[] = [
  {
    id: "necessary",
    label: "Necessary",
    description: "Required for site security, forms, portal authentication, routing, and consent storage.",
    required: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Helps AMG understand aggregate website and portal usage.",
    required: false,
  },
  {
    id: "marketing",
    label: "Marketing and retargeting",
    description: "Supports advertising, audience, and campaign measurement tools.",
    required: false,
  },
  {
    id: "session_recording",
    label: "Session recording and behavior analytics",
    description: "Supports troubleshooting and behavior analytics tools when enabled.",
    required: false,
  },
  {
    id: "embedded_tools",
    label: "Embedded tools",
    description: "Allows optional third-party embedded tools such as maps, media, chat, or scheduling widgets.",
    required: false,
  },
];

export type ConsentState = Record<ConsentCategoryId, boolean>;

export function defaultConsentState(optionalEnabled = false): ConsentState {
  return {
    necessary: true,
    analytics: optionalEnabled,
    marketing: optionalEnabled,
    session_recording: optionalEnabled,
    embedded_tools: optionalEnabled,
  };
}

export type ConsentScriptDefinition = {
  id: string;
  category: Exclude<ConsentCategoryId, "necessary">;
  envKey: string;
  description: string;
};

export const consentScriptRegistry: ConsentScriptDefinition[] = [
  {
    id: "google-analytics",
    category: "analytics",
    envKey: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    description: "Google Analytics measurement ID, loaded only when analytics consent is enabled.",
  },
  {
    id: "google-tag-manager",
    category: "analytics",
    envKey: "NEXT_PUBLIC_GTM_ID",
    description: "Google Tag Manager container, loaded only when analytics consent is enabled.",
  },
  {
    id: "meta-pixel",
    category: "marketing",
    envKey: "NEXT_PUBLIC_META_PIXEL_ID",
    description: "Meta Pixel identifier, loaded only when marketing consent is enabled.",
  },
  {
    id: "microsoft-clarity",
    category: "session_recording",
    envKey: "NEXT_PUBLIC_CLARITY_PROJECT_ID",
    description: "Microsoft Clarity project ID, loaded only when session recording consent is enabled.",
  },
  {
    id: "embedded-tools",
    category: "embedded_tools",
    envKey: "NEXT_PUBLIC_EMBEDDED_TOOLS_ENABLED",
    description: "Placeholder switch for optional embedded tools that must be gated by consent before activation.",
  },
];
