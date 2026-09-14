---
name: validate-endpoints
description: >-
  Use this skill when testing, validating, or writing integration tests for all 7 GET endpoints in the Property Market API, including bad-input edge cases and envelope shapes.
---

# API Validation & Integration Testing Workflow

This skill outlines the step-by-step procedures for validating endpoint contracts, query parameters, bad-input handling, and response envelopes.

## Test Coverage Requirements

Ensure tests cover all 7 endpoints and the following edge cases across `agents`, `listings`, and `viewings`:

### 1. Pagination & Clamping
- `limit > 100`: Must silently clamp to `100` with 200 OK.
- `offset < 0`: Must reject with 400 and `{ "error": { "code": "INVALID_OFFSET", ... } }`.
- Default pagination values: `limit=20`, `offset=0`.
- Response envelope contains correct `meta`: `{ total, limit, offset, hasMore }`.

### 2. Sorting & Ordering
- Unknown `sort` value: Must reject with 400 and `{ "error": { "code": "INVALID_SORT_FIELD", ... } }`, listing allowed fields in the message.
- Unknown `order` value (e.g. `order=foo`): Must reject with 400 and `{ "error": { "code": "INVALID_ORDER_VALUE", ... } }`.

### 3. ID Validation
- Malformed `:id` (non-cuid string like `123`, `abc`, `test-id`): Must reject with 400 and `{ "error": { "code": "INVALID_ID", ... } }` **before** performing any database lookup.
- Non-existent valid cuid: Must return 404 with `{ "error": { "code": "NOT_FOUND", ... } }`.

### 4. Filtering & Unknown Params
- Unknown `status` or `category` value: Must return 400 with `{ "error": { "code": "INVALID_FILTER_VALUE", ... } }`.
- Unknown query parameters (e.g. `?foo=bar`): Must be ignored without rejecting the request (returns 200).

### 5. Email Masking
- In all viewing responses (both list `/api/v1/viewings` and detail `/api/v1/viewings/:id`), `visitorEmail` must be masked to domain-only (e.g., `***@example.com`).
- No full email address must ever appear in response payloads.

## Running Tests

Execute integration test suite:
```bash
npm test
```
Or run a specific test file:
```bash
npm test -- tests/integration/listings.test.ts
```
