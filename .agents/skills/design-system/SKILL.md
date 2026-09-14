---
name: design-system
description: >-
  Use this skill when converting design tokens from JSON to CSS variables, maintaining token architecture (primitive vs semantic roles), and applying the design system to the consumer application.
---

# Design System Management and Application Skill

This skill governs the conversion of token definitions into standard CSS variables, enforcement of token hierarchy, and practical implementation in UI components.

## 1. Core Architecture Principles

1. **Primitive Tokens (`--color-primitive-*`):**
   - Palette definitions generated from `design-tokens.tokens.json`.
   - **Never** use primitive tokens directly in application UI code or styling.
2. **Semantic Color Roles (`--color-*`):**
   - Semantic tokens assigned for UI usage: `--color-primary`, `--color-on-primary`, `--color-surface`, `--color-surface-container`, `--color-error`, etc.
   - Reference primitive values via CSS `var()` with safe hex fallbacks.
   - **Always** use semantic tokens for UI styling (backgrounds, text, borders, badges, buttons).
3. **Typography & Utilities:**
   - Primary font: `'DM Sans', sans-serif`.
   - Utility classes: `.type-headline-large`, `.type-headline-medium`, `.type-body-large`, `.type-body-medium`, `.type-label-large`, etc.
   - CSS variables: `--typography-[role]-[size]-[property]`.

---

## 2. Converting Tokens to CSS

When `design-tokens.tokens.json` is updated or token variables need regeneration:

1. **Run the build script:**
   ```bash
   npm run tokens:build
   ```
2. **Verify Output:**
   - Root tokens file: `tokens.css`
   - Synced consumer app stylesheet: `apps/consumer/app/tokens.css`

---

## 3. Applying Tokens in Next.js Consumer App

### A. Layout Setup (`apps/consumer/app/layout.tsx`)
- Import `./tokens.css`.
- Load Google Fonts (`DM Sans`).
- Apply base styles using `var(--color-surface)` and `var(--color-on-surface)`.

### B. Component & Page Styling Guidelines
- **Containers & Surfaces:**
  - Card backgrounds: `var(--color-surface-container-lowest)` or `var(--color-surface)`
  - Card borders: `1px solid var(--color-surface-variant, #e2e4e9)`
  - Elevated shadows: `var(--elevation-shadow-level-1)` / `var(--elevation-shadow-level-2)`
- **Typography:**
  - Headings: Apply class `type-headline-large` or `type-headline-medium` with `color: var(--color-on-surface)`
  - Body text: Apply class `type-body-medium` or `type-body-large` with `color: var(--color-on-surface-variant)`
- **Interactive & Accent Elements:**
  - Buttons / CTA: `background-color: var(--color-primary); color: var(--color-on-primary);`
  - Chips / Badges (For Sale): `background-color: var(--color-primary-container); color: var(--color-on-primary-container);`
  - Chips / Badges (For Rent): `background-color: var(--color-tertiary-container); color: var(--color-on-tertiary-container);`
  - Errors & Alerts: `background-color: var(--color-error-container); color: var(--color-error); border: 1px solid var(--color-error);`
- **Spacing:**
  - Margins & Paddings: Use `var(--spacing-xs)`, `var(--spacing-sm)`, `var(--spacing-md)`, `var(--spacing-base)`, `var(--spacing-xl)`, `var(--spacing-2xl)`.
