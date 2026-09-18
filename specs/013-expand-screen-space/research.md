# Research: Expand Screen Space Usage

## Decision: Extend the existing responsive CSS token system

**Rationale**: The current page already derives its board width, page padding, section gaps, typography, and component dimensions from `globals.css`. Bounded CSS values can expand the desktop layout without client-side viewport state, resize listeners, or changes to game behavior.

**Alternatives considered**:

- Runtime resize measurement: unnecessary for sizing that CSS media queries and `clamp()` can express, and adds client-side complexity.
- New layout component: unnecessary because the primary page already owns the layout boundary.

## Decision: Apply expansion only when desktop space is sufficient

**Rationale**: The user wants more desktop real-estate usage while preserving the current no-scroll experience. A width-and-height-gated desktop rule can use the larger layout on 1440x900 and 1920x1080 while leaving the existing fallback for short or narrow viewports.

**Alternatives considered**:

- Expand at every width: risks mobile overflow and changes the established responsive design.
- Always use the largest layout: risks short-viewport clipping and required scrolling.

## Decision: Keep maximum bounds

**Rationale**: Increasing `--board-max` and the line board width improves the currently underused middle area, but unrestricted width would make very wide screens feel stretched. A bounded maximum preserves readable line lengths and control proportions.

**Alternatives considered**:

- Remove max widths: fails the wide-screen readability requirement.
- Scale the entire page with transforms: can distort text and touch targets and makes browser zoom behavior harder to validate.

## Decision: Verify geometry in Playwright

**Rationale**: Occupied viewport percentages, scroll width, and control visibility require real browser layout. Existing Playwright coverage already uses viewport changes and checks horizontal overflow, so the feature can extend that suite without a new testing dependency.

**Alternatives considered**:

- jsdom-only tests: cannot provide trustworthy rendered dimensions.
- Screenshot-only tests: less deterministic for overflow and exact viewport bounds.
