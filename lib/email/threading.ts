// The token embeds a thread public_id such as "THR-K7NPQR2ST9": a short prefix,
// a dash, then a random suffix. The character class must allow that internal
// dash, while anchoring the first and last captured characters to [A-Z0-9] so
// the closing "]" is never swallowed and "[AMG--]"-style noise is rejected.
// (The earlier `[A-Z0-9]{6,20}` could not span the dash, so it extracted null
// for every real token and inbound replies never matched their thread.)
const THREAD_TOKEN_RE = /\[AMG-([A-Z0-9][A-Z0-9-]{4,28}[A-Z0-9])\]/i;

// Outbound mail sets Reply-To: thread+<public_id>@<inbound-domain>. That
// plus-address rides in the envelope recipient, so it survives subject edits,
// "Re:" prefixes, and quoting — the most tamper-resistant inbound-threading
// signal available.
const THREAD_PLUS_ADDRESS_RE = /thread\+([A-Z0-9][A-Z0-9-]{4,28}[A-Z0-9])@/i;

export function generateCommunicationPublicId(prefix: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 10; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${suffix}`;
}

export function subjectWithThreadToken(subject: string, threadPublicId: string) {
  if (subject.includes(`[AMG-${threadPublicId}]`)) return subject;
  return `[AMG-${threadPublicId}] ${subject}`.trim();
}

export function extractThreadPublicId(input?: string | null) {
  if (!input) return null;
  const match = input.match(THREAD_TOKEN_RE);
  return match?.[1] ?? null;
}

/**
 * Pull the thread public_id out of any `thread+<id>@…` recipient address.
 * Because this address is one AMG chose as the Reply-To, a reply delivered to it
 * is a reply to that thread by construction — a signal that holds even when the
 * subject token was stripped or the client sent no In-Reply-To header.
 */
export function extractThreadPublicIdFromAddresses(
  addresses?: (string | null | undefined)[] | null,
) {
  if (!addresses) return null;
  for (const address of addresses) {
    const match = address?.match(THREAD_PLUS_ADDRESS_RE);
    if (match?.[1]) return match[1];
  }
  return null;
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
