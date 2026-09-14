# Property Market API & Consumer App — Project Documentation

Welcome to the complete documentation for the **Property Market API** project. This document provides a clear, step-by-step explanation of what was built, how each part works, and how the different pieces fit together without relying on overly complex technical terms.

---

## Table of Contents
1. [Project Overview & Purpose](#1-project-overview--purpose)
2. [Data Design & Market Resources](#2-data-design--market-resources)
3. [Realistic Data Generation & Seeding](#3-realistic-data-generation--seeding)
4. [The Public REST API](#4-the-public-rest-api)
5. [Reliability & Usage Protection](#5-reliability--usage-protection)
6. [Design System & Visual Styling](#6-design-system--visual-styling)
7. [The Consumer Application](#7-the-consumer-application)
8. [Testing & Quality Assurance](#8-testing--quality-assurance)
9. [How to Run the Project](#9-how-to-run-the-project)

---

## 1. Project Overview & Purpose

This project is built around a realistic property market. It consists of two independent parts that work together:

1. **The Property Market API (`apps/api`):** A public, read-only data service. It stores and serves real estate information—real estate agents, property listings for sale or rent, and scheduled viewing appointments. Anyone on the internet can query this API to look up property market data without needing to create an account or log in.
2. **The Consumer Application (`apps/consumer`):** A separate web application that acts as a real-world client. It fetches data exclusively from the public API over the web (HTTP) and presents it in a clean, user-friendly interface. It proves that the API is fully accessible and useful to outside developers.

```
┌─────────────────────────┐          HTTP Request          ┌─────────────────────────┐
│                         │  ────────────────────────────► │                         │
│  Consumer Application   │                                │   Property Market API   │
│   (Web User Interface)  │  ◄──────────────────────────── │   (Data Service & DB)   │
│                         │          JSON Data Response    │                         │
└─────────────────────────┘                                └─────────────────────────┘
```

---

## 2. Data Design & Market Resources

The system models how a real-world property marketplace functions using three core resources:

### The Three Core Resources

```
┌──────────────┐          Manages          ┌──────────────┐          Has          ┌───────────────────┐
│    Agent     │ ────────────────────────► │   Listing    │ ────────────────► │  Property Viewing │
│ (Real Estate │                           │ (Property    │                   │   (Appointments   │
│ Professional)│                           │  for Sale/   │                   │    with Visitors) │
└──────────────┘                           │     Rent)    │                   └───────────────────┘
                                           └──────────────┘
```

1. **Agents:** Real estate agents managing properties in various cities.
   - *Fields:* Name, email, phone number, operational city, creation date.
2. **Listings:** Real estate properties offered either for sale or for rent.
   - *Fields:* Title, description, price, category (`sale` or `rent`), bedroom count, bathroom count, address, city, assigned agent, creation date.
3. **Viewings:** Scheduled property visit appointments booked by prospective buyers or renters.
   - *Fields:* Visitor name, visitor email, scheduled date/time, appointment status (`scheduled`, `completed`, or `cancelled`), associated property listing.

### Key Design Decisions Explained Simply

- **Safe Identifiers (No Simple Counting Numbers):** Instead of using predictable numbers like `1, 2, 3` for record IDs (which would allow anyone to guess and download the entire database by counting), every record is assigned a unique, random string identifier (called a CUID, such as `cm1abcdef0001`).
- **Accurate Money Handling:** To eliminate rounding mistakes and precision loss common with decimal numbers in computer software, all prices are stored as whole integer numbers in USD cents (for example, `$450,000` is stored as `45000000`).
- **Privacy Protection for Visitor Emails:** To protect user privacy, visitor emails are automatically masked before any response leaves the API. For example, `sarah.smith@gmail.com` is automatically transformed into `***@gmail.com`. The full email is never exposed in public responses.

---

## 3. Realistic Data Generation & Seeding

A property market API is only useful if it contains rich, realistic data. 

To achieve this:
- We built a database generation script (`prisma/seed.ts`) that automatically creates **35 real estate agents**, **350 property listings**, and **600 viewing appointments**.
- The listings span realistic property titles, descriptive summaries, market-accurate prices, diverse bedroom/bathroom counts, and multiple cities.
- **Repeat-Safe (Idempotent):** You can run the data generation script as many times as you like; it will never create duplicate records or clutter the database.

---

## 4. The Public REST API

The API provides seven dedicated endpoints to search, filter, and view data. All responses are returned in a predictable, consistent JSON format.

### Available Endpoints

| Resource | HTTP Method & Path | Description |
| :--- | :--- | :--- |
| **Agents** | `GET /api/v1/agents` | List all agents with optional sorting, offset pagination, and city search. |
| **Agent Detail** | `GET /api/v1/agents/:id` | View a single agent's profile and contact details. |
| **Agent Listings** | `GET /api/v1/agents/:id/listings` | View all properties managed by a specific agent. |
| **Listings** | `GET /api/v1/listings` | Browse and filter listings by category (sale/rent), city, bedrooms, and price range. |
| **Listing Detail** | `GET /api/v1/listings/:id` | View a property's full details, assigned agent, and total viewings count. |
| **Listing Viewings**| `GET /api/v1/listings/:id/viewings` | View scheduled visits for a specific property (with masked emails). |
| **Viewings** | `GET /api/v1/viewings` | Browse all viewings across the platform with status filtering. |

### Standardized Response Envelopes

Every single request returns data wrapped in a clear, standard structure:

**1. Successful List Response (includes pagination information):**
```json
{
  "data": [
    {
      "id": "cm1abcdef0001",
      "title": "Modern Downtown Condo",
      "price": 45000000,
      "category": "sale",
      "city": "Austin"
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

**2. Error Response (clear error code and message):**
```json
{
  "error": {
    "code": "INVALID_FILTER_VALUE",
    "message": "Category must be either 'sale' or 'rent'."
  }
}
```

---

## 5. Reliability & Usage Protection

To ensure the API remains fast, stable, and protected from misuse:

1. **Fair Usage Rate Limiting:** The API includes rate limiting backed by an external Redis store. Each client IP address is allowed up to 100 requests per minute. If a client exceeds this, the API gracefully responds with HTTP status `429 (Too Many Requests)` along with a `Retry-After` header.
2. **Database Connection Pooling:** Instead of opening direct database connections that could overwhelm the database during high traffic, the API uses a connection pool to share and reuse connections efficiently.
3. **Strict Input Validation:** All query parameters (like sort directions, page numbers, and category filters) are validated against strict rules before reaching the database, returning clear error messages whenever bad input is provided.

---

## 6. Design System & Visual Styling

The project includes a structured Design System that translates design tokens (from `design-tokens.tokens.json`) into reusable CSS variables and styles.

### Two-Layer Token Architecture

```
┌─────────────────────────────────────────────────────────┐
│ 1. PRIMITIVE PALETTE (Raw Color Definitions)            │
│    --color-primitive-primary-40: #004bcc                │
│    --color-primitive-neutral-10: #16181d                │
│    (Never applied directly to UI components)            │
└────────────────────────────┬────────────────────────────┘
                             │ Aliased via var()
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 2. SEMANTIC COLOR ROLES (Applied to UI)                 │
│    --color-primary: Primary action buttons & highlights │
│    --color-surface: Background & card canvas            │
│    --color-on-surface: Primary text color               │
│    --color-error: Error badges & alerts                 │
└─────────────────────────────────────────────────────────┘
```

- **Typography:** Uses the clean, modern **DM Sans** typeface with pre-built utility classes (`.type-headline-large`, `.type-body-medium`, etc.).
- **Spacing Scale:** Standardized spacing values (`--spacing-xs` to `--spacing-2xl`) for consistent padding, margins, and layout gaps.
- **Elevation & Shadows:** Depth levels (`--elevation-shadow-level-1` through `5`) for cards, dialogs, and sticky headers.
- **Automatic Build Script:** Running `npm run tokens:build` automatically compiles the JSON tokens into `tokens.css` and synchronizes them to the consumer app.

---

## 7. The Consumer Application

The consumer web application (`apps/consumer`) serves as living proof that the API works externally.

### Key Pages in the Consumer App

1. **Browse Listings (`/listings`):**
   - Displays real estate cards with prices, bedroom/bathroom stats, location, and category tags (`For Sale` vs `For Rent`).
   - Includes an interactive filter bar allowing users to filter by category, city, minimum bedrooms, sorting field, and order.
   - Includes pagination controls to navigate through pages of results.
2. **Listing Detail (`/listings/:id`):**
   - Displays complete property details, specs grid, description, and price.
   - Shows the assigned real estate agent with a direct link to their profile.
   - Lists recent viewing appointments with privacy-masked visitor emails.
3. **Agent Profile (`/agents/:id`):**
   - Shows agent contact information and operating city.
   - Features a portfolio counter of total active properties.
   - Displays a grid of all listings managed by that agent.

### Pure Server-Side Rendering
The consumer app renders its pages on the server before sending HTML to the browser. It fetches data strictly over HTTP from the API, exactly as an independent third-party website would.

---

## 8. Testing & Quality Assurance

To ensure the API and consumer app remain stable and bug-free, the project includes:

- **Automated Integration Test Suite:** 31 automated tests (`npm test`) covering all endpoints, boundary conditions, invalid query parameter handling, limit clamping, ID validations, and email masking.
- **Strict Type Checking:** Zero TypeScript errors across both the API and consumer workspaces (`npm run typecheck`).
- **Production Build Validation:** Full production builds (`npm run build`) verified for speed and error-free compilation.

---

## 9. How to Run the Project

### Prerequisites
- Node.js (version 20 LTS or later)
- Docker Desktop (for running the PostgreSQL database locally)

### Quick Start Guide

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repository-url>
   cd property-market-api
   npm install
   ```

2. **Start the local PostgreSQL database:**
   ```bash
   docker-compose up -d
   ```

3. **Prepare the database and generate seed data:**
   ```bash
   # Push schema to database
   npm --workspace=apps/api run prisma:push

   # Seed database with 35 agents, 350 listings, and 600 viewings
   npm --workspace=apps/api run prisma:seed
   ```

4. **Build the design tokens:**
   ```bash
   npm run tokens:build
   ```

5. **Start the development servers:**
   - **API Server (port 3000):**
     ```bash
     npm --workspace=apps/api run dev
     ```
   - **Consumer App (port 3001):**
     ```bash
     npm --workspace=apps/consumer run dev
     ```

6. **Open in your browser:**
   - Browse listings in the Consumer App: [http://localhost:3001/listings](http://localhost:3001/listings)
   - Query the REST API directly: [http://localhost:3000/api/v1/listings](http://localhost:3000/api/v1/listings)

7. **Run tests:**
   ```bash
   npm test
   ```
