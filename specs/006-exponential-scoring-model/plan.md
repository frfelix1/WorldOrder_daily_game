# Implementation Plan: Exponential Scoring Model

**Branch**: `006-exponential-scoring-model` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-exponential-scoring-model/spec.md`

## Summary

Replace the current linear per-position scoring model (max 150) with a round-level exponential decay model capped at 100. Each stat (round) is worth up to 33 points; the number of wrong guesses for the whole round (attempts minus one) drives a steep geometric penalty. A 1-point perfect-game bonus brings three perfect rounds (99) to 100. The change is confined to `src/lib/scoring.ts`, its unit tests, and the handful of display components that hard-code the old maximum of 150.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode enforced via `tsconfig.json`)

**Primary Dependencies**: Next.js 16 (App Router), React 19, Vitest 4 (unit tests), Playwright (e2e), React Testing Library

**Storage**: `localStorage` only (via `src/lib/game-state.ts`) — no server-side score persistence

**Testing**: Vitest (unit + component), Playwright e2e (`tests/e2e/game-flow.spec.ts`)

**Target Platform**: Web (browser + Next.js SSR/SSG)

**Project Type**: Web application (single-page game, Next.js App Router)

**Performance Goals**: No meaningful CPU change — scoring is O(1) arithmetic. No performance budget impact.

**Constraints**: TypeScript strict mode, no `any`, all functions in `src/lib/` must be pure (no side effects). Score must remain a whole integer.

**Scale/Scope**: Single scoring module (`src/lib/scoring.ts`) + 4 display touch-points. No data migration needed (scores are recomputed from `guesses[]` on load per Constitution Principle IV).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ PASS | All new/changed functions will have explicit parameter and return type annotations; no `any`. |
| II. Test-First Development | ✅ PASS | New unit tests for `scoreForRound`, `scoreForStat`, `totalScore` must be written and confirmed failing before implementation. E2E coverage of the final score must be updated. |
| III. Next.js App Router Discipline | ✅ PASS | Scoring is pure `src/lib/` logic — no component boundary or data-fetching changes. |
| IV. Game Logic Purity | ✅ PASS | Scoring is already recomputed from `guesses[]`; the new model maintains this. No mutations introduced. |
| V. Accessibility Baseline | ✅ PASS | `aria-label` on `ScoreDisplay` updates from "/ 150" to "/ 100"; no drag or keyboard changes. |

**Post-design re-check**: All gates remain green. The formula change in `scoring.ts` is additive (new exported function) and replaces the old `scoreForStat` signature. No architectural violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/006-exponential-scoring-model/
├── plan.md              # This file
├── research.md          # Phase 0 output — formula design
├── data-model.md        # Phase 1 output — changed entities
├── quickstart.md        # Phase 1 output — formula reference card
├── contracts/
│   └── scoring-api.md   # TypeScript function-level contract
└── tasks.md             # Phase 2 output (not created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── scoring.ts              # PRIMARY CHANGE — new exponential model
├── types/
│   └── index.ts                # Minor: update score range comments (0–150 → 0–100)
├── app/
│   └── page.tsx                # Minor: update "out of 150 points" aria announcement
└── components/
    └── game/
        ├── ResultCard.tsx      # Update: performanceLabel thresholds + "/ 150" → "/ 100"
        └── ScoreDisplay.tsx    # Update: "/ 150" display and aria-label

tests/
├── unit/
│   └── scoring.test.ts         # Full rewrite for new model
└── e2e/
    └── game-flow.spec.ts       # Update: max score assertions (150 → 100)
```

**Structure Decision**: Single project (Option 1). All changes are within the existing `src/` tree. No new directories in source. The scoring module remains a pure-function library file.

## Complexity Tracking

> No constitution violations — this section is not required.
