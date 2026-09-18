# Implementation Plan: Expand Screen Space Usage

**Branch**: `013-expand-screen-space` | **Date**: 2026-09-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-expand-screen-space/spec.md`

## Summary

Expand the primary playing view on representative desktop and tablet sizes by giving the placement board meaningful width, scaling only readable playing-surface content, and distributing available vertical space through playing-view-scoped responsive tokens. Preserve the current visual identity, compact phone fallback, game state, keyboard/touch interactions, and browser-zoom safety. Define a deliberate overflow policy for accumulated guess history instead of trying to force every possible history length into one viewport. Validate actual element geometry, clipping, focus, overflow, and interaction states in Playwright across desktop, tablet, phone, short-height, and zoom conditions.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.4, Next.js 16.2.6

**Primary Dependencies**: Next.js App Router, React DOM, Tailwind CSS 4, Vitest, Testing Library, Playwright

**Storage**: N/A; layout state is derived from viewport dimensions and CSS tokens

**Testing**: Vitest with jsdom and global 80% coverage gate; Playwright Chromium browser checks

**Target Platform**: Modern desktop, tablet, and mobile browsers; representative desktop viewports 1440x900 and 1920x1080; tablet portrait and landscape; phone portrait and landscape; 150% desktop browser zoom

**Project Type**: Next.js App Router web application

**Performance Goals**: No measurable increase in page-load work or interaction latency; layout changes should be CSS-driven and avoid resize listeners or JavaScript layout measurement

**Constraints**: Tailwind utility classes and existing `globals.css` token pattern; playing-view overrides must not unintentionally resize the results screen; no horizontal overflow or clipping-based hiding; no required scrolling or panning for the primary playing surface when its history fits; accumulated history may require normal vertical page scrolling; short or constrained viewports use compact responsive sizing; preserve WCAG 2.1 AA interaction targets and focus visibility

**Scale/Scope**: Primary playing view only: scoped page spacing, board/content sizing, responsive breakpoint rules, accumulated-history behavior, and focused layout regression coverage; no API, persistence, game logic, or results-screen redesign

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / constraint | Status | Plan |
|---|---|---|
| TypeScript strict mode | PASS | Prefer CSS custom properties and existing class/style token usage; no new untyped logic or `any`. |
| Test-first development | PASS | Add failing browser geometry, clipping, history, accessibility, and overflow checks before changing layout tokens; retain existing unit and e2e coverage. |
| Next.js App Router discipline | PASS | No new client boundary or data-fetching change; layout remains in the existing page and global styling. |
| Game logic purity | PASS | No `src/lib`, puzzle, scoring, persistence, or API changes. |
| Accessibility baseline | PASS | Preserve existing DOM order, keyboard access, touch targets, focus styles, and readable content. |
| Performance budget | PASS | Use CSS responsive values rather than resize observers or runtime measurement; no API or drag-path changes. |
| Styling constraint | PASS | Keep responsive values in `globals.css` and existing utility classes, scoped to the playing view where necessary; do not add a styling dependency or component abstraction. |

**Gate result**: PASS. No constitution violations require a complexity exception.

## Phase 0 Research Decisions

- Use CSS responsive tokens as the sizing mechanism. The current page already centralizes viewport-aware dimensions in `globals.css`, so CSS avoids client-side resize state and preserves the App Router boundary.
- Scope expanded values to the playing view. Shared tokens used by `ResultCard` must retain their current values, or receive playing-view-specific overrides, because the recap screen is out of scope.
- Use explicit width/height modes: phone portrait, phone landscape, tablet portrait, tablet landscape, desktop, and short-height fallback. The exact media-query thresholds are an implementation detail, but the plan must test immediately on both sides of each threshold.
- Use bounded viewport-relative values rather than unrestricted growth. Expand the line board and meaningful playing content, but preserve a maximum width so text and controls do not become stretched.
- Treat feedback history as content that can grow beyond a single viewport. Keep history readable and accessible; do not hide it or use `overflow: hidden` to make occupancy assertions pass. When history exceeds the available height, allow normal vertical page scrolling while keeping the current controls in document order.
- Validate actual rendered geometry in Playwright. jsdom cannot measure layout, and the acceptance criteria depend on viewport occupancy, clipping, overflow, focus, and behavior at 150% zoom.

**Alternatives considered**:

- JavaScript `resize` handling: rejected because CSS media queries and `clamp()` already cover the behavior without runtime state or layout measurement.
- A new responsive layout/component abstraction: rejected because the existing page and tokens provide the only required integration points.
- Removing the maximum content width entirely: rejected because it would make very wide layouts uncomfortable and violate the bounded-layout requirement.
- Hiding or virtualizing feedback history: rejected because it would remove existing information and complicate keyboard and screen-reader access.

## Phase 1 Design

### Data Model

No persisted or domain-data changes. The layout has only derived presentation values:

| Value | Source | Rule |
|---|---|---|
| Desktop content width | Existing `--board-max` and `--line-board-width` tokens | Increase within a bounded playing-view range; remain viewport-safe without altering recap width. |
| Page vertical spacing | Existing `--space-page-top`, `--gap-section`, and related tokens | Increase at representative desktop widths; retain compact values for narrow or short viewports. |
| Content scale | Existing component dimensions and typography tokens | Increase meaningful board/component sizing without changing game semantics or touch minimums. |
| Responsive mode | Viewport width and height through CSS media queries | Explicit phone, tablet, desktop, and short-height modes; expanded mode applies only when space is sufficient. |
| History overflow | Document flow | Guess history remains readable; normal vertical scrolling is allowed once history cannot fit with active controls. |

### UI Contract

- The primary game view remains the same interactive surface and retains its existing test IDs and accessible names.
- At 1440x900 and 1920x1080, the playing surface occupies at least 80% of viewport width and 70% of viewport height, excluding intentional margins.
- At default desktop zoom, the empty, partially placed, and all-placed states fit without document scrolling or horizontal panning when their feedback history fits.
- At 150% zoom, the document must not exceed the viewport width and primary controls must remain accessible.
- Existing narrow-screen behavior, including the 320px no-horizontal-scroll check, remains valid.
- Short desktop viewports use compact responsive sizing rather than forcing the expanded desktop spacing; accumulated history remains in document flow.

### Project Structure

```text
specs/013-expand-screen-space/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── primary-game-view.md
└── checklists/
    └── requirements.md

src/
├── app/
│   ├── globals.css          # Responsive layout tokens and desktop bounds
│   └── page.tsx             # Existing primary game view consumer
└── components/game/         # Existing game controls; unchanged unless tests expose a fit issue

tests/
├── unit/                    # Existing component tests; add only focused assertions if needed
└── e2e/
    └── game-flow.spec.ts    # Desktop, zoom, short-height, and mobile geometry checks
```

**Structure Decision**: Keep the existing single Next.js project. This remains a CSS/token-level layout change with focused browser validation; no new application layer, route, data model, runtime service, dependency, or layout abstraction is needed.

## Post-Design Constitution Recheck

| Principle / constraint | Status | Verification |
|---|---|---|
| TypeScript strict mode | PASS | No new TypeScript logic is planned; any test helpers remain explicitly typed. |
| Test-first development | PASS | E2E layout, state, clipping, accessibility, and overflow assertions are added before token changes and must fail against the current compact layout where applicable. |
| Next.js App Router discipline | PASS | No client boundary, fetch, or route changes. |
| Game logic purity | PASS | No game logic, persistence, puzzle data, or API files are touched. |
| Accessibility baseline | PASS | Existing controls, focus order, keyboard token movement, touch sizes, focus visibility, reduced motion, and content semantics remain unchanged. |
| Performance and styling constraints | PASS | CSS-only responsive expansion stays within the existing styling system and does not add runtime layout work. |

**Post-design gate result**: PASS. The design resolves technical choices without a constitution exception.

## Implementation Sequence

1. Add Playwright checks before implementation for empty, partially placed, all-placed, incorrect-guess, and solved states. Assert meaningful playing-surface bounds rather than `main` height, and confirm the new desktop occupancy assertions fail against the current layout.
2. Add the viewport matrix: 1440x900, 1920x1080, a short desktop viewport such as 1440x600, tablet portrait and landscape, phone portrait and landscape, 320px width, and widths immediately around each responsive threshold.
3. Add checks for document overflow and actual element bounds/clipping. Cover board endpoints, placed-token labels, live value bubbles, tooltip bounds, focus outlines, primary buttons, and long country/stat/value content. Root `overflow-x` settings must not be treated as proof that content is usable.
4. Add interaction checks across the layout matrix: Tab order and visible focus, Home/End/Arrow token movement, pointer drag and touch placement, resize while placements/locks/score are present, tooltip open/dismissal, and reduced-motion behavior. Preserve the existing drag overlay dimensions and centering contract if board scale changes.
5. Adjust playing-view-scoped responsive tokens in `src/app/globals.css` and, only if required by measured failures, the minimal board/component dimensions. Preserve the current Cinzel/Outfit typography, dark surfaces, gold/teal accents, feedback symbols, and recap sizing.
6. Run focused tests, the full Vitest coverage suite, lint, build, and the relevant Playwright suite. Perform a documented real-browser 150% zoom check; automated viewport reflow alone is not a substitute for browser zoom validation.

## Risks and Mitigations

- **Short viewport overflow**: Gate desktop expansion behind both sufficient width and height; verify with a short-height Playwright viewport.
- **150% zoom overflow**: Keep width values bounded by viewport-safe calculations and verify document scroll width in a browser at 150% zoom.
- **Overly stretched wide layout**: Use explicit maximum widths and bounded `clamp()` values; verify both representative desktop sizes.
- **Accidental mobile regression**: Preserve existing base token values and run the existing 320px no-horizontal-scroll check.
- **Content density changes readability**: Validate primary controls and board visibility, not only percentage occupancy.
- **Accumulated history**: Do not promise no-scroll for arbitrary guess counts; verify that history remains readable in document flow and that active controls remain reachable.
- **Shared-token regression**: Scope overrides to the playing view and run a completed-state recap check so global token changes do not alter the out-of-scope result screen.
- **Hidden overflow and edge overlays**: Check bounds and visible clipping of endpoint content, labels, bubbles, tooltips, and focus outlines rather than relying only on document scroll width.

## Complexity Tracking

No violations.
