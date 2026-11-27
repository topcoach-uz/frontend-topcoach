# Phase 3: Page sweep. Plan

> superpowers:executing-plans, one batch at a time, one commit per batch. Each batch ends with real-page screenshots (1440 and 390, plus reduced motion and reduced transparency for pages with glass or motion) in `screens/phase-3/<batch>/`, and the inventory re-run for its files.

**Goal:** Every in-scope page uses the shell (`ApplicantPage` + breadcrumb), the kit (panels, rows, pills, tabs, empty/error/loading states, gate cards) and the tokens instead of literals. Loading, empty and error states are consistent, the spacing rhythm and mobile behaviour match, and touch targets are at least 44px. No behaviour, route, gate or API change.

**Per-batch checklist**
1. **Header:** `ApplicantPage` with `breadcrumb` (and `eyebrow` / `titleAddon` / `meta` where the page has them). Exactly one h1.
2. **Switchers:** `ViewTabs` for views, `FilterChips` for filters; no antd `Tabs` or `Segmented` for page-level switching.
3. **Surfaces:** `Panel` (glass on the canvas, inset inside glass; never glass on glass). Lists use `ListRow`, numbers use `StatTile`, statuses use `StatusPill` (no antd `Tag` presets), meters use `ProgressBar`.
4. **States:** `QueryState`, `EmptyState`, `ErrorState`, `SkeletonBlock`. Fix "not found shown as a retryable error" where the page has it.
5. **Literals to tokens:** replace colour, radius, font size, spacing, shadow and duration literals with `var(--tc-*)`. Exact matches are mechanical (codemod); near matches are unified by hand (e.g. `#655c55` → `--tc-muted`). Off-brand blues, greens and purples go.
6. **Motion:** apply MOTION.md. Remove `transition: all`, transition only transform and opacity, one press scale, lifts of at most 2px, `prefers-reduced-motion` handled.
7. **Fonts:** DM Sans only (D8): drop Iowan, Lora and Inter Tight in the batch's files.
8. **Strings:** every new or changed string goes into en, ru, uz and kk; layouts are checked with long ru/kk text.
9. **Mobile:** section tabs, 44px targets, no horizontal page scroll at 390.
10. **Verify:** `tsc`, the vitest suite, `yarn build`, the CI checks, screenshots, inventory delta.

## Batches (from AUDIT §9)

| # | Batch | Main files |
|---|---|---|
| 1 | Shell | `ApplicantShell`, `ApplicantWorkspaceNav`, `applicantPages.scss`, `liquidGlassWorkspace.scss`, `applicantWorkspace.scss`, `applicantNavigation.scss`; remove `.applicant-page .ant-btn { border-radius: 10px }` and the other button-radius overrides; Phase 1 and 2 deferred minors that touch the shell |
| 2 | Overview dashboard | `ApplicantOverviewPage`, `applicantOverview.scss` |
| 3 | My learning | `MyProgressEditorialView`, Admissions course section (three header layers), `/learning` player, SAT course double h1 |
| 4 | Community | Feed (plus keystroke re-renders, Phase 4), Messages header, Study Buddies (antd Tabs/Segmented → ViewTabs) |
| 5 | Application | college list, essays, documents (stacked error blocks), universities, degree and study-area detail, new scholarship |
| 6 | Tasks, Full Support, My Programs | My Programs header and tabs; Full Support and Study Buddy gates → `GateCard` |
| 7 | SAT prep | `SatPrepLayout` header, per-tab heroes, hand-rolled filters → `FilterChips` |
| 8 | IELTS and Research | IELTS inside the shell header; Research local Sass tokens → global |
| 9 | Major Match | mm3 (shared with counselor `MajorMatchTab`, D3) |
| 10 | Settings, Billing, Profile, Rewards, Opportunities | `UnifiedIcon` and `FontAwesomeIcon` → lucide; Opportunities antd Tabs |
| 11 | Auth and onboarding | `CustomButton`/`CustomText` → kit; illustration panel |
| 12 | Dead code | the ~25 unimported files (D4), after re-checking imports |

## Verification access (needed)

Student pages are behind login. To screenshot real pages, `tools/shoot.mjs` needs a signed-in **test student** session on the local dev server. Either:
- the owner signs in once in the browser pane (local dev, `localhost:5173`) as a test student, and the shooter reuses that session's local token for headless screenshots on `localhost` only; or
- the owner provides a test student account for the local dev database.
