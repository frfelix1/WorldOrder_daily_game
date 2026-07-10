# Tasks: Reward-Based Scoring Model

**Input**: Design documents from `specs/011-reward-scoring-model/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: REQUIRED — Constitution Principle II mandates Test-First Development (NON-NEGOTIABLE). Tests are written first, confirmed failing, then implementation proceeds.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Remove old scoring constants and prepare the module for rewrite

- [X] T001 Remove old scoring constants (ROUND_MAX, DECAY_BASE, PERFECT_BONUS, GAME_MAX, ACCURACY_FLOOR) and export new constants (STAT_MAX=333, GAME_MAX=1000, ORDERING_MAX=133, DISTANCE_MAX=200, TOLERANCE=0.05, ATTEMPT_DECAY=0.7, PERFECT_BONUS=1) in src/lib/scoring.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core scoring functions that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests (write FIRST, confirm FAIL)

- [X] T002 [P] Write unit tests for `concordantPairs(order, trueOrder)` function — test all-correct (10), all-reversed (0), single-swap (9), random permutations in tests/unit/scoring.test.ts
- [X] T003 [P] Write unit tests for `orderingScore(positions, trueValues)` function — test returns [0–133], full score for perfect order, 0 for reversed, proportional for partial in tests/unit/scoring.test.ts
- [X] T004 [P] Write unit tests for `nodeDistanceScore(placed, true)` function — test within tolerance returns 40, at boundary returns 40, linear decay, max error returns 0 in tests/unit/scoring.test.ts
- [X] T005 [P] Write unit tests for `distanceScore(positions, trueValues)` function — test returns [0–200], perfect placement = 200, all within tolerance = 200, linear degradation in tests/unit/scoring.test.ts

### Implementation

- [X] T006 [P] Implement `concordantPairs(order: string[], trueOrder: string[]): number` — count correctly ordered pairs from 10 possible in src/lib/scoring.ts
- [X] T007 [P] Implement `nodeDistanceScore(placedFraction: number, trueFraction: number): number` — 40 pts if error ≤ 0.05, linear decay otherwise in src/lib/scoring.ts
- [X] T008 Implement `orderingScore(positions: Record<string, number>, trueValues: Record<string, number>): number` — derive orders, count concordant pairs, scale to 133 in src/lib/scoring.ts
- [X] T009 Implement `distanceScore(positions: Record<string, number>, trueValues: Record<string, number>): number` — sum nodeDistanceScore for all 5 nodes in src/lib/scoring.ts

**Checkpoint**: Foundation ready — `npm test` passes for all scoring primitives

---

## Phase 3: User Story 1 - Earning Points Feels Rewarding (Priority: P1) 🎯 MVP

**Goal**: Score builds additively from 0 toward 1000; completing a perfect game yields exactly 1000.

**Independent Test**: Complete a game, verify score starts at 0, accumulates positively, displays as X/1000.

### Tests (write FIRST, confirm FAIL)

- [X] T010 [P] [US1] Write unit tests for `scoreForStat(session, positions, trueValues)` — test combines ordering + distance, applies attempt multiplier (0.7^wrongGuesses), clamps to [0–333] in tests/unit/scoring.test.ts
- [X] T011 [P] [US1] Write unit tests for `totalScore(statSessions[], positions[], trueValues[])` — test sums 3 stats, adds perfect bonus when all = 333, max = 1000 in tests/unit/scoring.test.ts
- [X] T012 [P] [US1] Write unit test: perfect game (0 wrong guesses, exact placement, all 3 stats) yields exactly 1000 in tests/unit/scoring.test.ts

### Implementation

- [X] T013 [US1] Implement `scoreForStat(session: StatSession, positions: Record<string, number>, trueValues: Record<string, number>): number` — ordering + distance × attemptMultiplier in src/lib/scoring.ts
- [X] T014 [US1] Implement `totalScore(statScores: number[]): number` — sum + perfect bonus in src/lib/scoring.ts
- [X] T015 [US1] Update `src/app/page.tsx` to call new scoring functions with positions and trueValues from puzzle data
- [X] T016 [US1] Update ScoreDisplay component to show score out of 1000 in src/components/game/ScoreDisplay.tsx

**Checkpoint**: Game produces scores [0–1000], building from 0 upward. `npm test` passes.

---

## Phase 4: User Story 2 - Nuanced Scoring Differentiates Skill Levels (Priority: P1)

**Goal**: Players with different placement accuracy see meaningfully different scores; the 1000-point scale produces clear differentiation.

**Independent Test**: Compare scores for 90% vs 70% accuracy — verify ≥15% score difference.

### Tests (write FIRST, confirm FAIL)

- [X] T017 [P] [US2] Write unit tests verifying score differentiation: 90% accuracy player scores ≥15% higher than 70% accuracy player (same ordering, same attempts) in tests/unit/scoring.test.ts
- [X] T018 [P] [US2] Write unit tests for edge cases: all nodes within tolerance = full distance score, nodes exactly at tolerance boundary = full score, clustered values still differentiate in tests/unit/scoring.test.ts

### Implementation

- [X] T019 [US2] Verify and adjust tolerance band (0.05) produces meaningful differentiation — run test scenarios, confirm spread in src/lib/scoring.ts (may require no code changes if T006-T009 already handle this correctly)

**Checkpoint**: Score differentiation tests pass. Different accuracy levels produce meaningfully different scores.

---

## Phase 5: User Story 3 - Ordering Correctness is Rewarded (Priority: P2)

**Goal**: Correct relative ordering earns points independent of exact placement.

**Independent Test**: Submit guesses with varying ordering correctness, verify ordering component changes proportionally.

### Tests (write FIRST, confirm FAIL)

- [X] T020 [P] [US3] Write unit tests: perfect order = 133 pts, single adjacent swap = ~120 pts (9/10 pairs), complete reversal = 0 pts in tests/unit/scoring.test.ts
- [X] T021 [P] [US3] Write unit test: correct ordering + poor placement still earns full ordering points (133) in tests/unit/scoring.test.ts

### Implementation

- [X] T022 [US3] Verify ordering score is independent of placement in `orderingScore` — uses derived order only, not fractional positions (may require no changes if T008 is correct)

**Checkpoint**: Ordering tests all pass. Ordering score responds only to relative order.

---

## Phase 6: User Story 4 - Fewer Attempts Still Matters (Priority: P3)

**Goal**: Geometric decay (0.7× per wrong guess) ensures fewer attempts = higher score.

**Independent Test**: Same stat with 1, 2, 3 guesses produces descending scores.

### Tests (write FIRST, confirm FAIL)

- [X] T023 [P] [US4] Write unit tests: 0 wrong = 100% of earned, 1 wrong = 70%, 2 wrong = 49%, 3 wrong = ~34% in tests/unit/scoring.test.ts
- [X] T024 [P] [US4] Write unit test: score never goes below 0 regardless of wrong guess count in tests/unit/scoring.test.ts

### Implementation

- [X] T025 [US4] Verify attempt multiplier in `scoreForStat` — `Math.pow(0.7, session.guesses.length - 1)` applied to raw total (may require no changes if T013 is correct)

**Checkpoint**: Attempt penalty tests pass. More guesses = lower score, never negative.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: UI updates and integration across all stories

- [X] T026 [P] Update performance tier thresholds in src/components/game/ResultCard.tsx (Perfect=1000, Excellent≥800, Great≥600, Good≥400, Keep Exploring<400)
- [X] T027 [P] Update share text format to show new score in src/lib/scoring.ts (`buildShareText`)
- [X] T028 [P] Remove old scoring functions that are no longer used (old `scoreForRound`, old `accuracyFactor`, old `scoreForStat`, old `totalScore`) from src/lib/scoring.ts
- [X] T029 Write e2e test verifying full game flow displays scores correctly with new 1000-point scale in tests/e2e/game-flow.spec.ts
- [X] T030 Run full validation: `npm run build && npm test && npm run test:e2e`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **User Stories (Phases 3–6)**: All depend on Phase 2 completion
  - US1 and US2 are both P1 but US2 depends on US1's `scoreForStat`/`totalScore`
  - US3 and US4 can proceed after US1
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only — MVP target
- **US2 (P1)**: Depends on US1 (needs scoring functions to verify differentiation)
- **US3 (P2)**: Depends on Foundational only (tests ordering in isolation)
- **US4 (P3)**: Depends on Foundational only (tests multiplier in isolation)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Foundation functions before composite functions
- Pure logic before UI integration

### Parallel Opportunities

- T002, T003, T004, T005 can all run in parallel (different test groups)
- T006, T007 can run in parallel (independent helper functions)
- T010, T011, T012 can run in parallel (different test cases)
- T017, T018 can run in parallel
- T020, T021 can run in parallel
- T023, T024 can run in parallel
- T026, T027, T028 can run in parallel (different files)

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational tests in parallel:
Task: "Write tests for concordantPairs in tests/unit/scoring.test.ts"
Task: "Write tests for orderingScore in tests/unit/scoring.test.ts"
Task: "Write tests for nodeDistanceScore in tests/unit/scoring.test.ts"
Task: "Write tests for distanceScore in tests/unit/scoring.test.ts"

# Then implement helpers in parallel:
Task: "Implement concordantPairs in src/lib/scoring.ts"
Task: "Implement nodeDistanceScore in src/lib/scoring.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (new constants)
2. Complete Phase 2: Foundational (scoring primitives)
3. Complete Phase 3: User Story 1 (composite scoring + UI)
4. **STOP and VALIDATE**: `npm test` — scoring works end-to-end with new model
5. Game is playable with reward-based scoring at this point

### Incremental Delivery

1. Setup + Foundational → Scoring primitives work
2. US1 → Game produces 0–1000 scores additively (MVP!)
3. US2 → Verify differentiation holds (validation, may need tuning)
4. US3 + US4 → Confirm ordering and attempt components work as designed
5. Polish → UI tiers, share text, cleanup, e2e

---

## Notes

- [P] tasks = different files or independent test groups, no dependencies
- Constitution mandates TDD: write tests, confirm FAIL, then implement
- All scoring logic stays in `src/lib/scoring.ts` (pure functions, no side effects)
- The existing `placementAccuracy` and `deriveOrder` from `src/lib/line-scale.ts` are reused — no changes needed there
- Commit after each task or logical group
