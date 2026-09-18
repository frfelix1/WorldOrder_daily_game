# Tasks: Daily Game Stats

**Input**: Design documents from `specs/014-daily-stats/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/stats-view.md`, `quickstart.md`

**Tests**: Required by the project constitution. Write each test first, confirm it fails, then implement the behavior.

## Phase 1: Setup

**Purpose**: Confirm the existing project structure and test commands require no new dependencies or infrastructure.

- [X] T001 Review `package.json`, `vitest.config.ts`, `playwright.config.ts`, and `tsconfig.json` to confirm the existing TypeScript, Vitest, Testing Library, Playwright, and strict-mode setup supports this feature without dependency changes
- [X] T002 [P] Create the planned test file path `tests/unit/StatsView.test.tsx` with a minimal failing placeholder test for the new stats component
- [X] T003 [P] Add a production-server verification command or documented local procedure in `specs/014-daily-stats/quickstart.md` for hydration-safe persistence checks after `npm run build`

---

## Phase 2: Foundational

**Purpose**: Establish the versioned storage schema, validation boundary, and deterministic browser-loading contract before story implementation.

**⚠️ CRITICAL**: User-story work depends on these storage and rendering contracts.

### Tests First

- [X] T004 Add failing unit tests in `tests/unit/game-state.test.ts` for the supported version-1 daily-result shape, per-puzzle storage-key format, exact UTC date validation, non-negative integer puzzle validation, `0..1000` score validation, and `completed: true` enforcement
- [X] T005 Add failing unit tests in `tests/unit/game-state.test.ts` for malformed JSON, wrong top-level values, unsupported versions, invalid identity fields, invalid scores retained as `null`, and status reporting for empty/corrupt/unsupported/unavailable storage
- [X] T006 Add failing unit tests in `tests/unit/game-state.test.ts` for per-day discovery, newest-first ordering, duplicate identity collapse, write/read exceptions, and preservation of unrelated localStorage keys

### Schema and Gateway

- [X] T007 Define explicit `DailyResult`, `StatsHistory`, and storage-status types in `src/types/index.ts` using the version-1 rules from `specs/014-daily-stats/data-model.md`
- [X] T008 Implement typed validation, per-puzzle key discovery, per-day save, and history load/recovery functions in `src/lib/game-state.ts`; keep unsupported or unreadable entries from being overwritten and return explicit storage status
- [X] T009 Add a current-completed-state repair helper in `src/lib/game-state.ts` that can recreate a missing daily record without updating `PlayerStats` counters or inferring older history

### Browser Boundary

- [X] T010 Add a failing component test in `tests/unit/StatsView.test.tsx` proving the initial render is deterministic and persisted history is loaded only after mount or explicit stats interaction
- [X] T011 Document the client-only loading boundary and supported storage statuses in `src/components/game/StatsView.tsx` without reading localStorage during render or state initialization

**Checkpoint**: Versioned storage validation and the hydration-safe loading contract are tested and available to all user stories.

---

## Phase 3: User Story 1 - Save a Completed Daily Game (Priority: P1) 🎯 MVP

**Goal**: Save one accurate result when the final stage is solved, before the recap is opened, while keeping gameplay usable if persistence fails.

**Independent Test**: Solve the final stage, close or reload before opening the recap, and verify the current UTC puzzle day and score are available without replaying.

### Tests First

- [X] T012 [US1] Add a failing completion-flow test in `tests/unit/GamePage.test.tsx` proving the final successful solve writes one versioned daily result before the `Show Recap` action
- [ ] T013 [US1] Add a failing completion-flow test in `tests/unit/GamePage.test.tsx` proving score `0` and score `1000` are persisted accurately and the stored score comes from the completed game state
- [ ] T014 [US1] Add a failing completion-flow test in `tests/unit/GamePage.test.tsx` proving a failed storage write leaves the in-memory result complete and exposes a non-blocking unsaved-result notice
- [ ] T015 [US1] Add a failing completion-flow test in `tests/unit/GamePage.test.tsx` proving repeated completion for one puzzle leaves one daily record and does not invoke repair as a second lifetime-stat count

### Implementation

- [X] T016 [US1] Update `src/app/page.tsx` so the final successful stage constructs the completed state and invokes the history writer before rendering the recap; do not wait for the recap button
- [X] T017 [US1] Preserve existing score calculation from `guesses[]` in `src/app/page.tsx` and pass the computed final score into the daily-result writer without recalculating or mutating guesses
- [X] T018 [US1] Add explicit persistence-status state and an accessible `aria-live` notice in `src/app/page.tsx` for a completed result that could not be saved, without blocking the completed game view
- [X] T019 [US1] Add a failing persisted-state repair test and then integrate the repair path in `src/app/page.tsx` for a valid current completed `worldorder_state` missing daily history, without incrementing `PlayerStats`

**Checkpoint**: A player can solve and preserve a daily result independently of the recap action, including safe failure behavior.

---

## Phase 4: User Story 2 - Review Daily History at a Glance (Priority: P1)

**Goal**: Present saved UTC daily results, current-day status, scores, unavailable-score states, and storage problems in an accessible glanceable view.

**Independent Test**: Seed valid, partially invalid, empty, unsupported, and unavailable storage states and verify the stats view displays the correct status, ordering, and score labels.

### Tests First

- [X] T020 [US2] Add failing component tests in `tests/unit/StatsView.test.tsx` for newest-first completed rows, UTC-safe date labels, completed status text, and score display
- [X] T021 [US2] Add failing component tests in `tests/unit/StatsView.test.tsx` for current-day incomplete status, genuinely empty history, unavailable storage, corrupt entries, unsupported versions, and valid days with `Score unavailable`
- [X] T022 [US2] Add failing component tests in `tests/unit/StatsView.test.tsx` for `Completed, not saved`, puzzle-fetch failure with stats still visible, semantic list structure, keyboard controls, and status conveyed without color alone

### Implementation

- [X] T023 [US2] Implement `src/components/game/StatsView.tsx` with semantic heading/list markup, UTC-safe date formatting, newest-first rows, score/unavailable-score labels, and distinct empty/corrupt/unsupported/unavailable states
- [X] T024 [US2] Add the keyboard-operable stats entry and return-to-game controls in `src/app/page.tsx` using existing styling and minimum touch-target conventions
- [X] T025 [US2] Pass current puzzle identity, in-memory completion, storage status, and persistence status from `src/app/page.tsx` to `StatsView` without direct storage access in the component
- [X] T026 [US2] Keep stats available in `src/app/page.tsx` when puzzle fetch fails and ensure the UI never replaces saved history with an empty state merely because the puzzle request failed

**Checkpoint**: A player can open stats and correctly distinguish completed days, incomplete today, unavailable scores, empty history, and storage problems.

---

## Phase 5: User Story 3 - Keep History Across Browser Sessions (Priority: P2)

**Goal**: Restore saved results after reload or browser restart without hydration errors, duplicate writes, or loss of unrelated days.

**Independent Test**: Solve a game, reload or reopen without replaying, and verify the same UTC day and score are shown; verify separate day keys survive concurrent writes.

### Tests First

- [ ] T027 [US3] Add a failing Playwright test in `tests/e2e/game-flow.spec.ts` that completes a real game, closes or reloads before recap, and verifies the daily result remains visible after reload
- [ ] T028 [US3] Add a failing Playwright test in `tests/e2e/game-flow.spec.ts` for malformed storage, unsupported version data, blocked storage, and no hydration error in a production-server run
- [ ] T029 [US3] Add a failing Playwright test in `tests/e2e/game-flow.spec.ts` for timezone-safe date display, puzzle-request failure with stats still available, and two tabs writing different puzzle days without erasing either day
- [ ] T030 [US3] Add a failing unit/integration test in `tests/unit/GamePage.test.tsx` proving an existing completed state repairs missing history after reload without incrementing `PlayerStats`

### Implementation and Verification

- [ ] T031 [US3] Integrate post-mount history loading and current-state repair in `src/app/page.tsx` so reloads restore history without writing an empty default during initialization
- [ ] T032 [US3] Retain injected completed-state coverage in `tests/e2e/game-flow.spec.ts` as restore-only coverage and add the real completion journey separately so persistence cannot be bypassed
- [ ] T033 [US3] Configure the production Playwright persistence run to build and serve the app, then assert no hydration mismatch and correct localStorage behavior across reloads

**Checkpoint**: Saved results survive sessions and browser rendering remains safe under corruption, blocked storage, timezone changes, fetch failure, and separate-tab writes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Run the full quality gates and verify the feature remains minimal, accessible, and maintainable.

- [ ] T034 [P] Run the focused Vitest suites from `specs/014-daily-stats/quickstart.md` and confirm all new tests were written before their implementation tasks
- [ ] T035 [P] Run `npm test` and confirm Vitest global lines, functions, branches, and statements coverage remain at least 80%
- [X] T036 [P] Run `npm run lint` and `npm run build` and resolve only feature-related failures in the planned files
- [ ] T037 Run `npm run test:e2e` plus the production-server persistence checks and verify the manual scenarios in `specs/014-daily-stats/quickstart.md`
- [ ] T038 Review the final diff for direct component localStorage access, unsupported-version overwrites, timezone-shifting date formatting, unnecessary dependencies, and accidental changes to legacy `PlayerStats` semantics

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No implementation dependency; confirm existing tooling and create the component test path.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories because every story uses the versioned gateway and browser-loading contract.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers the MVP save-on-final-solve behavior.
- **User Story 2 (Phase 4)**: Depends on Foundational and the US1 storage contract; can render seeded records independently, then integrates current in-memory completion from US1.
- **User Story 3 (Phase 5)**: Depends on US1 and US2 integration; validates the complete save, display, reload, and browser behavior.
- **Polish (Phase 6)**: Depends on all desired stories.

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only.
- **US2 (P1)**: Depends on Foundational for seeded rendering; integrates with US1 for current in-memory completion and unsaved status.
- **US3 (P2)**: Depends on US1's final-solve write and US2's stats display, but its storage/reload tests remain independently executable.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T004, T005, and T006 can run in parallel before T007/T008.
- T012–T015 should run sequentially because they share fixtures in `tests/unit/GamePage.test.tsx`.
- T020–T022 should run sequentially because they share fixtures in `tests/unit/StatsView.test.tsx`.
- T027–T030 should run sequentially unless separate browser contexts and fixtures are established.
- T034–T036 can run in parallel after implementation is complete.

### Parallel Example: User Story 1

```text
Task T012-T015: completion-flow tests in tests/unit/GamePage.test.tsx, run sequentially because they share fixtures
```

### Parallel Example: User Story 2

```text
Task T020-T022: component test groups in tests/unit/StatsView.test.tsx, run sequentially because they share fixtures
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 User Story 1.
3. Run its focused unit/integration tests and verify final solve persistence before recap.
4. Stop and validate the MVP before adding the history view.

### Incremental Delivery

1. Add User Story 1: save a completed daily result reliably.
2. Add User Story 2: display saved/current results and storage states.
3. Add User Story 3: validate reload, browser, corruption, and multi-tab behavior.
4. Run the full quality gates and manual quickstart checks.

### Notes

- Every task uses the required `- [ ] T###` checklist format.
- `[P]` is used only where the work can be separated without depending on incomplete tasks.
- No new package, route, repository abstraction, migration framework, or aggregate-stat redesign is planned.
- Repair only the current completed state; never infer historical daily results from aggregate counters.
