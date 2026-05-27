---
description: "Task list for Dev Testing & UX Improvements"
---

# Tasks: Dev Testing & UX Improvements

**Input**: Design documents from `specs/004-dev-ux-improvements/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/component-interfaces.md ✓

**Test Strategy**: Constitution mandates **Test-First Development (NON-NEGOTIABLE)**. For every user story, failing tests MUST be written and confirmed failing before any implementation code is written.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Baseline Verification)

**Purpose**: Confirm the development environment is in a known state before making changes.

- [ ] T001 Run existing Vitest test suite (`npm run test`) and record current pass/fail baseline
- [ ] T002 [P] Run TypeScript type check (`npm run typecheck`) to confirm the pre-existing strict-mode error (`setWrongGuessEffect` undeclared) exists in `src/app/page.tsx`

**Checkpoint**: Baseline recorded — known failures documented before any changes are made.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No shared infrastructure changes are required for this feature. All three user stories touch independent files and can proceed directly after Phase 1.

**⚠️ NOTE**: No blocking foundational tasks. User story phases (3–5) may proceed immediately after Phase 1 and can be worked in parallel by separate developers.

**Checkpoint**: Foundation confirmed — user story implementation may begin.

---

## Phase 3: User Story 1 — Randomized Dev Test Mode (Priority: P1) 🎯 MVP

**Goal**: Replace the broken `DevPanel` date-picker with a single "⚡ Randomize" button that picks a random available puzzle and loads a fresh game session. Fix the `setWrongGuessEffect` runtime crash in `page.tsx`.

**Independent Test**: Open the game in development mode (`NODE_ENV=development`), click "Randomize" in the dev toolbar, and verify a new puzzle loads from a fresh state. No date-picker or hardcoded test dates visible.

### Tests for User Story 1 (Test-First — MUST FAIL before implementation)

> **Write these tests FIRST and confirm they FAIL before touching source files**

- [ ] T003 [P] [US1] Write failing unit tests for `DevPanel` randomize behavior in `tests/unit/DevPanel.test.tsx` — cover: "renders a Randomize button with data-testid=dev-randomize", "clicking Randomize calls onDateChange with a string from the available dates list", "panel body renders no date list items (no `<li>` or date buttons)", "Randomize button is disabled and shows No puzzles available when dates list is empty", "Reset to today button (data-testid=dev-reset) appears when currentDate !== todayDate"
- [ ] T004 [P] [US1] Write failing unit tests for `handleDevDateChange` state reset in `tests/unit/GamePage.test.tsx` — cover: "switching dev date via handleDevDateChange resets puzzle, gameState, slotAssignments, lockedSlots, announcement, and roundCompleteEffect to initial values", "dev toolbar is not rendered when NODE_ENV is not development"
- [ ] T005 [US1] Confirm T003 and T004 tests fail by running `npm run test -- tests/unit/DevPanel.test.tsx tests/unit/GamePage.test.tsx`

### Implementation for User Story 1

- [ ] T006 [US1] Fix `setWrongGuessEffect` bug in `src/app/page.tsx` — in `handleDevDateChange`, remove the `setWrongGuessEffect(false)` call (approx line 163) and replace with `setRoundCompleteEffect(false)` per contracts/component-interfaces.md section 4
- [ ] T007 [P] [US1] Rewrite `src/components/dev/DevPanel.tsx` — remove the scrollable date-list entirely; render a single "⚡ Randomize" button (`data-testid="dev-randomize"`) that calls `handleRandomize()`; implement `handleRandomize()` using `dates[Math.floor(Math.random() * dates.length)]` per contracts/component-interfaces.md section 2; add a "Reset to today" button (`data-testid="dev-reset"`) shown only when `currentDate !== todayDate`; keep `data-testid="dev-toggle"` and `data-testid="dev-panel"` on existing elements unchanged; disable and relabel Randomize button to "No puzzles available" when `dates.length === 0`
- [ ] T008 [US1] Run US1 tests to confirm all pass: `npm run test -- tests/unit/DevPanel.test.tsx tests/unit/GamePage.test.tsx`

**Checkpoint**: User Story 1 fully functional and independently testable. Dev workflow unblocked.

---

## Phase 4: User Story 2 — Guess History Visibility (Priority: P2)

**Goal**: Extend `FeedbackRow` to display a compact mini-chip per position (flag + country name + ✓/✗ icon + correctness-colored border) so players can review their previous submissions while a round is still active.

**Independent Test**: Submit an incorrect guess; the feedback area above `RankingBoard` immediately shows 5 position cells, each with the country name and flag of the submitted country, a green or red border, and a ✓ or ✗ icon. Submit a second incorrect guess; both guesses remain visible in chronological order. Reload the page; the history is still present.

### Tests for User Story 2 (Test-First — MUST FAIL before implementation)

> **Write these tests FIRST and confirm they FAIL before touching source files**

- [ ] T009 [P] [US2] Write failing unit tests for `FeedbackRow` country display in `tests/unit/FeedbackRow.test.tsx` — cover: "renders 5 feedback cells (data-testid=feedback-cell) for a 5-position guess", "each cell aria-label contains the position number, country name, and correct/incorrect", "correct position cells have success border/bg styling", "incorrect position cells have wrong border/bg styling", "correct cells render ✓ icon and incorrect cells render ✗ icon (both aria-hidden)", "each cell renders a flag span with class fi fi-{flagCode}", "renders a ? placeholder cell when country id is not found in countries prop"; update/remove any existing tests asserting on the `🟩`/`🟥` emoji characters
- [ ] T010 [P] [US2] Write failing integration tests in `tests/unit/GamePage.test.tsx` — cover: "FeedbackRow components appear above RankingBoard after an incorrect guess is submitted", "all previously submitted guesses are shown stacked in chronological order after a second incorrect guess", "guess history for the active stat is restored and displayed correctly after a page reload from saved localStorage state", "FeedbackRow receives the puzzle's countries array as a prop"
- [ ] T011 [US2] Confirm T009 and T010 tests fail by running `npm run test -- tests/unit/FeedbackRow.test.tsx tests/unit/GamePage.test.tsx`

### Implementation for User Story 2

- [ ] T012 [US2] Update `FeedbackRowProps` interface in `src/components/game/FeedbackRow.tsx` — add required `countries: Country[]` prop per contracts/component-interfaces.md section 1; import `Country` from `src/types/index.ts` if not already imported
- [ ] T013 [US2] Implement country mini-chip rendering in `src/components/game/FeedbackRow.tsx` — replace emoji output with a 5-cell `role="list"` flex row; each cell (`role="listitem"`, `data-testid="feedback-cell"`) contains: flag `<span className={\`fi fi-\${country.flagCode}\`} aria-hidden="true" style={{ fontSize: '16px' }} />`, country name `<span>` at `font-size: 11px`, a ✓ or ✗ icon (`aria-hidden="true"`), success styling (`rgba(0,232,150,0.35)` border / `rgba(0,232,150,0.07)` bg) when `bulls[i] === true` and wrong styling (`rgba(255,48,98,0.3)` border / `rgba(255,48,98,0.08)` bg) when `bulls[i] === false`; `aria-label` format: `"Position {i+1}: {country?.name ?? 'Unknown'} — correct/incorrect"`; render `?` placeholder text when country lookup returns null per data-model.md defensive fallback rule
- [ ] T014 [US2] Thread `countries={puzzle.countries}` into all `<FeedbackRow>` render calls in `src/app/page.tsx` (approx line 558); TypeScript strict mode will flag the missing required prop as a compile error — verify it disappears after this change
- [ ] T015 [US2] Run US2 tests to confirm all pass: `npm run test -- tests/unit/FeedbackRow.test.tsx tests/unit/GamePage.test.tsx`

**Checkpoint**: User Story 2 fully functional and independently testable. Players can see past guess history while a round is in progress.

---

## Phase 5: User Story 3 — Enlarged Country Selection Area (Priority: P3)

**Goal**: Increase `PoolChipItem` interactive target height to ≥ 48 px by updating padding, flag font-size, and name font-size; update the `DragOverlay` chip to match proportionally.

**Independent Test**: Load any puzzle. The "Available" country pool chips are visibly larger — country names are clearly readable, flags are noticeably bigger, and each chip's bounding box height is ≥ 44 px (Playwright). Drag-and-drop and click-to-place both work as before. All 5 chips fit within a 1280 px viewport without horizontal overflow.

### Tests for User Story 3 (Test-First — MUST FAIL before implementation)

> **Write these tests FIRST and confirm they FAIL before touching source files**

- [ ] T016 [P] [US3] Write failing unit tests for `PoolChipItem` rendered content in `tests/unit/RankingBoard.test.tsx` — cover: "each pool chip renders a flag span with class containing fi fi-{flagCode}", "each pool chip renders the country name as text", "pool chip container element exists for each country in the available pool" (note: unit tests cannot assert CSS pixel values — chip height is validated by E2E)
- [ ] T017 [P] [US3] Write failing E2E tests in `tests/e2e/game-flow.spec.ts` — cover: "each pool chip bounding box height is >= 44px", "all 5 pool chips are visible within the viewport at 1280px width without horizontal scrollbar" (use Playwright `locator.boundingBox()` and `page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)`)
- [ ] T018 [US3] Confirm T016 and T017 tests fail by running `npm run test -- tests/unit/RankingBoard.test.tsx` and `npx playwright test tests/e2e/game-flow.spec.ts`

### Implementation for User Story 3

- [ ] T019 [US3] Update `PoolChipItem` inline styles in `src/components/game/RankingBoard.tsx` — change padding from `8px 14px` to `12px 20px`, flag span `fontSize` from `14px` to `22px`, name span `fontSize` from `13px` to `15px`, gap between flag and name from `8px` to `10px`; keep `borderRadius: 24px` unchanged per data-model.md sizing table
- [ ] T020 [US3] Update `DragOverlay` chip styling in `src/components/game/RankingBoard.tsx` to match the new `PoolChipItem` proportions — apply the same `fontSize: 22px` for the flag span, `fontSize: 15px` for the name span, and `padding: 12px 20px` so the dragged chip visually matches the pool chip
- [ ] T021 [US3] Run US3 unit tests to confirm passing (`npm run test -- tests/unit/RankingBoard.test.tsx`), then run E2E to validate chip height and no overflow (`npx playwright test tests/e2e/game-flow.spec.ts`)

**Checkpoint**: All three user stories independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Full-suite validation, coverage gate, and cleanup.

- [ ] T022 [P] Run full Vitest test suite (`npm run test`) and confirm global coverage ≥ 80% across `src/**` (coverage threshold defined in constitution)
- [ ] T023 [P] Run TypeScript type check (`npm run typecheck`) and confirm zero strict-mode errors remain
- [ ] T024 [P] Search for any remaining `setWrongGuessEffect` references in `src/` and confirm none exist; verify no hardcoded test date strings remain in dev-mode UI code

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: N/A — no shared infrastructure required; all user stories independent
- **User Stories (Phase 3–5)**: All can start after Phase 1 baseline is recorded
  - US1, US2, US3 modify different files — can proceed in parallel if staffed
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Requires all desired user stories to be complete

### User Story Dependencies

- **User Story 1 (P1)**: Modifies `src/components/dev/DevPanel.tsx` and `src/app/page.tsx` (`handleDevDateChange`). Independent of US2 and US3.
- **User Story 2 (P2)**: Modifies `src/components/game/FeedbackRow.tsx` and `src/app/page.tsx` (prop thread-through only — different function/section from US1). Can proceed in parallel with US1 if care is taken on `page.tsx` edits.
- **User Story 3 (P3)**: Modifies only `src/components/game/RankingBoard.tsx`. Fully independent of US1 and US2.

### Within Each User Story

1. Write tests → confirm they FAIL → implement → confirm tests PASS
2. Models/interfaces before rendering implementation
3. Rendering implementation before call-site thread-through

### Parallel Opportunities

- T003 and T004 (US1 test writing) can run in parallel — different files
- T006 and T007 (US1 implementation) can run in parallel — different files
- T009 and T010 (US2 test writing) can run in parallel — different files
- T016 and T017 (US3 test writing) can run in parallel — different files
- T022, T023, T024 (polish) can all run in parallel
- If multiple developers: US1, US2, US3 can all proceed in parallel after T001

---

## Parallel Execution Examples

### User Story 1 (Parallel test authoring)

```bash
# Run together — different files, no cross-dependencies:
Task: "Write DevPanel randomize tests" → tests/unit/DevPanel.test.tsx
Task: "Write GamePage dev date reset tests" → tests/unit/GamePage.test.tsx
```

### User Story 2 (Parallel test authoring)

```bash
# Run together — different files, no cross-dependencies:
Task: "Write FeedbackRow country display tests" → tests/unit/FeedbackRow.test.tsx
Task: "Write GamePage history integration tests" → tests/unit/GamePage.test.tsx
```

### User Story 3 (Parallel test authoring)

```bash
# Run together — different test runners, no cross-dependencies:
Task: "Write RankingBoard unit tests for chip content" → tests/unit/RankingBoard.test.tsx
Task: "Write E2E chip height/overflow tests" → tests/e2e/game-flow.spec.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Baseline verification
2. Complete Phase 3: User Story 1 (dev workflow unblocked)
3. **STOP and VALIDATE**: Confirm randomize works end-to-end in `NODE_ENV=development`
4. Deploy/demo if ready — dev iteration is now unblocked

### Incremental Delivery

1. Phase 1 → baseline recorded
2. Phase 3 (US1) → dev workflow fixed → validate independently
3. Phase 4 (US2) → guess history visible during play → validate independently
4. Phase 5 (US3) → enlarged chips → validate independently
5. Phase 6 → full-suite polish
6. Each story adds value without breaking previous stories

### Parallel Team Strategy (if two developers)

1. Both complete Phase 1 together
2. Developer A: Phase 3 (US1) — DevPanel + page.tsx bug fix
3. Developer B: Phase 5 (US3) — RankingBoard enlargement (completely independent)
4. Developer A (after US1): Phase 4 (US2) — FeedbackRow + page.tsx prop thread
5. Both: Phase 6 polish

---

## Notes

- **[P]** tasks touch different files and have no outstanding dependencies — safe to parallelize
- **[Story]** label maps each task to its user story for traceability
- Constitution mandates test-first: write tests, confirm failure, then implement — do not skip the failure confirmation step (T005, T011, T018)
- `page.tsx` is touched by both US1 (T006) and US2 (T014) — coordinate edits to avoid conflicts; these are different functions/sections of the file
- E2E tests (T017, T021) require a running dev server; Playwright will handle this if configured with `webServer` in `playwright.config.ts`
- Commit after each phase checkpoint to create clean rollback points
