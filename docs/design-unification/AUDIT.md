# Student-side design unification: Phase 0 audit

Read-only audit of the student-facing frontend, 2026-11-24, branch `design/student-unification` (from `dev` @ `8a60dfde`). Nothing in `src/` was changed.

**Scope scanned (498 files):** `src/pages/{auth,onboarding,student-hub,learning}`, `src/components/{layouts,student-hub,chat,notifications,common,sat-prep,referral}`, `src/styles`.
**Method:** a scan script for every hardcoded value (re-runnable: `docs/design-unification/tools/inventory.mjs`), a production build for sizes, and three read-only code reviews (components, antd + motion, performance patterns).

The complete `file:line` lists are in [`inventory/`](inventory/); this document is the summary and the plan inputs.

| Inventory | Rows | What's in it |
|---|---:|---|
| [colors.md](inventory/colors.md) | 5,389 | every hex/rgb(a) value, nearest proposed token, colour distance, off-brand hue flag |
| [type.md](inventory/type.md) | 2,620 + 116 | every font-size (px, nearest type token, off-scale flag) and font-family |
| [spacing.md](inventory/spacing.md) | 5,268 | every margin/padding/gap literal, values off the 4px grid |
| [radius.md](inventory/radius.md) | 1,442 | every border-radius, nearest radius token |
| [shadows.md](inventory/shadows.md) | 231 | every literal box-shadow |
| [motion.md](inventory/motion.md) | 368 + 94 | every transition/animation (durations, easing) and z-index |
| [build-baseline.md](inventory/build-baseline.md) | 433 | every built JS/CSS chunk, raw and gzip |

---

## 1. Headline findings

1. **Three competing token systems, none of them the brand.**
   - `styles/variables.scss` mirrors antd's theme (blue links `#1677FF`, grey layout `#F5F5F5`, a lighter hover red `#A90000`, antd green).
   - `styles/_editorial-tokens.scss` uses another cream (`#faf8f3`), another maroon (`#7b1f2f`, 170 uses) and Inter Tight plus Iowan serif.
   - `styles/student-hub-design-system.scss` is a Tailwind-style palette (grey scale, green "secondary", **purple**, orange and pink accents) plus global "NUCLEAR" antd overrides.
   - Pages add their own local `$tokens` on top (applicantPages, research-prep, taskWorkspace, communityHubMock…). None of the systems is exposed as CSS custom properties that pages use.
2. **Hardcoded everything.**
   - 5,389 colour literals with **1,209 distinct values**; 497 are off-brand hues (279 blue/purple, 176 green, 39 orange).
   - 184 distinct font sizes (404 uses off any sensible scale); 70 distinct radii; 196 distinct shadows.
   - 2,491 spacing values not on the 4px grid.
   - 17 font families, the most used being **Iowan Old Style (74)**. DM Sans is named only 12 times; it mostly arrives by inheritance.
3. **Focus rings are removed globally.** `student-hub-design-system.scss:380-450` sets `outline: none !important; box-shadow: none` on every focused `.ant-input` / `.ant-select`, unscoped. It's `@import`ed into 16 stylesheets, so the CSS is also duplicated 16× in the output. This is an accessibility bug, not just style.
4. **One giant student chunk.** `CommunityHubMockPage.tsx` (the live hub, despite the name) statically imports every section, and `StudentHubGate` statically imports `StudentHubRoutes`. Result: **522 kB JS + 719 kB CSS** for any student page.
5. **Polling never stops.** About 20 queries poll on fixed 10–60 s intervals with RTK 1.9 (no unfocused pause), including 3 in the shell on every page, and keep going in hidden tabs. The router subscribes to several of them, so the **whole app tree re-renders on each poll**.
6. **The page structure is mostly right in the applicant core.** Applications, tasks, essays, documents, universities and study direction use `ApplicantPage` + `Breadcrumb`. The drift is in the hub sections (My learning, Admissions, SAT, IELTS, Major Match, Messages, My Programs, Opportunities), the Overview dashboard, and auth/onboarding.
7. **Icons are already lucide underneath.** No react-icons, iconsax, FontAwesome or `@ant-design/icons` imports in scope. Two string wrappers (`UnifiedIcon`, `FontAwesomeIcon`) and 38 custom SVGs in `components/icons` remain.
8. **A lot of in-scope code is dead.** About 25 files have no importers (legacy applications/notifications/settings/timeline pages, rewards mock, several cards). Deleting them removes a big share of the off-brand colour, icon-wrapper and antd `Card`/`Tag`/`Empty` hits.

---

## 2. Tokens

### 2.1 What exists today

| File | What it defines | Problem |
|---|---|---|
| `src/styles/_liquid-glass.scss` | Materials: `lg-thick/regular/thin/tint/blush/inset/lens/segment-*`, `lg-enter`, `$lg-ease`, `$lg-red` | **Keep as the materials layer.** `lg-lens`, `lg-lens-light` and `lg-segment-*` lack `lg-fallbacks` (no reduced-transparency/contrast fallback). |
| `src/styles/variables.scss` | `$font-primary`, `$colorX: var(--colorX)` mirrors of the antd theme, mixins | Mirrors antd defaults, not the brand |
| `src/styles/_editorial-tokens.scss` | cream/ink/maroon `#7b1f2f`, serif + Inter Tight, display scale, radius 6/10/14 | A second brand |
| `src/styles/student-hub-design-system.scss` | Tailwind-style scales, purple/orange/pink accents, global antd overrides | A third brand, plus the focus-ring removal |
| `src/constants/theme.ts` + `src/lib/antd/index.tsx` | antd `ConfigProvider` theme (global) | Off-brand, see §4 |

### 2.2 Proposed tokens (Phase 1; one set, as CSS custom properties)

Defined once in `student-hub-design-system.scss`, rewritten as the student token file, with the old Sass variables aliased to it so nothing breaks while pages migrate. No new parallel file. Primitive → semantic layering follows the design-system skill; components read semantic tokens only.

| Group | Tokens (value) |
|---|---|
| Surfaces | `--tc-canvas #fbf9f6` · `--tc-surface #ffffff` · `--tc-surface-tonal #f5f2ee` · `--tc-surface-sunk #efeae4` |
| Lines | `--tc-line #e7e2dc` (≈ `rgba(48,43,40,.08)` on glass) · `--tc-line-strong #d8d0c8` |
| Text | `--tc-ink #221d1a` · `--tc-text #302b28` · `--tc-muted #6b625b` · `--tc-subtle #9a9089` · `--tc-on-brand #fff` |
| Brand | `--tc-brand #8b0000` · `--tc-brand-hover #6e0000` · `--tc-brand-press #5a0000` · `--tc-blush #f7e6e4` · `--tc-blush-strong #f1d9d6` · `--tc-focus rgba(139,0,0,.14)` |
| Status (muted, on-brand) | `--tc-success #2f7a4b` / bg `#eef5ef` · `--tc-warning #95580a` / bg `#fbf3e4` · `--tc-danger #b4372b` / bg `#fdeceb` · `--tc-info` = muted |
| Radius | `--tc-radius-xs 6` · `-sm 12` · `-md 16` · `-lg 20` · `-xl 24/28` · `-pill 999px` |
| Space (4px grid) | `--tc-space-1 4` · `-2 8` · `-3 12` · `-4 16` · `-5 20` · `-6 24` · `-8 32` · `-10 40` · `-12 48` · `-16 64` |
| Type | `--tc-text-micro 11` · `-caption 12` · `-small 13` · `-body-sm 14` · `-body 15` · `-body-lg 16` · `-h3 17` · `-h2 20` · `-h1 28` · `-display 36`; weights 400/500/600; size-specific letter-spacing (-0.02em ≥ 24px, 0 for body) |
| Elevation | `--tc-shadow-1` (hairline lift), `--tc-shadow-2` (card), `--tc-shadow-3` (popover/modal); glass shadows stay in the `lg-*` mixins |
| Motion | `--tc-ease` = `cubic-bezier(0.32,0.72,0,1)` (`$lg-ease`), `--tc-ease-fade` = `ease`, durations `--tc-dur-1 120ms` (press/colour), `--tc-dur-2 200ms` (state), `--tc-dur-3 320ms` (small spatial), `--tc-dur-enter 460ms` (panels, thumbs, `lg-enter`) |
| z-index | `--tc-z-raised 1` · `-sticky 10` · `-nav 100` · `-dropdown 1000` · `-modal 1100` · `-toast 1200` (today: 26 distinct values) |

### 2.3 Size of the gap (from the inventory)

| Value type | Most common literals | Maps to |
|---|---|---|
| Colour | `#8b0000` 444 · `#fff` 398 · `#7b1f2f` 170 · `#1f2937` 127 · `#655c55` 110 · `#6b7280` 106 · `#e7e2dc` 105 · `#302b28` 101 · `#e5e3da` 84 · `#64748b` 82 · `#0f172a` 55 · `#606976` 49 | brand · surface · brand (wrong maroon) · text · muted · muted · line · text · line · muted · ink · muted |
| Radius | `999px` 223 (+28 `!important`) · `12px` 145 · `8px` 140 · `10px` 132 · `50%` 128 · `14px` 94 · `16px` 78 · `6px` 62 · `4px` 44 · `20/24/18px` | pill · sm · xs/sm · sm · round · md · md · xs · xs · lg/xl |
| Font size | `14px` 234 · `12px` 200 · `13px` 176 · `0.75rem` 94 · `16px` 90 · `15px` 86 · `0.78rem` 85 · `0.875rem` 75 · `11px` 75 · `0.95rem` 68 … 184 distinct | the 10-step scale above |
| Font family | Iowan Old Style 74 · DM Sans 12 · system stack 7 · Lora 6 · monospace stacks 8 | DM Sans everywhere; a mono token for code/scores only |
| Duration | 150ms 197 · 120ms 80 · 200ms 73 · 300ms 28 · 180ms 23 · 100ms 20 · 240ms 19 · ~50 distinct | 120 / 200 / 320 / 460 |
| Easing | `ease` 287 · unspecified 70 · `ease-out` 44 · lg-ease (several local aliases) ~54 · 8 other cubic-beziers | `--tc-ease` for movement, `ease` for colour/opacity |

**Worst files** (hardcoded values; full list in `inventory/summary.json`):

| File | Hardcoded | Lines |
|---|---:|---:|
| applicant/applicantPages.scss | 1,408 | 2,938 |
| community/communityHubMock.module.scss | 926 | 3,418 |
| MyProgressEditorialView.scss | 638 | 2,088 |
| ielts-prep/style.css | 630 | 2,376 |
| admissions-program/AdmissionsProgramPage.scss | 575 | 2,000 |
| community/CommunityFeedEditorialView.scss | 554 | 2,231 |
| sat-prep/sat-platform.scss | 488 | 1,617 |
| major-match-v2/mm3-results-refresh.scss | 452 | 371 |
| sat-prep/sat-runner.scss | 399 | 1,301 |
| research/research-prep.scss | 350 | 1,850 |

`research-prep.scss` already uses local Sass tokens; they become the global ones. `AdmissionsProgramPage.scss` may be dead (see §7).

---

## 3. Components and page shells

### 3.1 Page headers

| Area | Today | Change |
|---|---|---|
| Applications, college list, tasks, essays, documents, universities, study direction, sessions | `ApplicantPage` + `Breadcrumb` ✓ | tokens only |
| Feed, Study Buddies, Mentors, My learning, Full Support, Profile, Rewards, Settings | `ApplicantPage`, **no Breadcrumb** | add Breadcrumb |
| **Overview dashboard** | own `ov-hero` + `applicant-page-heading` | ApplicantPage (keep the hero as the first card) |
| **Admissions course** (hub) | `admissionsShellHeader` + `admissionsHero` + `admissionsListHeader`: 3 header layers | ApplicantPage + one section header |
| **SAT prep** | `sat-shell__header` **plus** a per-tab hero h1 (Dashboard uses an h1 as an eyebrow) | ApplicantPage in `SatPrepLayout`; tabs become in-page sections |
| **SAT course** (hub) | hub `pageHeader` h1 **and** `CoursePreview` ApplicantPage h1 → two h1s | one header |
| **IELTS prep** | mounts the full site `<Header workspace />`; own CSS (`style.css`, `browse.css`) | ApplicantPage inside the shell (keeps its own chrome per `applicantWorkspace` rules, to confirm) |
| Research Program | `ResearchTopBar` (Breadcrumb + own header) | ApplicantPage with an actions/meter slot |
| Major Match | `mm3-workspace__breadcrumb` | ApplicantPage (shared with counselor `MajorMatchTab`; see §8) |
| Messages | `editorialHeader` | ApplicantPage |
| My Programs | bare h1 / `mp-heading` | ApplicantPage |
| Opportunities | `student-hub-page-title` + antd Tabs in a Card | ApplicantPage + view tabs |
| Scholarship new | `page-header` | ApplicantPage |
| Degree / study-area detail | `DetailHero` / missing state | ApplicantPage + hero card |
| `/learning` lesson player | `lesson-header-editorial` | ApplicantPage-compatible header (player layout stays) |
| Auth pages | `TitleDescriptionPair`, `CustomText fontSizeTitleN` | one `AuthHeader` |
| Onboarding | renders `pages/onboarding-preview/OnboardingPreview.tsx` (folder outside the listed paths, route in scope) | see Decision D7 |

Breadcrumb placement already renders **above** the title everywhere: `.applicant-page > .applicant-breadcrumb { order: -1 }` in `applicantPages.scss` moves it even when it's a child below the h1. Keep that rule; standardize on passing it through `ApplicantPage`.

### 3.2 Switchers not on `applicant-view-tabs`

- **Lens hook, own class:** `ProfilePage.tsx:403` (`pf-tabs`), `ResearchTopBar.tsx:127` (`rp-nav`), `ConversationList.tsx:194`, `SettingsNavigation.tsx:35`.
- **antd:**
  - `StudyBuddyHubSection.tsx:340` (`Tabs`), `:393` (`Segmented`)
  - `OpportunitiesPage.tsx:71` (`Tabs` in a `Card`)
- **Hand-rolled:**
  - `ApplicantDocumentReviewPage.tsx:199`, `ApplicantDocumentsPage.tsx:155`, `ApplicantEssaysPage.tsx:742` (`applicant-tabs`), `:811` (desk toggle)
  - `CommunityFeedEditorialView.tsx:951` (category row), `:938` (saved toggle)
  - `MM3Results.tsx:864`, `MyProgramsStudentPage.tsx:49` (+ a `<select>` program switcher :33), `MyProgressEditorialView.tsx:832`
  - `SatPrepLayout.tsx:69`, `SatLibraryPage.tsx:362` (+ subtopic chips), `SatMockTestsPage.tsx:369`, `SatReviewPage.tsx:158`, `SatPracticeFlowPage.tsx:248,267`, `SatTestPacksPage.tsx:241,261`
- **Keep as-is:** `ApplicantWorkspaceNav.tsx:505` (mobile section tabs, a different control).
- **Chips vs tabs:** filter *chips* (difficulty, count, subtopic) become one `FilterChip` group, not segmented tabs.

### 3.3 Search fields

- Every standalone live search field already has `SearchButton` except `CommunityFeedEditorialView.tsx:1578` (share-to-chat "Search people…").
- **`SearchButton` sizes vary** (24/28/30/34/48). Standardize: 24 in default fields, 30 in large fields, 48 in the university capsule.
- `Select showSearch` / `AutoComplete` pickers stay pickers (listed in the component audit).

### 3.4 Icons

- No third-party icon libraries in scope.
- **To replace with direct lucide imports:**
  - `UnifiedIcon` in live `CommunityHubMockPage`, `ProfilePage`, `OpportunitiesPage`, `ApplicationTimeline`, `AdmissionsProgramProgressCard`
  - `FontAwesomeIcon` (a lucide wrapper) in live `AcademicProfile` (21), `PersonalProfile` (8), `ActivitiesProfile` (4), `NewScholarshipPage`, `StudentHubErrorBoundary`
- Custom SVGs from `components/icons` in auth (`Tick2`, `Check`, `Info`), header actions, `ProfileDropdown`, hamburger, `common/modal`, `MySelect`. The header ones are shared with the public site (§8).
- `package.json` keeps `@fortawesome/*`, `iconsax-react`, `react-icons` and `@openai/chatkit-react`, but nothing in scope imports them. Remove only if nothing outside scope does (Phase 4 check).

### 3.5 Duplicate patterns → one shared component each

| Pattern | Today | Becomes |
|---|---|---|
| Cards/panels | `applicant-panel` (64 uses) + ~70 other card classes + antd `Card` in 38 files | `Panel` (on `applicant-panel` / `lg-regular`; inset variant for nesting) |
| Primary buttons | antd `Button` 323 + raw `<button>` 400; ~18 bespoke primary classes (`mm2__btn--primary`, `myprog__btn--primary`, `sat-btn--primary`, `rp-btn--primary`, `rewards__btn--primary`, `cf__btn--primary`, `mp-primary`, `CustomButton` in auth/onboarding…) | antd `Button` themed by tokens (pill), plus one `.tc-btn` CSS class for the rare non-antd case |
| Section headers | ~50 header classes | `SectionHeader` (title, meta, actions) |
| Empty states | antd `Empty` ×22, `applicant-empty` ×12, ~100 other `*empty*` | `EmptyState` (on `applicant-empty`) |
| Error states | `Alert` ×50, ~45 custom blocks; `QueryState` already exists (12 files) | `QueryState` everywhere (loading / error / empty) |
| Loading | `Spin` ×29, `Skeleton` ×36, ~60 custom shimmer classes, **two loader libraries** (`components/loader`, `components/loading`) | `QueryState` skeleton for pages, `Loader` for route fallbacks; retire `components/loading` |
| Modals/drawers | antd `Modal` 43 (33 files), `Drawer` 4, 6 custom portals, unused `common/modal` | `ModalShell` / `DrawerShell` (themed antd) |
| Stat tiles | ~15 families (`ov-stat`, `myprog__track-stat`, `rewards__hero-stat`, `mm2__stat`, `your-mentor__stat`…) | `StatTile` |
| List rows | antd `List` 31 + ~180 custom row classes | `ListRow` (leading, title, meta, trailing) |
| Progress bars | antd `Progress` 6 + 84 custom bars | `ProgressBar` (the `rp-meter` look) |
| Pills/badges | antd `Tag` 41 (blue `processing`, `gold`, `magenta`…) + ~120 custom pill classes | `StatusPill tone=` + `FilterChip` |
| Gate cards | `useFillViewport` in 2 gates; 4 more gates don't use it | `GateCard` |

---

## 4. antd theming

- **Global theme off-brand** (`constants/theme.ts` spread into `lib/antd/index.tsx`):
  - Links are antd blue `#1677FF`.
  - Primary hover gets *lighter* (`#A90000`).
  - Selected items are pale blue (`#E6F4FF`).
  - Text is `rgba(0,0,0,.88)`, layout grey `#F5F5F5`.
  - Success/warning/error are antd green/gold/red (`#F5222D` clashes with crimson).
  - Button radius 12 (not pill); Input focus ring is grey; Select's selected option is solid crimson with white text.
- **Off-brand usages:**
  - `Tag color="processing"` (blue) in Study Buddies, applications helpers and the learning progress tracker
  - `Tag color="blue"`, `gold`, `magenta`
  - `Progress` with Tailwind colours (`#22c55e/#3b82f6/#f59e0b`, `#16a34a`)
  - Default red `Badge`
- **873 `.ant-*` override lines in 67 stylesheets**, inside files that carry 1,405 `!important` declarations. Most targeted: `.ant-btn` (99), `.ant-select-selector` (58), `.ant-input` (48).
  - Button primary colours, pill radius, Tabs ink bar, Pagination, Checkbox/Radio/Switch, Segmented, Select option and focus rings can all move to theme tokens.
- **Toasts:** ~289 static `message.*` / `notification.*` calls; only 3 use `App.useApp()`, so most toasts don't see the theme.
- **Dead wrappers:** `common/tabs` (debug `red`/`yellow` colours), `common/segmented`, `common/checkbox`.
- **The full proposed `ConfigProvider` theme block is ready for Phase 1.** Brand tokens, pill buttons, warm borders, crimson focus ring, blush selection, muted status colours, tabs/segmented/pagination/tag/progress/badge component tokens. See Decision D1 for *where* it applies.

---

## 5. Motion

- **38 `@keyframes` in scope.** One good entrance system exists (`lg-materialize` via `lg-enter`, 480ms lg-ease; `applicant-panel-in` 420ms). Then:
  - **Three dead keyframes:** `shimmer`, `float`, `pulse` in `AdmissionsProgramPage.scss`.
  - **Nine separate `*-spin` keyframes** for spinners.
  - **A shared `fadeIn` that only works if `learning/index.scss` happens to be loaded,** and it uses `ease-in` (wrong direction for an entrance).
- **Durations:** about 50 distinct (150ms ×183, 120ms ×82, 200ms ×71…). **Easing:** `ease` ×321 plus 8 different cubic-beziers. lg-ease is re-declared locally under 4 names.
- **Expensive properties:**
  - `transition: all` ×56
  - Transitions on `box-shadow` ×24 and `width` ×16 (progress fills; the segmented lens animates `width`)
  - Transitions on `left` (`communityHubMock:3021`), `max-height` (`applicantPages:1968`, chat `slideDown`), `grid-template-columns` (`applicantPages:796`)
  - A `backdrop-filter` change on hover (`AdmissionsProgramPage.scss:829/864`)
- **Hover and press:** 78 hover lifts (mostly -1/-2px; -8/-12px in Admissions); 42 `:active` scales with 10 different values (0.92–0.99).
- **No scroll-reveal anywhere** (AOS is installed but not mounted in scope). No framer-motion, GSAP or react-spring. Good.
- **Reduced motion:** handled in 22 files; ~17 animating files don't. Feed shimmer, hub `sectionSwapIn`, Applications, Admissions, Assessment, Referral, Major Match, SAT dashboard/library, onboarding, the infinite typing indicator and skeleton loops.
- **Reduced transparency:** 28 raw `backdrop-filter`s; 7 have no fallback (`AdmissionsProgramPage:829,864`, `research-prep:1004`, `sat-runner:610`, `mm3-inputs:200`, `CommunityLockedPage:14`, `MyRewardsEditorialView:636`). Plus every segmented control (mixins lack `lg-fallbacks`).
- **Proposed motion spec (Phase 1):**
  - `--tc-dur-1` 120ms for press/colour, `--tc-dur-2` 200ms for state, `--tc-dur-3` 320ms for small moves, `--tc-dur-enter` 460ms for panels/lens/`lg-enter`.
  - `--tc-ease` (lg-ease) for anything that moves; `ease` only for opacity/colour.
  - Press = `scale(.97)`; hover lift ≤ 2px. Transform/opacity only (progress fills via `scaleX`).
  - One spinner keyframe.
  - `prefers-reduced-motion` → opacity cross-fades / no movement; `prefers-reduced-transparency` → `lg-fallbacks` everywhere.
  - Per apple-design: interruptible (no input lock during transitions), enter/exit along the same path.

---

## 6. Performance baseline

Build: `yarn build` passes (46 s). Totals: **JS 321 files, 9.2 MB raw / 3.6 MB gzip; CSS 112 files, 2.2 MB raw / 363 kB gzip.**

| Chunk | Raw | Gzip | Loaded by |
|---|---:|---:|---|
| `index-*.js` (entry) | 2,239 kB | 719 kB | **every page** |
| `StudentHubRoutes-*.js` | 522 kB | 142 kB | every student page |
| `StudentHubRoutes-*.css` | 719 kB | 89 kB | every student page |
| `ApplicantTopBarContext-*.css` | 111 kB | 17 kB | student shell |
| `pdf.worker` / `pdfWorker` | 1,046 / 454 kB | — / 135 kB | PDF lessons, document review |
| `jspdf.plugin.autotable` | 417 kB | 136 kB | Full Support / roadmap PDF export |
| `emoji-picker-react` | 335 kB | 83 kB | chat emoji (already lazy) |
| `ccEcharts` | 604 kB | 208 kB | not reachable from scope |

**Main causes:**
1. **Hub sections all static.** `CommunityHubMockPage.tsx:15-53` statically imports MyProgress, Feed, FullSupport (pulls jsPDF), ResearchPrep, MajorMatchV2 (also lazy elsewhere, so that's wasted), Opportunities, Profile (legacy Applications/Documents), Settings, Placement (jsPDF), StudyBuddies, Messenger, Rewards, Mentors. `StudentHubGate.tsx:18` imports `StudentHubRoutes` statically; `router:187` `StudentHubRoutesLazy` is unused.
2. **Entry chunk** carries the whole chat UI (header `ChatIcon` → `ChatModal`, even for logged-out visitors), plus `HomeRouter`, `CounselorConsoleGate`, `MainLayout`, Sentry replay and PostHog. The router also **prefetches the mentor console** for students (`router:297-302`). Mostly outside scope (§8).
3. **jsPDF/autotable** in the hub chunk for two click-only exports. **react-pdf** in `/learning` for PDF lessons only.
4. **Polling.** Shell on every page: `getMyOrgs` 30 s, prefs 30 s, enrollment 30 s, org membership 60 s, mentoring programs 30 s (hook called 3×).
   - Applications page: **six queries every 10 s**, including a duplicate key.
   - `FullSupportPaymentGate` polls every 10 s forever. Chat lists poll on a fixed 60 s, which overrides the smart pause.
   - None pause in hidden tabs (RTK 1.9.7 has no unfocused-skip).
5. **Re-renders.** Router-level subscriptions re-render the whole tree on each poll flip. `ApplicantShell` passes the raw query object as context. The Feed (28 `useState`, no memo) re-renders and re-sorts every post on every keystroke.
6. **Images.** `/img/some-university.png` is **4.4 MB** (applications fallback). Feed/chat/mentor/university images have no `loading="lazy"` or size. The auth illustration panel loads 5 images eagerly.
7. **Other.**
   - The DM Sans request includes the italic axis (unused?).
   - Meta Pixel + Clarity + GA4 on every page (out of scope).
   - Scroll-to-top runs 3× per hub navigation.
   - `TypingIndicator` runs a 3 s interval even when idle.

**Phase 4 targets** (to be measured in RESULTS.md):
- Split the hub into lazy sections. Expected: the 522 kB / 719 kB student chunk becomes a small shell plus per-section chunks.
- Make PDF export and the PDF viewer dynamic.
- Pause polling in hidden tabs, and dedupe keys.
- Memoize the shell context; isolate router subscriptions.
- Lazy-size images; replace the 4.4 MB PNG.
- Remove the duplicated `student-hub-design-system` CSS.

---

## 7. Dead or legacy code in scope

**No importers** (verify once more before deleting; Decision D4):
- `MyRewardsMockPage`, `MyRewardsStoreView`, `ResearchPrepLockedPreview`, `SatPrepComingSoonPage`
- `NewTaskPage`, `ViewApplicationPage`, `gpa-calculator/`, `notifications/NotificationsPage`, `timeline/`, `university-matcher/`, `settings/SettingsPage`
- Cards: `BookingsCard`, `EventsCard`, `AISuggestionsCard`, `NextBestActionCard`, `JourneyStatusHeader`, `TelegramConnectionChecklist`, `OrgMembershipCard`, `TelegramFlyerChip`
- `MajorMatchPromptModal`, `MajorMatchCollectModal`, `MajorMatchProfileFields`, `components/student-hub/LoginPrompt`, `MajorMatchStickyBanner`, `StudyGoalsStickyBanner`
- `admissions-program/AdmissionsProgramPage`, most of `psychometric-assessment/` (only `MajorMatchUpsell` is live)
- `common/tabs`, `common/segmented`, `common/checkbox`

**Live despite the name:** `CommunityHubMockPage`, `MenteeSettingsPageMock`, the `*EditorialView` files.

**Reachable only via read-only Profile:** `applications/ApplicationsPage`, `documents/DocumentsPage` (+ Edit/NewApplicationPage).

---

## 8. Changes that would reach out-of-scope areas (need your OK)

| Change | Would also affect |
|---|---|
| Theming antd via the **global** `ConfigProvider` | the mentor console, counselor console, public site, auth (everything) |
| `CommunityFeedEditorialView` | mentor console `FeedPage` |
| `ResearchPrepPage` and its components | mentor `ResearchPrepLearnerPage` |
| `chat/*` (`ChatModal`, `MessageList`, `ChatInput`, `ConversationList`) | mentor console chat |
| `ReferralsPanel` | mentor `ReferralsPage` |
| `MajorMatchV2Page` | counselor `MajorMatchTab` |
| `applicant/ApplicationRequirements` | mentor `SharedApplications` / `StudentWorkspace` |
| `EditProfileModal` | mentor `ProfilePage` |
| `my-programs/programModel` | mentor and counselor |
| `SearchButton` | ~20 mentor, counselor and admin files |
| `components/layouts` (header, `ProfileDropdown`, `ChatIcon`) | the public site and both consoles |
| `student-hub-design-system.scss` (focus-ring fix, de-duplication) | `pages/payment` (public) and `community` permalink (both import it) |
| Router (lazy `StudentHubRoutes`, drop mentor prefetch for students, lazy `ChatModal`) | `src/lib/router` is shared by every area |

---

## 9. Prioritized page list

No traffic data was available, so priority = how often a student sees it × how inconsistent it is × how much it costs at load. If you can share PostHog page-view counts, I'll re-rank.

| # | Batch | Why first |
|---|---|---|
| 1 | **Foundations:** tokens, antd theme, motion spec, focus-ring fix, `lg-fallbacks` on all mixins | every page; fixes an a11y bug |
| 2 | **Shell:** `ApplicantShell`, nav rail/panel, `ApplicantPage`/`Breadcrumb`, `applicantPages.scss` + `liquidGlassWorkspace.scss` (1,515 literals) | on every student page |
| 3 | **Overview dashboard** (`ApplicantOverviewPage`, `applicantOverview.scss`) | landing page; own header |
| 4 | **My learning:** MyProgress (638), Admissions course section (3 header layers), `/learning` player, SAT course double-h1 | high use, worst drift |
| 5 | **Community:** Feed (554 + keystroke re-renders), Messages (own header), Study Buddies (antd Tabs/Segmented) | high use; shared with mentor console (§8) |
| 6 | **Application:** college list, essays, documents, universities, degree/study-area detail, scholarship new | mostly compliant; tokens + switchers |
| 7 | **Tasks, Full Support, My Programs** | My Programs has no ApplicantPage; FS polling |
| 8 | **SAT prep** (sat-platform/runner/secondary/dashboard ≈ 1,450 literals, double headers, 6 hand-rolled filters) | big, self-contained |
| 9 | **IELTS prep** (630 + own header) and **Research Prep** (promote local tokens) | self-contained |
| 10 | **Major Match** (mm3 ≈ 900 literals; shared with counselor) | needs D3 |
| 11 | **Settings, Billing, Profile, Rewards, Opportunities** | lower traffic |
| 12 | **Auth and onboarding** (`CustomButton`, `CustomText`, illustration panel) | first impression, but smaller |
| 13 | **Dead-code removal** | after the sweep confirms nothing imports them |

---

## 10. Decisions needed before Phase 1

**Status: approved as recommended on 2026-11-24.**

| # | Decision | My recommendation |
|---|---|---|
| D1 | Where the brand antd theme applies | A **nested `ConfigProvider`** in the student shell, auth layout and onboarding only. The global one stays, so the mentor/counselor/public areas don't change. |
| D2 | Token naming | New `--tc-*` CSS custom properties defined in `student-hub-design-system.scss` (rewritten), with the old Sass variables aliased to them so nothing breaks mid-migration. `_editorial-tokens` and `variables.scss` mirrors are retired file by file. |
| D3 | Components shared with the mentor/counselor consoles (Feed, Research Prep, chat, Major Match, referrals, `SearchButton`) | Restyle them through the tokens. Their look changes in the consoles too, which should be fine since it's the same brand. Say if you'd rather I fork student-only wrappers. |
| D4 | Delete the ~25 dead in-scope files (§7) | Yes: one separate commit, after re-checking imports. |
| D5 | Polling (brief: tame polling, but don't change API calls) | Keep every endpoint and interval. Only pause while the tab is hidden, and dedupe identical keys. The data shown doesn't change. |
| D6 | Router changes (lazy `StudentHubRoutes`, no mentor prefetch for students, lazy `ChatModal`) | Do it: `src/lib/router` is shared, but the change is invisible except for speed. |
| D7 | `/onboarding` renders `pages/onboarding-preview/OnboardingPreview.tsx` | Treat that file as in scope (it *is* the live onboarding). |
| D8 | Serif type (Iowan/Lora, 80 uses: course titles, buddy names, research) | Drop it for DM Sans everywhere in scope. One family, as the brief says. |
| D9 | Header / `ProfileDropdown` / custom icons in `components/layouts` | Leave the shared site header alone (public site uses it); unify only student-only layout pieces. |

---

## Skills applied in this phase

- **using-superpowers:** process order; no brainstorming needed (no open design question yet).
- **design-system:** primitive → semantic → component token model.
- **apple-design:** material hierarchy, no light glass on light glass, press feedback, interruptibility, size-specific tracking, reduced motion/transparency/contrast.
- **design-taste-frontend:** only its "one system" checks apply (one button pair, card style, radius scale, link look; ≤2 boxes deep; one heading scale; contrast; 44px tap targets; focus; no scroll fade-ins). Its marketing-page pipeline (deals, photo sets, gate scripts) is for the public site, which is out of scope.
