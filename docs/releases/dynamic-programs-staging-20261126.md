# Dynamic programs staging source candidate

This source candidate is based on `origin/dev` at `8a60dfdef26a22764b92993a0a432587b3bd963f`. It is prepared in an isolated worktree. The original working checkout was read only during preparation.

## Included source and dependencies

- Dynamic program descriptors and capability gates in the existing mentor console.
- Enrollment selection, including notification links, isolated task/session/milestone history, per-enrollment hours, and explicitly separate legacy history.
- Scoped task and milestone creation; legacy history cannot silently create work in an automatically selected enrollment.
- Student enrollment history and dynamic catalog names, goals, progress, and hour allocations.
- Mentor/student program PDF downloads through authenticated scoped endpoints.
- Enrollment progress editing with the version captured when an editor opens. HTTP 409 preserves the draft and requires loading the current version before saving again.
- Permission refresh and request-argument cache isolation. Switching students or enrollments closes editors; a late response cannot clear another enrollment's draft.
- Already-deployed program scheduling source from frontend PR [136](https://github.com/topcoach-uz/frontend-topcoach/pull/136), commit `dabb59f8fef2f29941809afed5df0b5ddedb3722`. This dependency was not merged into `origin/dev`. It adds program enrollment selection to the lesson modal, protects academic work from incompatible legacy actions, and preserves lesson-end status calculations.

The current dev implementation of shared Applications is retained. Both the existing `?tab=applications` link and the new enrollment-specific notification links work. Current source features outside the listed mentor/program files are retained from `origin/dev`.

Unrelated dirty work was excluded: admissions/tracker editors, global API transport changes, session recordings, imported historical report APIs/UI, and locale/style/workflow changes. Existing lesson-duration helpers were retained instead of copying unrelated imported-history parsing changes.

## Runtime preservation requirement

A normal push to `dev` runs a full Vite build and deploys with `rsync --delete` to `/srv/previews/frontend/dev`. That can discard runtime-only patches. This source candidate is **not** evidence that a complete rebuild matches the running site.

The source commit must contain both `[preserve-dev-runtime]` and `[workspace-promotion]`. The first skips the ordinary deploy job; the second also skips the automatic Full Support promotion job. A marker alone is insufficient. No workflow configuration was changed for this candidate.

Known runtime provenance:

| Runtime feature | Preserved evidence/source |
| --- | --- |
| Student/mentor workspace promotion | Existing `.github/scripts/compile-workspaces-dev.cjs` and `promote-workspaces-dev.py`; local `output/workspace-main-dev-2026-10-31` snapshot/bundle receipts |
| My Programs / shared Applications / unified schedule | Existing promotion scripts in `.github/scripts`; local `output/my-programs-dev-2026-10-31`, `output/shared-applications-dev-2026-10-31`, `output/mentor-unified-course-schedule-2026-10-31` |
| Program lesson scheduling and labels | PR 136 source; local `output/program-lessons-dev-20261125/RELEASE.md`, snapshots and immutable frontend bundle; staging Actions runs [45481677632](https://github.com/topcoach-uz/backend-topcoach/actions/runs/45481677632) and [45482278228](https://github.com/topcoach-uz/backend-topcoach/actions/runs/45482278228) |
| Program roster counters and roles | Local `output/program-roster-dev-20261125/RELEASE.md` and runtime receipts; Actions run [45487236734](https://github.com/topcoach-uz/backend-topcoach/actions/runs/45487236734) |
| Additional source snapshots | Local `output/mentor-programs-production-20261125/frontend` at `dabb59f8`; `output/remaining-local-dev-20261107/frontend` at `0381a971` |

These receipts show additive runtime promotion, rather than one fully reconciled TypeScript source checkout for the complete current site. The newly verified server snapshot remains the authority for an eventual deploy.

Safe promotion after the verified backup requires:

1. Capture the current index and its complete reachable module graph; verify hashes against the backup and identify current program/mentor targets.
2. Compare the target implementations with the source provenance above. Keep current shared Applications, shell providers, authenticated API transport, and unrelated runtime modules.
3. Compile the reviewed program/mentor components against the live React/Redux/API singleton modules. Publish new immutable assets and rewritten reverse dependencies alongside all existing assets. Update the mentor gate/context/layout consumers together so capability fields agree.
4. Link-check the full composed module graph and verify target feature markers. Atomically switch the index only if all inspected source asset hashes still match. Keep the prior index as the rollback artifact.
5. Verify staging auth, program selection, progress conflicts, attendance/hour accounting, and scoped downloads. No production promotion is included.

No pushes, staging deployment, database access, or migrations were performed while preparing this source candidate.

## Prepared graft and checks

Preparation helper: `.github/scripts/build-dynamic-programs-graft.cjs`.
Independent preservation verifier: `.github/scripts/check-dynamic-programs-graft.cjs`.

The inspected site produced version `c4c9182775dc`: 321 baseline JavaScript modules; seven target function replacements; 288 other modules receive import-reference changes only; 26 modules keep their original filenames. All existing module implementations and organization/access policies are retained. Shared Applications and session chat reuse their exact live implementations. The React, Redux store, authenticated API, mentor context, translations, message components and review components come from the existing application runtime. A compatibility alias preserves older `hasFullSupport` context consumers while new pages use capabilities.

The graft adds 297 new immutable assets (295 graph modules, one program bundle and one stylesheet). The independent verifier reverses import rewrites and the seven declared function replacements, then requires every old module to equal the inspected source byte for byte. It also checks the live shared integration hashes and rejects bundled duplicate stores or sockets. The composed graph links successfully.

Artifacts are prepared outside Git under `/Users/mac/topcoach/releases/frontend-dynamic-programs-graft-20261126/`: `frontend-graft.json`, `preserved-modules.json`, and `build-metafile.json`. The payload contains exact expected hashes for the original HTML and all 321 reachable JavaScript files; the publisher must reject any drift or destination collisions and retain all previous assets. It must not use `rsync --delete`.

Validation passed: 73 targeted source tests across 14 suites; five Full Support payment-state checks; TypeScript and the production Vite build; graft compilation and complete module-graph linkage; independent preservation verification; Git whitespace checks. Sass deprecation and bundle-size warnings are pre-existing. No push or deployment was performed during preparation.
