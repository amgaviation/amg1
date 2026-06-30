const DEFAULT_SITE_URL = "http://localhost:3000";

function cleanUrlValue(value?: string | null) {
  return value
    ?.trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\/+$/, "");
}

function withProtocol(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function getSiteUrl() {
  const configured = cleanUrlValue(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return withProtocol(configured);

  const vercelUrl = cleanUrlValue(process.env.VERCEL_URL);
  if (vercelUrl) return withProtocol(vercelUrl);

  return DEFAULT_SITE_URL;
}
