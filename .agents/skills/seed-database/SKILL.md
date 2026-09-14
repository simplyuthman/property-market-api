---
name: seed-database
description: >-
  Use this skill when generating, updating, or testing the Prisma database seed script for the Property Market API, ensuring idempotency and data realism.
---

# Database Seeding Workflow (`prisma/seed.ts`)

This skill outlines the procedures for creating, running, and validating the database seed script using `@faker-js/faker` and Prisma.

## Requirements Checklist

1. **Volume Constraints:**
   - At least 30 `Agent` records.
   - At least 300 `Listing` records distributed across agents.
   - At least 500 `PropertyViewing` records distributed across listings.
2. **Data Realism & Formatting:**
   - `price`: Integer in USD cents (e.g. $450,000 is `45000000`).
   - `visitorEmail`: Generated via `faker.internet.email()` to ensure well-formed email addresses before response-layer masking.
   - `scheduledAt`: Distributed across both past and future dates.
   - `status` derivation:
     - Future `scheduledAt` -> `scheduled`.
     - Past `scheduledAt` -> `completed` or `cancelled`.
3. **Idempotency:**
   - Running the seed script twice (`npx prisma db seed`) MUST NOT duplicate records.
   - Use deterministic keys, fixed cuid generators, or check-then-insert / upsert logic to ensure zero duplicate records on repeated execution.

## Execution Steps

1. **Ensure Database Connection:**
   Verify `DATABASE_URL` is set in `.env` (pointing to pooled PostgreSQL connection).
2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```
3. **Push / Migrate Schema:**
   ```bash
   npx prisma db push
   ```
4. **Execute Seed Script:**
   ```bash
   npx prisma db seed
   ```
5. **Verify Idempotency:**
   Run the seed command a second time and check total record counts:
   ```bash
   npx prisma db seed
   ```
   Confirm record counts remain exactly unchanged.
