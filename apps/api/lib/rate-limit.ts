import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Only initialize Redis if real credentials are provided (not dummy placeholders)
const isConfigured =
  redisUrl &&
  redisToken &&
  !redisUrl.includes("sample-redis") &&
  !redisToken.includes("sample_upstash");

const redis = isConfigured
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "60 s"),
      analytics: true,
      prefix: "pm_ratelimit",
    })
  : null;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Checks rate limit for a given client identifier (e.g. IP address).
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  if (!ratelimit) {
    return {
      success: true,
      limit: 100,
      remaining: 100,
      reset: Date.now() + 60000,
    };
  }

  try {
    const result = await ratelimit.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // If Redis is temporarily unreachable, fallback gracefully to allow requests
    console.warn("Rate limiter network check bypassed:", error instanceof Error ? error.message : error);
    return {
      success: true,
      limit: 100,
      remaining: 100,
      reset: Date.now() + 60000,
    };
  }
}
