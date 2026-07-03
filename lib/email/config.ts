export const AMG_EMAIL_BRAND = {
  companyName: "AMG Aviation Group",
  operationsName: "AMG Operations",
  primaryColor: "#050B14",
  secondaryDarkColor: "#07111F",
  accentBlue: "#3B82F6",
  white: "#FFFFFF",
  slateText: "#9CA3AF",
  lightGray: "#C0C7D1",
  contactEmail: "information@amgaviationgroup.com",
  websiteLabel: "www.amgaviationgroup.com",
} as const;

const DEFAULT_SITE_URL = "https://www.amgaviationgroup.com";
const DEFAULT_PORTAL_URL = "https://www.amgaviationgroup.com";
const DEFAULT_NOTIFY_EMAIL = "notify@amgaviationgroup.com";
const DEFAULT_OPERATIONS_EMAIL = "operations@amgaviationgroup.com";
const DEFAULT_REPLY_TO = AMG_EMAIL_BRAND.contactEmail;

function cleanEnv(value?: string | null) {
  return value
    ?.trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/[⁠￼]/g, "")
    .trim();
}

function cleanUrl(value?: string | null, fallback = DEFAULT_SITE_URL) {
  const raw = cleanEnv(value);
  if (!raw) return fallback;
  const url = raw.startsWith("http") ? raw : `https://${raw}`;
  return url.replace(/\/+$/, "");
}

function normalizeSender(value: string | undefined, displayName: string, email: string) {
  const raw = cleanEnv(value);
  if (!raw) return `${displayName} <${email}>`;
  if (raw.includes("<") && raw.includes(">")) return raw;

  const emailMatch = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  if (!emailMatch) return `${displayName} <${email}>`;

  const name = raw.replace(emailMatch, "").trim() || displayName;
  return `${name} <${emailMatch}>`;
}

export const SITE_URL = cleanUrl(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL);
export const PORTAL_URL = cleanUrl(process.env.NEXT_PUBLIC_PORTAL_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL, DEFAULT_PORTAL_URL);
export const AMG_EMAIL_FROM = normalizeSender(
  process.env.AMG_EMAIL_FROM ??
    process.env.EMAIL_DEFAULT_FROM ??
    process.env.EMAIL_FROM_ADDRESS ??
    process.env.RESEND_FROM_EMAIL,
  AMG_EMAIL_BRAND.companyName,
  DEFAULT_NOTIFY_EMAIL,
);
export const AMG_OPERATIONS_FROM = normalizeSender(
  process.env.AMG_OPERATIONS_FROM ?? process.env.EMAIL_OPS_FROM,
  AMG_EMAIL_BRAND.operationsName,
  DEFAULT_OPERATIONS_EMAIL,
);
export const AMG_REPLY_TO = cleanEnv(process.env.AMG_REPLY_TO ?? process.env.EMAIL_REPLY_TO) ?? DEFAULT_REPLY_TO;

export const OPERATIONAL_EMAIL_DISCLAIMER =
  "AMG support requests remain subject to aircraft status, crew availability, owner/operator approval, operating conditions, support-scope review, and final acceptance. AMG Aviation Group does not present a request as accepted until the applicable review is complete.";

export const SHARED_EMAIL_FOOTER = [
  AMG_EMAIL_BRAND.companyName,
  AMG_EMAIL_BRAND.contactEmail,
  AMG_EMAIL_BRAND.websiteLabel,
].join("\n");

export function defaultSender(category?: "operations" | "billing" | "support" | "notification") {
  return category === "operations" ? AMG_OPERATIONS_FROM : AMG_EMAIL_FROM;
}

export function replyToAddress(value?: string | null) {
  return cleanEnv(value) ?? AMG_REPLY_TO;
}

export function absoluteSiteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function absolutePortalUrl(path = "/portal") {
  return new URL(path, `${PORTAL_URL}/`).toString();
}
