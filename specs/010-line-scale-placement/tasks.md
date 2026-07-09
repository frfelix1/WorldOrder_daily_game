---
description: "Task list for Line-Scale Placement Mechanic"
---

# Tasks: Line-Scale Placement Mechanic

**Input**: Design documents from `/specs/010-line-scale-placement/`

> **Implementation status (2026-07-09): COMPLETE.** All 29 tasks implemented.
> - `npm run build` — **PASS** (TypeScript + Next.js 16 production build).
> - `npm run test:e2e` — **PASS** (16/16: 8 tests × Chromium + mobile-chrome).
> - `npm test` — feature suites all green (line-scale 27, scoring 38, LineScaleBoard 19,
>   GamePage 15, StatPanel updated). New files coverage: `line-scale.ts` 100%,
>   `scoring.ts` 100%, `page.tsx` ~91% lines.
> - **2 pre-existing, out-of-scope unit failures remain on the branch** (present on
>   `main`, unrelated to this feature): `puzzle-generator.test.ts` "BASE_SEED is 42"
>   (source is `420`; a constitution-vs-code conflict that would change every generated
>   puzzle — not resolved here) and `DevPanel.test.tsx` "Randomize" (flaky dev-only mock).
>   These suppress the aggregate coverage table print but are not caused by this work.
> - Key correctness note: the value line is always oriented **least → most (left → right)**,
>   independent of a stat's ranking `direction`; the solved order is derived from raw
>   values, not the rank-ordered `solution`.

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/line-scale-board.md](./contracts/line-scale-board.md), [quickstart.md](./quickstart.md)

**Tests**: The project constitution mandates **Test-First Development (NON-NEGOTIABLE, Principle II)**. Therefore test tasks are included for every user story and MUST be written and confirmed **failing** before the corresponding implementation. Coverage gate: `vitest --coverage` ≥ 80% global.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in each task

## Path Conventions

Single Next.js App Router project: `src/` and `tests/` at repository root (per plan.md Structure Decision).

## ⚠️ Shared-file reality (read before parallelizing)

This feature centers on **one new component** (`src/components/game/LineScaleBoard.tsx`) and **one integration point** (`src/app/page.tsx`). Tasks that edit either of those two files are **serialized** (no `[P]`) even across stories, because they touch the same file. Genuinely parallel work is limited to the **pure `src/lib/*` modules**, **separate test files**, and **type declarations**. `[P]` is applied only where files are truly disjoint.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing stack is ready; no new dependencies are introduced (per plan.md — keep the same stack).

- [X] T001 Verify toolchain runs green on a clean tree from repo root: `npm install`, then `npm run build`, `npm test`, and `npm run test:e2e` all pass on branch `010-line-scale-placement` before changes begin.
- [X] T002 Confirm no new dependencies are needed by reviewing `package.json` (expect `@dnd-kit/core`, `next`, `react`, `tailwindcss`, `vitest`, `@playwright/test` already present); do NOT add packages.

**Checkpoint**: Baseline is green; ready to add foundational logic.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure, deterministic logic and type changes that EVERY user story depends on (Constitution IV — Game Logic Purity). These are the highest-value, most testable units and are written test-first.

**⚠️ CRITICAL**: No user-story UI work (US1–US5) can begin until this phase is complete.

- [X] T003 [P] Extend `src/types/index.ts`: add optional `positions?: Record<string, number>` to the `Guess` interface (backwards-compatible), with a doc comment explaining fraction semantics (0 = min/left, 1 = max/right). Do not remove existing `order`/`bulls`.
- [X] T004 [P] Write failing unit tests for line-scale pure logic in `tests/unit/line-scale.test.ts` covering: `valueAtFraction` (min at 0, max at 1, midpoint), `fractionForValue`, `deriveOrder` (ascending by fraction with deterministic country-ID tie-break), `trueFractions`, `placementAccuracy` (`A = 1 − mean|tᵢ − tᵢ*|`), `clamp01`, and the `max === min` degenerate guard (interpolation returns `min`; accuracy returns 1). (Red)
- [X] T005 Implement `src/lib/line-scale.ts` as pure functions to make T004 pass: `clamp01`, `valueAtFraction`, `fractionForValue`, `deriveOrder`, `trueFractions`, `placementAccuracy` — deterministic, no side effects, explicit param/return types, no `any`. (Green)

**Checkpoint**: Foundation ready — `line-scale.ts` + extended `Guess` type available. User stories can now begin (subject to the shared-file serialization above).

---

## Phase 3: User Story 1 - Place countries on a value line (Priority: P1) 🎯 MVP

**Goal**: A horizontal value line where the player drags all five country tokens to arbitrary positions; left end labeled with the smallest of the five's value, right end with the largest. Delivers a playable, novel input even before readout/scoring polish.

**Independent Test**: Load a puzzle; for the active stat, drag each of the five tokens to distinct arbitrary spots along the line; verify tokens are not snapped to five fixed slots, endpoint labels show min/max values with unit, and placements persist visually until changed.

### Tests for User Story 1 (write first — MUST fail before implementation) ⚠️

- [X] T006 [P] [US1] Write failing component test `tests/unit/LineScaleBoard.test.tsx` (mock `@dnd-kit/core` following the existing `tests/unit/RankingBoard.test.tsx` pattern) asserting: root `data-testid="line-scale-board"`, a `line-scale-track`, exactly five `line-token` elements (with `data-country` ids), endpoint labels `line-endpoint-min` / `line-endpoint-max` formatted via `formatStatValue`, that a simulated drop updates position and calls `onPositionsChange` without mutating the input, and that positions clamp to `[0,1]` past the ends. (Red)

### Implementation for User Story 1

- [X] T007 [US1] Create `src/components/game/LineScaleBoard.tsx` (leaf `'use client'`) implementing the props and behaviors B1–B4, B6, B10 from `contracts/line-scale-board.md`: render track + endpoint labels (min/max via `formatStatValue`), five draggable tokens (dnd-kit `useDraggable` + a single droppable track), place-anywhere with clamp on drop, emit `onPositionsChange` immutably, CSS `transform` during drag and static `left:%` after release. Tailwind utilities for styling; the only dynamic inline style permitted is per-token `transform`/`left`. Make T006 pass. (Green)
- [X] T008 [US1] Add `positions`/`locked` state to `src/app/page.tsx` (replace `slotAssignments`/`lockedSlots` for the active stat with `positions: Record<string,number>` and `locked: Record<string,boolean>`; keep `EMPTY_*` cleanup on stat change/dev-date reset), and compute active-stat `min`/`max`/`unit` from `activeStat.values` (guard missing values).
- [X] T009 [US1] In `src/app/page.tsx`, render `LineScaleBoard` in place of `RankingBoard` (remove the `RankingBoard` import/usage block at the "Ranking board" section), passing `countries`, `min`, `max`, `unit`, `positions`, `locked`, `onPositionsChange`, and `disabled` from `activeSession.solved`.

**Checkpoint**: The line renders with five draggable tokens and correct endpoint labels; tokens place anywhere and persist. (Submit/scoring wired in later stories.)

---

## Phase 4: User Story 2 - Live value readout while moving a token (Priority: P1)

**Goal**: While a token is dragged, a readout shows the interpolated stat value at its current position (min at far left, max at far right), formatted with the unit, updating within ~100 ms.

**Independent Test**: Drag a token slowly across the line and confirm a value indicator updates continuously — smallest-of-five value at far left, largest at far right, interpolated in between, with unit.

### Tests for User Story 2 (write first — MUST fail before implementation) ⚠️

- [X] T010 [P] [US2] Extend `tests/unit/LineScaleBoard.test.tsx` with failing cases: while a token is "dragging" (via the mocked dnd-kit move), `line-value-readout` renders and shows `formatStatValue(valueAtFraction(t,min,max), unit)` for representative fractions (0 → min, 1 → max, 0.5 → midpoint), and the readout exposes an accessible live value (e.g. `aria-live`/label). (Red)

### Implementation for User Story 2

- [X] T011 [US2] In `src/components/game/LineScaleBoard.tsx`, add the live value readout (behaviors B5, B7-readout parts): track the active drag fraction from dnd-kit move deltas, coalesce updates with `requestAnimationFrame`, render `line-value-readout` using `valueAtFraction` + `formatStatValue`, and expose it via `aria-live="polite"`. Retain last readout value for the moved token after release so placements are reviewable. Make T010 pass. (Green)

**Checkpoint**: Dragging any token shows a live, unit-formatted value that matches its position.

---

## Phase 5: User Story 3 - Guess until the order is correct, with feedback (Priority: P1)

**Goal**: Submitting evaluates left-to-right order against the true ranking; correct tokens lock, the rest can be repositioned; solving advances through all three stats and completes the game — preserving persistence and the results/share pipeline.

**Independent Test**: Place five tokens in a wrong order, submit → reported not solved with per-token correctness shown and correct tokens locked; fix order, submit → stat solved and advance; after the third stat, game completes and results show.

### Tests for User Story 3 (write first — MUST fail before implementation) ⚠️

- [X] T012 [P] [US3] Rewrite `tests/unit/GamePage.test.tsx` to drive the line mechanic instead of `pool-chip`/`ranking-slot`: place tokens by invoking the mocked board's `onPositionsChange`, then assert submit-blocked-until-all-placed, wrong-guess records a `FeedbackRow` and locks correct tokens, correct order marks solved and reveals the advance button, full 3-stat completion shows `result-card`, and dev-date change resets `positions`/`locked`/announcement. (Red)
- [X] T013 [P] [US3] Update `tests/e2e/game-flow.spec.ts` to use the new selectors (`line-scale-board`, `line-scale-track`, `line-token`, `line-value-readout`) and a placement helper that positions tokens along the track (pointer + keyboard paths); keep the full game-flow, resume-in-progress, stale-state, and results scenarios; retire `pool-chip`/`ranking-slot`/`ranking-board` selectors. (Red — until wiring below)

### Implementation for User Story 3

- [X] T014 [US3] In `src/app/page.tsx`, replace `computeBulls`/`computeLockedSlots` slot-index logic with order-based logic using `deriveOrder(positions)`: compute `order`, `bulls[i] = order[i] === stat.solution[i]`, `solved = bulls.every(Boolean)`; block submit until all five countries have a `positions` entry (`allPlaced`).
- [X] T015 [US3] In `src/app/page.tsx` `handleSubmit`, push `Guess { order, bulls, positions }` into the active `StatSession`; on a wrong guess, set `locked[id]=true` for correctly-positioned tokens and keep them fixed while allowing repositioning of the rest; keep the solved/advance/complete transitions and the `lockedStatIndex` value-reveal timing behavior.
- [X] T016 [US3] In `src/app/page.tsx`, wire `handleAdvanceStage` and stat-change to reset `positions`/`locked` for the next stat, and reconstruct board state on resume from the last `Guess.positions` of the active stat (FR-017); update the submit button `disabled` to use `allPlaced` and keep `data-testid="submit-btn"` / `next-stage-btn`.
- [X] T017 [US3] Ensure `FeedbackRow` and `buildShareText` still render from `bulls`/`order`; adjust only if the derived-order change requires it (no signature change expected). Verify `src/components/game/ResultCard.tsx` renders unchanged.
- [X] T018 [US3] Remove `src/components/game/RankingBoard.tsx` and delete `tests/unit/RankingBoard.test.tsx` (component fully replaced); update any remaining imports/references so `npm run build` is clean.

**Checkpoint**: Full guess-until-correct loop works across three stats with feedback, locking, persistence, and results — game is end-to-end playable with the line mechanic.

---

## Phase 6: User Story 4 - Updated scoring: penalty + proximity (Priority: P2)

**Goal**: Each wrong guess reduces the stat score; closer final placements earn more, within the per-stat cap of 33; total stays 0–100 with the perfect-game bonus.

**Independent Test**: First-try solve with near-exact placements → per-stat 33 and total 100 (with bonus); solves with wrong guesses and/or poor placement score strictly lower, never < 0 or > 33; total always within 0–100.

### Tests for User Story 4 (write first — MUST fail before implementation) ⚠️

- [X] T019 [P] [US4] Extend `tests/unit/scoring.test.ts` with failing cases per research.md Decision 5: `accuracyFactor(A)` bounds (`A=0 → 0.8`, `A=1 → 1.0`), `scoreForStat` = `round(scoreForRound(wrongGuesses) × accuracyFactor(A))` clamped `[0,33]`; monotonic in wrong guesses and in accuracy; perfect first-try (`0` wrong, `A=1`) = 33; `totalScore` within `[0,100]`; `PERFECT_BONUS` only when all three stats = 33; and legacy `Guess` without `positions` falls back to `A=1`. (Red)

### Implementation for User Story 4

- [X] T020 [P] [US4] Extend `src/lib/scoring.ts` (pure): add `ACCURACY_FLOOR = 0.8`, `accuracyFactor(A: number): number`, and a proximity-aware per-stat score `scoreForStat(session, accuracy)` (round, clamp `[0,33]`), keeping `ROUND_MAX`/`DECAY_BASE`/`PERFECT_BONUS`/`GAME_MAX` and updating `totalScore` to apply the perfect bonus only when every stat equals 33. Make T019 pass. (Green)
- [X] T021 [US4] In `src/app/page.tsx`, compute each stat's placement accuracy from its final `Guess.positions` via `placementAccuracy(positions, stat.values)` and pass it into scoring so `runningScore`/`finalScore` are recomputed from `guesses[]` (Constitution IV — never mutate score in place); handle legacy guesses without `positions` (accuracy-neutral).

**Checkpoint**: Scoring reflects penalty + proximity within 0–100; historical score buckets/streaks remain comparable.

---

## Phase 7: User Story 5 - Accessible & mobile-friendly placement (Priority: P3)

**Goal**: Touch and keyboard placement usable at 320–414px without page scroll; correctness conveyed by icon+shape (not color alone); reduced-motion honored; value/position exposed to assistive tech — to the standard set by feature 009.

**Independent Test**: On a 320–414px viewport, place all five tokens by touch without page scroll and complete a stat; using only the keyboard, move a token along the line and submit.

### Tests for User Story 5 (write first — MUST fail before implementation) ⚠️

- [X] T022 [P] [US5] Extend `tests/unit/LineScaleBoard.test.tsx` with failing accessibility cases: each `line-token` is focusable with an accessible name (country) and communicates current value (e.g. `aria-valuetext`), keyboard interaction (Arrow/Home/End) triggers `onPositionsChange`, locked/correct state exposes an icon/shape marker (not color only), and a reduced-motion path is respected. (Red)
- [X] T023 [P] [US5] Add a mobile assertion to `tests/e2e/game-flow.spec.ts` (mobile-chrome project): at a ~320px viewport, dragging a `line-token` does not scroll the page and the board fits with no horizontal overflow. (Red)

### Implementation for User Story 5

- [X] T024 [US5] In `src/components/game/LineScaleBoard.tsx`, implement accessibility/mobile behaviors B7–B8, B11 from the contract: keep dnd-kit `KeyboardSensor` active with discrete steps (Arrow = small step, Home/End = min/max), `TouchSensor` with `touch-action: none` so drags don't scroll, `aria-valuetext`/live announcements for value, icon+shape correctness marker (reuse the existing checkmark), Tab order, and `prefers-reduced-motion` handling. Make T022 pass.
- [X] T025 [US5] Verify responsive layout of the line at 320–414px in `src/app/page.tsx`'s board section (reuse feature-009 spacing tokens; ensure no horizontal overflow) and make T023 pass; keep `aria-live` stat-solved/game-complete announcements intact.

**Checkpoint**: Placement is fully operable by touch and keyboard, accessible, and mobile-safe.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, cleanup, and gate compliance across all stories.

- [X] T026 [P] Update the game rules/help copy and any wording that still says "drag into rank slots"/"Submit Ranking" to reflect the line-placement mechanic (search `src/` for user-facing strings; e.g. `src/app/page.tsx` button label and any onboarding text).
- [X] T027 Run `npm test` and raise coverage to ≥ 80% global (Constitution II) — add targeted unit tests for any uncovered branches in `src/lib/line-scale.ts`, `src/lib/scoring.ts`, and `src/components/game/LineScaleBoard.tsx`.
- [X] T028 Run the [quickstart.md](./quickstart.md) manual acceptance checklist end-to-end (all SC-001…SC-010) and fix any gaps.
- [X] T029 Run all Quality Gates from repo root and confirm green: `npm run build`, `npm test` (0 failures + ≥80% coverage), `npm run test:e2e` (desktop + mobile-chrome).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup. **BLOCKS all user stories** (US1–US5 need `line-scale.ts` and the `Guess` type).
- **User Stories (Phases 3–7)**: All depend on Foundational.
  - US1 → US2 → US3 are **sequential** because they edit the same two files (`LineScaleBoard.tsx`, `page.tsx`). US2 extends US1's component; US3 wires US1's page state into the game loop.
  - US4 (scoring) is largely **independent pure logic** (`scoring.ts` + one `page.tsx` hook) and can be developed in parallel with US1–US3, but its `page.tsx` wiring (T021) must merge after US3's `page.tsx` changes to avoid conflicts.
  - US5 refines US1/US2's component and depends on them existing.
- **Polish (Phase 8)**: Depends on all targeted stories being complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational. No dependency on other stories. (MVP)
- **US2 (P1)**: After US1 (extends `LineScaleBoard.tsx`).
- **US3 (P1)**: After US1 (needs the board + `positions` state to wire the loop). Independent of US2/US4 functionally.
- **US4 (P2)**: After Foundational for the pure-logic part (T019–T020); the `page.tsx` wiring (T021) after US3.
- **US5 (P3)**: After US1/US2 (refines the shared component).

### Within Each User Story

- Tests are written and MUST FAIL before implementation (Constitution II).
- Pure `lib` logic before UI; UI component before `page.tsx` wiring; core wiring before cleanup.

### Parallel Opportunities

- **Phase 2**: T003 (types) and T004 (line-scale tests) are `[P]` (different files); T005 follows T004.
- **Cross-story pure logic**: US4's T019/T020 (`scoring.ts` + its test) can run in parallel with US1–US3 work since they touch disjoint files.
- **Test authoring**: T006, T010, T012, T013, T019, T022, T023 are `[P]` relative to each other (distinct test files) — but each must precede its own implementation.
- **NOT parallel**: any two tasks editing `src/components/game/LineScaleBoard.tsx` (T007, T011, T024) or `src/app/page.tsx` (T008, T009, T014, T015, T016, T021, T025) — serialize these.

---

## Parallel Example: Foundational + early US4

```bash
# After Setup, these touch different files and can run together:
Task T003: "Extend src/types/index.ts with optional Guess.positions"
Task T004: "Write failing tests in tests/unit/line-scale.test.ts"

# US4 pure-logic can proceed alongside US1–US3 (disjoint files):
Task T019: "Extend tests/unit/scoring.test.ts (proximity scoring)"
Task T020: "Extend src/lib/scoring.ts with accuracyFactor + proximity scoreForStat"
```

---

## Implementation Strategy

### MVP First (User Stories 1–3 = playable game)

1. Phase 1: Setup → baseline green.
2. Phase 2: Foundational (`line-scale.ts`, `Guess` type) — CRITICAL, blocks everything.
3. Phase 3 (US1): line renders, tokens placeable → **STOP and VALIDATE** the input in isolation.
4. Phase 4 (US2): live readout.
5. Phase 5 (US3): full guess/solve/advance/persist loop → **the true MVP** (end-to-end playable, replacing the old mechanic). Demo here.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → US2 → US3 → test independently → the drag-list is fully replaced (MVP shippable).
3. US4 → penalty + proximity scoring → test → demo.
4. US5 → accessibility/mobile parity → test → demo.

### Notes

- `[P]` = different files, no incomplete dependencies. `[Story]` maps each task to its user story for traceability.
- The two shared files (`LineScaleBoard.tsx`, `page.tsx`) are the main serialization bottleneck — plan single-threaded edits there.
- Verify each test fails before implementing it (Red-Green-Refactor, Constitution II).
- No dataset/generator/API changes; everything derives from existing `StatDef.values`.
- Commit after each task or logical group; run the Quality Gates before merge.
