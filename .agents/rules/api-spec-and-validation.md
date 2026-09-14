# API Specification, Validation & Envelope Rules

This rule document defines the exact endpoint contracts, query parameters, validation rules, and response shapes for the Property Market API (`/api/v1/`).

## 1. Response Envelopes

### List Response Envelope
```json
{
  "data": [ ... ],
  "meta": {
    "total": 340,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Single Item Response Envelope
```json
{
  "data": { ... }
}
```

### Error Envelope
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable description of the error."
  }
}
```

## 2. Endpoints & Parameter Contracts

### 1. `GET /api/v1/agents`
- **Query Params:**
  - `limit`: integer, default `20`, clamped to max `100`
  - `offset`: integer, default `0`, must be `>= 0`
  - `sort`: enum [`name`, `createdAt`], default `createdAt` (or specified default)
  - `order`: enum [`asc`, `desc`], default `asc`
  - `city`: string (exact match filter)
- **Response `data`:** Array of `{ id, name, email, phone, city, createdAt }`
- **Note:** `minListings` is explicitly cut from v1.

### 2. `GET /api/v1/agents/:id`
- **Path Params:** `:id` (must be a valid cuid)
- **Response `data`:** `{ id, name, email, phone, city, createdAt, listingCount }`
- **Status:** 200 on success, 400 with `INVALID_ID` if id is malformed, 404 with `NOT_FOUND` if agent does not exist.

### 3. `GET /api/v1/agents/:id/listings`
- **Path Params:** `:id` (valid cuid)
- **Query Params:** Same pagination and sorting as `/listings`
- **Status:** 200 with `{ data: [...], meta }` on found agent (even if data array is empty), 400 with `INVALID_ID` if malformed, 404 with `NOT_FOUND` if agent does not exist.

### 4. `GET /api/v1/listings`
- **Query Params:**
  - `limit`: integer, default `20`, max `100` (clamped)
  - `offset`: integer, default `0`, `>= 0`
  - `sort`: enum [`price`, `createdAt`, `bedrooms`]
  - `order`: enum [`asc`, `desc`], default `asc`
  - `category`: enum [`sale`, `rent`]
  - `minPrice`: integer (USD cents)
  - `maxPrice`: integer (USD cents)
  - `city`: string (exact match)
  - `bedrooms`: integer
- **Response `data`:** Array of `{ id, title, description, price, category, bedrooms, bathrooms, city, address, agentId, createdAt }`

### 5. `GET /api/v1/listings/:id`
- **Path Params:** `:id` (valid cuid)
- **Response `data`:** `{ id, title, description, price, category, bedrooms, bathrooms, city, address, createdAt, agent: { id, name, email, phone }, viewingCount }`
- **Status:** 200 on success, 400 with `INVALID_ID` if id is malformed, 404 with `NOT_FOUND` if listing does not exist.

### 6. `GET /api/v1/listings/:id/viewings`
- **Path Params:** `:id` (valid cuid)
- **Query Params:** Same pagination and sorting as `/viewings`
- **Response `data`:** Array of viewing objects with masked `visitorEmail`
- **Status:** 200 on found listing (even if data array is empty), 400 with `INVALID_ID` if malformed, 404 with `NOT_FOUND` if listing does not exist.

### 7. `GET /api/v1/viewings`
- **Query Params:**
  - `limit`: integer, default `20`, max `100` (clamped)
  - `offset`: integer, default `0`, `>= 0`
  - `sort`: enum [`scheduledAt`, `createdAt`]
  - `order`: enum [`asc`, `desc`], default `asc`
  - `status`: enum [`scheduled`, `completed`, `cancelled`]
  - `listingId`: string (valid cuid filter)
- **Response `data`:** Array of `{ id, listingId, visitorName, visitorEmail, scheduledAt, status, createdAt }`
- **Note:** `visitorEmail` is ALWAYS masked (`***@domain.com`).

### 8. `GET /api/v1/viewings/:id`
- **Path Params:** `:id` (valid cuid)
- **Response `data`:** `{ id, visitorName, visitorEmail, scheduledAt, status, createdAt, listing: { id, title, city, price } }`
- **Note:** `visitorEmail` is ALWAYS masked.
- **Status:** 200 on success, 400 with `INVALID_ID` if malformed, 404 with `NOT_FOUND` if viewing does not exist.

---

## 3. Validation Logic & Error Codes

All parameter validation MUST use centralized Zod schemas in `apps/api/lib/validation/`:

| Condition | Action / Status Code | Error Code | Note |
| :--- | :--- | :--- | :--- |
| `limit > 100` | Clamp to 100 | None (200) | Silent clamping, not rejected |
| `limit < 1` (or invalid int) | Fallback / 400 | `INVALID_LIMIT` or default | Enforce positive integer |
| `offset < 0` | Reject (400) | `INVALID_OFFSET` | "Offset must be greater than or equal to 0" |
| Unknown `sort` | Reject (400) | `INVALID_SORT_FIELD` | Message must list allowed sort fields |
| Unknown `order` (not `asc`/`desc`) | Reject (400) | `INVALID_ORDER_VALUE` | Message specifies allowed values ('asc', 'desc') |
| Malformed `:id` (not valid cuid) | Reject (400) | `INVALID_ID` | Evaluated BEFORE database query |
| Resource not found by ID | Reject (404) | `NOT_FOUND` | e.g. "Listing not found" |
| Unknown `category` or `status` | Reject (400) | `INVALID_FILTER_VALUE` | Message states allowed filter values |
| Unknown query parameters | Ignore (200) | None | Never reject unrecognized parameters |

---

## 4. Visitor Email Masking Rules

In `apps/api/lib/mask-email.ts`:
- Replaces local part before `@` with `***`.
- Example: `john.doe@example.com` -> `***@example.com`.
- Must be applied at the response layer before data is returned.
- Full email is never returned under any circumstances.
