# Implementation Plan: Puzzle Data Generation from Processed Stats

**Branch**: `feature/version-1` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-puzzle-data-generation/spec.md`

## Summary

Build a two-stage offline Python pipeline that replaces hand-curated puzzle files with generated ones derived from real country statistics. Stage 1 (`build_dataset.py`) ingests 17 processed CSVs, maps ISO alpha-2→alpha-3 codes, parses numeric values, and writes a structured local dataset (`data/dataset.json`). Stage 2 (`generate_puzzles.py`) reads the dataset and produces one `data/puzzles/YYYY-MM-DD.json` per day, enforcing: no ties in stat values, stats spanning ≥2 categories, and quintile-band spread (countries drawn from 5 distinct percentile bands of the primary stat's ranking). The game's API route and TypeScript client are unchanged.

## Technical Context

**Language/Version**: Python 3.10+ (pipeline scripts) | TypeScript 5 / Node.js 20+ (game — unchanged)

**Primary Dependencies**: `pandas`, `rapidfuzz` (already in `venv`); `pycountry` (to add); Next.js 15, dnd-kit, Tailwind (game — unchanged)

**Storage**: `data/dataset.json` (single JSON file, read via `readFileSync` at generation time); `data/puzzles/YYYY-MM-DD.json` (existing puzzle file pattern, unchanged)

**Testing**: `pytest` (Python pipeline unit tests in `tests/scripts/`); `vitest` with ≥80% coverage gate (TypeScript game logic — unchanged); `playwright` E2E (unchanged)

**Target Platform**: Developer/operator local machine (macOS/Linux); no server-side runtime changes

**Project Type**: CLI tools (Python scripts) + existing web application (Next.js)

**Performance Goals**: Single puzzle generation < 10s; 30-day batch < 60s; dataset build < 30s

**Constraints**: Output puzzle files must pass `PuzzleFile` TypeScript type validation; no changes to `src/app/api/puzzle/route.ts` or any `src/` file

**Scale/Scope**: 30–60 country pool; 14+ stats; 90+ days of non-repeating puzzles; 17 input CSV files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ PASS | No TypeScript changes required. Existing `tsconfig.json` strict mode is untouched. |
| II. Test-First Development | ✅ PASS | pytest unit tests in `tests/scripts/` MUST be written before pipeline implementation. Covers: alpha-2 mapping, numeric parsing, rank computation, quintile-band algorithm, constraint validation, schema conformance. |
| III. Next.js App Router Discipline | ✅ PASS | No changes to `src/app/` or any server component/route. The pipeline is a build-time tool entirely outside the Next.js tree. |
| IV. Game Logic Purity | ✅ PASS | `src/lib/` is unchanged. The pipeline is separate from game logic. |
| V. Accessibility Baseline | ✅ PASS | No UI changes. |
| Performance Budget | ✅ PASS | API route unchanged; puzzle files are pre-generated static JSON; `Cache-Control` headers are unaffected. |
| Puzzle Data Integrity | ✅ PASS | Pipeline enforces all constraints from the constitution's Puzzle Data Integrity clause: distinct values, ≥2 categories, valid solution permutations. Additionally enforces quintile-band spread (FR-016). |
| Styling | ✅ PASS | No styling changes. |
| Quality Gates | ✅ PASS | `npm run build`, `npm test` (≥80% coverage), `npm run test:e2e` are all unaffected by this feature. Pipeline tests run separately via `pytest`. |

**No violations. No complexity exceptions required.**

## Project Structure

### Documentation (this feature)

```text
specs/003-puzzle-data-generation/
├── plan.md                          # This file
├── spec.md                          # Feature specification
├── research.md                      # Phase 0 — decisions + rationale
├── data-model.md                    # Phase 1 — data structures
├── quickstart.md                    # Phase 1 — operator runbook
├── contracts/
│   └── puzzle-generation.md         # Phase 1 — CLI + output contracts
├── checklists/
│   └── requirements.md              # Spec quality checklist
└── tasks.md                         # Phase 2 — task list (created by /speckit.tasks)
```

### Source Code (repository root)

```text
scripts/
├── normalize_stats.py               # Existing (unchanged)
├── normalize_stats_output.md        # Existing (unchanged)
├── iso_map.py                       # NEW — alpha-2→alpha-3 mapping + display-name overrides
├── stat_definitions.py              # NEW — static metadata for all 17 stats
├── country_pool.py                  # NEW — curated 30–60 country pool definition
├── build_dataset.py                 # NEW — dataset builder entry point
└── generate_puzzles.py              # NEW — puzzle generator entry point

data/
├── stats/
│   └── processed/                   # Existing (unchanged) — input CSVs
├── dataset.json                     # NEW (generated artifact) — local dataset
└── puzzles/
    └── YYYY-MM-DD.json              # Generated puzzle files (replaces hand-curated)

tests/
├── scripts/                         # NEW
│   ├── test_build_dataset.py        # NEW — unit tests for build_dataset.py
│   └── test_generate_puzzles.py     # NEW — unit tests for generate_puzzles.py
├── unit/                            # Existing (unchanged)
├── integration/                     # Existing (unchanged)
└── e2e/                             # Existing (unchanged)
```

**Structure Decision**: Single-project layout. The pipeline scripts are added to the existing `scripts/` directory (Python only). All game source in `src/` is untouched. Tests for Python scripts go in `tests/scripts/` (new subdirectory, isolated from vitest runs by the existing `**/tests/e2e/**` exclusion pattern — the Python tests are run via `pytest`, not vitest).

## Complexity Tracking

*No violations — section left blank as instructed.*

---

## Phase 0: Research

**Status**: Complete — see [research.md](./research.md)

**Decisions made**:
- Dataset format: single `data/dataset.json`
- Script language: Python (consistent with existing `scripts/`)
- Alpha-2→alpha-3: `pycountry` library + curated display-name override dict
- Quintile primary stat: `stats[0]` (first stat in reveal order)
- Test coverage: `pytest` in `tests/scripts/`

---

## Phase 1: Design & Contracts

**Status**: Complete

**Artifacts produced**:
- [data-model.md](./data-model.md) — all data structures, entity relationships, state transitions
- [contracts/puzzle-generation.md](./contracts/puzzle-generation.md) — CLI contracts, output schema, constraint checklist, quintile-band contract
- [quickstart.md](./quickstart.md) — operator runbook for building dataset and generating puzzles

**Constitution Check (post-design)**: All principles pass. No TypeScript or game-logic changes required. The pipeline is fully isolated in `scripts/` and `tests/scripts/`.
