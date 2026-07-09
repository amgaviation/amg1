import "server-only";

/**
 * Best-effort in-memory, per-key rate limiter for public POST endpoints.
 *
 * Scope note: this is a coarse abuse brake, not a distributed quota. State lives
 * in the module (per server instance) and resets on cold start, so a determined
 * attacker across many instances isn't fully bounded — but it stops the common
 * case of a single script hammering one endpoint. The public API here is
 * deliberately storage-agnostic: Phase 4 can swap the internals for a shared
 * store (e.g. Upstash/Redis) without changing callers.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  /** Whether this request is allowed. */
  ok: boolean;
  /** Requests remaining in the current window (0 when blocked). */
  remaining: number;
  /** Seconds until the window resets — suitable for a `Retry-After` header. */
  retryAfterSeconds: number;
};

/** Drop expired buckets so the map can't grow unbounded across many IPs. */
export function pruneRateLimitBuckets(now = Date.now()): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Fixed-window counter. Returns `ok: false` once `limit` requests for `key`
 * arrive within `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Cheap safety valve against unbounded growth under a spray of unique keys.
  if (buckets.size > 5000) pruneRateLimitBuckets(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, retryAfterSeconds };
}

/**
 * Best-effort client IP from common proxy headers. Vercel/most reverse proxies
 * set `x-forwarded-for` (client is the first entry). Falls back to `x-real-ip`,
 * then a shared bucket so an unknown-IP flood is still coarsely limited.
 */
export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
