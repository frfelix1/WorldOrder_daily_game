# Tasks: Refine Results Actions

**Input**: Design documents from `/specs/015-refine-results-actions/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

**Tests**: Required by the project constitution's Test-First Development principle. Write each test first, confirm it fails, then implement the behavior.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing project and feature artifacts are ready. No new dependencies or project structure are needed.

- [X] T001 Verify the existing Next.js/Vitest project scripts and feature documents before editing `src/components/game/ResultCard.tsx` and `tests/unit/ResultCard.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the current results behavior baseline before changing the shared action area.

- [X] T002 Run the existing ResultCard unit suite with `npx vitest run tests/unit/ResultCard.test.tsx` and record the baseline in the implementation notes

**Checkpoint**: Existing Share Result behavior is green and the story tests can be added without masking a pre-existing failure.

---

## Phase 3: User Story 1 - Use the split results actions (Priority: P1) 🎯 MVP

**Goal**: Present independently targetable Share Result and Daily Stats actions while preserving both existing behaviors.

**Independent Test**: Render the results card, verify both named buttons are present, activate Share Result and verify clipboard behavior, then activate Daily Stats through the page flow and verify the stats view opens.

### Tests for User Story 1

> Write these tests FIRST and confirm they FAIL before implementation.

- [X] T003 [US1] Add ResultCard tests in `tests/unit/ResultCard.test.tsx` for exactly two results action buttons with accessible names Share Result and Daily Stats
- [X] T004 [US1] Add ResultCard test in `tests/unit/ResultCard.test.tsx` proving Share Result still calls `navigator.clipboard.writeText` with the existing share text
- [X] T005 [US1] Add GamePage regression test in `tests/unit/GamePage.test.tsx` proving activating Daily Stats from completed results opens the Daily Stats heading/view

### Implementation for User Story 1

- [X] T006 [US1] Update `src/components/game/ResultCard.tsx` to accept the existing Daily Stats activation callback without changing share state or clipboard handling
- [X] T007 [US1] Update `src/app/page.tsx` to pass the existing `setShowStats(true)` behavior into the completed results action group
- [X] T008 [US1] Replace the single Share Result markup in `src/components/game/ResultCard.tsx` with two native buttons in one horizontal grouped action area, keeping Share Result on the left and Daily Stats on the right

**Checkpoint**: User Story 1 is independently functional: both actions are visible and each activates its existing destination/behavior.

---

## Phase 4: User Story 2 - Recognize the actions as one visual group (Priority: P1)

**Goal**: Make both actions share the existing button treatment while extending the dark-to-bright gradient across the complete action group.

**Independent Test**: Inspect the completed results action group and verify equal-width buttons, a small gap, matching typography/colors, and a darker left-to-brighter right gradient.

### Tests for User Story 2

> Write these tests FIRST and confirm they FAIL before implementation.

- [X] T009 [US2] Add DOM/style assertions in `tests/unit/ResultCard.test.tsx` for the grouped action container, approximately equal button widths, and a small inter-button gap
- [X] T010 [US2] Add DOM/style assertions in `tests/unit/ResultCard.test.tsx` that distinguish the darker left Share Result gradient from the brighter right Daily Stats gradient while preserving the existing gold color family

### Implementation for User Story 2

- [X] T011 [US2] Style the action group in `src/components/game/ResultCard.tsx` with equal flexible widths, a small fixed gap, shared typography, existing touch minimum, and no new visual tokens
- [X] T012 [US2] Apply the existing gold gradient continuously from darker Share Result on the left to brighter Daily Stats on the right in `src/components/game/ResultCard.tsx`, including consistent border, shadow, hover, focus, and pressed states

**Checkpoint**: User Story 2 is independently verifiable through the rendered styles and visual inspection without changing game or stats data.

---

## Phase 5: User Story 3 - Use the actions on narrow screens (Priority: P2)

**Goal**: Keep both action targets side-by-side, readable, and usable at every currently supported width.

**Independent Test**: Render or manually inspect the results action group at the narrowest supported width and verify both labels, targets, gap, and gradient remain visible without overlap or clipping.

### Tests for User Story 3

> Write these tests FIRST and confirm they FAIL before implementation.

- [X] T013 [US3] Add responsive class/style assertions in `tests/unit/ResultCard.test.tsx` proving the action group does not use a stacking layout and both buttons retain the touch minimum

### Implementation for User Story 3

- [X] T014 [US3] Adjust responsive utility classes in `src/components/game/ResultCard.tsx` so the two actions remain side-by-side and readable at supported narrow widths without overflow
- [X] T015 [US3] Verify keyboard focus order and accessible names for both native buttons in `src/components/game/ResultCard.tsx`, preserving the left-to-right Share Result then Daily Stats order

**Checkpoint**: All three user stories work together, and the action group remains usable across supported widths.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Run the required regression, quality, and manual checks across the completed feature.

- [X] T016 [P] Run `npx vitest run tests/unit/ResultCard.test.tsx tests/unit/GamePage.test.tsx` and resolve any regressions in `src/components/game/ResultCard.tsx` or `src/app/page.tsx`
- [ ] T017 [P] Run `npm test` and confirm global coverage remains at least 80% across `src/`
- [X] T018 Run `npm run build` and resolve any TypeScript or Next.js build failures in changed files
- [ ] T019 Run the manual scenarios in `specs/015-refine-results-actions/quickstart.md`, including the narrowest supported width

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; confirms the existing project and documents.
- **Foundational (Phase 2)**: Depends on Setup; establishes the green baseline and blocks story work.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers the MVP behavior and is the base for visual refinement.
- **User Story 2 (Phase 4)**: Depends on User Story 1 because it styles the new two-button markup.
- **User Story 3 (Phase 5)**: Depends on User Story 2 because it validates the final grouped layout responsively.
- **Polish (Phase 6)**: Depends on all desired user stories.

### User Story Dependencies

- **User Story 1 (P1)**: No story dependencies after Phase 2.
- **User Story 2 (P1)**: Depends on US1's two-button markup.
- **User Story 3 (P2)**: Depends on US2's final action-group styles.

### Within Each User Story

- Write and run tests before implementation tasks.
- Complete behavior before visual styling.
- Keep existing share and stats state flows unchanged except for the callback wiring required by the new grouped action.
- Stop at each checkpoint and verify the story independently.

## Parallel Opportunities

- T003 and T004 can be written in parallel in the same test file only if changes are coordinated; T005 can be written independently in `tests/unit/GamePage.test.tsx`.
- T009 and T010 can be written in parallel after US1 markup exists, though both touch `tests/unit/ResultCard.test.tsx`.
- T016 and T017 can run in parallel after implementation; T018 follows source/test completion.

## Parallel Example: User Story 1

```text
Task A: T003 and T004 in tests/unit/ResultCard.test.tsx
Task B: T005 in tests/unit/GamePage.test.tsx
```

After all three tests fail for the expected reasons, execute T006 through T008 sequentially because they share the ResultCard/page action contract.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 and T002.
2. Write T003 through T005 and confirm they fail.
3. Complete T006 through T008.
4. Validate User Story 1 at its checkpoint.

### Incremental Delivery

1. Deliver US1 with both working actions.
2. Add US2 visual grouping and gradient refinement.
3. Add US3 supported-width and keyboard verification.
4. Run Phase 6 regression and manual checks.

### Notes

- No new entity, API contract, dependency, persistence path, or service is required.
- The parent page already owns `showStats`; `ResultCard` only needs the smallest callback surface necessary to invoke it.
- Every task includes an exact repository-relative file path and follows the required checklist format.
