# Dynamic program payments — dev release, 26 November 2026

Program Access → Manage student → Payments now selects any configured academic program. Each program has its own agreed price, approval, history, checkout and verified-payment enrollment. Students see their authorized offers in My Programs. Existing Full Support endpoints and callbacks remain compatible.

Deployed through the preservation-checked backend ops workflow, run 45809363021, version 8379be8a9a4b. This release is dev only. Backend and Filament derivative images retain runtime-only features; the frontend graph changes only program payments and the My Programs page. Source push markers must include both `[preserve-dev-runtime]` and `[workspace-promotion]` to avoid the legacy Full Support promotion job. The initial source push triggered that old job; its gate-shape guard stopped before deployment. The reviewed ops deployment succeeded.

The database backup was restored and 237 table counts / 207 ID fingerprints matched. The selective ProgramPaymentOffers1799600000000 migration was rehearsed on the restored clone, then transactionally applied to dev. All old-column values in offers, orders, payment audit, payments, enrollments and mentor assignments matched before and after. Existing offers default to full_support; uniqueness is now per student and program.

Validation: 106 backend regression tests, 92 Filament tests, 14 frontend tests; production frontend build; 73 authenticated staging checks, with owned fixtures fully cleaned. Live browser verification confirmed the program selector loads Research payment details and My Programs renders without console errors. No real payment was submitted. Callback success, wrong-owner access and duplicate confirmation were exercised in isolated PostgreSQL tests.

Production rollout requires its own fresh backup, migration rehearsal and reviewed release. Do not run a blanket migration command or replace dev with a plain rebuild without reconciling runtime-only features. Do not roll back to the old checkout code once non-Full-Support offers exist; it does not filter by program.
