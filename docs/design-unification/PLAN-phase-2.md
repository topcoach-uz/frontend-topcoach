# Phase 2: Shared student components. Implementation plan

> **For agentic workers:** superpowers:executing-plans (native). TDD with `react-dom/server` render tests (vitest node environment, no DOM library). Steps use `- [ ]`.

**Goal:** One small, token-driven component kit for the student side, so Phase 3 can replace one-offs page by page. The kit is: page header, section panel, stat tile, list row, empty, error and loading states, gate card, view tabs, status pill, filter chips, progress bar, modal/drawer shells, and pill button and field classes.

**Architecture:**
- **Extend what exists:** `ApplicantPage` gains `eyebrow`, `breadcrumb`, `titleAddon` and `meta` slots. `QueryState` gains an empty state and uses the new loading and error components. `CollegeListTabs` becomes a thin use of the new `ViewTabs`.
- **New pieces** live in `src/components/student-hub/ui/` with one stylesheet that uses only `var(--tc-*)` tokens and the `lg-*` mixins. Components render existing workspace class names where a design already exists (`applicant-empty`, `applicant-view-tabs`), so current pages keep their look.
- **No page adopts the kit in this phase** except `CollegeListTabs` (same markup), so the visual diff is nil outside the gallery.

**Tech:** React 18, antd 5 (Modal/Drawer/Skeleton not used for skeletons), lucide-react, react-router-dom 6, i18next (flat dotted keys in `public/locales/{en,ru,uz,kk}.json`), Sass, vitest + `react-dom/server`.

**Spec:** AUDIT.md §3.5 (duplicate patterns → shared component), §3.1–3.2; TOKENS.md; MOTION.md.

## Global constraints

- Tokens only in the new stylesheet: no raw hex, px font size, radius or duration literals. `lg-*` mixins are allowed for glass.
- Motion per MOTION.md: transform/opacity only, 120/200/320/460ms, `--tc-ease`. Shimmer and spinner stop under `prefers-reduced-motion`.
- Every new user-facing default string goes into all four locales under `studentUi.*` (flat keys).
- lucide-react icons only. Tap targets ≥ 44px for interactive pieces (`ListRow`, `ViewTabs` items, `FilterChip`, `tc-btn`).
- Accessible by default: `ErrorState` `role="alert"`; skeletons `aria-busy` with a visually hidden "Loading…" label; `ProgressBar` `role="progressbar"` with `aria-valuenow`; `ViewTabs` `aria-current="page"` (links) or `aria-pressed` (buttons); `FilterChip` `aria-pressed`.
- No behaviour, route, gate or API change. Plain commits, no attribution, no push.

## Review focus

1. **Long ru/kk strings:** `ViewTabs`, `StatusPill`, `FilterChip` and `ListRow` titles must truncate or wrap without overflowing. The gallery includes long Kazakh and Russian labels.
2. **`ListRow` with both `to` and an interactive `trailing`:** no nested interactive elements. Rule: when `to` or `onClick` is set, `trailing` must not contain buttons, documented in a JSDoc comment.
3. **`QueryState` callers:** existing 12 callers pass `loading`/`error`/`retry` and keep working unchanged (snapshot of the error branch text through i18n defaults).
4. **`ViewTabs` lens on first paint and on window resize:** reuses `useSegmentLens` (already measured on resize).
5. **Reduced motion:** the skeleton shimmer and the spinner rest (compiled-CSS test).

---

### Task 1: Stylesheet and button/field classes

**Files:**
- Create: `src/components/student-hub/ui/student-ui.scss`. It defines `tc-btn` (`--primary|--secondary|--ghost|--danger`, `--sm|--lg`, `--block`; pill, 44px min height, `tc-press`), `tc-field` (native input/textarea look matching antd Input: radius sm, line border, brand focus ring), and the styles of every component below. It also prints `@keyframes tc-spin` and `tc-shimmer` once, with reduced-motion rests.
- Test: `src/components/student-hub/ui/studentUi.styles.test.ts`. Compile the stylesheet and assert:
  - No `#hex` outside `var(` fallbacks.
  - No `\d+ms` literal outside `var(` fallbacks.
  - `@keyframes tc-spin` appears exactly once.
  - It contains `prefers-reduced-motion: reduce` and `min-height: 44px` (tap targets).

### Task 2: Page shell (extend `ApplicantPage`, `QueryState`)

**Files:** modify `src/pages/student-hub/applicant/ApplicantPage.tsx`. Test: `src/components/student-hub/ui/studentUi.test.tsx`.

**Interfaces, produces:**
- `ApplicantPage({ title?: string; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; breadcrumb?: ReactNode; titleAddon?: ReactNode; meta?: ReactNode; children })`.
  - Order: `<Breadcrumb>{breadcrumb}</Breadcrumb>`, `.applicant-page__heading` (eyebrow `.applicant-page__eyebrow`, h1 + `titleAddon` in `.applicant-page__title-row`, subtitle), then `meta` and `actions`.
  - Unchanged output when the new props are absent.
- `QueryState({ loading?; error?; retry; empty?: boolean; emptyState?: ReactNode; children })`.
  - loading → `SkeletonBlock variant="panel"`; error → `ErrorState onRetry={retry}`; empty → `emptyState`.

**Tests:**
- `ApplicantPage renders breadcrumb, eyebrow, title addon and meta in order`.
- `ApplicantPage without new props renders the same markup as before` (string-compare against the old structure: `<section class="applicant-page"><header class="applicant-page__heading"><div><h1>T</h1><p>S</p></div></header>…`).
- `QueryState shows the error with a retry button and role=alert`.
- `QueryState shows emptyState when empty`.

### Task 3: Content pieces

**Files:** create in `src/components/student-hub/ui/`: `Panel.tsx`, `SectionHeader.tsx`, `StatTile.tsx`, `ListRow.tsx`, `StatusPill.tsx`, `ProgressBar.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `Skeleton.tsx` (`SkeletonBlock`, `Spinner`), and `index.ts` (barrel + stylesheet import).

**Interfaces:**
- `Panel({ as?: 'section'|'div'|'article'; title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; tone?: 'glass'|'inset'|'plain'; padding?: 'md'|'lg'|'none'; className?; children })` → `.tc-panel.tc-panel--{tone}.tc-panel--pad-{padding}`. Defaults: glass, md.
- `SectionHeader({ title: ReactNode; subtitle?; meta?; actions?; level?: 2|3 })` → `.tc-section-head`.
- `StatTile({ label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: 'neutral'|'brand'|'success'|'warning' })` → `.tc-stat`.
- `ListRow({ leading?; title: ReactNode; meta?; trailing?; to?: string; onClick?: () => void; className? })` → a `Link` (`to`), a `button` (`onClick`) or a `div`. Class `.tc-row`, min height 44px.
- `StatusPill({ tone?: 'neutral'|'brand'|'success'|'warning'|'danger'; icon?: ReactNode; children })` → `.tc-pill.tc-pill--{tone}`.
- `ProgressBar({ value: number; label?: ReactNode; meta?: ReactNode; ariaLabel?: string })` → `role="progressbar"`, value clamped 0–100, fill as `transform: scaleX(v/100)`.
- `EmptyState({ icon?: LucideIcon; title: ReactNode; description?: ReactNode; actions?: ReactNode; className? })` → `.applicant-empty` with svg, h3, p, `.applicant-actions`.
- `ErrorState({ title?; description?; onRetry?: () => unknown; retryLabel? })` → `role="alert"`. Defaults from `studentUi.error.title`, `studentUi.error.body`, `studentUi.error.retry`.
- `SkeletonBlock({ variant?: 'panel'|'list'|'tiles'; lines?: number })` → `.tc-skeleton`, `aria-busy="true"`, hidden label `studentUi.loading`. `Spinner({ size?: 16|24|32; label? })` → `role="status"`.

**Tests:**
- One `it` per component asserting the class, element type and a11y attribute above.
- `ProgressBar clamps 140 to 100 and uses scaleX(1)`.
- `ListRow renders a link when to is set and a button when onClick is set`.

### Task 4: Composite pieces

**Files:** create `GateCard.tsx`, `ViewTabs.tsx`, `FilterChips.tsx`, `ModalShell.tsx` (`ModalShell`, `DrawerShell`); modify `CollegeListTabs` in `ApplicantPage.tsx` to use `ViewTabs`.

**Interfaces:**
- `GateCard({ eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; children?: ReactNode /* actions, form */; aside?: ReactNode; asideTitle?: ReactNode; fill?: boolean /* default true: useFillViewport */ })` → `.tc-gate` two-column (`.tc-gate__main`, `.tc-gate__aside`); stacks at a panel width under 820px.
- `ViewTabs({ items: { key: string; label: ReactNode; to?: string; count?: number }[]; value: string; onChange?: (key) => void; ariaLabel: string; className? })`. Links when `to` is set, else buttons. Uses `useSegmentLens('[aria-current="page"],[aria-pressed="true"]')` and the `applicant-view-tabs` markup.
- `FilterChips({ options: { value: string; label: ReactNode; count?: number }[]; value: string | string[]; onChange: (value: string) => void; ariaLabel: string; multiple?: boolean })` → `role="group"`, buttons with `aria-pressed`.
- `ModalShell(props: ModalProps)` → antd `Modal` with `className="tc-modal"`, `centered`, `width` default 560, `closeIcon` lucide X. `DrawerShell(props: DrawerProps)` → antd `Drawer` with `className="tc-drawer"`, `width` default 480, lucide X.

**Tests:**
- `ViewTabs marks the active link with aria-current=page`.
- `ViewTabs renders buttons with aria-pressed when items have no to`.
- `CollegeListTabs output is unchanged` (same class, links and labels).
- `FilterChips marks selected values with aria-pressed`.
- `GateCard renders main and aside regions`.

### Task 5: Locales, gallery, verify, commit

- [ ] Add `studentUi.error.title`, `studentUi.error.body`, `studentUi.error.retry`, `studentUi.loading` to `public/locales/{en,ru,uz,kk}.json`. Test `studentUi keys exist in all four locales` (in `studentUi.test.tsx`, reads the JSON).
- [ ] Temporary gallery page with every component, including long ru/kk labels. Screenshots at 1440 and 390, plus reduced motion and reduced transparency, saved to `docs/design-unification/screens/phase-2/`.
- [ ] `npx tsc -p tsconfig.app.json --noEmit` (0 errors); `npx vitest run src/components/student-hub/ui src/styles src/lib/antd` (all pass); the full suite (only the known `codex-sat-lessons` fixture error); `yarn build`; the CI gate and IELTS tests.
- [ ] Commit: `Shared student UI kit (phase 2)`.
