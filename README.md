# Property Market REST API & Consumer Application

A public, read-only REST API serving realistic property market data (agents, listings, and property viewings) built with **Next.js (App Router Route Handlers)**, **Prisma ORM**, and **PostgreSQL (Neon pooled connection)**.

Accompanying the API is an isolated, server-rendered **Consumer Application** built with Next.js Server Components that consumes the API over HTTP.

---

## 📑 Table of Contents
- [Overview](#overview)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Response Envelopes](#response-envelopes)
- [API Endpoints & Curl Examples](#api-endpoints--curl-examples)
- [Validation & Error Codes](#validation--error-codes)
- [Rate Limiting](#rate-limiting)
- [Data Model](#data-model)
- [Local Setup & Running](#local-setup--running)
- [Running Integration Tests](#running-integration-tests)

---

## Overview

- **Base URL Prefix:** `/api/v1/`
- **Authentication:** None (Public, read-only).
- **HTTP Methods:** `GET` only (No write endpoints in version one).
- **Visitor Privacy:** `visitorEmail` is masked to domain-only (`***@domain.com`) across all viewing endpoints.
- **Pricing:** Denominated as whole-number integers in USD cents (e.g., `$450,000` is `45000000`).

---

## Architecture & Tech Stack

```
/
├── apps/
│   ├── api/                        # Next.js App Router Route Handlers
│   │   ├── app/api/v1/             # 7 REST GET Endpoints
│   │   ├── lib/                    # Shared validation, envelopes, rate-limiter, Prisma singleton
│   │   ├── prisma/                 # Schema and Faker-based seed script
│   │   └── tests/integration/      # 31 bad-input & envelope integration tests
│   └── consumer/                   # Standalone Next.js Server Components consumer app
│       ├── app/listings/           # Listings browse page with filter bar
│       ├── app/listings/[id]/      # Listing detail with embedded agent & viewings count
│       ├── app/agents/[id]/        # Agent profile with portfolio
│       └── lib/api-client.ts       # Pure HTTP fetch client
```

---

## Response Envelopes

### List Response Envelope
```json
{
  "data": [
    {
      "id": "cm1abcdef0001",
      "title": "Modern Loft with 2 Bed in Austin",
      "price": 45000000,
      "category": "sale",
      "bedrooms": 2,
      "bathrooms": 2,
      "city": "Austin",
      "address": "123 Congress Ave",
      "agentId": "cm1agent0001",
      "createdAt": "2026-09-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 350,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Single Item Response Envelope
```json
{
  "data": {
    "id": "cm1abcdef0001",
    "title": "Modern Loft with 2 Bed in Austin",
    "price": 45000000,
    "category": "sale",
    "bedrooms": 2,
    "bathrooms": 2,
    "city": "Austin",
    "address": "123 Congress Ave",
    "createdAt": "2026-09-01T10:00:00.000Z",
    "agent": {
      "id": "cm1agent0001",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "(512) 555-0199"
    },
    "viewingCount": 3
  }
}
```

### Error Response Envelope
```json
{
  "error": {
    "code": "INVALID_SORT_FIELD",
    "message": "Invalid sort field 'invalid_name'. Allowed fields: price, createdAt, bedrooms."
  }
}
```

---

## API Endpoints & Curl Examples

### 1. List Listings
```bash
curl -X GET "http://localhost:3000/api/v1/listings?category=sale&city=Austin&limit=10"
```
**Query Parameters:**
- `limit` (default `20`, clamped to max `100`)
- `offset` (default `0`, `>= 0`)
- `sort` (`price` | `createdAt` | `bedrooms`, default `createdAt`)
- `order` (`asc` | `desc`, default `asc`)
- `category` (`sale` | `rent`)
- `minPrice` (integer in USD cents)
- `maxPrice` (integer in USD cents)
- `city` (exact match filter)
- `bedrooms` (integer count)

### 2. Get Single Listing
```bash
curl -X GET "http://localhost:3000/api/v1/listings/cm1abcdef0001"
```
Returns listing object with embedded agent `{ id, name, email, phone }` and `viewingCount`.

### 3. List Viewings for a Listing
```bash
curl -X GET "http://localhost:3000/api/v1/listings/cm1abcdef0001/viewings"
```
Returns all scheduled viewings for the listing with domain-masked `visitorEmail` (e.g. `***@example.com`).

### 4. List Agents
```bash
curl -X GET "http://localhost:3000/api/v1/agents?city=Austin"
```
**Query Parameters:** `limit`, `offset`, `sort` (`name` | `createdAt`), `order` (`asc` | `desc`), `city`.

### 5. Get Single Agent
```bash
curl -X GET "http://localhost:3000/api/v1/agents/cm1agent0001"
```
Returns agent details along with `listingCount`.

### 6. List Listings by Agent
```bash
curl -X GET "http://localhost:3000/api/v1/agents/cm1agent0001/listings"
```
Returns paginated listings belonging to the specified agent.

### 7. List Property Viewings
```bash
curl -X GET "http://localhost:3000/api/v1/viewings?status=scheduled"
```
**Query Parameters:** `limit`, `offset`, `sort` (`scheduledAt` | `createdAt`), `order` (`asc` | `desc`), `status` (`scheduled` | `completed` | `cancelled`), `listingId`.

### 8. Get Single Viewing
```bash
curl -X GET "http://localhost:3000/api/v1/viewings/cm1viewing0001"
```
Returns viewing details with masked email and embedded listing info.

---

## Validation & Error Codes

| Condition | Status | Error Code | Behavior |
| :--- | :--- | :--- | :--- |
| `limit > 100` | 200 OK | *None* | Silently clamped to `100` |
| `offset < 0` | 400 Bad Request | `INVALID_OFFSET` | Rejects with error message |
| Unknown `sort` | 400 Bad Request | `INVALID_SORT_FIELD` | Rejects and lists allowed sort fields |
| Unknown `order` | 400 Bad Request | `INVALID_ORDER_VALUE` | Rejects and states `asc` or `desc` |
| Malformed `:id` | 400 Bad Request | `INVALID_ID` | Validated before DB query |
| Resource not found | 404 Not Found | `NOT_FOUND` | Standard 404 envelope |
| Unknown filter value | 400 Bad Request | `INVALID_FILTER_VALUE` | Rejects and lists valid filter options |
| Unknown query param | 200 OK | *None* | Silently ignored |

---

## Rate Limiting

- **Store:** Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`).
- **Limit:** 100 requests per minute per IP.
- **On Limit Exceeded:** Status `429 Too Many Requests` with `Retry-After: <seconds>` header and error envelope `{ "error": { "code": "RATE_LIMITED", ... } }`.

---

## Data Model & Resource Design

The domain models three core resources: **Agents**, **Listings**, and **Property Viewings**. All primary keys use collision-resistant **CUIDs** (`cuid()`), preventing sequential ID enumeration attacks.

### Entity Relationships
```
┌──────────────┐          1 : N          ┌──────────────┐          1 : N          ┌───────────────────┐
│    Agent     │ ─────────────────────── │   Listing    │ ─────────────────────── │  PropertyViewing  │
└──────────────┘                         └──────────────┘                         └───────────────────┘
```
- An **Agent** has many **Listings**.
- A **Listing** belongs to an **Agent** and has many scheduled **Property Viewings**.
- A **Property Viewing** belongs to a **Listing**.

### Resource Field Tables

#### 1. `Agent` Resource
| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | String (`cuid()`) | Yes | Primary Key (e.g. `cm1agent0001`) |
| `name` | String | Yes | Full name of the real estate agent |
| `email` | String | Yes | Unique contact email |
| `phone` | String | Yes | Contact phone number |
| `city` | String | Yes | Operational market/city (indexed) |
| `createdAt` | DateTime | Yes | Timestamp of creation |
| `updatedAt` | DateTime | Yes | Timestamp of last update |

#### 2. `Listing` Resource
| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | String (`cuid()`) | Yes | Primary Key (e.g. `cm1listing0001`) |
| `title` | String | Yes | Headline title of the property |
| `description` | String | Yes | Detailed description |
| `price` | Integer | Yes | Price denominated in whole USD cents |
| `category` | Enum (`sale`, `rent`) | Yes | Listing category (indexed) |
| `bedrooms` | Integer | Yes | Bedroom count |
| `bathrooms` | Integer | Yes | Bathroom count |
| `city` | String | Yes | City location (indexed) |
| `address` | String | Yes | Street address |
| `agentId` | String (`cuid`) | Yes | Foreign Key referencing `Agent.id` |
| `createdAt` | DateTime | Yes | Timestamp of creation |
| `updatedAt` | DateTime | Yes | Timestamp of last update |

#### 3. `PropertyViewing` Resource
| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | String (`cuid()`) | Yes | Primary Key (e.g. `cm1viewing0001`) |
| `visitorName` | String | Yes | Name of the prospective visitor |
| `visitorEmail` | String | Yes | Masked in responses (`***@domain.com`) |
| `scheduledAt` | DateTime | Yes | Scheduled date and time (indexed) |
| `status` | Enum (`scheduled`, `completed`, `cancelled`) | Yes | Viewing status (indexed) |
| `listingId` | String (`cuid`) | Yes | Foreign Key referencing `Listing.id` |
| `createdAt` | DateTime | Yes | Timestamp of creation |
| `updatedAt` | DateTime | Yes | Timestamp of last update |

---

## Local Setup & Running

### 1. Configure Environment Variables
Create `.env` inside `apps/api/` (or copy `.env.example`):
```bash
DATABASE_URL="postgresql://user:password@ep-pooler.neon.tech/neondb?sslmode=require&pgbouncer=true"
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_redis_token"
```

### 2. Generate Prisma Client & Push Schema
```bash
npm --workspace=apps/api run prisma:generate
npm --workspace=apps/api run prisma:push
```

### 3. Seed Realistic Data (Idempotent)
```bash
npm --workspace=apps/api run prisma:seed
```
Generates 35 agents, 350 listings, and 600 viewings with realistic pricing and date-derived statuses.

### 4. Start Development Servers
```bash
# API Server on http://localhost:3000
npm run dev:api

# Consumer App on http://localhost:3001
npm run dev:consumer
```

---

## Running with Docker Compose

You can launch PostgreSQL, the REST API, and the Consumer App simultaneously using Docker Compose:

```bash
docker compose up --build
```

- **API:** Reachable at `http://localhost:3000/api/v1/listings`
- **Consumer App:** Reachable at `http://localhost:3001`
- **PostgreSQL:** Port `5432`

---

## Running Integration Tests

Run the complete test suite (31 tests covering bad input, clamping, CUIDs, and envelopes):
```bash
npm test
```

