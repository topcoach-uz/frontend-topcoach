# Student design tokens

**Source of truth:** `src/styles/student-hub-design-system.scss`, the "TOPCOACH STUDENT TOKENS" block.
**Printed once** as CSS custom properties on `:root` by `src/styles/global.scss`.
**antd:** `src/lib/antd/studentTheme.ts` mirrors the colours. `src/lib/antd/studentTheme.test.ts` fails if they drift.

## How to use

- **In new or migrated CSS, use the custom property:** `color: var(--tc-muted)`, `border-radius: var(--tc-radius-pill)`, `transition: transform var(--tc-dur-2) var(--tc-ease)`.
- **In Sass, only where you need math or a map:** `@use '/src/styles/student-hub-design-system' as tc;` then `tc.$tc-brand`, `map-get(tc.$tc-space, '4')`.
- **Never write a raw hex, px font size, radius or duration** in student-facing styles. If a value is missing, add a token here first.
- **Glass surfaces** keep using the `lg-*` mixins in `src/styles/_liquid-glass.scss` (materials layer). Tokens cover everything else.
- **Deprecated:** the older variables in the same file (`$primary-*`, `$gray-*`, `$text-*`, `$space-*`, `$radius-*`, `$shadow-*`), `src/styles/_editorial-tokens.scss`, and the antd mirrors in `src/styles/variables.scss`. They keep their old values until each page migrates (phase 3), then they get deleted.

## Colour

| Token | Value | Use |
|---|---|---|
| `--tc-canvas` | `#fbf9f6` | page background |
| `--tc-surface` | `#ffffff` | solid cards, inputs |
| `--tc-surface-tonal` | `#f5f2ee` | quiet fills, chips |
| `--tc-surface-sunk` | `#efeae4` | wells, disabled fills, segmented track fallback |
| `--tc-line` | `#e7e2dc` | hairlines, borders |
| `--tc-line-strong` | `#d8d0c8` | hover borders, dividers on tonal |
| `--tc-ink` | `#221d1a` | headings, strong text |
| `--tc-text` | `#302b28` | body text |
| `--tc-muted` | `#6b625b` | secondary text, icons |
| `--tc-subtle` | `#9a9089` | placeholders, meta (not for body text: contrast) |
| `--tc-on-brand` | `#ffffff` | text on crimson |
| `--tc-brand` | `#8b0000` | primary actions, active states, links |
| `--tc-brand-hover` | `#6e0000` | hover on brand |
| `--tc-brand-press` | `#5a0000` | pressed on brand |
| `--tc-blush` | `#f7e6e4` | calm brand surface, selected rows |
| `--tc-blush-strong` | `#f1d9d6` | hover on blush |
| `--tc-success` / `-bg` | `#2f7a4b` / `#eef5ef` | done, passed, graded |
| `--tc-warning` / `-bg` | `#95580a` / `#fbf3e4` | revision, attention |
| `--tc-danger` / `-bg` | `#b4372b` / `#fdeceb` | errors, destructive |
| `--tc-focus` | `rgba(139,0,0,.14)` | focus halo colour |
| `--tc-focus-ring` | `0 0 0 3px var(--tc-focus)` | every focus-visible ring |

## Radius, space, type

| Group | Tokens |
|---|---|
| Radius | `--tc-radius-xs` 6 · `-sm` 12 (fields) · `-md` 16 · `-lg` 20 (cards) · `-xl` 24 (big panels) · `-pill` 999px (buttons, chips) |
| Space (4px grid) | `--tc-space-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-8` 32 · `-10` 40 · `-12` 48 · `-16` 64 |
| Font | `--tc-font` (DM Sans) · `--tc-font-mono` (scores/code only) |
| Type | `--tc-text-micro` 11 · `-caption` 12 · `-small` 13 · `-body-sm` 14 · `-body` 15 · `-body-lg` 16 · `-h3` 17 · `-h2` 20 · `-h1` 28 · `-display` 36 |

Headings use weight 500. Letter-spacing is size-specific: -0.02em at 24px and up, -0.01em for 17–20px, 0 for body.

## Elevation, motion, layers

| Group | Tokens |
|---|---|
| Shadow | `--tc-shadow-1` hairline lift · `-2` card · `-3` popover/modal (glass uses `lg-*`) |
| Motion | `--tc-ease` (= lg-ease) · `--tc-ease-fade` (`ease`) · `--tc-dur-1` 120ms · `-2` 200ms · `-3` 320ms · `-enter` 460ms (see MOTION.md) |
| z-index | `--tc-z-raised` 1 · `-sticky` 10 · `-nav` 100 · `-dropdown` 1000 · `-modal` 1100 · `-toast` 1200 |
