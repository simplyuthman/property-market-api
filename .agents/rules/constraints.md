# Non-Negotiable Constraints & Invariants

This rule document enforces the absolute boundaries and hard constraints defined in AGENTS.md and the PRD. Violating any constraint here means the task has failed.

## 1. Locked Technical Decisions

- **Framework:** Next.js App Router only (Route Handlers under `app/api/v1/`). No Pages Router.
- **Language:** TypeScript with `strict: true` in `tsconfig.json`. No plain JavaScript files.
- **ORM:** Prisma (`schema.prisma` in `apps/api/prisma/schema.prisma`). No raw SQL query builders or direct `pg` client usage (except Prisma raw query if required).
- **Database:** PostgreSQL on Neon accessed **only** through a **pooled connection string** (e.g. PgBouncer-backed endpoint). Never connect via a direct unpooled connection string from serverless functions.
- **Validation:** Zod schemas centralized in `apps/api/lib/validation/`. No hand-rolled or inline validation in route handlers.
- **Rate Limiting:** Upstash Redis (or equivalent external store). **In-memory rate limiting is strictly forbidden**.
- **Data Generation:** `@faker-js/faker` for all seed data in `prisma/seed.ts`. Do not scrape or hand-write fixture data.
- **Identifiers:** Prisma `cuid()` on every primary key. Never use auto-incrementing sequential integers.
- **Deployment target:** Vercel-style serverless functions. Every technical decision must assume cold starts, no shared memory between invocations, and connection limits on the database.
- **Consumer App:** A separate deployed project from the API, with its own public URL. It calls the API over HTTP like any external client. It must never import API code directly or share a deployment with the API.
- **Consumer App Fetch Strategy:** Server-side only, using Next.js Server Components. Do not add client-side (browser) fetching to the primary pages. This is a deliberate choice to prove external reachability without depending on CORS. If a bonus client-side "refresh" action is ever added, it requires its own CORS setup and is not part of version one.

## 2. Hard Boundaries (What Must NEVER Happen)

1. **Never add authentication, login, sessions, or API keys.** This is a fully public, unauthenticated read API in version one.
2. **Never add a write endpoint.** No `POST`, `PATCH`, `PUT`, or `DELETE` on any resource, including a "book a viewing" endpoint. All seven documented `GET` endpoints are the entire surface area.
3. **Never implement booking, scheduling, or conflict-detection logic.** Viewings are static, pre-generated records. Two viewings existing at the same time for the same listing is correct behavior, not a bug to fix.
4. **Never return a full, unmasked visitorEmail in any API response**, in any endpoint, under any condition — including error messages, logs surfaced to a client, or debug output. Always mask it to domain-only (e.g. `***@example.com`) at the response layer.
5. **Never store money as a decimal or float.** `price` is always a whole-number integer in USD cents. Never introduce a `Float`, `Decimal`, or string-based currency field anywhere.
6. **Never use a sequential integer as a primary key.** Every model uses `cuid()`.
7. **Never silently accept bad input.** Every list endpoint must enforce all of the following exactly as specified, with the exact error codes:
   - `limit` above 100 is clamped to 100 (not rejected).
   - `offset` below 0 returns `400 INVALID_OFFSET`.
   - Unknown `sort` value returns `400 INVALID_SORT_FIELD`.
   - Unknown `order` value (not `asc`/`desc`) returns `400 INVALID_ORDER_VALUE`.
   - Malformed `:id` returns `400 INVALID_ID` **before** any database lookup runs.
   - Unknown `status`/`category` value returns `400 INVALID_FILTER_VALUE`.
   - Unknown query parameters are ignored, never rejected.
8. **Never use inconsistent response shapes.** Every success response uses the `{ data, meta }` envelope. Every error response uses the `{ error: { code, message } }` envelope. No endpoint returns a bare array, a bare object, or a differently-shaped error.
9. **Never use in-memory state for rate limiting or any cross-request state.** Anything that needs to persist across requests goes into Redis or PostgreSQL, never a module-level variable, never a file on disk.
10. **Never open a direct (unpooled) database connection from a serverless function.** Always use the pooled connection string.
11. **Never let the consumer app talk to the database directly, and never let it bundle server-only Prisma code.** It calls the public API over HTTP only, server-side via Server Components.
12. **Never add CORS headers to the API unless a client-side fetch is explicitly requested.** The primary consumer app flow is server-side and requires no CORS. Adding CORS speculatively increases the API's attack surface for no benefit in version one.
13. **Never add monetization, billing, pricing tiers, or paid API keys.** Version one is free and has no business model.
14. **Never expand scope to multiple resources beyond agents, listings, and viewings**, and never add fields not specified in the Prisma Data Model, without being told to.
15. **Never commit secrets.** `DATABASE_URL`, Redis credentials, and any other secret live only in environment variables set through the hosting platform. Never hardcode them, never commit a `.env` file with real values.
16. **Never skip the seed script's idempotency requirement.** Running the seed script twice must never create duplicate agents, listings, or viewings.
