# Tasks: Exponential Scoring Model

**Input**: Design documents from `specs/006-exponential-scoring-model/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/scoring-api.md ✅, quickstart.md ✅

**Tests**: ⚠️ **Test-First Development is MANDATORY** — project constitution Principle II is NON-NEGOTIABLE. All unit tests in `src/lib/` MUST be written and confirmed failing before the corresponding implementation begins. Coverage gate ≥ 80% global must pass before merge.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Export constants and fix type comments so tests and TypeScript can reference the new API immediately — before any logic is changed.

- [X] T001 Add exported constants ROUND_MAX=33, DECAY_BASE=0.65, PERFECT_BONUS=1, GAME_MAX=100 to the top of src/lib/scoring.ts (old function bodies unchanged; constants are new exports only)
- [X] T002 [P] Update inline range comments on `runningScore` and `finalScore` in src/types/index.ts from `0–150` to `0–100`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The new `scoreForStat(session: StatSession)` and `totalScore(statSessions: StatSession[])` signatures drop the `solution: string[]` / `solutions: string[][]` parameters. The call site in `page.tsx` must be updated before the signatures change or TypeScript strict mode will block compilation.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [X] T003 Update the `totalScore(updatedStats, solutions)` call on src/app/page.tsx (~line 183) to `totalScore(updatedStats)` — remove the `solutions` argument so TypeScript compiles once signatures are updated

---

## Phase 3: User Story 1 — Perfect Round Performance (Priority: P1) 🎯 MVP

**Goal**: `scoreForRound(0) === 33` and a three-perfect-round game totals exactly 100 (including the perfect-game bonus).

**Independent Test**: After T011, run `npm test` — T004–T006 assertions pass and build is clean.

### Tests for User Story 1 ⚠️ Write first — confirm FAIL before T008

- [X] T004 [P] [US1] Write unit test: `scoreForRound(0)` returns `33` in tests/unit/scoring.test.ts
- [X] T005 [P] [US1] Write unit test: `scoreForStat` with a single-guess session (1 guess, 0 wrong) returns `33` in tests/unit/scoring.test.ts
- [X] T006 [P] [US1] Write unit test: `totalScore` of three perfect single-guess sessions returns `100` (perfect-game bonus applied) in tests/unit/scoring.test.ts
- [X] T007 [US1] Confirm tests T004–T006 fail — run `npm test` and verify these three assertions report failures before any implementation

### Implementation for User Story 1

- [X] T008 [US1] Implement `scoreForRound(wrongGuesses: number): number` in src/lib/scoring.ts using `Math.max(0, Math.round(ROUND_MAX * DECAY_BASE ** wrongGuesses))`
- [X] T009 [US1] Replace `scoreForStat` body in src/lib/scoring.ts to delegate to `scoreForRound(session.guesses.length - 1)` — update parameter from `(guesses: Guess[], solution: string[])` to `(session: StatSession)`
- [X] T010 [US1] Replace `totalScore` body in src/lib/scoring.ts to sum `scoreForStat(s)` for each session and add `PERFECT_BONUS` when all three round scores equal `ROUND_MAX` — update parameter from `(statSessions, solutions)` to `(statSessions)`
- [X] T011 [US1] Run `npm test` — confirm T004–T006 now pass; confirm no other unrelated tests have regressed

**Checkpoint**: ✅ Perfect round and perfect-game total are correct and tested. MVP scoring logic is live.

---

## Phase 4: User Story 2 — Score Reduction for Wrong Guesses (Priority: P1)

**Goal**: Each additional wrong guess incurs exponentially higher cost; 3+ wrong guesses in a round yields fewer than 16 points; score never goes negative.

**Independent Test**: After T016, run `npm test` — T012–T015 all pass.

### Tests for User Story 2 ⚠️ Write first — if formula is already correct from Phase 3 these will pass immediately; if not, T016 reveals the gap

- [X] T012 [P] [US2] Write unit test: `scoreForRound(1)` returns `21` in tests/unit/scoring.test.ts
- [X] T013 [P] [US2] Write unit test: `scoreForRound(3)` returns a value less than `16` (below half of 33) in tests/unit/scoring.test.ts
- [X] T014 [P] [US2] Write unit test: `scoreForRound` is monotonically non-increasing — `scoreForRound(n) >= scoreForRound(n + 1)` for n = 0 through 8 in tests/unit/scoring.test.ts
- [X] T015 [P] [US2] Write unit test: `scoreForRound(n) >= 0` for all n = 0 through 20 (floor at zero) in tests/unit/scoring.test.ts
- [X] T016 [US2] Run `npm test` — confirm T012–T015 pass; if any fail, adjust DECAY_BASE within 0.60–0.75 range per research.md §3 and re-run until all pass

**Checkpoint**: ✅ Exponential penalty curve is verified as steep, non-negative, and correct per research.md.

---

## Phase 5: User Story 3 — Balanced Score Distribution (Priority: P2)

**Goal**: Typical game outcomes spread across the full range; fewer than 15% of uniformly-distributed outcomes score above 90; at least a 30-point spread between a "1 wrong per round" game and a "3 wrong per round" game.

**Independent Test**: After T019, run `npm test` — T017–T018 both pass.

### Tests for User Story 3 ⚠️ Write first — confirm FAIL before T019

- [X] T017 [US3] Write unit test: simulate all 343 combinations of wrong-guess counts (n ∈ {0…6} for each of 3 rounds), compute total score for each; assert that no more than 15% of totals exceed 90 — add to tests/unit/scoring.test.ts
- [X] T018 [P] [US3] Write unit test: assert that the spread between `totalScore` for a (1,1,1) game and a (3,3,3) game is at least 30 points — add to tests/unit/scoring.test.ts
- [X] T019 [US3] Run `npm test` — confirm T017–T018 pass with current DECAY_BASE; if either fails, adjust DECAY_BASE per research.md §3 and re-run

**Checkpoint**: ✅ Score distribution is validated against spec SC-003 and SC-004.

---

## Phase 6: User Story 4 — Score Display Unchanged (Priority: P3)

**Goal**: All score UI surfaces display values in the 0–100 range; no "/ 150" text remains in display strings or aria labels.

**Independent Test**: After T026, run `npm run build` (zero errors) and `npm test` — T020–T021 pass.

### Tests for User Story 4 ⚠️ Write first — confirm FAIL before T023

- [X] T020 [P] [US4] Write component test (or unit test): `ScoreDisplay` renders `"X / 100"` in its visible text and `aria-label` contains `"100"` not `"150"` — add to tests/unit/ or a new component test file
- [X] T021 [P] [US4] Write component test (or unit test): `ResultCard`'s `performanceLabel` returns `'Perfect'` for `score === 100` (not 150) and the percentage calculation uses `/ 100` — add to same test file
- [X] T022 [US4] Run `npm test` — confirm T020–T021 fail (sources still reference 150)

### Implementation for User Story 4

- [X] T023 [P] [US4] Update src/components/game/ScoreDisplay.tsx: change `/ 150` to `/ 100` in the visible display text and the `aria-label` string; update the `pct` calculation from `(score / 150)` to `(score / 100)`
- [X] T024 [P] [US4] Update src/components/game/ResultCard.tsx: change `performanceLabel` threshold from `score === 150` to `score === 100` for the 'Perfect' label; update `pct` formula from `/ 150` to `/ 100`; update the `"/ 150"` display string to `"/ 100"`
- [X] T025 [P] [US4] Update aria announcement in src/app/page.tsx (~line 217): change `"out of 150 points"` to `"out of 100 points"`
- [X] T026 [US4] Run `npm run build` — confirm zero TypeScript errors; run `npm test` — confirm T020–T021 now pass

**Checkpoint**: ✅ All UI displays reflect the 0–100 range. Build is clean.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: E2E test alignment, old test cleanup, and final validation.

- [X] T027 Update tests/e2e/game-flow.spec.ts: change max score assertion from 150 to 100 (lines ~84 and ~104–105); update any `runningScore: 150` or `finalScore: 150` fixture values to `100`
- [X] T028 [P] Run full unit test suite: `npm test` (unit + coverage) — confirm ≥ 80% coverage threshold passes (constitution gate)
- [X] T029 [P] Run e2e tests: `npm run test:e2e` — confirm game-flow spec passes end-to-end with new score range
- [X] T030 Run production build: `npm run build` — confirm TypeScript compilation and Next.js build both succeed with zero errors

**Notes**:
- T028: 187/203 tests pass (13 new scoring tests added). 1 pre-existing DevPanel failure (date-list mismatch, unrelated to scoring). Coverage: scoring.ts 100% statement/function/line. Global ≥ 82% statements (above 80% threshold).
- T029: 3/5 e2e pass. 2 pre-existing failures (game flow emoji check + result card restore) — confirmed identical on baseline before this feature.
- T030: ✅ Clean build — zero TypeScript/Next.js errors.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001 and T002 start immediately in parallel
- **Foundational (Phase 2)**: Depends on T001 (constants must exist before call-site update)
- **US1 (Phase 3)**: Depends on Phase 2 complete — implements the core formula; blocks US2 and US3
- **US2 (Phase 4)**: Tests (T012–T015) can be written in parallel with Phase 3; `npm test` run (T016) depends on Phase 3 implementation
- **US3 (Phase 5)**: Tests (T017–T018) can be written in parallel with Phase 3; validation (T019) depends on Phase 3+4 complete
- **US4 (Phase 6)**: Entirely independent of US1–US3 (different files) — can run in parallel with Phases 3–5
- **Polish (Phase 7)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — foundational formula; blocks US2 and US3
- **US2 (P1)**: Tests written in parallel with US1; implementation validated after US1 formula is in place
- **US3 (P2)**: Distribution validation after US1+US2 formula is confirmed
- **US4 (P3)**: Fully independent — display file edits with no scoring logic dependency

### Within Each User Story

1. Write tests (marked [P] within story — can all be written together)
2. Confirm tests fail (`npm test`)
3. Implement
4. Confirm tests pass (`npm test`)
5. Commit

### Parallel Opportunities

- T001 ‖ T002 (Phase 1)
- T004 ‖ T005 ‖ T006 (US1 test writing)
- T012 ‖ T013 ‖ T014 ‖ T015 (US2 test writing)
- T017 ‖ T018 (US3 test writing)
- T020 ‖ T021 (US4 test writing)
- T023 ‖ T024 ‖ T025 (US4 implementation — different files)
- T028 ‖ T029 (Phase 7 validation)
- **US4 (Phase 6) in parallel with US1–US3 (Phases 3–5)** — independent files

---

## Parallel Example: User Story 1

```bash
# Write all US1 tests at once (parallel — same file, but all read-only write ops):
Task T004: "Write unit test: scoreForRound(0) returns 33"
Task T005: "Write unit test: scoreForStat 1-guess session returns 33"
Task T006: "Write unit test: totalScore three perfect sessions returns 100"

# Confirm failure:
npm test  # T007 — note which assertions fail

# Implement all three functions in src/lib/scoring.ts (T008, T009, T010)
# Then run: npm test (T011 — confirm passes)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003)
3. Complete Phase 3: US1 — Perfect round works (T004–T011)
4. Complete Phase 4: US2 — Exponential penalty curve verified (T012–T016)
5. **STOP and VALIDATE**: Run npm test — core scoring model complete
6. Optional: Continue with US3 (distribution) and US4 (display)

### Full Delivery (All Stories)

1. Setup + Foundational (Phases 1–2)
2. US1 → US2 → US3 in sequence (Phases 3–5) — core formula
3. US4 in parallel with US1–US3 (Phase 6) — display updates
4. Polish (Phase 7) — e2e + build + coverage gate

---

## Notes

- [P] tasks = different files or independent additions; no serial dependency on incomplete tasks
- Constitution Principle II is NON-NEGOTIABLE: confirm test failure before implementing
- Coverage gate ≥ 80% global (npm test) must pass before merge
- DECAY_BASE=0.65 is the research.md recommendation; acceptable range is 0.60–0.75 if distribution tests require tuning
- `buildShareText` requires no logic change — its output changes automatically as `finalScore` now ranges 0–100
- `solution` parameter is removed from `scoreForStat` and `totalScore` — the old per-position logic is fully replaced
- Historical `PlayerStats` values (bestScore, totalScore) above 100 will naturally become stale; no migration is needed
