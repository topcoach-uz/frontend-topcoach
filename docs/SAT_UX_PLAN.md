# SAT UX audit and implementation plan

Keep the established TopCoach white/red identity and page structure. Apply the apple-design skill through clear hierarchy, immediate control feedback, accessible focus, and restrained motion.

## Implementation

- [x] Shared dialogs: portal above the page, contain focus, make background inert, close with Escape, and return focus to the trigger.
- [x] Dialog styling: white surfaces, red primary actions, readable labels, and 44px controls.
- [x] Motion: interruptible 180ms entry/exit; reduced-motion opacity only; reduced-transparency and contrast alternatives.
- [x] Library mobile navigation: collapsible subject picker; close after selection; fit all five SAT navigation links on a phone.
- [x] Reading history: record text-lesson opens through the existing progress endpoint without resetting completion or reading time.
- [x] Supporting typography and controls: enlarge small labels, preserve hierarchy, add visible keyboard focus and immediate pressed feedback.
- [x] Overview: account-persisted target score with validation, edit/clear controls, save errors, and a correctly labeled 400–1600 score scale.
- [x] Practice: separate domain selection checkboxes from disclosure buttons.
- [x] Runner: show vocabulary tools only for Reading & Writing.

## Verification

- [x] Frontend type check and Library/overview tests (12 tests).
- [x] Backend goal service tests (8 tests): account scope, valid score, invalid values, and clearing.
- [x] Browser: keyboard focus stays inside dialogs, Escape closes, trigger focus returns.
- [x] Browser: invalid target disables saving; valid target updates the score journey.
- [x] Browser: opening a text lesson appears in Recently opened.
- [x] Browser: phone navigation fits, subjects expand/select/collapse, separate practice controls work, and Math runner omits vocabulary.

Browser verification uses actual SAT components with a labeled local sample account. Authenticated dev verification requires an available signed-in session; deployment checks alone do not establish that every account flow works on dev.
