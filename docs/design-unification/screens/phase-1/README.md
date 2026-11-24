# Phase 1 screenshots

Taken with `docs/design-unification/tools/shoot.mjs` (headless Chrome) on 2026-11-24.

| File | What it shows |
|---|---|
| auth-signin-1440.png / -390.png | Real sign-in page under the student theme: pill button, crimson links, warm borders |
| auth-signin-focus-1440.png | Keyboard focus on the email field: crimson border + 3px focus ring |
| antd-before-after-1440.png | antd components inside the student shell: global theme (left) vs student theme (right), input focused, select open |
| antd-gallery-390.png | The same at phone width |
| antd-gallery-reduced-transparency-1440.png | `prefers-reduced-transparency: reduce`: glass panels and segmented tracks go solid |
| antd-gallery-reduced-motion-1440.png | `prefers-reduced-motion: reduce` |

The component gallery was a temporary page (not committed). Student pages behind login weren't shot in this phase: Phase 1 changes only antd theming, focus rings and tokens; page-level shots start in Phase 3.
