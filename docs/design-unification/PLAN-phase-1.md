# Phase 1: Tokens and foundations. Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (native, chosen: the tasks share one token interface and are small). Steps use `- [ ]` checkboxes.

**Goal:** One student design-token layer (CSS custom properties + Sass), a brand antd theme for student areas only, one documented motion spec, and the two foundation bugs fixed (focus rings, glass fallbacks), with **no page restyling yet** (that's Phase 3).

**Architecture:** `src/styles/student-hub-design-system.scss` becomes the single, output-free token source (`$tc-*` Sass values + a `tc-custom-properties` mixin). `global.scss` prints the custom properties once on `:root`. Old Sass variables keep their current values (marked deprecated) so no page changes until Phase 3 migrates it. The legacy CSS that file used to emit 16 times is emitted once, scoped to the student shell, with focus rings restored. antd gets a nested `StudentThemeProvider` mounted only in student layouts.

**Tech stack:** Sass (dart-sass `^1.77`, `sass.compile` in tests), antd 5 `ConfigProvider` (`ThemeConfig`), vitest 2 (node environment, no DOM library).

**Spec:** [AUDIT.md](AUDIT.md), §2.2 tokens, §4 antd, §5 motion, §10 decisions D1–D9 (approved as recommended, 2026-11-24).

## Global constraints

- Token values exactly as AUDIT §2.2: canvas `#fbf9f6`, ink `#221d1a`, text `#302b28`, muted `#6b625b`, brand `#8b0000`, hover `#6e0000`, blush `#f7e6e4`, DM Sans, pill 999px, 4/8px spacing, type h1 28 / h2 20 / h3 17 (weight 500).
- **D1:** the brand antd theme applies only inside student layouts: `StudentHubLayout`, the auth layout, `/onboarding`, `/learning`. The global provider is unchanged.
- No behaviour, route, gate or API change. No hand edits to `src/app/api/Api.ts`. `FullSupportPaymentGate` imports stay relative.
- No new strings in this phase (so no locale changes).
- Plain commit messages, no AI attribution, no push.

## Review focus

1. **Inputs outside the student area:** the old unscoped `.ant-input` / `.ant-form-item` rules leaked into the mentor and public areas after a student page loaded. After the scope fix, those inputs return to antd defaults. That's expected, and it's a visible change outside scope (it restores their focus ring). Called out in the report.
2. **A Sass consumer of a renamed variable:** old names must still compile in all 16 importers (`yarn build` catches it).
3. **Keyboard focus** on a student input/select must show a visible ring (test checks the compiled CSS; browser check confirms).
4. **Reduced transparency:** segmented controls and lens surfaces must go solid (compiled-CSS test).
5. **antd components inside student pages** pick up the nested theme, while modals and messages rendered through portals keep working (browser check on a page with a Select dropdown and a toast).

---

### Task 1: Token source and CSS custom properties

**Files:**
- Modify: `src/styles/student-hub-design-system.scss` (add `$tc-*` tokens, the motion and z-index scales, and `@mixin tc-custom-properties`; mark old variables deprecated; move all CSS-emitting rules into mixins, see Task 3)
- Modify: `src/styles/global.scss` (`:root { @include tc-custom-properties; }`)
- Create: `docs/design-unification/TOKENS.md` (token table + how to use: `var(--tc-*)` in new CSS, `$tc-*` only where Sass math needs it)
- Test: `src/styles/designTokens.test.ts`

**Interfaces, produces:**
- CSS custom properties on `:root`, named as in AUDIT §2.2:
  - Colour, radius, space, type, shadow: `--tc-canvas … --tc-shadow-3`
  - Motion: `--tc-ease`, `--tc-ease-fade`, `--tc-dur-1|2|3|enter`
  - z-index: `--tc-z-*`
  - Focus: `--tc-focus`, `--tc-focus-ring` (`0 0 0 3px var(--tc-focus)`)
- Sass: `$tc-brand` etc. and the map `$tc-colors` (name → hex), read by the test.

- [ ] Step 1: write `designTokens.test.ts`:
  - `compiles global.scss with every --tc token`: compile `src/styles/global.scss` with `sass.compile` (loadPaths: repo root). Expect `--tc-brand: #8b0000`, `--tc-canvas: #fbf9f6`, `--tc-ink: #221d1a`, `--tc-muted: #6b625b`, `--tc-blush: #f7e6e4`, `--tc-radius-pill: 999px`, `--tc-dur-enter: 460ms`, `--tc-ease: cubic-bezier(0.32, 0.72, 0, 1)` each to appear exactly once.
  - `design-system partial emits no CSS`: compile a string `@import "src/styles/student-hub-design-system";` and expect trimmed CSS to be `''`.
- [ ] Step 2: `npx vitest run src/styles/designTokens.test.ts` → FAIL (tokens missing; partial emits CSS).
- [ ] Step 3: implement tokens and the mixin; include it in `global.scss`.
- [ ] Step 4: re-run → token test PASS (the empty-output test passes after Task 3).

### Task 2: Liquid-glass fallbacks and motion spec

**Files:**
- Modify: `src/styles/_liquid-glass.scss`: `lg-lens`, `lg-lens-light`, `lg-segment-track`, `lg-segment-thumb` include `lg-fallbacks` (thumb → solid `#fff`, track → `$tc-surface-sunk`). `lg-enter` uses 460ms (`--tc-dur-enter`) and lg-ease. Add `@mixin tc-press` (`:active` scale .97, 120ms) and `@keyframes`-free `@mixin tc-spin` that references one shared keyframe `tc-spin` printed once from `global.scss`.
- Create: `docs/design-unification/MOTION.md`: the spec (durations, easing, press, hover lift ≤ 2px, entrances = `lg-enter`, transform/opacity only, interruptible, reduced-motion = no movement, reduced-transparency = `lg-fallbacks`).
- Test: extend `src/styles/designTokens.test.ts`

- [ ] Step 1: test `segment and lens mixins fall back under reduced transparency`: compile `@use "src/styles/liquid-glass" as lg; .t{@include lg.lg-segment-track} .u{@include lg.lg-segment-thumb} .v{@include lg.lg-lens}`. Expect the output to contain `prefers-reduced-transparency` three times and `backdrop-filter: none`.
- [ ] Step 2: run → FAIL. Step 3: implement. Step 4: run → PASS.

### Task 3: Legacy form rules emitted once, scoped, focus restored

**Files:**
- Modify: `src/styles/student-hub-design-system.scss`:
  - Wrap utilities and "NUCLEAR" blocks in `@mixin tc-legacy-student-forms`.
  - Selectors scoped to `.applicant-shell, .student-hub-page, .student-profile-page, .academic-profile, .personal-profile`.
  - `:hover` → border `var(--tc-line-strong)`.
  - `:focus`, `:focus-visible`, `:focus-within`, `*-focused` → `border-color: var(--tc-brand)` and `box-shadow: var(--tc-focus-ring)`. No `outline: none` on the focused element itself; inner-element resets stay.
  - Drop the unused utility classes (`.text-*`, `.bg-*`, `.border-*`, `.shadow-*`, `.rounded-*`). Only `text-secondary` is referenced once in TSX; check that reference and keep a scoped equivalent if live.
- Modify: `src/components/student-hub/StudentHubLayout.scss`: `@include tc-legacy-student-forms;` once.
- Test: extend `designTokens.test.ts`

- [ ] Step 1: tests:
  - `legacy form rules are scoped and keep a focus ring`: compile `StudentHubLayout.scss`. Expect no selector beginning `.ant-input` or `.ant-form-item` at the top level (regex `/(^|\})\s*\.ant-(input|form-item)/m` has no match); the CSS to contain `var(--tc-focus-ring)`; and no rule matching `/:focus[^{]*\{[^}]*outline:\s*none/` for `.ant-input` / `.ant-select-selector` / `.ant-picker`.
  - The empty-output test from Task 1.
- [ ] Step 2: run → FAIL. Step 3: implement. Step 4: run → PASS. Step 5: `yarn build` must pass, since all 16 importers still compile.

### Task 4: Student antd theme (D1)

**Files:**
- Create: `src/lib/antd/studentTheme.ts`: `export const studentThemeTokens` (the hex values, mirroring the Sass `$tc-colors` map) and `export const studentTheme: ThemeConfig` with the AUDIT §4 token and component block (pill buttons, warm borders, crimson focus `0 0 0 3px rgba(139,0,0,.14)`, blush selection, muted status colours, Tabs/Segmented/Pagination/Tag/Progress/Badge/Switch/Modal/Card/Alert/Collapse). `inherit` stays true, so locale etc. pass through.
- Create: `src/lib/antd/StudentThemeProvider.tsx`: `export default function StudentThemeProvider({ children }: PropsWithChildren)` → `<ConfigProvider theme={studentTheme}><App component={false}>{children}</App></ConfigProvider>`, so `App.useApp()` toasts inside are themed.
- Modify: wrap with it in `src/components/student-hub/StudentHubLayout.tsx`, `src/components/layouts/auth/index.tsx`, `src/pages/onboarding/index.tsx` (render branch), `src/pages/learning/index.tsx` (top-level return).
- Test: `src/lib/antd/studentTheme.test.ts`

- [ ] Step 1: tests:
  - `theme colours match the Sass tokens`: parse `$tc-colors` from the SCSS file text. Expect `studentTheme.token.colorPrimary === tokens.brand`, `colorLink === brand`, `colorPrimaryHover === brand-hover`, `colorBgLayout === canvas`, `colorText === text`, `colorTextHeading === ink`, `colorTextSecondary === muted`, `controlItemBgActive === blush`.
  - `buttons are pills`: `studentTheme.components.Button.borderRadius === 999`.
  - `no antd blue`: `JSON.stringify(studentTheme)` contains none of `#1677ff`, `#e6f4ff`, `#69b1ff` (case-insensitive).
- [ ] Step 2: run → FAIL (module missing). Step 3: implement and wire. Step 4: run → PASS.

### Task 5: Verify, screenshot, commit

- [ ] `npx tsc -p tsconfig.app.json --noEmit` → no errors.
- [ ] `npx vitest run src/styles src/lib/antd` → all pass.
- [ ] CI checks: `node .github/scripts/test-full-support-gate.cjs` → "5 … checks passed"; IELTS `node --test` both → `fail 0`.
- [ ] `yarn build` → passes. Record student chunk CSS size (expect a drop from removing 15 duplicate copies).
- [ ] Browser:
  - Pages: the student overview, a page with Select + Input + Tabs (Applications), auth sign-in, at 1440 and 390.
  - Keyboard focus on an input shows the crimson ring.
  - Reduced motion and reduced transparency emulated on a page with a segmented control.
  - Screenshots go to `docs/design-unification/screens/phase-1/`.
- [ ] Commit `Design tokens and student theme foundations (phase 1)` with the plan, docs, tests and code.
