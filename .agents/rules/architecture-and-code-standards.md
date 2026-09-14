# Architecture & Code Standards

This rule document governs repository structure, coding conventions, separation of concerns, and database client usage.

## 1. Project Layout

```
/
├── apps/
│   ├── api/                        # Next.js API App
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
│   │   │           │   ├── route.ts            # GET /api/v1/listings
│   │   │           │   └── [id]/
│   │   │           │       ├── route.ts        # GET /api/v1/listings/:id
│   │   │           │       └── viewings/
│   │   │           │           └── route.ts    # GET /api/v1/listings/:id/viewings
│   │   │           └── viewings/
│   │   │               ├── route.ts            # GET /api/v1/viewings
│   │   │               └── [id]/
│   │   │                   └── route.ts        # GET /api/v1/viewings/:id
│   │   ├── lib/
│   │   │   ├── prisma.ts           # Shared PrismaClient singleton instance
│   │   │   ├── envelope.ts         # Shared success/error response envelope helpers
│   │   │   ├── validation/         # Zod schemas (agents.ts, listings.ts, viewings.ts, common.ts)
│   │   │   ├── rate-limit.ts       # Upstash Redis-backed rate limiter
│   │   │   └── mask-email.ts       # visitorEmail masking utility
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Prisma schema with cuid IDs and pooled connection
│   │   │   └── seed.ts             # Faker-based idempotent seed script
│   │   └── tests/
│   │       └── integration/        # Integration tests covering bad inputs for all resources
│   └── consumer/                   # Separate consumer app
│       ├── app/
│       │   ├── listings/           # Listings browse page
│       │   ├── listings/[id]/      # Listing detail page (with viewing count and agent)
│       │   └── agents/[id]/        # Agent detail page
│       └── lib/
│           └── api-client.ts       # Fetch wrapper pointed at the API's public URL only
├── AGENTS.md
└── README.md
```

## 2. Separation of Concerns

- **Route Handlers (`route.ts`):** Only responsible for HTTP request handling: extracting params, calling validation in `lib/validation/`, delegating business/data logic to `lib/`, applying rate-limiting, and wrapping responses using `lib/envelope.ts`.
- **Business & Query Logic (`lib/`):** All reusable logic, Zod validation schemas, rate limiting, and email masking live in `lib/`.
- **Database Access (`lib/prisma.ts`):** Instantiate `PrismaClient` once and export the singleton instance. Never call `new PrismaClient()` inside route handlers.
- **Consumer Isolation (`apps/consumer/`):** The consumer app must never import files from `apps/api/`, must never touch `prisma`, and must only communicate over HTTP via `apps/consumer/lib/api-client.ts` using Server Components (server-side only).
- **CORS Headers:** No CORS headers added to the API unless client-side fetch is explicitly requested. The primary consumer app flow is server-side and requires no CORS.

## 3. TypeScript & Code Style Rules

- **Strict Mode:** Always enabled in `tsconfig.json`.
- **Explicit Return Types:** Every exported function and route handler must have an explicit return type. No implicit `any`.
- **Naming Conventions:**
  - `camelCase` for functions, variables, and properties.
  - `PascalCase` for types, interfaces, and Prisma models.
  - `kebab-case` for non-Next.js file names.
- **Error Handling:** Every error path must return the standard error envelope `{ error: { code, message } }` with appropriate status code (400, 404, 429, 500). Never surface raw unhandled exceptions or stack traces to clients.
- **No Dead Code:** No commented-out code blocks left in files.
- **Intentional Comments:** Write comments explaining *why* decisions were made, not describing obvious syntax.
