# Design System Rules

## 1. Token Architecture & Layering

The design system enforces a strict two-layer token architecture:

1. **Primitive Tokens (Foundational Palette)**
   - Token prefix: `--color-primitive-*` (e.g., `--color-primitive-primary-40`, `--color-primitive-neutral-10`).
   - Purpose: Raw color definitions and palette scales.
   - **RULE:** Primitive color tokens must **NEVER** be applied directly to UI components or elements.

2. **Semantic Tokens (Color Roles)**
   - Token prefix: `--color-*` (e.g., `--color-primary`, `--color-on-primary`, `--color-surface`, `--color-surface-container`, `--color-error`).
   - Purpose: Purpose-driven tokens that assign meaning and context to visual elements.
   - Reference: Semantic tokens alias primitive tokens via CSS `var()` (e.g. `--color-primary: var(--color-primitive-key-primary, #004ed4);`).
   - **RULE:** All UI surfaces, text, borders, buttons, and backgrounds **MUST** consume semantic tokens.

---

## 2. Standard Token Names & Roles

### Surfaces & Backgrounds
- `--color-surface`: Base page background / card surface.
- `--color-on-surface`: Primary text and high-contrast content on surface.
- `--color-surface-variant`: Subtle borders, dividers, and background containers.
- `--color-on-surface-variant`: Secondary text, metadata, captions, icons.
- `--color-surface-container-lowest`: Elevated card surfaces (pure white).
- `--color-surface-container-low`: Secondary card background / subtle containers.
- `--color-surface-container`: Standard container background.
- `--color-surface-container-high` / `--color-surface-container-highest`: Accent containers and prominent card blocks.
- `--color-inverse-surface` & `--color-inverse-on-surface`: High-contrast dark containers / badges.

### Brand & Interactive Roles
- `--color-primary`: Primary interactive elements, buttons, active links, primary highlights.
- `--color-on-primary`: Text and icons placed on top of `--color-primary`.
- `--color-primary-container`: Soft highlight backgrounds, category badges, subtle selected states.
- `--color-on-primary-container`: Text and icons inside `--color-primary-container`.
- `--color-secondary` & `--color-on-secondary`: Secondary actions, accents.
- `--color-secondary-container` & `--color-on-secondary-container`: Secondary chips and badges.
- `--color-tertiary` & `--color-tertiary-container`: Specialty accents (e.g., rental tags).

### Feedback Roles
- `--color-error`: Error messages, destructive alerts, cancelled status.
- `--color-on-error`: High-contrast text on error backgrounds.
- `--color-error-container`: Soft red warning/error container backgrounds.
- `--color-on-error-container`: Text inside error container blocks.

---

## 3. Typography Scale & Classes

The design system uses **DM Sans** as its primary typeface.

Use the pre-generated atomic typography classes on HTML/React elements:
- `.type-display-large`, `.type-display-medium`, `.type-display-small`
- `.type-headline-large`, `.type-headline-medium`, `.type-headline-small`
- `.type-title-large`, `.type-title-medium`, `.type-title-small`
- `.type-body-large`, `.type-body-medium`, `.type-body-small`
- `.type-label-large`, `.type-label-medium`, `.type-label-small`

Or use the typography CSS variables directly in styles:
- `font: var(--typography-headline-large);`
- `font-family: var(--typography-headline-large-font-family);`
- `font-size: var(--typography-body-medium-font-size);`

---

## 4. Spacing Scale

Use standard spacing variables for margins, paddings, and grid gaps:
- `--spacing-none`: `0px`
- `--spacing-xs`: `4px`
- `--spacing-sm`: `8px`
- `--spacing-md`: `12px`
- `--spacing-base`: `16px`
- `--spacing-lg`: `20px`
- `--spacing-xl`: `24px`
- `--spacing-2xl`: `32px`

---

## 5. Elevation & Shadows

Apply elevation tokens to cards, modals, popovers, and sticky headers:
- `--elevation-shadow-level-1`: Subtle card border elevation (`0 1px 3px rgba(0,0,0,0.08)`).
- `--elevation-shadow-level-2`: Interactive card hover elevation.
- `--elevation-shadow-level-3`: Dropdowns, popovers, navigation menus.
- `--elevation-shadow-level-4` & `--elevation-shadow-level-5`: Dialogs and floating overlays.

---

## 6. Build Workflow & Synchronization

1. Token source: `design-tokens.tokens.json`.
2. Generator script: `scripts/convert-tokens.js`.
3. Command: `npm run tokens:build`.
4. Distribution: Automatically compiles to root `tokens.css` and copies to `apps/consumer/app/tokens.css`.
5. When modifying token definitions, always run `npm run tokens:build` and verify the consumer app compiles cleanly.
