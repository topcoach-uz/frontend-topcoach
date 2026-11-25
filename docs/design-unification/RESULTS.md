# Student design unification: results

Running record, updated at the end of each phase. Branch `design/student-unification` (from `dev` @ `8a60dfde`).

## Sizes

| Measure | Baseline (Phase 0) | After Phase 1 | After Phase 2 |
|---|---:|---:|---:|
| Entry JS (`index-*.js`) | 2,239 kB / 719 kB gz | 2,239 / 719 | 2,239 / 719 |
| Student hub JS (`StudentHubRoutes-*.js`) | 522 kB / 142 kB gz | 523 / 142 | 523 / 142 |
| Student hub CSS (`StudentHubRoutes-*.css`) | **719 kB / 88.6 kB gz** | **634 / 81.6** | 634 / 81.6 |
| Global CSS (`index-*.css`) | 71.4 kB | 73.1 kB (+ tokens) | 73.1 kB |

The performance work proper is Phase 4. Phase 1's CSS drop comes from printing the legacy form rules once instead of 16 times.

## Phase 1: tokens and foundations

Commits `0289ee1a`, review fixes `08101159`.

- **Tokens:** `--tc-*` CSS custom properties from `$tc-*` in `src/styles/student-hub-design-system.scss`, printed once by `global.scss`. Covers colour, radius, 4px space, type scale, elevation, motion and z-index. See [TOKENS.md](TOKENS.md).
- **Student antd theme:** `src/lib/antd/studentTheme.ts` applied by `StudentThemeProvider` in the student hub layout, auth layout, `/onboarding` and `/learning` only (D1).
- **Motion spec:** [MOTION.md](MOTION.md). `lg-enter` uses the tokens; new `tc-press` mixin.
- **Glass fallbacks:** lens and segmented mixins go solid under reduced transparency and more contrast.
- **Legacy form rules:** printed once, limited to student containers (they used to load site-wide), focus rings restored, one border on inputs with icons, InputNumber has one ring.
- **Tests:** `src/styles/designTokens.test.ts` (9), `src/lib/antd/studentTheme.test.ts` (5).
- **Screenshots:** [screens/phase-1/](screens/phase-1/).

**Rulings**
- `global.scss` loads the token file with a namespaced `@use`, because 5 Sass names collide with `variables.scss`. Cost if wrong: none.
- The `lg-lens` reduced-transparency fallback is solid `#a32d2d`, since it sits on brand red with white text (~7:1). Cost if wrong: a lighter red chip in that mode.
- The shared `tc-spin` keyframe moved to Phase 2. Cost if wrong: none.
- Raw `input`/`textarea` legacy rules stay limited to the profile forms; antd field rules cover student containers. Cost if wrong: none vs before.
- Select/picker legacy rules keep their original reach (form items, `.student-hub-page`, profile forms) behind a zero-specificity `:where()` prefix (review fix). Cost if wrong: none.
- `Select.activeOutlineColor` doesn't exist in antd 5.20.3; Select uses the global `controlOutline` (= `--tc-focus`). Cost if wrong: none.
- `/learning` is wrapped at its default export (9 early returns). Cost if wrong: none.
- Dark mode: the student theme stays light. Learning, auth and onboarding styles were already light-only. Cost if wrong: dark-mode users see light antd controls in student areas, as they already saw light page chrome.

**Deferred minors (Phase 1 review)**
- Inputs inside hub modals and drawers (portals outside the shell) use the theme's 12px / `#e7e2dc`, while in-page legacy inputs keep 6px / `#d1d5db`. This resolves as Phase 3 migrates pages.
- SAT, IELTS, learning, auth and onboarding inputs moved from 6px / `#d1d5db` to 12px / `#e7e2dc`. `#e7e2dc` has lower boundary contrast on white; revisit the field border token in Phase 3.
- The old leak was wider than first stated: `components/loading` imported the design system, so the global form rules also loaded on mentor and counselor pages. The scoping fixes that.
- A textarea inside an affix wrapper (`showCount`/`allowClear`) still has a double border (pre-existing).
- Tests: the `backdrop-filter: none` count is weak (the `-webkit-` prefix matches too); the focus-ring test compares literals; 7 theme colours aren't mirrored in the parity test.
- The nested `<App>` adds a second toast host, so static `message.*` and `App.useApp()` toasts stack separately.
- `tools/shoot.mjs`: the random port isn't checked as free, `send()` has no timeout, the temp profile can survive on Windows, and there's a dead `clip` variable.

## Phase 2: shared student UI kit

Commits `12e1c936`, review fixes `f6deb06a`.

- **The kit** (`src/components/student-hub/ui`): `Panel`, `SectionHeader`, `StatTile`, `ListRow`, `StatusPill`, `ProgressBar`, `EmptyState`, `ErrorState`, `SkeletonBlock`, `Spinner`, `GateCard`, `ViewTabs`, `FilterChips`, `ModalShell`, `DrawerShell`, plus the `.tc-btn` and `.tc-field` classes. One stylesheet, tokens only.
- **`ApplicantPage`** gains `breadcrumb`, `eyebrow`, `titleAddon` and `meta` (output unchanged without them). `QueryState` uses the kit's skeleton and error state and supports an empty state. `CollegeListTabs` renders through `ViewTabs` with identical markup.
- **Strings:** `studentUi.error.title|body|retry` and `studentUi.loading` in en, ru, uz and kk (kk = Karakalpak, Latin script).
- **Tests:** `studentUi.test.tsx` and `studentUi.styles.test.ts`, 42 in total.
- **Screenshots:** [screens/phase-2/](screens/phase-2/).

**Rulings**
- Chips and small buttons are 36px on mouse devices and 44px on touch screens (`pointer: coarse`); view tab items are too. Cost if wrong: 36px desktop targets.
- Literal-value checks read the stylesheet source; the `lg-*` mixins carry their own solid fallbacks. Cost if wrong: none.
- `ErrorState`'s default title keeps the existing copy ("We couldn't finish that request."). Cost if wrong: none.
- **Visual change:** `QueryState`'s error and loading states now render the kit's centred block instead of antd's compact Alert on about 25 callers. This is the intended kit adoption. Two error blocks stacking inside one card (document review, essays) and "not found" shown as a retryable error get per-page fixes in Phase 3. Cost if wrong: a larger error block in small sub-panels until then.

**Deferred minors (Phase 2 review)**
- `ListRow` drops `onClick` when `to` is also passed.
- `.tc-row__trailing` needs `max-width`/`min-width` so a long pill can't squeeze the title on 390px.
- `FilterChips` has an unused `multiple` prop; counts in chips and tabs need a separator for screen readers.
- `ModalShell`/`DrawerShell` turn `closeIcon={null}` into an X; in antd, `null` hides it.
- `ViewTabs` wraps in-page filter buttons in a `<nav>` landmark; label content carrying `aria-current` could take the thumb.
- `ProgressBar` has no accessible name when `label` is a node and `ariaLabel` is missing.
- The list skeleton never shows short lines (`flex: 1` wins over the width).
- `GateCard` always renders `<h1>` (two h1s inside a titled page), and its blush aside is glass on glass.
- Tests are SSR-only (no effect, click or keyboard paths); there are mid-file imports; the `localStorage` stub isn't guarded.
- Found for Phase 3: `.applicant-page .ant-btn { border-radius: 10px }` blocks the theme's pill buttons on workspace pages.

## Known, not caused by this work

- `codex-sat-lessons.test.ts` fails locally because it reads `D:\Projects\TopCoach\output\…\lesson-pack.json`, which isn't in the repo. CI doesn't run vitest.
- The build's `Unexpected ")"` CSS warning comes from `ielts-prep/browse.css` (pre-existing).
