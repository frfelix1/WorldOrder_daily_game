# Implementation Plan: Reveal Correct Values

**Branch**: `007-reveal-correct-values` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-reveal-correct-values/spec.md`

## Summary

Display the actual measured value (with unit) on any ranking slot the moment it locks in green, so players learn real-world facts as they play. Values come from `DatasetEntry.value` and `DatasetStat.unit`, both already present in `data/dataset.json`. The implementation adds `unit` and `values` to `StatDef`, adds a pure `formatStatValue` function, and passes pre-formatted strings down to `RankingBoard` (and optionally `FeedbackRow`).

## Technical Context

**Language/Version**: TypeScript 5.x, strict mode (`"strict": true`)

**Primary Dependencies**: Next.js 15 (App Router), React 19, @dnd-kit/core, Tailwind CSS, Vitest + React Testing Library, Playwright (E2E)

**Storage**: `localStorage` (game state, read-only for this feature); `data/dataset.json` (read at server-side puzzle generation)

**Testing**: Vitest (`npm test`), Playwright (`npm run test:e2e`), ≥80% global coverage gate

**Target Platform**: Web — Next.js SSR + client-side hydration

**Project Type**: Web application (single Next.js app)

**Performance Goals**: TTI ≤ 1.5s; no new API calls; API p95 ≤ 200ms (unchanged by this feature)

**Constraints**: Tailwind/CSS vars only — no inline `style` for colours not already in CSS vars; all new logic in `src/lib/` must be pure functions; no `any` types

**Scale/Scope**: 5 countries × 17 stats; 2 new `StatDef` fields; 1 new lib file; changes to 5 existing files

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. TypeScript Strict Mode | ✅ PASS | All new types explicitly annotated; no `any`; `formatStatValue` return type is `string` |
| II. Test-First Development | ✅ PASS | Tests written before implementation for `formatStatValue`, `RankingBoard` value display, puzzle-generator extension |
| III. Next.js App Router Discipline | ✅ PASS | No new `'use client'` boundaries; no `useEffect` for data fetching; value computation stays in existing client page |
| IV. Game Logic Purity | ✅ PASS | `formatStatValue` is a pure function in `src/lib/formatting.ts`; no new side effects |
| V. Accessibility Baseline | ✅ PASS | Value text is inline in the natural DOM reading order; no color-only state change; existing `aria-live` region covers guess-result announcements |
| Performance Budget | ✅ PASS | No new API calls; 2 small fields added to existing payload; display-only change |
| Styling | ✅ PASS | Inline `style={}` objects following existing component convention; CSS var colors only |
| Puzzle Data Integrity | ✅ PASS | `values` derived deterministically from `DatasetEntry.value` in the generator — same inputs, same output |

*No constitution violations. Complexity Tracking section is not applicable.*

## Project Structure

### Documentation (this feature)

```text
specs/007-reveal-correct-values/
├── plan.md              ← this file
├── research.md          ← Phase 0
├── data-model.md        ← Phase 1
├── contracts/
│   └── puzzle-api.md    ← Phase 1
└── tasks.md             ← Phase 2 (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── index.ts                     ← add unit + values to StatDef
├── lib/
│   ├── formatting.ts                ← NEW: formatStatValue pure function
│   └── puzzle-generator.ts          ← populate unit + values in StatDef construction
└── components/
    └── game/
        ├── RankingBoard.tsx          ← add slotValues prop; render value on locked slots
        └── FeedbackRow.tsx           ← add valueMap prop (P3); show value on correct cells
src/app/
└── page.tsx                         ← compute slotValues + valueMap; pass to components

tests/
├── unit/
│   ├── formatting.test.ts           ← NEW: formatStatValue unit tests
│   ├── RankingBoard.test.tsx        ← extend: locked-slot value rendering
│   ├── FeedbackRow.test.tsx         ← extend: correct-cell value display (P3)
│   ├── GamePage.test.tsx            ← extend: slotValues passed to RankingBoard
│   └── puzzle-generator.test.ts    ← extend: unit + values populated in StatDef
└── e2e/
    └── game-flow.spec.ts            ← extend: value visible after correct lock
```

**Structure Decision**: Single Next.js project. No new directories beyond `src/lib/formatting.ts`. All changes are additive.
