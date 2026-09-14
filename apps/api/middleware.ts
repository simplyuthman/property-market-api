import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api/v1")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const { success, reset } = await checkRateLimit(ip);

    if (!success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again later.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/v1/:path*",
};
