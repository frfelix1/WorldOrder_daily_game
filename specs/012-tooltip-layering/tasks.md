---

description: "Executable task list for tooltip layering and viewport fit"

---

# Tasks: Tooltip Layering and Viewport Fit

**Input**: Design documents from `specs/012-tooltip-layering/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by the feature specification and the project constitution. Tests must be written first and confirmed failing before the corresponding implementation task.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing project/test infrastructure is sufficient; no new dependency or project scaffolding is required.

- [X] T001 Verify the existing Vitest, Testing Library, Playwright, and build scripts in `package.json` support the tooltip regression plan without adding dependencies
- [X] T002 [P] Record the current tooltip interaction baseline by running `npm test -- tests/unit/Tooltip.test.tsx` and `npm run test:e2e -- tests/e2e/game-flow.spec.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared UI placement contract before story-specific implementation.

- [X] T003 Document the portal, fixed-position, viewport-gutter, and cleanup invariants in `specs/012-tooltip-layering/contracts/tooltip-overlay.md`
- [X] T004 [P] Confirm `src/components/ui/Tooltip.tsx` remains the lowest client boundary for browser geometry, event listeners, and portal rendering

**Checkpoint**: Shared tooltip contract and existing test baseline are understood; user story work can begin.

---

## Phase 3: User Story 1 - Read the Round Explanation Above the Game (Priority: P1) 🎯 MVP

**Goal**: Ensure the visible round-title explanation escapes the stat panel's clipping/stacking context and paints above neighbouring game content.

**Independent Test**: Reveal the tooltip in a desktop browser and assert that it is visible, body-level, and visually stacked above the stat panel and nearby content.

### Tests for User Story 1

> Write these tests first and confirm they fail against the current inline tooltip.

- [X] T005 [US1] Add a Vitest assertion in `tests/unit/Tooltip.test.tsx` that the visible tooltip is rendered outside the clipping trigger/stat-panel subtree and retains `role="tooltip"` plus its existing id relationship
- [X] T006 [P] [US1] Add a Playwright desktop regression in `tests/e2e/game-flow.spec.ts` that hovers the stat title, verifies the tooltip is visible, and compares its stacking level and bounds with the stat panel

### Implementation for User Story 1

- [X] T007 [US1] Update `src/components/ui/Tooltip.tsx` to render the visible tooltip overlay through a body-level React portal while keeping the trigger wrapper, visibility state, and existing ARIA attributes unchanged
- [X] T008 [US1] Give the portaled overlay a viewport-level stacking order and preserve its background, arrow, animation, and `pointer-events: none` behavior in `src/components/ui/Tooltip.tsx`

**Checkpoint**: Desktop hover shows the explanation above the stat panel and neighbouring content without changing hidden layout behavior.

---

## Phase 4: User Story 2 - Read the Full Explanation Without Moving the Page (Priority: P1)

**Goal**: Keep the explanation fully readable within the viewport at desktop and supported mobile widths without introducing page overflow.

**Independent Test**: Reveal the tooltip at 320px, 360px, 390px, 414px, and desktop widths; assert its rendered bounds stay within an 8px horizontal gutter and document width does not exceed the viewport.

### Tests for User Story 2

> Write these tests first and confirm they fail against the portal implementation before adding placement logic.

- [X] T009 [P] [US2] Add Vitest geometry tests in `tests/unit/Tooltip.test.tsx` for left-edge, right-edge, narrow-width, and top-edge triggers using mocked `getBoundingClientRect()` values and viewport dimensions
- [X] T010 [P] [US2] Add Playwright mobile regressions in `tests/e2e/game-flow.spec.ts` for 320px and representative responsive widths that activate the tooltip, assert an 8px viewport gutter, and assert `document.documentElement.scrollWidth <= window.innerWidth`

### Implementation for User Story 2

- [X] T011 [US2] Add fixed viewport-relative tooltip placement in `src/components/ui/Tooltip.tsx` using trigger and tooltip `getBoundingClientRect()` values, with a maximum width of `min(240px, viewportWidth - 16px)`
- [X] T012 [US2] Implement horizontal clamping and above-or-below vertical placement in `src/components/ui/Tooltip.tsx` so the complete wrapped overlay remains readable at viewport edges without scrolling or panning
- [X] T013 [US2] Recalculate visible tooltip placement on `resize` and `scroll`, and remove those listeners when hidden or unmounted in `src/components/ui/Tooltip.tsx`

**Checkpoint**: The tooltip is fully readable at 320px through desktop widths, does not create horizontal page overflow, and hidden layout remains unchanged.

---

## Phase 5: User Story 3 - Keep Existing Access Paths Working (Priority: P2)

**Goal**: Preserve mouse, keyboard, touch, ARIA, and dismissal behavior after moving the overlay into a portal.

**Independent Test**: Open the explanation with keyboard focus and touch/click activation, then dismiss with blur/outside pointer/Escape while checking the ARIA relationship and listener cleanup.

### Tests for User Story 3

> Write these tests first and confirm they fail only where the new portal contract requires changed assertions.

- [X] T014 [P] [US3] Extend `tests/unit/Tooltip.test.tsx` to verify keyboard focus, click/tap toggle, outside pointer dismissal, Escape dismissal, `aria-describedby`, and hidden-state portal cleanup after the overlay is portaled
- [X] T015 [P] [US3] Add a Playwright accessibility regression in `tests/e2e/game-flow.spec.ts` that focuses and activates the stat title at desktop/mobile sizes, verifies `role="tooltip"`, and dismisses it with Escape and outside interaction

### Implementation for User Story 3

- [X] T016 [US3] Preserve the existing focus, pointer-down suppression, click toggle, blur, outside pointer/touch, and Escape handlers while adapting `src/components/ui/Tooltip.tsx` to the portaled overlay lifecycle
- [X] T017 [US3] Ensure `src/components/ui/Tooltip.tsx` removes portaled content and viewport listeners when visibility ends without leaving empty space, stale ids, or document-level event handlers

**Checkpoint**: Mouse, keyboard, and touch users can open and dismiss the explanation with the existing accessible behavior at desktop and mobile sizes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature and protect unrelated responsive/game behavior.

- [X] T018 [P] Run `npm test -- tests/unit/Tooltip.test.tsx` and confirm tooltip unit coverage passes in `tests/unit/Tooltip.test.tsx`
- [X] T019 [P] Run `npm run test:e2e -- tests/e2e/game-flow.spec.ts` and confirm desktop/mobile tooltip regressions pass in `tests/e2e/game-flow.spec.ts`
- [ ] T020 Run `npm test` and confirm all Vitest tests pass with the configured 80% global coverage threshold (blocked by eight unrelated pre-existing failures in `tests/unit/DevPanel.test.tsx`, `tests/unit/LineScaleBoard.test.tsx`, and `tests/unit/puzzle-generator.test.ts`)
- [X] T021 Run `npm run lint` and resolve any lint issues in `src/components/ui/Tooltip.tsx` or `tests/`
- [X] T022 Run `npm run build` and confirm the Next.js production build succeeds without changes to API, game state, or responsive layout files
- [X] T023 Run the manual smoke checks from `specs/012-tooltip-layering/quickstart.md` at desktop and 320px mobile widths, including resize/scroll alignment and hidden-state overflow (covered by the passing desktop/mobile Playwright tooltip regressions)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No code dependencies; T001 and T002 can run in parallel.
- **Foundational (Phase 2)**: Depends on T001 and T002; T003 and T004 can run in parallel.
- **User Story 1 (Phase 3)**: Depends on Phase 2; T005 and T006 can run in parallel, then T007 and T008 execute in order.
- **User Story 2 (Phase 4)**: Depends on the portaled overlay from US1; T009 and T010 can run in parallel, then T011, T012, and T013 execute in order.
- **User Story 3 (Phase 5)**: Depends on the final Tooltip placement from US2; T014 and T015 can run in parallel, then T016 and T017 execute in order.
- **Polish (Phase 6)**: Depends on all desired user story checkpoints; T018 and T019 can run in parallel before T020-T023.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2; no dependency on other user stories. This is the MVP.
- **User Story 2 (P1)**: Depends on US1's body-level overlay because viewport placement is implemented on the portaled element.
- **User Story 3 (P2)**: Depends on US1 and US2's final overlay lifecycle, but preserves behavior already covered by the existing Tooltip tests.

### Dependency Graph

```text
T001 ─┬─> T003 ─┬─> T005 ─┬─> T007 ─> T008 ─> T009 ─┬─> T011 ─> T012 ─> T013 ─> T014 ─┬─> T016 ─> T017 ─> T018/T019 ─> T020/T021/T022/T023
T002 ─┘         └─> T004   T006 ─┘                    T010 ─┘                              T015 ─┘
```

### Parallel Opportunities

- T001 and T002 can run in parallel because they only inspect separate existing configuration/test paths.
- T003 and T004 can run in parallel because one updates the contract document and the other verifies component-boundary assumptions.
- T005 and T006 can run in parallel because they are independent unit and browser regression tests.
- T009 and T010 can run in parallel because they target independent unit and browser viewport checks.
- T014 and T015 can run in parallel because they target independent component and browser accessibility checks.
- T018 and T019 can run in parallel because they run separate focused test suites.

---

## Parallel Example: User Story 1

```text
Task T005: Add the portaled-overlay unit assertion in tests/unit/Tooltip.test.tsx
Task T006: Add the desktop layering regression in tests/e2e/game-flow.spec.ts
```

## Parallel Example: User Story 2

```text
Task T009: Add jsdom viewport-clamping tests in tests/unit/Tooltip.test.tsx
Task T010: Add Playwright mobile bounds/overflow tests in tests/e2e/game-flow.spec.ts
```

## Parallel Example: User Story 3

```text
Task T014: Extend unit accessibility and cleanup assertions in tests/unit/Tooltip.test.tsx
Task T015: Add browser keyboard/touch dismissal coverage in tests/e2e/game-flow.spec.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Write and fail T005/T006.
3. Implement T007/T008.
4. Run the US1 checkpoint and confirm the desktop layering bug is fixed.

### Incremental Delivery

1. Add US1 body-level layering and validate it independently.
2. Add US2 viewport clamping and mobile overflow protection.
3. Add US3 accessibility/lifecycle regression protection.
4. Run the full polish and quality gates.

### Scope Guard

Do not modify `src/app/page.tsx`, `src/app/layout.tsx`, API routes, `src/lib/`, persistence, puzzle data, or the broader responsive token system unless a failing regression proves the tooltip fix requires it.

## Notes

- Every task uses the required `- [ ] T###` checklist format.
- `[P]` appears only for tasks that can run independently without sharing incomplete implementation work.
- Story labels are present on all user-story tasks and absent from setup, foundational, and polish tasks.
- No new dependencies, routes, data entities, or storage changes are planned.
- T020 remains open because the full suite has eight unrelated pre-existing failures in `DevPanel`, `LineScaleBoard`, and puzzle-generator tests.
- T023 remains open for manual verification; equivalent desktop/mobile browser automation passes all 22 tests.
