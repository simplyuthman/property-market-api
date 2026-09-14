---
name: setup-rate-limiter
description: >-
  Use this skill when configuring, implementing, or testing the Upstash Redis-backed per-IP rate limiter for the Property Market API.
---

# Rate Limiter Implementation & Testing Workflow

This skill guides the implementation and verification of serverless-compatible rate limiting.

## Hard Requirements

1. **Store:** Must use Upstash Redis (or equivalent external distributed store via `@upstash/ratelimit` / `@upstash/redis`).
2. **In-Memory Forbidden:** In-memory rate limiting must NOT be used because it does not persist across serverless instances.
3. **Threshold:** 100 requests per minute per IP.
4. **Behavior on Exceeded:**
   - Return status `429 Too Many Requests`.
   - Set HTTP header: `Retry-After: <seconds>`.
   - Response body:
     ```json
     {
       "error": {
         "code": "RATE_LIMITED",
         "message": "Too many requests. Please try again later."
       }
     }
     ```

## Implementation Guide (`apps/api/lib/rate-limit.ts`)

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
  prefix: "pm_ratelimit",
});
```

## IP Extraction Strategy

In Next.js Route Handlers:
```typescript
const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
const { success, reset } = await ratelimit.limit(ip);
```

## Verification & Load Testing

1. Send rapid requests to verify header and body:
   ```bash
   for i in {1..105}; do curl -i http://localhost:3000/api/v1/listings; done
   ```
2. Confirm request #101 returns status 429, `Retry-After` header, and standard error envelope.
