# Tasks: Reveal Correct Values

**Input**: Design documents from `specs/007-reveal-correct-values/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/puzzle-api.md ✅

**Tests**: Constitution Principle II (Test-First Development) is **NON-NEGOTIABLE** — test tasks are mandatory for every user story. Write tests first, confirm they fail (RED), then implement (GREEN).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in every description

---

## Phase 1: Setup

**Purpose**: Confirm the baseline is clean before any changes.

- [ ] T001 Run `npm run build` and confirm TypeScript compiles with zero errors before any code changes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type extension and pure formatting function — both block ALL user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests (write first — must FAIL before implementing)

- [ ] T002 [P] Write failing unit tests for `formatStatValue` covering all value categories (integer, float < 10, float ≥ 10, zero) and all 17 stat unit strings in `tests/unit/formatting.test.ts`
- [ ] T003 [P] Write failing unit tests for puzzle-generator asserting each generated `StatDef` contains non-empty `unit: string` and a `values` record with exactly 5 entries in `tests/unit/puzzle-generator.test.ts`
- [ ] T004 [P] Write failing integration test asserting `GET /api/puzzle` response body includes `stats[*].unit` (string) and `stats[*].values` (object with 5 country-ID keys) in `tests/integration/api/puzzle.test.ts`

### Implementation

- [ ] T005 Add `unit: string` and `values: Record<string, number>` fields to the `StatDef` interface in `src/types/index.ts` — resolves all TypeScript errors introduced by T002–T004
- [ ] T006 [P] Create `src/lib/formatting.ts` and implement `formatStatValue(value: number, unit: string): string` with rules: whole numbers → thousands-separated integer; float < 10 → 3 decimal places; float ≥ 10 → 1 decimal place + thousands separator; always appends `" " + unit`
- [ ] T007 Update the `statDefs` mapping in `src/lib/puzzle-generator.ts` to populate `unit: stat.unit` and `values: Object.fromEntries(selectedIds.map(id => [id, entriesById.get(id)!.value]))` on each `StatDef`

**Checkpoint**: `npm test` should show T002–T004 now passing. Foundation ready — user story phases can begin.

---

## Phase 3: User Story 1 — View Actual Value on Correct Lock (Priority: P1) 🎯 MVP

**Goal**: When a ranking slot locks in green after a correct guess, it immediately shows the country's actual measured value with its unit (e.g., "449,964 km²").

**Independent Test**: Submit a guess where at least one position is correct; verify the locked slot renders a non-empty value string matching the expected formatted output for that country and stat.

### Tests for User Story 1 ⚠️ Write FIRST — must FAIL before implementing

- [ ] T008 [P] [US1] Write failing RTL tests for `RankingBoard` with `slotValues` prop: locked slots render the formatted value text; unlocked slots do not; `slotValues` absent → no value text rendered in `tests/unit/RankingBoard.test.tsx`
- [ ] T009 [P] [US1] Write failing RTL tests for `GamePage` asserting that after a correct guess `RankingBoard` receives a `slotValues` array where locked positions contain formatted strings and unlocked positions are `null` in `tests/unit/GamePage.test.tsx`

### Implementation for User Story 1

- [ ] T010 [US1] Add optional `slotValues?: (string | null)[]` prop to `RankingBoardProps` and render a `<span>` with the value string between the country name and the checkmark icon on locked slots in `src/components/game/RankingBoard.tsx`
- [ ] T011 [US1] In `src/app/page.tsx`, compute `slotValues` by mapping `slotAssignments` through `formatStatValue(activeStat.values[id], activeStat.unit)` for locked positions (null for unlocked/empty) and pass as `slotValues` prop to `<RankingBoard>`

**Checkpoint**: US1 fully functional — submit a guess, correct slots show value immediately. `npm test` passes. `npm run build` clean.

---

## Phase 4: User Story 2 — Values Persist on Solved Stat (Priority: P2)

**Goal**: After all 5 slots are locked (stat solved), all five values remain visible throughout the post-solve display — no values disappear when `disabled=true`.

**Independent Test**: Solve all five positions of a stat; verify each slot still displays its formatted value string; verify values remain after `disabled` prop is set to `true`.

### Tests for User Story 2 ⚠️ Write FIRST — must FAIL before implementing

- [ ] T012 [P] [US2] Write failing RTL tests for `RankingBoard` asserting all five locked slots render their value strings when `disabled=true` (full-solve state) in `tests/unit/RankingBoard.test.tsx`
- [ ] T013 [P] [US2] Write failing RTL tests for `GamePage` asserting that when a stat is `solved: true`, the `slotValues` prop passed to `<RankingBoard>` still contains the correct formatted strings for all 5 positions in `tests/unit/GamePage.test.tsx`

### Implementation for User Story 2

- [ ] T014 [US2] Verify (and fix if needed) that the `slotValues` computation path in `src/app/page.tsx` covers the solved-stat render: when `activeStat.solved === true` all locked positions are still included and `slotValues` is non-null for every slot

**Checkpoint**: Fully solved stat shows all 5 values. Values survive the `disabled` state. `npm test` passes.

---

## Phase 5: User Story 3 — Correct Value in Guess History (Priority: P3)

**Goal**: In the feedback rows below the board, positions marked with a ✓ also show the country's formatted value under its name.

**Independent Test**: Submit a guess with at least one correct position; verify the feedback row for that guess shows the formatted value string beneath the country name in the correct cell.

### Tests for User Story 3 ⚠️ Write FIRST — must FAIL before implementing

- [ ] T015 [P] [US3] Write failing RTL tests for `FeedbackRow` with `valueMap` prop: correct cells render the value string under the country name; incorrect cells do not; `valueMap` absent → no value shown in `tests/unit/FeedbackRow.test.tsx`
- [ ] T016 [P] [US3] Write failing RTL tests for `GamePage` asserting that each `<FeedbackRow>` receives a `valueMap` with pre-formatted strings for all 5 countries of the active stat in `tests/unit/GamePage.test.tsx`

### Implementation for User Story 3

- [ ] T017 [US3] Add optional `valueMap?: Record<string, string>` prop to `FeedbackRowProps` and render the value string in a `<span>` beneath the country name inside correct cells in `src/components/game/FeedbackRow.tsx`
- [ ] T018 [US3] In `src/app/page.tsx`, compute a `valueMap` (all 5 countries pre-formatted via `formatStatValue`) from the active `StatDef` and pass as `valueMap` prop to each `<FeedbackRow>`

**Checkpoint**: All three user stories independently functional. `npm test` passes. `npm run build` clean.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: E2E coverage, edge-case hardening, and final quality gate.

- [ ] T019 [P] Add E2E test scenario to `tests/e2e/game-flow.spec.ts`: after a correct guess, a locked ranking slot is visible with text matching the country name AND a formatted numeric value (regex: `/\d[\d,]*(\.\d+)?\s+\S+/`)
- [ ] T020 [P] Add explicit test in `tests/unit/formatting.test.ts` for zero-value input: `formatStatValue(0, "km²")` returns `"0 km²"` (not blank, not `"undefined km²"`)
- [ ] T021 Run `npm test` — confirm ≥80% global coverage gate passes; fix any coverage gaps in `src/lib/formatting.ts`, `src/components/game/RankingBoard.tsx`, or `src/app/page.tsx`
- [ ] T022 Run `npm run build` — confirm TypeScript compiles with zero errors and Next.js build completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 3 completion (US2 extends US1's locked-slot rendering)
- **US3 (Phase 5)**: Depends on Phase 2 completion — can overlap with Phase 4 if needed
- **Polish (Phase 6)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — no dependency on US2 or US3
- **US2 (P2)**: Extends US1's rendering — starts after US1
- **US3 (P3)**: Only needs Foundational + `formatStatValue` — independent of US1/US2 except for `page.tsx` edits

### Within Each Phase

- Tests MUST be written and confirmed FAILING before implementation tasks in the same phase
- T005 (`StatDef` type) before T006 and T007 (type must exist for TS to accept new fields)
- T006 (`formatting.ts`) before T011 (page.tsx uses `formatStatValue`)
- T010 (`RankingBoard` prop) before T011 (page must pass the correct prop shape)

### Parallel Opportunities

- T002, T003, T004 — all test files, no shared dependencies → parallel
- T006, T007 — different files → parallel once T005 is done
- T008, T009 — different test targets → parallel
- T012, T013 — different test targets → parallel
- T015, T016 — different test targets → parallel
- T019, T020 — different concerns → parallel

---

## Parallel Example: Foundational Phase

```
# All three failing tests can be written simultaneously:
Task: "Write failing tests for formatStatValue in tests/unit/formatting.test.ts"          [T002]
Task: "Write failing tests for StatDef output in tests/unit/puzzle-generator.test.ts"     [T003]
Task: "Write failing integration test for API response in tests/integration/api/puzzle.test.ts" [T004]

# After T005 (types), these two implementations are independent:
Task: "Implement formatStatValue in src/lib/formatting.ts"                                [T006]
Task: "Update puzzle-generator StatDef construction in src/lib/puzzle-generator.ts"       [T007]
```

## Parallel Example: User Story 1

```
# Both failing tests can be written simultaneously:
Task: "Write failing RankingBoard slotValues tests in tests/unit/RankingBoard.test.tsx"   [T008]
Task: "Write failing GamePage slotValues tests in tests/unit/GamePage.test.tsx"           [T009]

# T010 must complete before T011 (prop must exist before page passes it):
Task: "Add slotValues prop + locked-slot value render in src/components/game/RankingBoard.tsx" [T010]
Task: "Compute slotValues + pass to RankingBoard in src/app/page.tsx"                     [T011]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T007) — **required before US1**
3. Complete Phase 3: User Story 1 (T008–T011)
4. **STOP and VALIDATE**: Correct guesses show values on locked slots; unlocked slots show nothing
5. Ship or demo — US1 alone delivers the full learning benefit on every correct lock

### Incremental Delivery

1. Setup + Foundational → type system + formatter ready
2. US1 → value on lock → **demo-able MVP**
3. US2 → value persists on full solve → polish for completed stats
4. US3 → value in history rows → reinforcement during review
5. Polish → E2E coverage + coverage gate

### Notes

- [P] tasks = different files, no shared state — safe to parallelize
- Constitution Principle II is non-negotiable: RED before GREEN on every story
- Each story has its own checkpoint where `npm test` must fully pass before moving on
- Zero-value entries must display `"0 <unit>"` — covered by T020 explicitly
- `slotValues` is an optional prop — backwards-compatible; existing tests without it continue to pass
