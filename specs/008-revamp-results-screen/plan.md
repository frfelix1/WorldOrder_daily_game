# Implementation Plan: Revamp Results Screen

**Branch**: `feature/summary` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-revamp-results-screen/spec.md`

## Summary

Revamp the post-game summary screen to show clearly-bounded per-stat sections each containing the stat label, all guess rows with correct/wrong feedback, and a new "correct values" row showing all five countries' answers formatted with the existing `formatStatValue` utility. Remove all score bar animations (shimmer sweep, glow pulse, and width transition) from both the in-game `ScoreDisplay` component and the `ResultCard` summary score bar. Simplify the share button to always use the Clipboard API — no `navigator.share` fallback, ever — and add a visible error state for clipboard failures.

All data required by the revamp (`StatDef.values`, `StatDef.unit`) was introduced in feature 007 and is already returned by the puzzle API. No API changes, no localStorage schema changes, no new TypeScript types in `src/types/index.ts`.

## Technical Context

**Language/Version**: TypeScript 5.x, `"strict": true` in `tsconfig.json`

**Primary Dependencies**: Next.js App Router (v15+), React 18+, Vitest + @testing-library/react (unit/component), Playwright (e2e)

**Storage**: N/A — no changes to localStorage schema or puzzle API response shape

**Testing**: Vitest + RTL for unit/component tests (`tests/unit/`), Playwright for e2e (`tests/e2e/game-flow.spec.ts`)

**Target Platform**: Web browser — desktop + mobile, all modern browsers

**Project Type**: Next.js single-page web application

**Performance Goals**: Removing animations reduces paint/composite workload. No new data fetching or API calls. Score bar renders at final width immediately; perceived TTI on the results screen improves.

**Constraints**:
- No new API routes or localStorage schema changes
- `StatDef.values` and `StatDef.unit` are optional (feature 007 backwards-compat); results screen must gracefully handle absent values without crashing
- Existing codebase uses inline `style={}` props throughout — follow this pattern for consistency (see Styling gate note below)
- Test-first: failing tests must be written and confirmed before implementation begins

**Scale/Scope**: 2 modified components, 1 new component, 3 modified test files, 1 new test file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ PASS | All new/modified code uses explicit prop types and return types; no `any`; `CorrectValuesRowProps` fully annotated; `'idle' \| 'copied' \| 'error'` union replaces loose boolean |
| II. Test-First Development | ✅ PASS | Failing tests required before implementation for: `ScoreDisplay` (no animation), `ResultCard` score bar (no transition), `CorrectValuesRow` (new component), `ResultCard` stat sections (revamp), `ResultCard` share button (clipboard-only + tri-state) |
| III. App Router Discipline | ✅ PASS | `ResultCard` is already `'use client'` (uses `useState`/`useEffect`/Clipboard API — all client-only). No new client boundaries introduced. No `useEffect` for data fetching. |
| IV. Game Logic Purity | ✅ PASS | `formatStatValue` (existing pure function in `src/lib/formatting.ts`) reused without modification. No new functions added to `src/lib/`. No direct `localStorage` access in components. |
| V. Accessibility Baseline | ✅ PASS | Each stat section wrapped in `<section aria-label={stat.label}>`. `CorrectValuesRow` cells include `aria-label` with country name and value. Share button error/success states conveyed via text (not color alone). |
| Performance Budget | ✅ PASS | Removing animations improves performance; no new network requests; no new API routes. |
| Styling | ⚠️ PRE-EXISTING VIOLATION | The entire codebase uses inline `style={}` props, contradicting the constitution's "Tailwind utility classes only" rule. This violation predates feature 008 and is not introduced by it. New code follows the existing pattern. Full Tailwind migration is out of scope for this feature. No new violation introduced. |

**Complexity Tracking**: No new constitution violations. Pre-existing styling violation documented; not amplified.

## Project Structure

### Documentation (this feature)

```text
specs/008-revamp-results-screen/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

*(No `contracts/` directory — this feature consumes the existing puzzle API with no new endpoints or response shape changes. The current API contract is documented in `specs/007-reveal-correct-values/contracts/puzzle-api.md`.)*

### Source Code (repository root)

```text
src/
├── app/
│   └── globals.css                        # [NO CHANGE] shimmerGold keyframe kept (referenced by .text-shimmer-gold)
├── components/
│   └── game/
│       ├── ResultCard.tsx                 # [MODIFY] remove bar transition; revamp stat sections; clipboard-only share + tri-state
│       ├── ScoreDisplay.tsx               # [MODIFY] remove shimmerGold animation + backgroundSize + width transition
│       └── CorrectValuesRow.tsx           # [CREATE] five-cell row showing all countries' correct values in solution order

tests/
├── e2e/
│   └── game-flow.spec.ts                  # [MODIFY] summary screen sections + share button clipboard scenarios
└── unit/
    ├── ResultCard.test.tsx                # [MODIFY] stat sections, clipboard-only, error state, no bar transition
    ├── ScoreDisplay.test.tsx              # [MODIFY] assert no animation/transition inline styles
    └── CorrectValuesRow.test.tsx          # [CREATE] full unit coverage for new component
```

**Structure Decision**: Single Next.js project. No structural or directory changes. Feature 008 is a pure UI change within the existing component tree; all affected files are under `src/components/game/` and `tests/unit/`.
