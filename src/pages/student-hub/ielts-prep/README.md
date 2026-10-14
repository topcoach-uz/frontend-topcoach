# TopCoach IELTS practice

The browser-researched practice UI is integrated as a lazy student-hub module. It is rendered directly in TopCoach, without an iframe or a second React root.

## Entry and routing

- `/student-hub/ielts-prep`: overview.
- `/student-hub/ielts-prep/practice/home`: Academic catalog.
- `/student-hub/ielts-prep/practice/general-training`: General Training catalog.
- `/student-hub/ielts-prep/practice/academic/21/1/reading/1`: practice route example.
- `/student-hub/ielts-prep/vocabulary`: vocabulary.
- `/student-hub/ielts-prep/practice/academic/21/1/score`: review.
- Explicit Writing and Speaking sample layouts: add `?feedback=demo` to their practice routes.

Desktop/community, mobile drawer and applicant learning navigation include IELTS test prep. Existing TopCoach authentication, onboarding and student-role gates protect the module. Account settings and legal links open the existing TopCoach destinations. The source replica's demo Google sign-in, logout and account deletion controls were removed from this module. No IELTS subscription rule has been added.

`IeltsPrepPage.tsx` adapts the authenticated Redux profile and React Router location to `IeltsWorkspace.jsx`. `routes.ts` maps the preserved renderer's internal route vocabulary to TopCoach URLs. Browser Back/Forward and modified-click links work through the existing router. The JSX practice renderer has a typed public boundary. Writing and Speaking submissions connect to the authenticated IELTS practice API; representative exam content remains local.

All practice styles live under `.ielts-workspace`; the theme changes this root only. Fonts and chart/cover assets use `/ielts-assets/`. The normal header, sidebar, footer and chat overlay yield to the full-width practice shell on IELTS routes, and return when leaving the module.

Local work uses `topcoach:ielts:v1:<encoded-user-id>:` keys. There is no migration of the separate replica's demo account or saved work. Answers, annotations, vocabulary, essays, timers and last practice are scoped to the stable TopCoach account ID. Storage-write failures display an alert. Unsubmitted audio recordings remain in memory. Finish practice uploads the latest recording for each question to private account storage for seven days; saved transcripts and feedback remain available after audio expires.

## TopCoach browsing design

Only the overview and Academic / General Training catalogs use `IeltsBrowse.jsx` and `browse.css`. The `ielts-browse` root class scopes their burgundy, DM Sans, light-gray workspace and responsive navigation. The existing practice shell, theme preference, vocabulary and results screens retain their original components and styles.

The overview resumes the account-scoped last practice and links each skill to the Academic catalog with a skill filter. Catalogs retain the existing books, test counts and practice/results URLs, with local search, book selection, skill selection and an empty-results reset. General Training retains its reading-only catalog.

## Development verification

Normal production build: `npm run build`.

Integration tests: `npx vitest run src/pages/student-hub/ielts-prep/routes.test.ts`.

Local fixture preview with the **real TopCoach router and gates**:

```sh
npx vite --config codex-ielts-preview.config.ts
```

Open `http://127.0.0.1:5185/student-hub/ielts-prep`. This separate development config supplies a mock student account and intercepts API requests locally. It is not part of the production entry and does not change production authentication. It also includes a minimal applicant overview response so the return-to-hub navigation can be reviewed.

Production TypeScript/Vite build and all 5 integration tests passed. Browser checks verified native catalog links, Reading draft persistence after refresh, Answer Keys, return to the existing hub, applicant learning entry, and scoped theme changes. The representative exam corpus and local Reading/Listening scoring remain temporary. Normal Writing and Speaking feedback now uses the student's saved response; the explicit feedback=demo route remains a sample layout.

Full browser-grounded flow analysis: `research/ielts/USER_FLOWS.md`. Its original-service observations remain useful; the integration addendum records TopCoach-specific adaptations.

## Server-backed Writing and Speaking

Deploy the backend with migration `1796800000000-CreateIeltsPractice` before the frontend.

IELTS endpoints live under `/api/ielts-practice`: create/list submissions, upload per-question audio, assess a saved submission, and retrieve private audio. Every read/write checks account ownership. Audio is stored in PostgreSQL as private bytea data, capped at 5 MB per question. Expired recordings become inaccessible at seven days and are deleted by an hourly job. Submissions, transcripts and feedback remain.

The backend uses `OPENAI_API_KEY`, `IELTS_ASSESSMENT_MODEL` (default `gpt-4o-mini`) and `IELTS_TRANSCRIPTION_MODEL` (default `whisper-1`). Missing credentials or provider failures preserve the submission and allow retry. Structured feedback is validated before storage; there is no sample fallback. Limits are 20 saved submissions per account per UTC day and three assessment attempts per submission. Creation is idempotent using an account-scoped request ID; concurrent assessment requests cannot acquire the same job.

Writing may receive an estimated half-band practice score. Speaking feedback evaluates the transcribed response's vocabulary, grammar and relevance. It does not assign an overall speaking band or evaluate pronunciation/delivery from text. Results are automated practice guidance, never official IELTS results.

Verification on 11 October 2026: frontend tests and production build, backend ownership/quota/failure tests, isolated PostgreSQL migration/retention checks, and fixture browser flows for writing/speaking upload, retry, refresh and private playback. Microphone and AI provider responses were mocked; live provider and staging verification remain separate.
