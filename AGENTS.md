# AGENTS.md

## 1. What Is This Project

This is the **Property Market API**, a public, read-only REST API that serves realistic property market data (agents, listings, and property viewings), plus a separate consumer app that proves the API works from outside its own codebase.

- **What it does:** Serves paginated, filterable, sortable JSON data for three resources — agents, listings, and viewings — with no authentication required to read.
- **Who it's for:** Technical reviewers evaluating backend skill, and third-party developers who might build on top of the API.
- **Version being built:** Version one only — Phases 1 through 4 of the roadmap. Phase 5 (write access, API keys) is explicitly future and out of scope.
- **Source of truth:** The PRD (`Property Market API`) is the single source of truth for *what* to build. This file governs *how* you behave while building it. If this file and the PRD ever conflict, the PRD wins on features and scope; this file wins on process, structure, and non-negotiable constraints. If you find a genuine contradiction between them, stop and flag it — do not silently pick a side.

---

## 2. What Is Locked

These choices are already made. You do not evaluate, swap, "improve," or second-guess any of them, even if you believe a different tool is objectively better.

- **Framework:** Next.js, App Router, Route Handlers only. No Pages Router.
- **Language:** TypeScript, `strict` mode enabled. No plain JavaScript files anywhere in the project.
- **ORM:** Prisma. No raw SQL query builders, no alternate ORMs, no direct `pg` client usage, except where the PRD explicitly calls for a raw query (e.g., aggregate counts) and even then it goes through Prisma's raw query interface.
- **Database:** PostgreSQL, hosted on Neon, accessed only through a **pooled** connection string. Never connect via a direct (non-pooled) connection string from a serverless function.
- **Validation library:** Zod. All query parameters and route parameters are validated through Zod schemas in one shared location. Do not hand-roll validation logic per route.
- **Rate limiting store:** Upstash Redis (or an equivalent externally-hosted store). **In-memory rate limiting is forbidden**, not discouraged — it does not persist across serverless invocations and will silently fail in production.
- **Data generation:** `@faker-js/faker` for all seed data. Do not scrape real listings or hand-write fixture data.
- **Identifiers:** Prisma `cuid()` on every primary key. Never a sequential integer, ever, for any model.
- **Deployment target:** Vercel-style serverless functions. Every technical decision must assume cold starts, no shared memory between invocations, and connection limits on the database.
- **Consumer app:** A separate deployed project from the API, with its own public URL. It calls the API over HTTP like any external client. It must never import API code directly or share a deployment with the API.
- **Consumer app fetch strategy:** Server-side only, using Next.js Server Components. Do not add client-side (browser) fetching to the primary pages. This is a deliberate choice to prove external reachability without depending on CORS. If a bonus client-side "refresh" action is ever added, it requires its own CORS setup and is not part of version one.

If a task seems to require breaking one of these, stop and flag it instead of working around it.

---

## 3. What Must Never Happen

Every rule below is a hard boundary, not a style preference. **Breaking any rule on this list means the task has failed, even if the code compiles, the tests pass, and the feature appears to work.** Where the PRD states the requirement directly, it is cited.

1. **Never add authentication, login, sessions, or API keys.** This is a fully public, unauthenticated read API in version one. (PRD: Non-Goals, Technical Requirements.)
2. **Never add a write endpoint.** No `POST`, `PATCH`, `PUT`, or `DELETE` on any resource, including a "book a viewing" endpoint. All seven documented `GET` endpoints are the entire surface area. (PRD: Non-Goals, Functional Requirements.)
3. **Never implement booking, scheduling, or conflict-detection logic.** Viewings are static, pre-generated records. Two viewings existing at the same time for the same listing is correct behavior, not a bug to fix. (PRD: Non-Goals.)
4. **Never return a full, unmasked `visitorEmail` in any API response**, in any endpoint, under any condition — including error messages, logs surfaced to a client, or debug output. Always mask it to domain-only (e.g. `***@example.com`) at the response layer. (PRD: Functional Requirements — Visitor email masking.)
5. **Never store money as a decimal or float.** `price` is always a whole-number integer in USD cents. Never introduce a `Float`, `Decimal`, or string-based currency field anywhere. (PRD: Prisma Data Model.)
6. **Never use a sequential integer as a primary key.** Every model uses `cuid()`. (PRD: Technical Requirements.)
7. **Never silently accept bad input.** Every list endpoint must enforce all of the following exactly as specified, with the exact error codes:
   - `limit` above 100 is clamped to 100 (not rejected).
   - `offset` below 0 returns `400 INVALID_OFFSET`.
   - Unknown `sort` value returns `400 INVALID_SORT_FIELD`.
   - Unknown `order` value (not `asc`/`desc`) returns `400 INVALID_ORDER_VALUE`.
   - Malformed `:id` returns `400 INVALID_ID` **before** any database lookup runs.
   - Unknown `status`/`category` value returns `400 INVALID_FILTER_VALUE`.
   - Unknown query parameters are ignored, never rejected.
   (PRD: Functional Requirements — Validation Rules.)
8. **Never use inconsistent response shapes.** Every success response uses the `{ data, meta }` envelope. Every error response uses the `{ error: { code, message } }` envelope. No endpoint returns a bare array, a bare object, or a differently-shaped error.
9. **Never use in-memory state for rate limiting or any cross-request state.** Anything that needs to persist across requests goes into Redis or PostgreSQL, never a module-level variable, never a file on disk.
10. **Never open a direct (unpooled) database connection from a serverless function.** Always use the pooled connection string. This protects the database from connection exhaustion, which is a production outage, not a cosmetic bug.
11. **Never let the consumer app talk to the database directly, and never let it bundle server-only Prisma code.** It calls the public API over HTTP only, server-side via Server Components. Mixing these breaks the entire point of the project, which is proving external reachability.
12. **Never add CORS headers to the API unless a client-side fetch is explicitly requested.** The primary consumer app flow is server-side and requires no CORS. Adding CORS speculatively increases the API's attack surface for no benefit in version one.
13. **Never add monetization, billing, pricing tiers, or paid API keys.** Version one is free and has no business model. (PRD: Business Model.)
14. **Never expand scope to multiple resources beyond agents, listings, and viewings**, and never add fields not specified in the Prisma Data Model, without being told to.
15. **Never commit secrets.** `DATABASE_URL`, Redis credentials, and any other secret live only in environment variables set through the hosting platform. Never hardcode them, never commit a `.env` file with real values.
16. **Never skip the seed script's idempotency requirement.** Running the seed script twice must never create duplicate agents, listings, or viewings.

---

## 4. How Is the Work Arranged

Follow this folder layout. Do not invent a different structure, and do not scatter logic across arbitrary locations.

```
/
├── apps/
│   ├── api/                        # The Next.js API project
│   │   ├── app/
│   │   │   └── api/
│   │   │       └── v1/
│   │   │           ├── agents/
│   │   │           │   ├── route.ts            # GET /api/v1/agents
│   │   │           │   └── [id]/
│   │   │           │       ├── route.ts        # GET /api/v1/agents/:id
│   │   │           │       └── listings/
│   │   │           │           └── route.ts    # GET /api/v1/agents/:id/listings
│   │   │           ├── listings/
│   │   │           │   ├── route.ts
│   │   │           │   └── [id]/
│   │   │           │       ├── route.ts
│   │   │           │       └── viewings/
│   │   │           │           └── route.ts
│   │   │           └── viewings/
│   │   │               ├── route.ts
│   │   │               └── [id]/
│   │   │                   └── route.ts
│   │   ├── lib/
│   │   │   ├── prisma.ts           # Single Prisma client instance (pooled connection)
│   │   │   ├── envelope.ts         # Shared success/error envelope builders
│   │   │   ├── validation/         # Zod schemas, one file per resource
│   │   │   ├── rate-limit.ts       # Redis-backed rate limiter
│   │   │   └── mask-email.ts       # visitorEmail masking utility
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── tests/
│   │       └── integration/        # One file per resource, covering all bad-input cases
│   └── consumer/                   # The separate consumer app project
│       ├── app/
│       │   ├── listings/           # Listings browse page
│       │   ├── listings/[id]/      # Listing detail page
│       │   └── agents/[id]/        # Agent detail page
│       └── lib/
│           └── api-client.ts       # Fetch wrapper pointed at the API's public URL only
├── AGENTS.md
└── README.md
```

Rules about this layout:
- **Business logic (validation, masking, rate limiting) lives in `lib/`, never inline inside a `route.ts` file.** Route handlers call into `lib/` functions; they do not contain raw Prisma queries or raw Zod parsing themselves.
- **One Prisma client instance, shared across the whole API app**, instantiated in `lib/prisma.ts`. Never instantiate `new PrismaClient()` inside a route handler.
- **The consumer app has no access to `lib/prisma.ts`, `schema.prisma`, or any API-side code.** It only knows the API's public base URL.
- **Heavy or repeated work (seeding, aggregate queries) stays in `prisma/seed.ts` or `lib/`, never duplicated inline across multiple route files.**

---

## 5. How Should the Code Look

- Write clean, readable TypeScript. No cleverness for its own sake — prefer the boring, obvious solution over a dense one-liner.
- Use current LTS Node.js and current stable versions of Next.js, Prisma, and Zod. Do not pin to outdated versions, and do not adopt bleeding-edge/canary releases either.
- Every exported function has an explicit return type. No implicit `any`.
- No commented-out code left in place. Delete it or don't write it.
- One responsibility per file. A route file handles HTTP concerns (parsing, calling lib functions, returning the envelope); it does not also contain business logic.
- Consistent naming: `camelCase` for variables and functions, `PascalCase` for types and Prisma models, `kebab-case` for file names outside of Next.js's required conventions.
- Every error path returns the shared error envelope — never a raw thrown error surfaced to the client, never an unhandled promise rejection.
- Comments explain *why*, not *what*. Do not narrate obvious code.

---

## 6. What Counts as Done

Before marking any task complete, produce a checklist covering everything below, confirm each item, and confirm the project builds with zero errors and zero type errors.

```
- [ ] Code builds with no errors and no TypeScript errors
- [ ] All Zod validation rules from Section 3, Rule 7 are implemented and tested
- [ ] Every response uses the correct shared envelope (success or error)
- [ ] visitorEmail is masked in every response that includes it
- [ ] price fields are integers, never floats or decimals
- [ ] No sequential integer IDs anywhere — all cuid()
- [ ] Rate limiting is Redis-backed, not in-memory, and returns 429 + Retry-After when exceeded
- [ ] Database connection uses the pooled connection string
- [ ] Consumer app fetches server-side only (Server Components), not client-side
- [ ] No CORS headers added to the API unless a client-side fetch was explicitly requested
- [ ] Seed script runs twice with no duplicate records created
- [ ] No write endpoints exist anywhere in the API
- [ ] No authentication code exists anywhere in the API
- [ ] Consumer app only calls the API over HTTP, with no direct database or Prisma access
- [ ] Integration tests cover every bad-input case listed in Section 3, Rule 7
- [ ] Folder layout matches Section 4 exactly — no logic misplaced outside lib/
- [ ] No feature from Phase 5 (or any out-of-scope item) has been added
```

If any box cannot be checked, the task is not done. Say so plainly instead of marking it complete.

---

## 7. What Does the Agent Do When Unsure

- **Do not guess and keep going.** If a requirement is ambiguous, stop and ask, or make the smallest possible reasonable assumption, state it explicitly in your output, and flag it for review. Never bury an assumption silently inside code.
- **Never invent a new feature, endpoint, field, or resource that is not in the PRD**, even if it seems like an obvious improvement. If you think something is missing, say so — do not just add it.
- **Never expand scope to "while I'm in here" work.** If you notice an unrelated issue, note it separately. Do not fix it as a side effect of the current task.
- **When two valid approaches exist and neither is specified, pick the simplest one that satisfies the stated requirement, and say which one you picked and why.** Do not pick the most feature-rich or most "impressive" option by default.
- **Never patch around a locked-choice constraint with workaround code.** For example, if pooling seems inconvenient, do not fall back to a direct connection "just for now." Stop and flag it instead.
- **When a task would require breaking a rule in Section 3, refuse the task as written and explain which rule blocks it**, rather than completing it in a way that quietly violates the rule.
- **Prefer an incomplete, clearly-labeled task over a complete task built on a guess.** A half-finished feature with an honest note is recoverable. Spaghetti code built to paper over uncertainty is not.