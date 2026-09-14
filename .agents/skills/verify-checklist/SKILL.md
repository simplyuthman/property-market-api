---
name: verify-checklist
description: >-
  Use this skill to perform the comprehensive 16-item quality and compliance verification before marking any task as complete in the Property Market API project.
---

# Definition of Done Verification Workflow

Before marking any milestone or task complete, follow this verification procedure and validate every item on the AGENTS.md Section 6 checklist.

## Verification Checklist

Review and verify each requirement below:

- [ ] **TypeScript & Build:** Code compiles with zero errors and no TypeScript errors (`tsc --noEmit`, `npm run build`).
- [ ] **Validation Rules:** All Zod validation rules from Section 3, Rule 7 are implemented and tested.
- [ ] **Response Envelopes:** Every response uses the correct shared envelope (success `{ data, meta }` / `{ data }` or error `{ error: { code, message } }`).
- [ ] **Email Masking:** `visitorEmail` is masked in every response that includes it (`***@domain.com`).
- [ ] **Integer Pricing:** `price` fields are integers (USD cents), never floats or decimals.
- [ ] **cuid IDs:** No sequential integer IDs anywhere — all `cuid()`.
- [ ] **Redis Rate Limiting:** Rate limiting is Redis-backed, not in-memory, and returns 429 + `Retry-After` when exceeded.
- [ ] **Database Connection Pooling:** Database connection uses the pooled connection string.
- [ ] **Consumer App Fetch Strategy:** Consumer app fetches server-side only (Server Components), not client-side.
- [ ] **No CORS Headers:** No CORS headers added to the API unless a client-side fetch was explicitly requested.
- [ ] **Seed Idempotency:** Seed script runs twice with no duplicate records created.
- [ ] **No Write Endpoints:** No write endpoints exist anywhere in the API.
- [ ] **No Authentication:** No authentication code exists anywhere in the API.
- [ ] **Consumer App Isolation:** Consumer app only calls the API over HTTP, with no direct database or Prisma access.
- [ ] **Integration Test Coverage:** Integration tests cover every bad-input case listed in Section 3, Rule 7.
- [ ] **Layout Compliance:** Folder layout matches Section 4 exactly — no logic misplaced outside `lib/`.
- [ ] **Scope Control:** No feature from Phase 5 (or any out-of-scope item) has been added.

## Verification Commands

1. **Typecheck:**
   ```bash
   npm run typecheck
   ```
2. **Build:**
   ```bash
   npm run build
   ```
3. **Run Tests:**
   ```bash
   npm test
   ```
