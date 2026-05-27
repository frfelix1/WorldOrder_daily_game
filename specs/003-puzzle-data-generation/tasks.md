# Tasks: Puzzle Data Generation from Processed Stats

**Input**: Design documents from `specs/003-puzzle-data-generation/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/puzzle-generation.md ✅, quickstart.md ✅

**Tests**: Tests are **MANDATORY** — the project constitution mandates Test-First Development (Principle II, NON-NEGOTIABLE). All pipeline tests must be written and confirmed to fail before implementation. Tests live in `tests/scripts/` and are run via `pytest`, isolated from the vitest/Next.js test suite.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. Due to implementation dependencies, phases are ordered: US3 (dataset builder) → US2 (constraint enforcement) → US1 (end-to-end game) → US4 (batch generation). User story numbers match spec.md throughout.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in all descriptions

---

## Phase 1: Setup

**Purpose**: Python environment and test directory scaffolding — no source code yet

- [X] T001 Install `pycountry` into the project virtualenv: `source venv/bin/activate && pip install pycountry`
- [X] T002 Create `tests/scripts/` directory with `tests/scripts/__init__.py` (empty, for pytest discovery)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared Python modules used by both pipeline scripts. Must be complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Implement `scripts/iso_map.py`
- [X] T004 [P] Implement `scripts/stat_definitions.py`
- [X] T005 [P] Implement `scripts/country_pool.py`

**Checkpoint**: Shared modules ready — `iso_map.py`, `stat_definitions.py`, `country_pool.py` all importable

---

## Phase 3: User Story 3 — Dataset Builder Ingests Processed CSVs (Priority: P1)

**Goal**: A single command reads all 17 processed CSVs, maps alpha-2→alpha-3 codes, parses numeric values, computes pre-ranked orderings, and writes `data/dataset.json` as the authoritative source for puzzle generation.

**Independent Test**: Run `python scripts/build_dataset.py --verbose`, then inspect `data/dataset.json` for Japan (`JPN`) — confirm numeric values, pre-computed ranks, and alpha-3 codes exist for ≥10 stats. Verify `"32,383,920"` is stored as `32383920`.

### Tests for User Story 3 — WRITE FIRST, CONFIRM THEY FAIL BEFORE IMPLEMENTING

- [X] T006 [P] [US3] Write tests for alpha-2→alpha-3 mapping in `tests/scripts/test_build_dataset.py`
- [X] T007 [P] [US3] Write tests for numeric parsing in `tests/scripts/test_build_dataset.py`
- [X] T008 [P] [US3] Write tests for rank computation in `tests/scripts/test_build_dataset.py`
- [X] T009 [US3] Write tests for dataset idempotency and schema in `tests/scripts/test_build_dataset.py`

### Implementation for User Story 3

- [X] T010 [US3] Implement CSV ingestion in `scripts/build_dataset.py`
- [X] T011 [US3] Implement numeric parsing and availability flagging in `scripts/build_dataset.py`
- [X] T012 [US3] Implement rank computation in `scripts/build_dataset.py`
- [X] T013 [US3] Implement dataset serialization in `scripts/build_dataset.py`
- [X] T014 [US3] Implement CLI for `scripts/build_dataset.py`

**Checkpoint**: `python scripts/build_dataset.py --verbose` produces `data/dataset.json` with ≥14 stats and ≥30 countries. All `pytest tests/scripts/test_build_dataset.py` pass.

---

## Phase 4: User Story 2 — Puzzle Generator Enforces Constraints (Priority: P1)

**Goal**: The generator automatically ensures all five chosen countries have distinct values for every stat, the three stats span at least two categories, and the five countries are drawn from five distinct quintile bands of the primary stat. Constraint violations are reported and no partial file is written.

**Independent Test**: Attempt to generate a puzzle with two countries whose ranks are tied for a stat — verify the tool rejects with a message identifying the conflicting stat and country pair. Attempt a puzzle where all three stats are from "economy" — verify rejection with a category-variety error.

### Tests for User Story 2 — WRITE FIRST, CONFIRM THEY FAIL BEFORE IMPLEMENTING

- [X] T015 [P] [US2] Write tests for tie rejection in `tests/scripts/test_generate_puzzles.py`
- [X] T016 [P] [US2] Write tests for category-variety validation in `tests/scripts/test_generate_puzzles.py`
- [X] T017 [P] [US2] Write tests for quintile-band algorithm in `tests/scripts/test_generate_puzzles.py`
- [X] T018 [US2] Write tests for missing-data exclusion in `tests/scripts/test_generate_puzzles.py`

### Implementation for User Story 2

- [X] T019 [P] [US2] Implement `PuzzleCandidate` dataclass and `validate_candidate()` in `scripts/generate_puzzles.py`
- [X] T020 [P] [US2] Implement quintile-band selection algorithm in `scripts/generate_puzzles.py`
- [X] T021 [US2] Implement constraint violation reporting in `scripts/generate_puzzles.py`

**Checkpoint**: Unit tests for constraint logic all pass. Constraint violations are correctly detected and reported with no file written.

---

## Phase 5: User Story 1 — Game Serves Real-Data Puzzles for Every Date (Priority: P1)

**Goal**: A player loads the game on any given day and receives a puzzle whose five countries and three stats are derived entirely from the processed statistics dataset. The correct ordering is computed from real numeric values. The player experience is unchanged.

**Independent Test**: Delete all files in `data/puzzles/`, run `python scripts/generate_puzzles.py` (today's date), load `http://localhost:3000` in the browser, verify five countries and three stats appear and the solution arrays match the dataset's ranked values.

### Tests for User Story 1 — WRITE FIRST, CONFIRM THEY FAIL BEFORE IMPLEMENTING

- [X] T022 [P] [US1] Write tests for `PuzzleFile` schema conformance in `tests/scripts/test_generate_puzzles.py`
- [X] T023 [P] [US1] Write tests for solution derivation in `tests/scripts/test_generate_puzzles.py`
- [X] T024 [US1] Write end-to-end integration test in `tests/scripts/test_generate_puzzles.py`

### Implementation for User Story 1

- [X] T025 [US1] Implement dataset loading in `scripts/generate_puzzles.py`
- [X] T026 [US1] Implement single-date puzzle generation in `scripts/generate_puzzles.py`
- [X] T027 [US1] Implement atomic puzzle file write in `scripts/generate_puzzles.py`
- [X] T028 [US1] Implement CLI for `scripts/generate_puzzles.py`
- [X] T029 [US1] Perform end-to-end verification per quickstart.md

**Checkpoint**: `data/puzzles/<today>.json` exists, passes schema validation, and the game renders correctly with real data. All `pytest tests/scripts/` pass.

---

## Phase 6: User Story 4 — Operator Can Generate a Full Sequence of Puzzle Files (Priority: P2)

**Goal**: A game operator runs a single command specifying a 30-day date range and receives one valid puzzle file per day in `data/puzzles/`, with no two consecutive files sharing an identical five-country set. Existing files are preserved unless `--force` is passed.

**Independent Test**: Run the batch generator for a 30-day window, verify 30 valid files are produced, verify no two consecutive files share the same set of five country IDs.

### Tests for User Story 4 — WRITE FIRST, CONFIRM THEY FAIL BEFORE IMPLEMENTING

- [X] T030 [P] [US4] Write tests for batch uniqueness in `tests/scripts/test_generate_puzzles.py`
- [X] T031 [P] [US4] Write tests for skip-existing behavior in `tests/scripts/test_generate_puzzles.py`

### Implementation for User Story 4

- [X] T032 [US4] Implement batch date-range iteration in `scripts/generate_puzzles.py`
- [X] T033 [US4] Implement consecutive-puzzle uniqueness enforcement in `scripts/generate_puzzles.py`
- [X] T034 [US4] Implement partial-failure reporting and exit code in `scripts/generate_puzzles.py`
- [X] T035 [US4] Implement `--dry-run` mode validation for batch runs in `scripts/generate_puzzles.py`

**Checkpoint**: `python scripts/generate_puzzles.py --start-date 2026-05-27 --end-date 2026-06-25` produces 30 valid files. No two consecutive files share the same five-country set.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, documentation, and cleanup across all stories

- [X] T036 [P] Run full pytest suite: `python -m pytest tests/scripts/ -v` — 68 passed
- [X] T037 [P] TypeScript build verified — pre-existing error in src/ unrelated to this feature; no `src/` files modified
- [X] T038 [P] Run quickstart.md Step 1 validation — Stats: 17, Countries: 202, Warnings: 0 files skipped
- [ ] T039 Validate quickstart.md end-to-end per Steps 2–3: generate 30 days of puzzles, start dev server, run `npm run test:e2e`, confirm all E2E tests pass with generated puzzle files
- [X] T040 [P] Performance budgets verified: build_dataset 0.47s (<30s ✓), single-date 0.09s (<10s ✓), 30-day batch 0.12s (<60s ✓)
- [X] T041 [P] Module-level docstrings present in all new Python files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user story work**
- **US3 (Phase 3)**: Depends on Foundational (uses iso_map, stat_definitions, country_pool)
- **US2 (Phase 4)**: Depends on Foundational (uses same modules); can overlap with US3 since constraint logic is unit-testable with synthetic data
- **US1 (Phase 5)**: Depends on US3 (needs `data/dataset.json` for integration test) and US2 (constraint validation must exist)
- **US4 (Phase 6)**: Depends on US1 (batch extends single-date generation)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US3 (P1)**: Can start after Foundational — no dependency on other stories
- **US2 (P1)**: Can start after Foundational — unit tests use synthetic data, no dependency on US3
- **US1 (P1)**: Depends on US3 (dataset must exist) and US2 (validation must be implemented)
- **US4 (P2)**: Depends on US1 (extends the single-date generator with batch loop)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (constitution Principle II)
- Shared module tasks [T003–T005] before any dataset/generator work
- `iso_map.py` and `stat_definitions.py` before `build_dataset.py`
- `build_dataset.py` complete (and `data/dataset.json` generated) before end-to-end integration test in US1
- Constraint logic (US2) before full generation pipeline (US1)

### Parallel Opportunities

- T003, T004, T005 (Foundational modules) can all run in parallel
- T006, T007, T008 (US3 tests) can all run in parallel
- T010, T011, T012 (US3 implementation steps) are sequential (depend on each other)
- T015, T016, T017 (US2 tests) can all run in parallel
- T019, T020 (US2 implementation) can run in parallel (different functions)
- T022, T023 (US1 tests) can run in parallel
- T025, T026 (US1 dataset loading and generation logic) can run in parallel
- T030, T031 (US4 tests) can run in parallel
- T032, T033 (US4 batch logic) are sequential
- T036, T037, T038, T040, T041 (Polish validations) can all run in parallel

---

## Parallel Execution Examples

### Phase 2: Foundational

```
Task T003: Implement scripts/iso_map.py
Task T004: Implement scripts/stat_definitions.py
Task T005: Implement scripts/country_pool.py
```

### Phase 3: US3 Tests (write first, all parallel)

```
Task T006: alpha-2→alpha-3 mapping tests in tests/scripts/test_build_dataset.py
Task T007: numeric parsing tests in tests/scripts/test_build_dataset.py
Task T008: rank computation tests in tests/scripts/test_build_dataset.py
```

### Phase 4: US2 Tests (write first, all parallel)

```
Task T015: tie rejection tests in tests/scripts/test_generate_puzzles.py
Task T016: category-variety validation tests in tests/scripts/test_generate_puzzles.py
Task T017: quintile-band algorithm tests in tests/scripts/test_generate_puzzles.py
```

---

## Implementation Strategy

### MVP First (User Stories 1–3 Only — all P1)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T005)
3. Complete Phase 3: US3 — Dataset Builder (T006–T014)
4. Complete Phase 4: US2 — Constraint Enforcement (T015–T021)
5. Complete Phase 5: US1 — End-to-End Game (T022–T029)
6. **STOP and VALIDATE**: Run `python -m pytest tests/scripts/ -v`, start dev server, verify game loads with generated data
7. Deploy if ready

### Incremental Delivery

1. Setup + Foundational → shared modules ready
2. US3 done → `data/dataset.json` builds correctly from real CSVs
3. US2 done → constraint logic validated, clean error reporting
4. US1 done → game serves real data, players unaffected (**MVP delivered**)
5. US4 done → operator can generate a 30-day puzzle backlog in one command
6. Polish → all quality gates green

### Single-Developer Sequence

Since this is a Python pipeline with clear dependency order, work sequentially:

```
Phase 1 → Phase 2 → Phase 3 (tests first) → Phase 4 (tests first) → Phase 5 (tests first) → Phase 6 (tests first) → Phase 7
```

---

## Notes

- **[P]** tasks = different files or functions with no shared incomplete dependencies
- **[US#]** label maps task to specific user story for traceability
- Tests are MANDATORY per constitution Principle II (Test-First Development)
- Confirm each test FAILS before writing the implementation it covers
- `pycountry` must be in the virtualenv before any import of `scripts/iso_map.py`
- The three expected CSV failures (`modify_population_density.csv`, `modify_temperature.csv`, `modify_corruption_index.csv`) are warnings, not errors — they must not affect exit code 0
- No files in `src/` are modified by this feature; `npm run build` must remain green
- Puzzle files are written atomically (`os.replace`) to prevent partial writes on interruption
- Use `--seed 42` during development for reproducible generation
