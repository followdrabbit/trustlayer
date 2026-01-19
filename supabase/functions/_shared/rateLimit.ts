type RateLimitState = {
  count: number;
  resetAt: number;
};

const DEFAULT_WINDOW_SECONDS = 60;
const buckets = new Map<string, RateLimitState>();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseNonNegativeInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function getRateLimitConfig(prefix: string): { limit: number; windowMs: number } {
  const windowSeconds = parsePositiveInt(
    Deno.env.get("RATE_LIMIT_WINDOW_SECONDS"),
    DEFAULT_WINDOW_SECONDS
  );
  const limit = parseNonNegativeInt(
    Deno.env.get(`${prefix}_RATE_LIMIT_MAX`),
    0
  );

  return { limit, windowMs: windowSeconds * 1000 };
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetMs: number } {
  if (limit <= 0) {
    return { allowed: true, remaining: -1, resetMs: 0 };
  }

  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(limit - 1, 0), resetMs: windowMs };
  }

  existing.count += 1;
  const remaining = Math.max(limit - existing.count, 0);
  const resetMs = Math.max(existing.resetAt - now, 0);

  return { allowed: existing.count <= limit, remaining, resetMs };
}

export function rateLimitHeaders(
  limit: number,
  remaining: number,
  resetMs: number
): Record<string, string> {
  if (limit <= 0) return {};

  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(remaining, 0)),
    "X-RateLimit-Reset": String(Math.ceil(resetMs / 1000)),
  };
}
