# Primary Game View Contract

## Purpose

Define the observable layout and accessibility contract for expanding the playing screen without changing game behavior.

## Desktop Layout

- At 1440x900 and 1920x1080, the primary game view uses at least 80% of viewport width and 70% of viewport height, excluding intentional margins.
- Content grows through readable component sizing and balanced spacing rather than a global transform.
- Very wide viewports retain bounded content widths so text and controls do not become uncomfortably stretched.

## No-Scroll Behavior

- At supported default desktop sizes, all primary game content and controls are visible without vertical scrolling or horizontal panning.
- At 150% browser zoom, the document does not exceed the viewport width.
- Short desktop viewports use the existing responsive fallback.

## Responsive Behavior

- Existing narrow-screen layout, content order, controls, and accessibility remain usable.
- The existing 320px no-horizontal-scroll behavior remains valid.
- Resizing preserves game state and active interaction state.

## Regression Observables

- Desktop geometry checks pass at 1440x900 and 1920x1080.
- Short-height desktop checks confirm primary controls remain accessible.
- 150% zoom checks confirm no horizontal overflow.
- Existing mobile overflow and interaction checks continue to pass.
