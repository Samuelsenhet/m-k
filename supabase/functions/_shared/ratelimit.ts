// Rate Limiting Helper for Edge Functions
// Uses in-memory storage (sufficient for edge function use case)

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Check if blocked
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Check if window expired - reset counter
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true };
  }

  // Check if max attempts exceeded
  if (entry.count >= config.maxAttempts) {
    const blockDuration = config.blockDurationMs || config.windowMs;
    const blockedUntil = now + blockDuration;

    rateLimitStore.set(key, {
      ...entry,
      blockedUntil,
    });

    const retryAfter = Math.ceil(blockDuration / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment counter
  rateLimitStore.set(key, {
    ...entry,
    count: entry.count + 1,
  });

  return { allowed: true };
}

// Cleanup old entries periodically (optional optimization)
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt && (!entry.blockedUntil || now >= entry.blockedUntil)) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
