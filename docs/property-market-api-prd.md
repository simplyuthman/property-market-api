# Property Market API

## Product Summary
A public, read-only REST API serving realistic property market data: listings, agents, and property viewings, versioned at `/api/v1/`, deployed on Next.js with a PostgreSQL database via Prisma. No authentication is required to read data. A separate consumer application, also built in Next.js, calls this API over HTTP and renders the results, demonstrating that the API is reachable and functional from outside its own codebase. The dataset is generated using Faker rather than scraped or sourced from a live property market.

[ASSUMPTION] Addresses use US-style formatting, to keep field generation consistent. This is pending Open Question 2.
[ASSUMPTION] All `price` values are integers denominated in USD cents. This is stated directly in the schema, not left implicit.

## Problem Statement
Developers learning API design, and reviewers assessing a candidate's backend skills, need a working example that demonstrates REST conventions, pagination, filtering, sorting, input validation, rate limiting, and consistent response shaping, in a domain that behaves like a real business rather than a toy CRUD example. Most tutorial APIs skip the parts that matter in production: they don't clamp bad pagination limits, don't validate sort fields, and don't return consistent error envelopes. This project exists to prove those specific competencies using a property listings domain, which naturally supports rich filtering (price, location, bedrooms) and multiple related resources: agents who own listings, and viewings scheduled against those listings.

## Goals and Non-Goals

### Goals
- Ship a fully working, publicly reachable REST API with three resources: agents, listings, and property viewings.
- Demonstrate correct handling of pagination, filtering, sorting, and malformed input across all three resources.
- Enforce per-IP rate limiting on a public unauthenticated endpoint, using an implementation that actually works on the target serverless infrastructure.
- Ship a second, separately deployed consumer app that proves the API works for an external caller.
- Produce documentation good enough that a developer who has never spoken to the author can use the API from the README alone, verified against an objective test, not a vibe.

### Non-Goals
- No authentication or authorization system of any kind in version one.
- No write endpoints (no POST, PATCH, or DELETE) in version one, including for scheduling a new viewing.
- **No booking or scheduling logic.** Viewings are static, pre-generated records with no conflict detection, no double-booking prevention, and no availability calendar. Multiple viewings may exist for the same listing at the same time by design — this is not a bug.
- No admin panel, no dashboard, no landing page beyond API docs.
- No real-time features (no websockets, no live updates, no calendar sync for viewings).
- No monetization, billing, or API key tiering in version one.
- No multi-region or multi-market support in version one. [ASSUMPTION] Single market only, pending Open Question 2.

## User Personas

**Technical Reviewer ("Dana")**
A hiring manager or senior engineer evaluating a candidate's backend work. Dana will read the README first, then hit the live API with curl or Postman, then intentionally send bad input to see how the API responds. Dana cares about correctness under edge cases more than feature count, and will check whether a three-resource, two-relationship API stays consistent across all of them.

**Third-Party Developer ("Sam")**
A developer discovering the API who wants to build something on top of it, such as a demo frontend or a script. Sam needs clear endpoint documentation, predictable response shapes, and to understand rate limits before integrating.

**Consumer App User ("Casey")**
An end user of the small consumer app, who never sees the API directly. Casey wants to browse listings, see agent details, and see when a listing has upcoming viewings. Casey's experience exists purely to prove the API is externally consumable, not to be a polished product. This persona is directly tied to the consumer app deliverables listed under Phase 4 of the Roadmap: a listings browse page, a listing detail page, and an agent detail page.

## Functional Requirements

All endpoints are prefixed with `/api/v1/`. All responses use the shared success and error envelopes defined below.

### Success envelope
```json
{
  "data": [],
  "meta": { "total": 340, "limit": 20, "offset": 0, "hasMore": true }
}
```
For single-item responses, `data` is an object and `meta` is omitted.

### Error envelope
```json
{
  "error": { "code": "NOT_FOUND", "message": "Listing not found" }
}
```

### Endpoints

**GET /api/v1/agents**
List agents.
- Query params: `limit` (default 20, max 100), `offset` (default 0), `sort` (allowed: `name`, `createdAt`), `order` (`asc` | `desc`, default `asc`), `city` (filter, exact match)
- Response: `data` is an array of agent objects: `{ id, name, email, phone, city, createdAt }`
- Status: 200

> `minListings` has been removed from this endpoint. It required an aggregate count-and-filter query (Prisma `groupBy` with a `having` clause, or raw SQL) that is meaningfully more complex than every other filter in this API, and it did not serve either persona's stated needs. Cut for version one.

**GET /api/v1/agents/:id**
Get one agent, including a count of their listings.
- Response: `{ id, name, email, phone, city, createdAt, listingCount }`
- Status: 200 on found, 404 with `code: "NOT_FOUND"` if not, 400 with `code: "INVALID_ID"` if the id is malformed

**GET /api/v1/agents/:id/listings**
Nested resource: all listings belonging to one agent.
- Query params: same pagination and sorting as `/listings` below
- Status: 200 on found agent (even if listings array is empty), 404 if agent does not exist

**GET /api/v1/listings**
List listings.
- Query params: `limit` (default 20, max 100), `offset` (default 0), `sort` (allowed: `price`, `createdAt`, `bedrooms`), `order` (`asc` | `desc`, default `asc`), `category` (filter, enum: `sale`, `rent`), `minPrice` (filter, integer, USD cents), `maxPrice` (filter, integer, USD cents), `city` (filter, exact match), `bedrooms` (filter, integer)
- Response: `data` is an array of listing objects: `{ id, title, description, price, category, bedrooms, bathrooms, city, address, agentId, createdAt }`. `price` is an integer representing USD cents.
- Status: 200

**GET /api/v1/listings/:id**
Get one listing, with the associated agent embedded and a count of scheduled viewings.
- Response: `{ id, title, description, price, category, bedrooms, bathrooms, city, address, createdAt, agent: { id, name, email, phone }, viewingCount }`
- Status: 200 on found, 404 with `code: "NOT_FOUND"` if not, 400 with `code: "INVALID_ID"` if the id is malformed

**GET /api/v1/listings/:id/viewings**
Nested resource: all viewings scheduled against one listing.
- Query params: same pagination and sorting as `/viewings` below
- Status: 200 on found listing (even if viewings array is empty), 404 if listing does not exist

**GET /api/v1/viewings**
List property viewings.
- Query params: `limit` (default 20, max 100), `offset` (default 0), `sort` (allowed: `scheduledAt`, `createdAt`), `order` (`asc` | `desc`, default `asc`), `status` (filter, enum: `scheduled`, `completed`, `cancelled`), `listingId` (filter, exact match)
- Response: `data` is an array of viewing objects: `{ id, listingId, visitorName, visitorEmail, scheduledAt, status, createdAt }`. `visitorEmail` is masked (see below).
- Status: 200

**GET /api/v1/viewings/:id**
Get one viewing, with the associated listing embedded.
- Response: `{ id, visitorName, visitorEmail, scheduledAt, status, createdAt, listing: { id, title, city, price } }`. `visitorEmail` is masked (see below).
- Status: 200 on found, 404 with `code: "NOT_FOUND"` if not, 400 with `code: "INVALID_ID"` if the id is malformed

### Visitor email masking
Because this API is fully public and unauthenticated, `visitorEmail` is never returned in full in any response. It is masked to show only the domain, e.g. `***@example.com`. This applies to both the list and detail viewing endpoints. Full email addresses are never exposed, even though the underlying data is synthetic.

### Validation rules applied to every list endpoint
- `limit` above 100 is silently clamped to 100, not rejected.
- `offset` below 0 returns 400 with `code: "INVALID_OFFSET"`.
- An unknown value in `sort` returns 400 with `code: "INVALID_SORT_FIELD"`, naming the allowed values in the message.
- An unknown value in `order` (anything other than `asc` or `desc`) returns 400 with `code: "INVALID_ORDER_VALUE"`.
- A malformed `:id` (not a valid cuid) returns 400 with `code: "INVALID_ID"` before a database lookup is attempted.
- An unknown value in `status` or `category` returns 400 with `code: "INVALID_FILTER_VALUE"`.
- Unknown query parameters are ignored, not rejected.

## Technical Requirements

- **Framework**: Next.js (App Router), using Route Handlers for all API endpoints under `app/api/v1/`.
- **Language**: TypeScript throughout, `strict` mode enabled in `tsconfig.json`.
- **ORM**: Prisma, with a single `schema.prisma` defining `Agent`, `Listing`, and `PropertyViewing` models.
- **Database**: PostgreSQL. [ASSUMPTION] Hosted on Neon, pending Open Question 3.
- **Connection pooling**: Prisma connects to PostgreSQL via a pooled connection string (e.g., Neon's PgBouncer-backed pooled endpoint), configured from Phase 1 onward. Without pooling, serverless cold starts on Vercel can exhaust a free-tier database's connection limit, producing intermittent 500s unrelated to any real application bug.
- **Consumer app fetch strategy**: The consumer app fetches data server-side, using Next.js Server Components. This still proves external reachability (a genuinely separate deployment making a real HTTP call to the API's public URL) while avoiding CORS entirely, since the request never originates from a browser.
- **CORS**: Not required for the primary flow, since all consumer app requests are server-side. If a client-side "refresh" action is added later as a bonus, CORS headers permitting the consumer app's deployed origin would need to be added at that time. This is optional and not part of version one.
- **Validation**: A schema validator (Zod) validates all query parameters and route params in one shared location, not inline in each handler. `visitorEmail` is treated as a validated email string wherever it is read, even though there are no write endpoints, because the masking function needs a well-formed value to parse.
- **Rate limiting**: Per-IP limiting at roughly 100 requests per minute, implemented with Upstash Redis (or equivalent externally-hosted store). **In-memory limiting is explicitly not used**, because it does not persist across serverless invocations and would silently fail to limit anything in production.
- **Seeding**: A Prisma seed script (`prisma/seed.ts`) using `@faker-js/faker` to generate at least 30 agents, at least 300 listings, and at least 500 viewings distributed across listings and statuses. Viewings are generated with `scheduledAt` dates spread across past and future, and `status` is derived logically from that date (past dates get `completed` or `cancelled`, future dates get `scheduled`) rather than assigned purely at random. Emails are generated with `faker.internet.email()`, guaranteeing a well-formed value before masking is applied. The script must be idempotent: it checks for existing data or uses deterministic keys so re-running it does not create duplicates.
- **Identifiers**: All primary keys use Prisma's `cuid()`, never auto-incrementing integers.
- **Deployment**: The API and the consumer app are deployed as two separate projects on the same or different hosts (e.g. Vercel), each with its own public URL. The consumer app calls the API's public URL, not a local import or shared function.
- **Environment variables**: `DATABASE_URL` (pooled connection string) for Prisma, plus the rate-limiter connection string, set through the hosting platform's environment configuration, never committed to the repo.
- **Testing**: At minimum, integration tests for the bad-input cases listed in Functional Requirements (clamped limit, rejected negative offset, rejected unknown sort, rejected unknown order, malformed id, invalid filter value, envelope shape), run against all three resources.

## Business Model
None in version one. This is a free, public, unauthenticated demonstration API with no billing, no API keys, and no usage tiers. [ASSUMPTION] A future phase could introduce API keys, a free/paid tier structure, and a writable viewings endpoint (so a real visitor could actually book a viewing) if the project were to move beyond portfolio use, but no work should be done toward this in version one, and it is listed only as a roadmap note, not a requirement.

## Risks

- **Abuse of a public unauthenticated API**: without rate limiting, the API is a target for scraping or load. Mitigated by the per-IP rate limit specified above, implemented with an externally-hosted store rather than in-memory state.
- **Connection pool exhaustion**: Prisma on serverless functions can open more Postgres connections than a free-tier database allows, causing intermittent 500s under moderate load that are easy to mistake for application bugs. Mitigated by using a pooled connection string from Phase 1 onward.
- **Cold start / hosting costs on a free tier**: serverless functions and free-tier Postgres can sleep or throttle, making the API look broken to an external reviewer at the worst moment. Mitigate by choosing a host with acceptable free-tier cold-start behavior and documenting expected latency.
- **Seed script duplication**: if the seed script is not idempotent, repeated deploys or manual re-runs could double or triple the dataset across all three resources, breaking pagination totals. Mitigated by the idempotency requirement above.
- **Unrealistic viewings data**: if viewing dates and statuses are generated randomly without logical constraints (e.g. a `completed` viewing scheduled in the future), the data will look obviously fake to a reviewer. Mitigated by deriving `status` from `scheduledAt` during seeding.
- **Inconsistent error shapes across handlers**: if validation logic is duplicated per-route instead of centralized, error codes and shapes will drift over time, especially now that there are three resources to keep consistent. Mitigated by a single shared validation and error-handling layer.
- **Consumer app coupling**: if the consumer app is deployed in the same repo or process as the API, it does not actually prove external reachability. This must be a genuinely separate deployment hitting the public URL over HTTP.
- **Scope creep into write endpoints**: because a real viewings feature would naturally want a "book a viewing" write action, there is a temptation to add it ahead of schedule, which would require authentication and considerably more surface area. This is explicitly out of scope for version one per the Non-Goals section.

## Prisma Data Model

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Agent {
  id        String    @id @default(cuid())
  name      String
  email     String    @unique
  phone     String
  city      String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  listings  Listing[]

  @@index([city])
}

model Listing {
  id          String            @id @default(cuid())
  title       String
  description String
  price       Int
  category    Category
  bedrooms    Int
  bathrooms   Int
  city        String
  address     String
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  agentId     String
  agent       Agent             @relation(fields: [agentId], references: [id])
  viewings    PropertyViewing[]

  @@index([city])
  @@index([price])
  @@index([category])
  @@index([agentId])
}

model PropertyViewing {
  id           String        @id @default(cuid())
  visitorName  String
  visitorEmail String
  scheduledAt  DateTime
  status       ViewingStatus @default(scheduled)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  listingId    String
  listing      Listing       @relation(fields: [listingId], references: [id])

  @@index([listingId])
  @@index([status])
  @@index([scheduledAt])
}

enum Category {
  sale
  rent
}

enum ViewingStatus {
  scheduled
  completed
  cancelled
}
```

`price` is stored as an integer in USD cents to avoid floating-point rounding issues in filtering and sorting. `updatedAt` is included on all three models even though there are no write endpoints in version one, so a future write phase does not require a schema migration just to add audit fields. [ASSUMPTION] No `imageUrl` field is included pending Open Question 1; if images are required, add `imageUrl String?` to `Listing`. [ASSUMPTION] `PropertyViewing` has no separate `Visitor` entity; visitor name and email are stored directly on the viewing record, since there is no authentication or visitor account system in version one. `visitorEmail` is stored in full in the database but masked at the API response layer, never at rest.

## Success Metrics

Because this is a portfolio-grade project rather than a live product, success is measured by correctness and reachability, not usage volume:

- The API is deployed and reachable at a public URL with no login wall.
- All seven documented endpoints, across three resources, return correct status codes and envelope shapes.
- All bad-input cases in Functional Requirements behave exactly as specified when tested manually or via automated tests, across agents, listings, and viewings.
- The rate limiter returns 429 with a `Retry-After` header when the threshold is exceeded, verified with a load test script, and continues to work correctly across multiple separate serverless invocations (not just within one warm instance).
- The consumer app, deployed separately, successfully renders live data fetched from the public API URL, including at least one view showing a listing's related viewings, confirmed by calling it from a device other than the development machine.
- A developer can successfully call `GET /api/v1/listings` and receive a 200 response with valid `data` and `meta` fields, using only the exact curl command shown in the README, with zero additional explanation or trial and error.

## Assumptions

- The project is a portfolio/demonstration piece, not a commercial product, so no monetization or authentication work is done in version one. [ASSUMPTION]
- The property market is scoped to a single, generic market rather than multiple regions. [ASSUMPTION]
- Addresses use US-style formatting. [ASSUMPTION]
- All `price` values are USD cents. [ASSUMPTION]
- Listings do not include images in version one. [ASSUMPTION]
- PostgreSQL is hosted on Neon, accessed via a pooled connection string. [ASSUMPTION]
- The API remains read-only permanently unless a future phase explicitly reopens that decision, including for booking new viewings. [ASSUMPTION]
- Viewings have no separate visitor account or authentication; visitor details are plain fields on the viewing record, but `visitorEmail` is masked in every API response by default. [ASSUMPTION]
- Viewing status is derived logically during seeding from whether the scheduled date is in the past or future, not assigned purely at random. [ASSUMPTION]

## Phased Roadmap

**Phase 1: Core API foundation**
Design the three resources, write the Prisma schema (including `updatedAt` fields), configure the pooled Postgres connection string, build the seed script, implement all seven endpoints with pagination, filtering, sorting, and the shared envelopes.

**Phase 2: Hardening**
Add the schema validator layer, implement all bad-input handling across agents, listings, and viewings (including `order` validation), add Redis-backed rate limiting, add `visitorEmail` masking, write integration tests for every edge case listed in Functional Requirements. CORS headers are not added in this phase, since the consumer app fetches server-side (see Technical Requirements).

**Phase 3: Deployment and documentation**
Deploy the API to a public URL, run the seed script against production, write the full README with curl examples for every endpoint, confirm reachability from an external device, and verify the objective README success metric.

**Phase 4: Consumer app**
Build and deploy a separate small Next.js app that calls the live API and renders:
- a listings browse page
- a listing detail page, showing embedded agent info and viewing count
- an agent detail page
This proves external reachability end to end and directly serves the Casey persona.

**Phase 5 (future, not committed): Write access and API keys**
If ever pursued, this phase would add authenticated write endpoints, including the ability to book a new viewing, plus a basic API key or tiering system. Not part of version one.

## Open Questions

1. Do listings include images, and if so, are they placeholder URLs or something else?
2. Is the property market scoped to a single city, single country, or multiple regions?
3. Which managed Postgres host will be used (Neon, Supabase, Railway, or other)?
4. Will version two ever add authenticated write endpoints, or does this stay read-only permanently?
5. ~~Does the consumer app fetch data client-side in the browser or server-side via Next.js server components?~~ **Resolved:** server-side, via Next.js Server Components. CORS is not required for the primary flow (see Technical Requirements).