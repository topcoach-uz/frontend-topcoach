# TopCoach IELTS practice

The browser-researched practice UI is integrated as a lazy student-hub module. It is rendered directly in TopCoach, without an iframe or a second React root.

## Entry and routing

- `/student-hub/ielts-prep`: overview.
- `/student-hub/ielts-prep/practice/home`: Academic catalog.
- `/student-hub/ielts-prep/practice/general-training`: General Training catalog.
- `/student-hub/ielts-prep/practice/academic/21/1/reading/1`: practice route example.
- `/student-hub/ielts-prep/vocabulary`: vocabulary.
- `/student-hub/ielts-prep/practice/academic/21/1/score`: review.
- Writing and Speaking fixture feedback: add `?feedback=demo` to their practice routes.

Desktop/community, mobile drawer and applicant learning navigation include IELTS test prep. Existing TopCoach authentication, onboarding and student-role gates protect the module. Account settings and legal links open the existing TopCoach destinations. The source replica's demo Google sign-in, logout and account deletion controls were removed from this module. No IELTS subscription rule has been added.

`IeltsPrepPage.tsx` adapts the authenticated Redux profile and React Router location to `IeltsWorkspace.jsx`. `routes.ts` maps the preserved renderer's internal route vocabulary to TopCoach URLs. Browser Back/Forward and modified-click links work through the existing router. Source JSX renderers remain fixture components with a typed public boundary; porting their data contracts to typed production services is the next phase.

All practice styles live under `.ielts-workspace`; the theme changes this root only. Fonts and chart/cover assets use `/ielts-assets/`. The normal header, sidebar, footer and chat overlay yield to the full-width practice shell on IELTS routes, and return when leaving the module.

Local work uses `topcoach:ielts:v1:<encoded-user-id>:` keys. There is no migration of the separate replica's demo account or saved work. Answers, annotations, vocabulary, essays, timers and last practice are scoped to the stable TopCoach account ID. Storage-write failures display an alert. Audio recordings remain in memory; production recording storage, assessment and synchronization are not implemented.

## TopCoach browsing design

Only the overview and Academic / General Training catalogs use `IeltsBrowse.jsx` and `browse.css`. The `ielts-browse` root class scopes their burgundy, DM Sans, light-gray workspace and responsive navigation. The existing practice shell, theme preference, vocabulary and results screens retain their original components and styles.

The overview resumes the account-scoped last practice and links each skill to the Academic catalog with a skill filter. Catalogs retain the existing books, test counts and practice/results URLs, with local search, book selection, skill selection and an empty-results reset. General Training retains its reading-only catalog.

The catalogs use one navigation row, readable text, 44px action targets and immediate press feedback. Reduced-motion preferences disable press scaling.

## Development verification

Normal production build: `npm run build`.

Integration tests: `npx vitest run src/pages/student-hub/ielts-prep/routes.test.ts`.

Local fixture preview with the **real TopCoach router and gates**:

```sh
npx vite --config codex-ielts-preview.config.ts
```

Open `http://127.0.0.1:5185/student-hub/ielts-prep`. This separate development config supplies a mock student account and intercepts API requests locally. It is not part of the production entry and does not change production authentication. It also includes a minimal applicant overview response so the return-to-hub navigation can be reviewed.

Production TypeScript/Vite build and all 5 integration tests passed. Browser checks verified native catalog links, Reading draft persistence after refresh, Answer Keys, return to the existing hub, applicant learning entry, and scoped theme changes. The original replica's representative exam content, local scoring and sample feedback remain temporary. The full exam corpus, AI assessment and final pixel/edge-state parity are outside this integration change.

Full browser-grounded flow analysis: `research/ielts/USER_FLOWS.md`. Its original-service observations remain useful; the integration addendum records TopCoach-specific adaptations.
