/**
 * Tiny in-memory rate limiter (per server process). Good enough to slow down password guessing
 * and form spam on a single server; use a shared store (Redis/Upstash) if you scale to many servers.
 */
const hits = new Map<string, { n: number; reset: number }>();

export function tooMany(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return false;
  }
  h.n += 1;
  return h.n > max;
}

export function clearLimit(key: string) {
  hits.delete(key);
}
