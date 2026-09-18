# Tasks: Expand Screen Space Usage

**Input**: Design documents from `specs/013-expand-screen-space/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Testing**: Required by the project constitution. Write browser regression tests first, confirm the new assertions fail against the current layout, then implement the layout changes.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish deterministic browser coverage for the responsive layout without adding dependencies or application abstractions.

- [X] T001 Add typed viewport and layout-measurement helpers for the screen-space feature in `tests/e2e/game-flow.spec.ts`
- [ ] T002 [P] Add deterministic completed, incorrect-guess, and multi-guess local-storage fixtures in `tests/e2e/game-flow.spec.ts`
- [ ] T003 [P] Add a stable long-content puzzle fixture or test data override for long country, stat, and formatted-value geometry checks in `tests/e2e/game-flow.spec.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared responsive modes and observables before user-story implementation.

**Checkpoint**: Shared test helpers and baseline fixtures are ready; user-story tests can be added without changing production behavior.

- [X] T004 Add named selectors or data attributes only where needed to identify the playing surface, primary controls, feedback history, and responsive layout bounds in `src/app/page.tsx`
- [ ] T005 [P] Add baseline Playwright assertions for current 320px horizontal overflow, token keyboard operation, focus visibility, reduced motion, and result-card rendering in `tests/e2e/game-flow.spec.ts`
- [ ] T006 [P] Document the playing-view responsive modes and threshold test matrix in `specs/013-expand-screen-space/contracts/primary-game-view.md`

---

## Phase 3: User Story 1 - Use More of the Available Game View (Priority: P1) 🎯 MVP

**Goal**: Make the playing surface use more desktop and tablet real estate through meaningful board sizing, readable content scale, and balanced spacing while preserving the visual identity.

**Independent Test**: At 1440x900 and 1920x1080, open a fresh playing game and verify the measured playing surface, board, and controls occupy the intended space without clipping or visual stretching.

### Tests for User Story 1

> Write these tests first and confirm they fail against the current compact layout before changing production styles.

- [X] T007 [P] [US1] Add 1440x900 and 1920x1080 geometry tests for playing-surface width and height usage, excluding `main` height and intentional margins, in `tests/e2e/game-flow.spec.ts`
- [X] T008 [P] [US1] Add desktop hierarchy and visibility assertions for header, score, progress, stat panel, board, and primary action in `tests/e2e/game-flow.spec.ts`
- [X] T009 [P] [US1] Add tablet portrait and landscape geometry tests plus threshold-adjacent checks in `tests/e2e/game-flow.spec.ts`
- [ ] T010 [P] [US1] Add desktop edge-content assertions for board endpoints, placed-token labels, live value bubbles, tooltip bounds, focus outlines, and long-content wrapping in `tests/e2e/game-flow.spec.ts`

### Implementation for User Story 1

- [X] T011 [US1] Add playing-view-scoped responsive layout tokens and desktop/tablet media-query modes in `src/app/globals.css`
- [X] T012 [US1] Update the primary playing-view container and board sizing consumers to use the scoped responsive tokens in `src/app/page.tsx`
- [ ] T013 [US1] Adjust only the minimal board dimensions required by measured geometry failures, preserving existing typography, colors, feedback symbols, and touch targets in `src/components/game/LineScaleBoard.tsx`
- [ ] T014 [US1] Add completed-state recap regression assertions proving playing-view expansion does not change result-card sizing or presentation in `tests/e2e/game-flow.spec.ts`

**Checkpoint**: User Story 1 is independently testable at desktop and tablet sizes with the current game interactions and visual language intact.

---

## Phase 4: User Story 2 - Preserve No-Scroll Play (Priority: P1)

**Goal**: Keep the empty, partially placed, and all-placed playing states usable without unnecessary scrolling or horizontal panning, while handling accumulated history honestly and accessibly.

**Independent Test**: Exercise the playing view at default zoom, 150% browser zoom, short desktop height, and multiple guess-history lengths; verify controls, overlays, and history remain reachable and usable.

### Tests for User Story 2

> Write these tests first and confirm they fail against the current implementation where the new behavior is not yet present.

- [ ] T015 [P] [US2] Add empty, partially placed, and all-placed state tests asserting primary content and action controls fit without scrolling when feedback history fits in `tests/e2e/game-flow.spec.ts`
- [ ] T016 [P] [US2] Add incorrect-guess and accumulated-history tests verifying feedback remains readable in document flow and active controls remain reachable when normal vertical scrolling is required in `tests/e2e/game-flow.spec.ts`
- [X] T017 [P] [US2] Add short desktop-height coverage at 1440x600 verifying compact sizing, no clipping, and accessible primary controls in `tests/e2e/game-flow.spec.ts`
- [ ] T018 [P] [US2] Add 150% browser-zoom coverage and document the required manual real-browser check in `tests/e2e/game-flow.spec.ts` and `specs/013-expand-screen-space/quickstart.md`
- [ ] T019 [P] [US2] Add pointer-drag, touch-placement, keyboard Home/End/Arrow movement, resize-preservation, and tooltip open/dismissal regression coverage in `tests/e2e/game-flow.spec.ts`

### Implementation for User Story 2

- [X] T020 [US2] Tune playing-view spacing and board dimensions for default and short-height modes in `src/app/globals.css` without hiding overflow or reducing readable content below existing accessibility expectations
- [ ] T021 [US2] Preserve feedback-history document flow and verify primary action ordering and reachability in `src/app/page.tsx`
- [ ] T022 [US2] Keep drag-overlay sizing and centering consistent with any token or board scale changes in `src/components/game/LineScaleBoard.tsx`
- [ ] T023 [US2] Add regression assertions proving tooltip, focus, and reduced-motion behavior remain unchanged after playing-view layout changes in `tests/e2e/game-flow.spec.ts`

**Checkpoint**: User Story 2 is independently testable across default zoom, 150% zoom, short desktop height, history growth, keyboard, pointer, touch, and overlay interactions.

---

## Phase 5: User Story 3 - Retain Responsive Behavior on Smaller Screens (Priority: P2)

**Goal**: Preserve and explicitly validate the existing phone behavior while improving tablet and desktop use of space.

**Independent Test**: Open the playing view at phone portrait, phone landscape, 320px width, tablet portrait, and tablet landscape; verify content order, readable labels, primary controls, keyboard access, and no unintended horizontal overflow.

### Tests for User Story 3

> Write these tests first and confirm they fail against any changed responsive mode before finalizing the CSS.

- [ ] T024 [P] [US3] Add phone portrait and landscape layout tests for content order, readable stat direction, board endpoints, staging tokens, and primary action access in `tests/e2e/game-flow.spec.ts`
- [ ] T025 [P] [US3] Add 320px and narrow-width tests for document overflow, visible focus outlines, tooltip bounds, token labels, and touch-target dimensions in `tests/e2e/game-flow.spec.ts`
- [ ] T026 [P] [US3] Add viewport-resize tests proving placements, locked tokens, score, focus target, and tooltip state are preserved when moving between phone, tablet, and desktop sizes in `tests/e2e/game-flow.spec.ts`

### Implementation for User Story 3

- [X] T027 [US3] Preserve compact phone tokens and add tablet portrait/landscape overrides without changing existing phone content order in `src/app/globals.css`
- [ ] T028 [US3] Fix only measured narrow-screen clipping or wrapping issues in `src/components/game/LineScaleBoard.tsx`, `src/components/game/StatPanel.tsx`, and `src/components/game/FeedbackRow.tsx`
- [ ] T029 [US3] Add regression assertions proving responsive style changes leave loading, error, and completed result states unchanged in `tests/e2e/game-flow.spec.ts`

**Checkpoint**: All three user stories are independently testable, with smaller-screen behavior preserved and desktop/tablet space usage improved.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature and prevent regressions across visual, functional, and accessibility boundaries.

- [ ] T030 [P] Update `specs/013-expand-screen-space/quickstart.md` with final viewport thresholds, history overflow policy, and manual 150% zoom steps
- [ ] T031 [P] Review `specs/013-expand-screen-space/contracts/primary-game-view.md` against the final selectors and measured geometry contract
- [ ] T032 Run `npm test` and confirm Vitest coverage remains at least 80% globally
- [ ] T033 Run `npm run lint` and resolve only feature-related lint failures in changed files
- [X] T034 Run `npm run build` and confirm the App Router production build succeeds
- [X] T035 Run `npm run test:e2e -- tests/e2e/game-flow.spec.ts` across Chromium desktop and mobile projects
- [ ] T036 Perform the manual real-browser 150% zoom smoke check and verify desktop, tablet, phone, short-height, edge-overlay, keyboard, touch, reduced-motion, and recap behavior before marking the feature complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; establishes deterministic fixtures and measurement helpers.
- **Foundational (Phase 2)**: Depends on Setup; blocks user-story implementation because tests and selectors must be stable first.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers the MVP desktop/tablet layout expansion.
- **User Story 2 (Phase 4)**: Depends on the responsive modes and playing-view tokens from US1; validates no-scroll, history, zoom, and interactions.
- **User Story 3 (Phase 5)**: Depends on the final responsive token structure from US1 and overflow behavior from US2; validates phone and tablet boundaries.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2; no dependency on another user story.
- **User Story 2 (P1)**: Depends on US1's responsive token structure and playing-view scope, but is independently testable after that foundation.
- **User Story 3 (P2)**: Depends on US1's responsive modes and US2's overflow/focus contract; no game-logic dependency.

### Within Each User Story

- Tests MUST be written and confirmed failing before implementation.
- CSS/token changes precede only the minimal component changes justified by measured failures.
- Run the story checkpoint tests before moving to the next story.
- Do not change game logic, persistence, API routes, or recap behavior to solve layout fit.

## Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T005 and T006 can run in parallel after the shared fixture work.
- T007, T008, T009, and T010 can run in parallel because they add independent assertions to the same test file only if coordinated; otherwise execute sequentially to avoid merge conflicts.
- T015 through T019 can be split by test scenario, with one owner coordinating `tests/e2e/game-flow.spec.ts`.
- T024 through T026 can be split by phone, narrow-width, and resize scenarios with coordinated test-file integration.
- T030 and T031 can run in parallel with the final test suite.
- T032, T033, and T034 can run in parallel after implementation; T035 depends on the built/running application environment.

## Parallel Example: User Story 1

```text
Task: "Add 1440x900 and 1920x1080 playing-surface geometry assertions in tests/e2e/game-flow.spec.ts"
Task: "Add desktop hierarchy and control visibility assertions in tests/e2e/game-flow.spec.ts"
Task: "Add tablet portrait and landscape geometry assertions in tests/e2e/game-flow.spec.ts"
Task: "Add edge-content and clipping assertions in tests/e2e/game-flow.spec.ts"
```

## Parallel Example: User Story 2

```text
Task: "Add empty and placed-state no-scroll assertions in tests/e2e/game-flow.spec.ts"
Task: "Add accumulated feedback-history reachability assertions in tests/e2e/game-flow.spec.ts"
Task: "Add short-height and 150% zoom overflow assertions in tests/e2e/game-flow.spec.ts"
Task: "Add keyboard, pointer, touch, resize, and tooltip interaction assertions in tests/e2e/game-flow.spec.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate desktop/tablet geometry, visual hierarchy, and existing interactions.
5. Demo the expanded playing view before adding history, zoom, and mobile edge-case work.

### Incremental Delivery

1. Add US1 for the bounded desktop/tablet expansion.
2. Add US2 for no-scroll states, history behavior, short heights, zoom, and interaction preservation.
3. Add US3 for phone and narrow-screen regression coverage.
4. Complete Phase 6 and run the full quality gates.

## Notes

- Every task uses the required checkbox, sequential ID, optional parallel marker, story label where applicable, and an exact file path.
- Tests are included because the project constitution mandates test-first development.
- No new dependency, API, persistence model, or broad layout abstraction is planned.
