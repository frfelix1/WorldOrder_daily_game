# Implementation Plan: Refine Results Actions

**Branch**: `014-daily-stats` | **Date**: 2026-09-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-refine-results-actions/spec.md`

## Summary

Replace the full-width results Share Result control with a compact two-action group. Keep Share Result on the left, add Daily Stats on the right, preserve the existing gold gradient across the group, and keep both actions side-by-side at all supported widths. Reuse the existing `ResultCard` share behavior and the existing page-level Daily Stats state transition; add component tests before changing the markup and styling.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 App Router

**Primary Dependencies**: React Testing Library, Vitest, Tailwind CSS 4; existing application components only

**Storage**: N/A; this refinement does not change stats or game persistence

**Testing**: Vitest with React Testing Library; existing Playwright flow remains the regression check for completed-game navigation

**Target Platform**: Responsive browser UI at the app's existing supported widths

**Project Type**: Next.js web application

**Performance Goals**: No new runtime work; action rendering must remain immediate with no additional network or storage operations

**Constraints**: Preserve existing share and Daily Stats behavior; use existing visual tokens and accessible keyboard/touch targets; keep buttons side-by-side at supported widths; follow Tailwind-only styling policy for new layout styling

**Scale/Scope**: One results card action group, one existing navigation callback, and focused unit/regression tests; no data, API, or persistence changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|------|--------|----------|
| TypeScript strict mode | PASS | No new `any`, ignored errors, or relaxed compiler settings |
| Test-first development | PASS | Add failing `ResultCard` assertions for two actions, labels, side-by-side group, and click behavior before implementation |
| App Router discipline | PASS | Change remains within existing client boundary; no new browser API or data-fetching effect |
| Game logic purity | PASS | No `src/lib` or persistence changes |
| Accessibility baseline | PASS | Native buttons remain keyboard reachable with explicit accessible names and existing touch minimum |
| Performance/styling constraints | PASS | No new runtime work; use existing gradient/tokens and responsive utility classes |

## Project Structure

### Documentation (this feature)

```text
specs/015-refine-results-actions/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── spec.md
```

### Source Code

```text
src/
├── app/
│   └── page.tsx
└── components/
    └── game/
        ├── ResultCard.tsx
        └── StatsView.tsx

tests/
└── unit/
    ├── ResultCard.test.tsx
    └── GamePage.test.tsx
```

**Structure Decision**: Keep the implementation in the existing `ResultCard` and its parent-controlled Daily Stats flow. Extend `tests/unit/ResultCard.test.tsx` for the component contract and retain the existing `GamePage` completion test for integration coverage. No new component or service is needed.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The feature fits the existing results component and navigation state. |
