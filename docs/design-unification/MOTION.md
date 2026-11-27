# Student motion spec

One motion system for the student-facing app. It's built on the liquid-glass easing and Apple's fluid-interface rules: motion responds instantly, starts from where things are, can be interrupted, and never exists for decoration.

## Tokens

| Token | Value | Use it for |
|---|---|---|
| `--tc-dur-1` | 120ms | press feedback, colour/background/border changes |
| `--tc-dur-2` | 200ms | state changes: open/close of small things, hover lifts, toggles |
| `--tc-dur-3` | 320ms | small spatial moves: list reorders, expanding rows |
| `--tc-dur-enter` | 460ms | entrances of panels and cards (`lg-enter`), the segmented thumb (`useSegmentLens`) |
| `--tc-ease` | `cubic-bezier(0.32, 0.72, 0, 1)` | anything that **moves** (transform) |
| `--tc-ease-fade` | `ease` | opacity and colour only |

No other durations or curves. Sass: `$tc-motion` and `$tc-ease` in `student-hub-design-system.scss`; `$lg-ease` in `_liquid-glass.scss` is the same curve.

## Rules

1. **Transform and opacity only.**
   - Never transition `all`, `width`, `height`, `left/top`, `max-height`, `grid-template-*`, `box-shadow` or `backdrop-filter`.
   - Progress fills use `transform: scaleX()` with `transform-origin: left`.
   - A shadow change on hover is acceptable only as an instant swap, not animated.
2. **Press:** `@include lg.tc-press` gives `scale(.97)` on `:active` in 120ms. One value everywhere (not 0.92 to 0.99).
3. **Hover:** a lift of at most 2px (`translateY(-2px)`) on linked cards, in `--tc-dur-2`. No hover on things that aren't interactive. Hover styles live under `@media (hover: hover)` so touch devices don't get sticky hovers.
4. **Entrances:**
   - `@include lg.lg-enter` (blur, scale and opacity materialize, 460ms) for panels and cards when a page or section mounts.
   - At most one staggered group per screen, 60ms apart, maximum 4 items.
   - No scroll-triggered reveals, no fade-in on every section.
5. **Exits mirror entrances** along the same path, at `--tc-dur-2`.
6. **Spatial consistency:** popovers, menus and sheets grow from their trigger (`transform-origin` at the trigger edge). The segmented thumb slides between options; it doesn't fade.
7. **Interruptible:** never block input while something animates. Start CSS transitions from the current value (transitions, not keyframes, for anything the user can reverse).
8. **Loading:**
   - One spinner (`rotate`, 800ms linear, infinite) and one skeleton shimmer (1.4s, `background-position`).
   - Both stop under reduced motion, showing a static skeleton.
   - Phase 2 provides the shared components.
9. **Reduced motion** (`prefers-reduced-motion: reduce`): nothing translates or scales. Entrances and the thumb become instant, loops stop, opacity cross-fades of 120ms or less are allowed. `lg-enter`, `tc-press` and `useSegmentLens` already comply.
10. **Reduced transparency / more contrast:** every glass mixin falls back to a solid surface (`lg-fallbacks`), including the segmented track and thumb and the lens mixins.

## Mixins

- `@include lg.lg-enter($delay: 0ms)`: entrance.
- `@include lg.tc-press($scale: .97)`: press feedback. It sets `transition` on transform; if the element already transitions other properties, add `transform var(--tc-dur-1) var(--tc-ease)` to its list instead.
- `useSegmentLens` (hook): segmented thumb, 460ms `--tc-ease`.

## Migration targets (phase 3 and 4, from the audit)

- 56 `transition: all`.
- Width, left, max-height and grid transitions in `applicantPages`, `research-prep`, `MajorMatchV2Page`, `MyProgressEditorialView`, `CourseSidebar`, `communityHubMock:3021`.
- Nine separate spin keyframes.
- The `fadeIn` keyframe that depends on `learning/index.scss` being loaded.
- `ease-in` entrances.
- About 17 animating files with no reduced-motion handling.
- Seven raw `backdrop-filter`s with no fallback.
