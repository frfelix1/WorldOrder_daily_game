# Tasks: Dynamic Puzzle Generation

**Input**: Design documents from `specs/005-dynamic-puzzle-generation/`

**Prerequisites**: [plan.md](./plan.md) | [spec.md](./spec.md) | [research.md](./research.md) | [data-model.md](./data-model.md) | [contracts/api-contracts.md](./contracts/api-contracts.md)

**Tests**: The project constitution mandates Test-First Development as NON-NEGOTIABLE. Tests are **required** for every user story. Write tests first, confirm they fail, then implement.

**Organization**: Tasks grouped by user story for independent implementation, testing, and delivery.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on in-progress tasks)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup (Type Definitions)

**Purpose**: Add the new TypeScript types that all implementation tasks depend on. No logic — types only.

- [X] T001 Add `Dataset`, `DatasetStat`, and `DatasetEntry` interfaces to `src/types/index.ts` (see data-model.md New Types section for exact field definitions)

**Checkpoint**: `npm run build` still passes. New types are importable.

---

## Phase 2: Foundational — Seeded PRNG

**Purpose**: Implement and validate the deterministic PRNG (`src/lib/seeded-random.ts`) which is a hard dependency for the puzzle generator. Must be complete before any user story work begins.

**⚠️ CRITICAL**: Write tests first, confirm they fail, then implement.

### Tests — Write First, Confirm Failing

- [X] T002 Write failing unit tests in `tests/unit/seeded-random.test.ts` covering: (a) `createRng(42)` is stable across calls, (b) `nextFloat` returns values in [0,1), (c) same seed produces same sequence, (d) `pickRandom` throws `RangeError` on empty array, (e) `shuffle` does not mutate input, (f) `pickRandom` distribution is approximately uniform over 1000 samples

### Implementation

- [X] T003 Implement `src/lib/seeded-random.ts` — Mulberry32 algorithm with exported `RngState` type and pure functions `createRng`, `nextFloat`, `pickRandom<T>`, `shuffle<T>` (all with explicit TypeScript parameter and return types; no `any`; see contracts/api-contracts.md section 4)

**Checkpoint**: `npm test tests/unit/seeded-random.test.ts` passes with all assertions green.

---

## Phase 3: User Story 1 — Always-Available Daily Puzzle (Priority: P1) 🎯 MVP

**Goal**: Any request to `GET /api/puzzle?date=YYYY-MM-DD` returns a valid, well-formed puzzle, even for dates with no pre-generated JSON file.

**Independent Test**: `curl "http://localhost:3000/api/puzzle?date=2027-01-01"` returns HTTP 200 with a valid PuzzleFile JSON body (5 countries, 3 stats, valid solutions). This date is well beyond the last pre-generated file.

### Tests — Write First, Confirm Failing

- [X] T004 [P] Write failing unit tests in `tests/unit/puzzle-generator.test.ts` covering: (a) returns a `PuzzleFile` for a known date with full dataset, (b) `countries.length === 5`, (c) `stats.length === 3`, (d) each `solution` is a valid permutation of `countries.map(c => c.id)`, (e) `stats` span ≥2 distinct categories, (f) returns `null` when `dataset.countryCount < 30`, (g) returns `null` when `dataset.statCount < 14`, (h) `computeQuintileBands` returns 5 non-empty bands, (i) `deriveSolution` sorts by rank ascending
- [X] T005 [P] Update `tests/integration/api/puzzle.test.ts` — add test cases: (a) date `2027-06-01` (no pre-generated file) returns 200 with valid body matching `PuzzleFile` shape, (b) response includes `Cache-Control: public, max-age=86400` header, (c) invalid date format still returns 400

### Implementation

- [X] T006 Implement `src/lib/puzzle-generator.ts` — export `generatePuzzle(dateStr: string, dataset: Dataset): PuzzleFile | null` implementing the full algorithm: dataset validation; up to 20 seeded attempts; per-attempt stat selection (3 stats, ≥2 categories); `computeQuintileBands` with zero-value special handling; country selection (one per band from intersection of eligible countries across all 3 stats); 5-constraint validation; consecutive-day uniqueness check; `deriveSolution`. Seed formula: `BASE_SEED (42) + getPuzzleNumberForDate(dateStr) + attemptIndex`. Export `computeQuintileBands` and `deriveSolution` for unit tests. (Reference: data-model.md State Transitions section; contracts/api-contracts.md section 3)
- [X] T007 Update `src/app/api/puzzle/route.ts` — replace `readFileSync('data/puzzles/${date}.json')` with: (a) load dataset via `fs.readFileSync(path.join(process.cwd(), 'data', 'dataset.json'), 'utf-8')` wrapped in `unstable_cache` from `next/cache` (no `revalidate`, permanent cache); (b) call `generatePuzzle(date, dataset)`; (c) return 404 `{ error: 'not_found' }` if result is `null`; (d) return 200 JSON with same `Cache-Control` header as before. Date validation regex and 400 response unchanged.

**Checkpoint**: `npm test` passes for `seeded-random.test.ts`, `puzzle-generator.test.ts`, and `puzzle.test.ts`. `curl "http://localhost:3000/api/puzzle?date=2027-01-01"` returns valid puzzle.

---

## Phase 4: User Story 2 — Consistent Puzzles Across the Same Day (Priority: P2)

**Goal**: Any two requests for the same date — from different users, at different times, in different serverless invocations — receive byte-identical puzzle data.

**Independent Test**: Run `curl -s "http://localhost:3000/api/puzzle?date=2026-08-01" | sha256sum` twice. Both hashes must match.

### Tests — Write First, Confirm Failing

- [X] T008 [P] Add determinism test suite to `tests/unit/puzzle-generator.test.ts`: (a) calling `generatePuzzle('2026-08-01', dataset)` twice returns deeply equal results, (b) `generatePuzzle('2026-08-01', dataset)` and `generatePuzzle('2026-08-02', dataset)` return different country sets (consecutive-day uniqueness), (c) country sets for any 10 sequential test dates are all distinct from their predecessor
- [X] T009 [P] Add repeat-request consistency test to `tests/integration/api/puzzle.test.ts`: two sequential GET requests for the same date string return JSON bodies with identical `countries[*].id` arrays and `stats[*].solution` arrays

### Implementation

- [X] T010 Extract seed constants in `src/lib/puzzle-generator.ts`: add `export const BASE_SEED = 42` and `export const MAX_ATTEMPTS = 20` as named module-level constants with inline JSDoc comments explaining the determinism guarantee (enables determinism tests to import and verify the seed formula without magic numbers)

**Checkpoint**: `npm test` passes all determinism assertions. Manual hash check confirms identical puzzle across two requests for the same date.

---

## Phase 5: User Story 3 — Zero-Maintenance Deployment (Priority: P3)

**Goal**: After one Vercel deploy, the game produces a valid puzzle for every future date automatically — no file commits, no scripts, no operator action required.

**Independent Test**: Delete all `data/puzzles/*.json` files locally. Run `npm run dev`. Navigate to the game. It loads today's puzzle without error. `GET /api/puzzles` returns a JSON array that includes today's date.

### Tests — Write First, Confirm Failing

- [X] T011 [P] Create `tests/integration/api/puzzles-list.test.ts` — test `GET /api/puzzles` returns: (a) HTTP 200, (b) JSON array of strings, (c) first element is `"2026-01-01"` (epoch), (d) last element is today's UTC date, (e) array is sorted ascending, (f) no duplicates, (g) all strings match `/^\d{4}-\d{2}-\d{2}$/`
- [X] T012 [P] Add E2E scenario to `tests/e2e/game-flow.spec.ts` — new test: navigate to game with `?date=2027-01-01` query (a date guaranteed to have no pre-generated file); assert page does not show error state; assert 5 country chips are rendered

### Implementation

- [X] T013 Update `src/app/api/puzzles/route.ts` — replace directory scan with computed date range: generate a sorted array of all UTC date strings from `2026-01-01` (epoch) through `getUTCDateString()` (today), return as JSON array. No filesystem access. (Reference: contracts/api-contracts.md section 2)
- [X] T014 Delete all files matching `data/puzzles/*.json` — removes the pre-generated puzzle files that are no longer needed (use `rm data/puzzles/*.json` or equivalent; keep the `data/puzzles/` directory only if required by other code, otherwise remove it too)
- [X] T015 Delete `scripts/generate_puzzles.py` — the logic has been ported to TypeScript; this file is no longer the source of truth (optionally retain `scripts/build_dataset.py`, `scripts/normalize_stats.py`, and `scripts/stat_definitions.py` which are needed for dataset maintenance)

**Checkpoint**: `npm test` passes including `puzzles-list.test.ts` and updated E2E. `GET /api/puzzles` returns array starting at `2026-01-01`. Game loads without any `data/puzzles/` files present.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Full suite validation, build verification, and minor documentation alignment.

- [X] T016 [P] Run `npm test` and confirm: (a) 0 failures, (b) global coverage ≥ 80% on all metrics (lines, functions, branches, statements) as reported by `vitest --coverage`, (c) `tests/unit/puzzle-generator.test.ts` and `tests/unit/seeded-random.test.ts` meet 100% coverage for their respective modules
- [X] T017 [P] Run `npm run build` and confirm TypeScript strict-mode compilation and Next.js build complete with no errors or warnings
- [X] T018 Update `Puzzle Data Integrity` paragraph in `.specify/memory/constitution.md` to remove the reference to "authoring checklist in `contracts/puzzle-api.md`" and replace with: "The TypeScript generation function (`src/lib/puzzle-generator.ts`) enforces all integrity constraints at runtime — no manual authoring step is required."

**Checkpoint**: All quality gates pass. The feature is ready for Vercel deployment.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (types) — **BLOCKS** all user story work
- **Phase 3 (US1)**: Depends on Phase 2 (PRNG ready) — MVP deliverable
- **Phase 4 (US2)**: Depends on Phase 3 (generator implemented) — determinism properties tested against working implementation
- **Phase 5 (US3)**: Depends on Phase 3 (route updated) — depends on the generator being live in the API route
- **Phase 6 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 — core generation logic, no dependency on US2 or US3
- **US2 (P2)**: Depends on US1 — tests determinism properties of the US1 implementation; T010 is a pure constant-extraction refactor with no risk
- **US3 (P3)**: Depends on US1 — the route must already serve generated puzzles before removing static files; T013/T014/T015 can be parallelized

### Within Each Phase

- Tests (T002, T004, T005, T008, T009, T011, T012) MUST be written and confirmed **failing** before their paired implementation tasks
- T004 and T005 can run in parallel (different files)
- T008 and T009 can run in parallel (different files)
- T011 and T012 can run in parallel (different files)
- T016 and T017 can run in parallel (read-only validation commands)

---

## Parallel Execution Examples

### Phase 3: US1 — Tests can be written in parallel

```
Parallel:
  Task A: T004 — Write tests/unit/puzzle-generator.test.ts
  Task B: T005 — Update tests/integration/api/puzzle.test.ts

Then sequentially:
  Task C: T006 — Implement src/lib/puzzle-generator.ts
  Task D: T007 — Update src/app/api/puzzle/route.ts
```

### Phase 4: US2 — Both test tasks can run in parallel

```
Parallel:
  Task A: T008 — Add determinism tests to tests/unit/puzzle-generator.test.ts
  Task B: T009 — Add consistency test to tests/integration/api/puzzle.test.ts

Then:
  Task C: T010 — Extract BASE_SEED/MAX_ATTEMPTS constants in src/lib/puzzle-generator.ts
```

### Phase 5: US3 — Tests and removals can run in parallel

```
Parallel:
  Task A: T011 — Create tests/integration/api/puzzles-list.test.ts
  Task B: T012 — Update tests/e2e/game-flow.spec.ts

Then:
  Task C: T013 — Update src/app/api/puzzles/route.ts
  
Parallel after T013:
  Task D: T014 — Delete data/puzzles/*.json
  Task E: T015 — Delete scripts/generate_puzzles.py
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Type definitions
2. Complete Phase 2: PRNG foundation
3. Complete Phase 3: US1 (tests → generator → route)
4. **STOP and VALIDATE**: `curl "http://localhost:3000/api/puzzle?date=2027-01-01"` returns valid puzzle
5. Deploy to Vercel and smoke-test — game is already maintenance-free at this point

### Incremental Delivery

1. Phase 1 + 2 → PRNG ready
2. Phase 3 (US1) → Puzzle generation live, MVP deployed
3. Phase 4 (US2) → Determinism formally verified and documented
4. Phase 5 (US3) → Static files removed, clean deployment
5. Phase 6 → All gates pass, constitution updated

---

## Notes

- `[P]` tasks operate on different files with no shared in-flight dependencies
- Constitution Principle II (Test-First) is NON-NEGOTIABLE: every `T00N` implementation task has a corresponding test task `T00M` that must fail before coding begins
- The seeded PRNG (Phase 2) is the only genuine blocking prerequisite — once it exists, US1, US2, and US3 work can proceed
- `data/dataset.json` must be present and committed before any integration tests run; verify with `ls data/dataset.json`
- Commit after each checkpoint to preserve progress and enable easy rollback
