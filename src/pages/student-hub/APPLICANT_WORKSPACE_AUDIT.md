# Applicant workspace design audit

Scope: every route exposed by the applicant workspace while
the default applicant workspace, reviewed against the supplied
TopCoach Figma workspace direction: cream canvas, compact left navigation,
serif/editorial headings, soft bordered cards, crimson primary actions, and
responsive mobile drawer.

Implementation update, 23 September 2026: the Master’s program and document
review flows are coded, but the local API/database are stopped. The “Aligned”
entries below describe static implementation coverage; they are not signed-in
browser or pixel-parity results. New backend migrations and sourced graduate
program records are required before scenario QA.

## Shared system

| Area | Owner | Status | Finding |
| --- | --- | --- | --- |
| Shell and desktop navigation | `applicant/ApplicantShell.tsx` | Aligned | Uses the Figma-style rail, profile card, grouped navigation, responsive drawer, and access indicators. |
| Mobile navigation | `applicant/ApplicantShell.tsx` + `applicantWorkspace.scss` | Aligned | Uses the same hierarchy as desktop and retains locked-state indicators. |
| Common page primitives | `applicant/ApplicantPage.tsx` + `applicantPages.scss` | Aligned | Shared headings, cards, forms, list rows, empty states, buttons, and responsive breakpoints. |
| Access states | `community/CommunityLockedPage.tsx`, `full-support/FullSupportStudentPage.tsx` | Aligned | Community and Full Support use applicant-style in-page access panels while retaining their existing entitlement rules. |

## Applicant routes

| Route | View | Status | Required work |
| --- | --- | --- | --- |
| `/student-hub/overview` | Applicant overview | Aligned | Verify populated application, task, and meeting variants with production-like data. |
| `/student-hub/applications` | Applications list | Aligned | Verify table/list density at desktop and mobile widths with more than one application. |
| `/student-hub/applications/new` | New application form | Aligned | Verify validation, long university names, and mobile form spacing. |
| `/student-hub/applications/:id` | Application detail | Aligned | Verify all status and deadline variants. |
| `/student-hub/applications/:id/edit` | Edit application form | Aligned | Same visual review as new application. |
| `/student-hub/tasks` | Tasks | Aligned | Verify dense task lists and task modal states. |
| `/student-hub/documents` | Documents | Aligned | Verify uploaded-file, processing, and empty states. |
| `/student-hub/documents/:id` | Document review | QA pending | Verify private file preview, new version, assigned-mentor sharing, feedback, and legacy-public warning. |
| `/student-hub/essays` | Essays list | Aligned | Verify feedback badge and multi-essay grid. |
| `/student-hub/essays/new` | New essay | Aligned | Verify editor toolbar at mobile width. |
| `/student-hub/essays/:id` | Essay editor | Aligned | Verify save/error state and long-document rhythm. |
| `/student-hub/universities` | University catalogue | Aligned | Verify pagination and narrow result cards. |
| `/student-hub/universities/:id` | University detail | Aligned | Verify facts panel, program list, and image fallbacks. |

## Embedded and legacy surfaces

| Route or section | View | Status | Required work |
| --- | --- | --- | --- |
| `?section=others&target=profile` | Profile | Aligned | Uses the applicant page heading, panels, responsive tabs, and shared form treatment. |
| `?section=others&target=full-support` | Full Support | Aligned | Access, loading, and enrolled states share applicant panels and mobile table treatment. |
| `?section=feed` | Community feed | Aligned | Feed and its locked state use applicant page primitives and in-page access messaging. |
| `?section=messages` | Messages | Aligned | The messenger inherits applicant colors, borders, controls, and mobile rhythm. |
| `?section=buddies` | Study buddies | Aligned | Study buddy discovery and consent states use the shared applicant layout. |
| `?section=my-learning` | My progress | Aligned | Progress now uses the applicant page and panel system across desktop and mobile. |
| `?section=admissions-program` | Admissions course | Aligned | Admissions pages, loading, and enrollment states use applicant workspace styling. |
| `/student-hub/psychometric-assessment` | Major Match | Aligned | The v2 experience is mounted in applicant workspace styling without changing its assessment flow. |
| `/student-hub/sat-prep/*` | SAT Prep | Aligned | SAT pages and gated preview share applicant workspace tokens and responsive shell styling. |
| `/student-hub/research-prep` | Research Prep | Aligned | Research pages and locked preview use the applicant page system. |
| `?section=account&target=settings` | Settings | Aligned | Settings and subscription gate use applicant headings, controls, panels, and mobile CTA stacking. |
| `?section=account&target=rewards` | Rewards | Aligned | Rewards follows the applicant page and panel system. |

## Delivery order

1. Keep the shared applicant primitives as the requirement for all new Student Hub pages.
2. Expand visual regression coverage for populated, empty, loading, error, and locked variants as production data fixtures become available.
