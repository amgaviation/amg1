const THREAD_TOKEN_RE = /\[AMG-([A-Z0-9]{6,20})\]/i;

export function generateCommunicationPublicId(prefix: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 10; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${suffix}`;
}

export function subjectWithThreadToken(subject: string, threadPublicId: string) {
  return subject
    .replace(/\s*\[AMG-[^\]]+\]\s*/gi, " ")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractThreadPublicId(input?: string | null) {
  if (!input) return null;
  const match = input.match(THREAD_TOKEN_RE);
  return match?.[1] ?? null;
}

export function normalizeEmailList(value: string | string[] | null | undefined) {
  const raw = Array.isArray(value) ? value.join(",") : value ?? "";
  return raw
    .split(/[,\n;]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function safeAttachmentFileName(fileName: string) {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/^\.+/, "");

  return cleaned || "attachment";
}
