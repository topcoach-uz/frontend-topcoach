# Phase 2 screenshots: the student UI kit

Taken with `docs/design-unification/tools/shoot.mjs` on 2026-11-25 from a temporary gallery page (not committed) that renders every kit component inside the student shell and theme, with long Russian and Karakalpak labels.

| File | What it shows |
|---|---|
| kit-1440.png | Every component at desktop width |
| kit-390.png | Phone width: tiles two-up, rows wrap titles to two lines, gate card stacks |
| kit-reduced-motion-1440.png | `prefers-reduced-motion: reduce`: skeleton shimmer and spinner rest |
| kit-reduced-transparency-1440.png | `prefers-reduced-transparency: reduce`: glass goes solid |

Known, deferred to phase 3 (shell batch): `.applicant-page .ant-btn { border-radius: 10px }` in applicantPages.scss overrides the theme's pill buttons for large antd buttons inside workspace pages (visible on "Agree & continue").
