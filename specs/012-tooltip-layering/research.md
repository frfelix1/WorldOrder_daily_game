# Research: Tooltip Layering and Viewport Fit

## Decision: Render the visible tooltip through a body-level portal

**Rationale**: The current tooltip is absolutely positioned inside `StatPanel`, which has `overflow: hidden` and `backdrop-filter`. The tooltip's local `z-index: 50` cannot escape that ancestor's clipping and stacking context. A portal moves only the visible overlay outside the panel while keeping the trigger and interaction state in the existing component. This is the smallest robust fix for the reported layering bug.

**Alternatives considered**:

- Removing `overflow: hidden` from `StatPanel`: smaller diff, but leaves the overlay exposed to other ancestor stacking contexts and risks changing the panel's rounded decorative clipping.
- Increasing the tooltip z-index: insufficient because z-index cannot escape an ancestor stacking context or clipping boundary.
- Introducing a positioning library: unnecessary for one tooltip; native geometry APIs cover the required placement and avoid a dependency.

## Decision: Use fixed viewport-relative placement with measured clamping

**Rationale**: `getBoundingClientRect()` returns viewport-relative trigger coordinates. A body-level `position: fixed` tooltip can use those coordinates directly, avoiding document-scroll offset calculations. The tooltip width remains capped at 240px or the viewport minus two 8px gutters. Horizontal and vertical coordinates are clamped after measurement so long text wraps inside the viewport and does not create page overflow. If there is insufficient room above the trigger, the tooltip is placed below it.

**Alternatives considered**:

- Keep absolute positioning and adjust only `left`: does not solve ancestor clipping or top-edge overflow.
- Use CSS-only `position: fixed` without measurement: cannot reliably handle edge alignment or choose above/below placement for varying tooltip height.
- Always place below: avoids top clipping but can cover the board and can extend below the visible viewport near the bottom.

## Decision: Recalculate only while visible and on viewport movement

**Rationale**: Placement is needed only when the tooltip is displayed. Recalculate after opening, on `resize`, and on `scroll`; remove listeners when hidden. This preserves normal page performance and keeps the overlay aligned when the page or viewport changes.

**Alternatives considered**:

- Continuously observe layout: unnecessary overhead for a short-lived informational overlay.
- Recalculate only on open: becomes stale after scroll or resize and fails the responsive requirement.

## Decision: Preserve the existing accessibility and interaction contract

**Rationale**: Existing unit tests and the feature spec already require hover, keyboard focus, touch click, outside dismissal, Escape dismissal, `aria-describedby`, and `role="tooltip"`. The implementation changes the rendered location, not the trigger semantics or state transitions.

**Alternatives considered**:

- Replace the tooltip with a new disclosure component: expands scope and risks regressions unrelated to layering.

## Decision: Verify in both jsdom and a real browser

**Rationale**: Unit tests can verify portal placement, styles, geometry calculations, and cleanup with mocked rectangles. Playwright is required for actual rendered bounds, stacking against neighbouring content, mobile viewport behavior, and document overflow.

**Alternatives considered**:

- Screenshot-only regression: less deterministic for exact viewport bounds and overflow.
- Unit-only regression: jsdom does not paint stacking contexts or provide trustworthy layout geometry.
