# Implementation Plan: Dynamic Puzzle Generation

**Branch**: `005-dynamic-puzzle-generation` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-dynamic-puzzle-generation/spec.md`

---

## Summary

Replace the file-based puzzle serving mechanism with a server-side TypeScript generation function. The `GET /api/puzzle` route currently reads pre-generated `data/puzzles/YYYY-MM-DD.json` files. After this change, it calls a pure `generatePuzzle(dateStr, dataset)` function that deterministically constructs a valid puzzle from the bundled `data/dataset.json`. Results are cached server-side via `unstable_cache` so each date's puzzle is computed only once per deployment. The Python generation scripts and all pre-generated JSON files are removed.

---

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)

**Primary Dependencies**: Next.js 16.2.6 (App Router), React 19, Vitest 4, Playwright 1.60

**Storage**: No new storage. `data/dataset.json` (filesystem, ~150KB) loaded at runtime via `fs.readFileSync`. Puzzle results cached in-memory via `unstable_cache` (Next.js built-in).

**Testing**: Vitest 4 (unit + integration), Playwright 1.60 (E2E). Coverage: v8 provider, ≥ 80% threshold enforced in CI.

**Target Platform**: Vercel (Node.js serverless functions)

**Project Type**: Web application (Next.js App Router)

**Performance Goals**: Puzzle API p95 ≤ 200ms (Constitution constraint). First-generation is bounded by the Mulberry32 PRNG and O(n) dataset scan per attempt; subsequent requests are memory cache hits.

**Constraints**:
- `unstable_cache` ensures at-most-once generation per date per deployment
- All `src/lib/` code must be pure functions (Constitution IV)
- TypeScript strict mode throughout; no `any`, explicit parameter and return types (Constitution I)
- Test-first: tests written and confirmed failing before implementation (Constitution II)

**Scale/Scope**: Single-developer project; ~100 DAU; no concurrency risk for the serverless generation function.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ PASS | New `src/lib/` files use explicit types; `Dataset`, `DatasetStat`, `DatasetEntry` typed in `src/types/index.ts`; no `any` |
| II. Test-First Development | ✅ PASS | `seeded-random.test.ts` and `puzzle-generator.test.ts` written before implementation; integration test updated before route modification |
| III. Next.js App Router Discipline | ✅ PASS | Route Handler is GET-only; `unstable_cache` used for server-side caching; no new `use client` boundaries |
| IV. Game Logic Purity | ✅ PASS | `generatePuzzle()` is pure (no I/O, no side effects); dataset loading stays in route handler |
| V. Accessibility Baseline | ✅ N/A | No UI changes |
| Performance Budget | ✅ PASS | `unstable_cache` ensures ≤1ms on cache hit; cold-start generation well within 200ms p95 |
| Puzzle Data Integrity | ✅ PASS | `generatePuzzle` validates all 5 constraints (spec FR-003); solution arrays are proven valid permutations |
| Styling | ✅ N/A | No UI changes |

**No violations. No Complexity Tracking entries required.**

---

## Project Structure

### Documentation (this feature)

```text
specs/005-dynamic-puzzle-generation/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — technical decisions
├── data-model.md        # Phase 1 — types and module design
├── quickstart.md        # Phase 1 — developer guide
├── contracts/
│   └── api-contracts.md # Phase 1 — API and function contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code Changes

```text
src/
├── types/
│   └── index.ts          # Modified: add Dataset, DatasetStat, DatasetEntry
├── lib/
│   ├── seeded-random.ts  # New: pure Mulberry32 PRNG
│   ├── puzzle-generator.ts # New: pure generatePuzzle(dateStr, dataset)
│   └── puzzle.ts         # Unchanged: getPuzzleNumberForDate reused by generator
└── app/
    └── api/
        ├── puzzle/
        │   └── route.ts  # Modified: generate instead of readFileSync
        └── puzzles/
            └── route.ts  # Modified: computed date range instead of dir scan

tests/
├── unit/
│   ├── seeded-random.test.ts      # New: PRNG unit tests
│   ├── puzzle-generator.test.ts   # New: generator unit tests
│   └── [existing tests unchanged]
└── integration/
    └── api/
        └── puzzle.test.ts         # Modified: add generation assertions

data/
└── dataset.json  # Unchanged (retained; deployed to Vercel)

data/puzzles/     # REMOVED: all *.json files deleted

scripts/
└── generate_puzzles.py  # REMOVED (logic ported to TypeScript)
```

**Structure Decision**: Single Next.js project (Option 1). No architectural change — this feature adds two new `src/lib/` modules and modifies two API routes. The `data/puzzles/` directory is removed.
