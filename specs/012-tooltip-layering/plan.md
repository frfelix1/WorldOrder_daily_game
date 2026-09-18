# Implementation Plan: Tooltip Layering and Viewport Fit

**Branch**: `main` | **Date**: 2026-09-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-tooltip-layering/spec.md`

## Summary

Move the visible round-title explanation out of the stat panel's clipping and stacking context, then position it against the viewport so it remains above neighbouring game content and fully readable at desktop and mobile widths. Preserve the existing hover, keyboard focus, touch activation, outside-dismissal, Escape, ARIA, and responsive behaviours. Add focused component and browser regression coverage for layering, viewport bounds, and overflow.

## Technical Context

**Language/Version**: TypeScript 5.x with React 19.2.4 and Next.js 16.2.6

**Primary Dependencies**: Next.js App Router, React DOM portal API, Tailwind CSS 4, Vitest, Testing Library, Playwright

**Storage**: N/A; tooltip visibility and placement are ephemeral UI state

**Testing**: Vitest with jsdom and 80% global coverage gate; Playwright Chromium desktop and Pixel 5 mobile projects

**Target Platform**: Modern desktop and mobile browsers, with 320px minimum supported viewport width

**Project Type**: Next.js App Router web application

**Performance Goals**: Tooltip opens without perceptible delay; repositioning occurs only on visibility, resize, and scroll events; no layout work is added to normal hidden renders

**Constraints**: Keep the existing interaction and ARIA contract; prevent horizontal document overflow; keep the overlay within an 8px horizontal viewport gutter; do not alter game state, API, or broader responsive layout

**Scale/Scope**: One reusable Tooltip component, one stat-panel integration boundary, focused unit coverage, and one e2e regression block

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / constraint | Status | Plan |
|---|---|---|
| TypeScript strict mode | PASS | Keep explicit prop, event, ref, and geometry types; no `any` or `@ts-ignore`. |
| Test-first development | PASS | Add failing Tooltip geometry/portal assertions and e2e scenarios before implementation; retain existing interaction tests. |
| Next.js App Router discipline | PASS | Keep browser interaction in the existing lowest client boundary (`Tooltip`); use a portal only after the component is mounted. No route or layout client escalation. |
| Game logic purity | PASS | No `src/lib` or game-state changes. |
| Accessibility baseline | PASS | Preserve keyboard focus, `aria-describedby`, `role="tooltip"`, Escape, outside dismissal, and touch activation. |
| Performance budget | PASS | No drag or API changes; geometry recalculates only while visible and on viewport movement. |
| Styling constraint | PASS with existing-pattern exception | The current component uses inline styles for dynamic geometry and appearance. Keep the smallest localized change unless migration is required; custom global CSS is not needed. |

**Gate result**: PASS. No constitution violations require a complexity exception.

### Phase 0 Research Decisions

- Use a body-level React portal for the visible overlay. Removing only `overflow: hidden` would fix the primary clip but would leave the tooltip vulnerable to other ancestor stacking contexts and animated siblings.
- Use `position: fixed` with `getBoundingClientRect()` coordinates. These coordinates are viewport-relative and therefore remain correct when the document is scrolled.
- Measure and clamp both horizontal and vertical placement while visible. Prefer above the trigger; fall back below when the top edge has insufficient room; keep an 8px viewport gutter and constrain width with the existing 240px / viewport-based limit.
- Recalculate on open, `resize`, and `scroll`; clean up listeners when hidden. Do not introduce a positioning dependency for this single overlay.
- Keep the tooltip `pointer-events: none`, because the current content is informational and dismissal is owned by the trigger/outside listeners.

## Project Structure

### Documentation (this feature)

```text
specs/012-tooltip-layering/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── tooltip-overlay.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── game/
│   │   └── StatPanel.tsx       # Existing consumer; preserve panel layout
│   └── ui/
│       └── Tooltip.tsx         # Portal and viewport placement
└── app/
    └── globals.css             # Unchanged unless browser evidence requires a small rule

tests/
├── unit/
│   └── Tooltip.test.tsx        # Interaction, portal, style, and geometry coverage
└── e2e/
    └── game-flow.spec.ts       # Desktop/mobile bounds and overflow regression
```

**Structure Decision**: Keep the existing single Next.js project. The fix is isolated to the reusable UI tooltip and its existing StatPanel consumer. No API, persistence, game logic, or new route is needed. Regression coverage stays beside the existing tooltip unit tests and game-flow browser tests.

## Post-Design Constitution Recheck

| Principle / constraint | Status | Verification |
|---|---|---|
| TypeScript strict mode | PASS | Portal refs, DOM events, and geometry values remain explicitly typed. |
| Test-first development | PASS | The implementation sequence starts with failing component assertions and includes browser regression coverage. |
| Next.js App Router discipline | PASS | No new client boundary is introduced; the existing client Tooltip owns browser APIs and portal rendering. |
| Game logic purity | PASS | No game logic, persistence, API, or puzzle data is touched. |
| Accessibility baseline | PASS | Trigger semantics, focus access, ARIA linkage, Escape, outside dismissal, and touch activation are retained. |
| Performance and styling constraints | PASS | Work is limited to visible tooltip lifecycle; no drag styles or API performance paths change. |

**Post-design gate result**: PASS. Research resolved all technical choices without introducing a constitution exception.

## Implementation Sequence

1. Add unit assertions for the visible tooltip's portal placement, fixed positioning, stacking order, viewport width constraint, and event cleanup. Confirm the new assertions fail against the current inline tooltip.
2. Update `src/components/ui/Tooltip.tsx` to portal the visible overlay to the document body, calculate viewport-relative placement from the trigger and tooltip bounds, clamp horizontal and vertical coordinates, and reposition on resize/scroll.
3. Preserve the trigger wrapper and existing visibility/dismissal handlers so current tests and accessibility semantics remain stable.
4. Add Playwright coverage at desktop and 320px mobile widths. Reveal the tooltip with hover/click, assert it is visible, within the viewport gutter, above the stat panel by computed stacking order, and does not increase document width.
5. Run focused tests, then `npm test`, `npm run lint`, `npm run build`, and the relevant e2e suite. The constitution requires the full e2e suite for logic/API changes; this UI-only change still runs the relevant browser regression and full suite when available.

## Risks and Mitigations

- **Portal timing**: Render the portal only after `visible` is true and refs exist; calculate after the tooltip enters the DOM.
- **Viewport movement**: Attach passive resize/scroll listeners only while visible and remove them on hide/unmount.
- **Top-edge placement**: Prefer above the trigger but switch below if the measured height does not fit; clamp to the viewport rather than allowing page movement.
- **Test environment geometry**: Keep interaction tests independent of layout and mock geometry only in focused placement tests; verify real browser bounds in Playwright.

## Complexity Tracking

No violations.
