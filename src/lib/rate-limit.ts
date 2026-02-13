// NOTE: This in-memory rate limiter provides best-effort protection on serverless platforms.
// For production use, consider upgrading to Upstash Redis (@upstash/ratelimit) for persistent rate limiting.
// On Vercel, each cold start creates a new Map, so limits reset per instance.

// In-memory sliding window rate limiter

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  resetAt: number;
}

export interface RateLimiter {
  config: RateLimitConfig;
  check: (identifier: string) => RateLimitResult;
}

// Store: IP -> array of request timestamps
const store = new Map<string, number[]>();

// Auto-cleanup expired entries every 60 seconds to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;
let maxRegisteredWindowMs = 0;

function ensureCleanupRunning(windowMs: number) {
  maxRegisteredWindowMs = Math.max(maxRegisteredWindowMs, windowMs);
  if (cleanupTimer !== null) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store) {
      // Use max of all registered windows so no limiter's entries are prematurely evicted
      const filtered = timestamps.filter((t) => now - t < maxRegisteredWindowMs);
      if (filtered.length === 0) {
        store.delete(key);
      } else {
        store.set(key, filtered);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  // Allow the Node process to exit even if the timer is running
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Create a rate limiter with the given config.
 */
function createLimiter(config: RateLimitConfig): RateLimiter {
  ensureCleanupRunning(config.windowMs);

  return {
    config,
    check(identifier: string): RateLimitResult {
      // Emergency cleanup if store gets too large
      if (store.size > 10000) {
        const cleanupNow = Date.now();
        for (const [key, timestamps] of store) {
          const filtered = timestamps.filter((t) => cleanupNow - t < config.windowMs);
          if (filtered.length === 0) store.delete(key);
          else store.set(key, filtered);
        }
      }

      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get existing timestamps and filter to current window
      const existing = store.get(identifier) ?? [];
      const inWindow = existing.filter((t) => t > windowStart);

      if (inWindow.length >= config.maxRequests) {
        // Over limit — find when the oldest request in the window expires
        const oldestInWindow = inWindow[0];
        const resetAt = oldestInWindow + config.windowMs;
        return {
          success: false,
          remaining: 0,
          resetAt,
        };
      }

      // Under limit — record this request
      inWindow.push(now);
      store.set(identifier, inWindow);

      return {
        success: true,
        remaining: config.maxRequests - inWindow.length,
        resetAt: now + config.windowMs,
      };
    },
  };
}

/**
 * Extract an IP identifier from a Request object.
 */
export function getIdentifier(request: Request): string {
  const headers = new Headers(request.headers);
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be comma-separated; take the first (client) IP
    return forwarded.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "anonymous";
}

/**
 * Check rate limit for a request against a limiter.
 */
export function rateLimit(
  request: Request,
  limiter: RateLimiter,
): RateLimitResult {
  const identifier = getIdentifier(request);
  return limiter.check(identifier);
}

// Pre-configured limiters

/** 200 requests per minute — for GET/read endpoints */
export const generalLimit = createLimiter({
  maxRequests: 200,
  windowMs: 60_000,
});

/** 60 requests per minute — for POST/write endpoints */
export const writeLimit = createLimiter({
  maxRequests: 60,
  windowMs: 60_000,
});

/** 10 requests per minute — for heavy pipeline triggers */
export const heavyLimit = createLimiter({
  maxRequests: 10,
  windowMs: 60_000,
});

/** 5 requests per minute — for pipeline trigger endpoints */
export const pipelineLimit = createLimiter({
  maxRequests: 5,
  windowMs: 60_000,
});

/** 500 requests per minute — for Inngest/Stripe webhooks */
export const webhookLimit = createLimiter({
  maxRequests: 500,
  windowMs: 60_000,
});
