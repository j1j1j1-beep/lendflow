import { rateLimit, type RateLimiter } from "@/lib/rate-limit";

/**
 * Check rate limit for a request. Returns null if under limit (proceed),
 * or a 429 Response if over limit.
 *
 * Usage in a route handler:
 * ```ts
 * const limited = await withRateLimit(request, writeLimit);
 * if (limited) return limited;
 * ```
 */
export async function withRateLimit(
  request: Request,
  limiter: RateLimiter,
): Promise<Response | null> {
  const result = rateLimit(request, limiter);

  if (result.success) {
    return null;
  }

  const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetAt),
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
