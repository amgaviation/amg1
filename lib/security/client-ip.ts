import "server-only";

/** Anything with a `get(name)` — a real `Headers`, or Next's `ReadonlyHeaders`. */
export type HeaderReader = Pick<Headers, "get">;

/**
 * Client IP resolution, split by how much the answer is trusted to carry.
 *
 * `x-forwarded-for` is appended to by every hop, including the client. A
 * request can arrive carrying `X-Forwarded-For: <anything>` and, unless a proxy
 * in front of us overwrites rather than appends, `split(",")[0]` hands back the
 * attacker's own string. That is tolerable for a rate-limit key (worst case the
 * limiter is evaded, which it already is across instances) and NOT tolerable for
 * an access decision, where it is a straight authentication bypass.
 *
 * Vercel sets `x-vercel-forwarded-for` at the edge and overwrites any inbound
 * value, so it is the one header here a caller cannot forge. Everything else is
 * a hint.
 */

/** Leftmost entry of a comma-separated forwarding header. */
function firstEntry(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

/**
 * The client IP, or `null` when no platform-set header is present.
 *
 * Use this — and only this — when the IP grants access. Returning `null` off
 * Vercel is deliberate: an allowlist compared against a spoofable header is
 * worse than no allowlist, because it reads as a control while granting
 * whatever the caller asks for. Callers must treat `null` as "not trusted" and
 * fall through to real authentication.
 */
export function trustedClientIp(headers: HeaderReader): string | null {
  return firstEntry(headers.get("x-vercel-forwarded-for"));
}

/**
 * Best-effort client IP for bucketing and logging. Never an access decision.
 *
 * Prefers the unspoofable header so the common deployment gets a real key, then
 * degrades to the proxy hints, then to a shared bucket so an unknown-IP flood is
 * still coarsely limited rather than unlimited.
 */
export function bestEffortClientIp(headers: HeaderReader): string {
  return (
    trustedClientIp(headers) ??
    firstEntry(headers.get("x-forwarded-for")) ??
    headers.get("x-real-ip")?.trim() ??
    "unknown"
  );
}
