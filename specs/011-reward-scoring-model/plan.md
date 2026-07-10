# Implementation Plan: Reward-Based Scoring Model

**Branch**: `011-reward-scoring-model` | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-reward-scoring-model/spec.md`

## Summary

Replace the current punishment-based scoring model (starts at max, decays down) with an additive reward-based model that builds from 0 toward 1000. The new model scores each of 3 stats (~333 pts each) using two components: ordering correctness (133 pts via pairwise comparison) and placement distance (200 pts with 5% tolerance band), multiplied by a geometric attempt factor (0.7× per wrong guess). A 1-point perfect bonus brings the theoretical max to exactly 1000.

## Technical Context

**Language/Version**: TypeScript (strict mode), Next.js 16.2.6, React 19

**Primary Dependencies**: Next.js App Router, @dnd-kit (drag/sort), Tailwind CSS 4

**Storage**: localStorage (client-side game state persistence via `src/lib/game-state.ts`)

**Testing**: Vitest (unit + coverage ≥80%), Playwright (e2e), @testing-library/react (components)

**Target Platform**: Web (mobile-responsive), 4G connection budget (TTI ≤1.5s)

**Project Type**: Web application (Next.js, single-page daily game)

**Performance Goals**: Page TTI ≤1.5s, scoring computation is pure math (sub-ms)

**Constraints**: All game logic must be pure functions in `src/lib/`. No side effects. Scoring recomputed from `guesses[]` source of truth.

**Scale/Scope**: Single-player daily game, 3 stats × 5 countries per puzzle

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ PASS | All new scoring functions will have explicit types |
| II. Test-First Development | ✅ PASS | Scoring tests rewritten before implementation |
| III. Next.js App Router Discipline | ✅ PASS | Scoring is pure lib code, no component/route changes needed beyond display |
| IV. Game Logic Purity | ✅ PASS | All scoring in `src/lib/scoring.ts` — pure functions, deterministic, no side effects |
| V. Accessibility Baseline | ✅ PASS | Score display changes are text-based, no accessibility regression |

**Performance Budget**: ✅ No API changes. Scoring is client-side pure math.
**Puzzle Data Integrity**: ✅ No changes to puzzle generation or data.
**Styling**: ✅ Only Tailwind utility class changes for score display.

**Gate Result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/011-reward-scoring-model/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── page.tsx                    # accuracyForSession integration (minor update)
├── components/
│   └── game/
│       ├── ScoreDisplay.tsx        # Update to /1000 display
│       └── ResultCard.tsx          # Recalibrate performance tiers
├── lib/
│   ├── scoring.ts                  # PRIMARY: rewrite scoring model
│   └── line-scale.ts              # No changes (provides placementAccuracy)
└── types/
    └── index.ts                    # No changes (GameState already has runningScore/finalScore)

tests/
├── unit/
│   └── scoring.test.ts            # PRIMARY: rewrite all scoring tests (TDD)
└── e2e/
    └── game-flow.spec.ts          # Verify scores display correctly
```

**Structure Decision**: Standard Next.js App Router single-project structure. This feature touches primarily `src/lib/scoring.ts` (pure logic) and two display components. No new files needed — this is a refactor of existing scoring logic.

## Complexity Tracking

> No violations — section not applicable.
