# Research: Puzzle Data Generation from Processed Stats

**Feature**: `003-puzzle-data-generation`
**Date**: 2026-05-27

---

## Decision 1: Dataset Storage Format

**Decision**: Single JSON file at `data/dataset.json`

**Rationale**: The project uses a "static files on disk" data pattern exclusively — puzzle files are static JSON read via `readFileSync`. No database driver exists in `package.json` (no SQLite, no Prisma, no ORM). Multiple per-stat JSON files would require glob loading and merging at generation time with no benefit. A single `data/dataset.json` is one `readFileSync` call, easily diffed in git, and consistent with the project's existing data-access pattern.

**Alternatives considered**:
- SQLite: Rejected — no database driver in the project; adds a new dependency class; build-time pipeline has no need for runtime queries.
- Per-stat JSON files: Rejected — adds complexity (glob + merge) with no benefit over a single file; harder to inspect at a glance.

**Suggested shape**:
```json
{
  "generatedAt": "2026-05-27T00:00:00Z",
  "stats": {
    "area": {
      "label": "Land Area",
      "category": "geography",
      "direction": "desc",
      "unit": "km²",
      "source": "Wikipedia — List of countries by area",
      "dataYear": 2023,
      "tooltip": "Total land area in square kilometres. Source: Wikipedia, 2023.",
      "entries": [
        {
          "id": "RUS",
          "name": "Russia",
          "flagCode": "ru",
          "value": 17098242,
          "rank": 1,
          "tied": false,
          "available": true
        }
      ]
    }
  }
}
```

---

## Decision 2: Script Language

**Decision**: Python (extending existing `scripts/` directory)

**Rationale**: The only files in `scripts/` are Python. No TypeScript script runner (`tsx`, `ts-node`, `esno`) is present in `package.json`. A Python virtualenv (`venv/`) is confirmed present and already has `pandas` and `rapidfuzz` installed. The new scripts are developer/operator tools — not part of the Next.js runtime. Keeping them in Python is zero-friction.

**Concrete scripts**:
- `scripts/build_dataset.py` — reads `data/stats/processed/*.csv`, maps alpha-2→alpha-3, parses numerics, computes ranks, writes `data/dataset.json`
- `scripts/generate_puzzles.py` — reads `data/dataset.json`, enforces all FR-006/FR-007/FR-016 constraints, writes `data/puzzles/YYYY-MM-DD.json` files
- `scripts/iso_map.py` — module containing alpha-2→alpha-3 mapping and curated display-name overrides

**Alternatives considered**:
- TypeScript scripts: Rejected — no script runner present; would require adding `tsx` as a dev dependency just for scripts; no precedent in the project.

---

## Decision 3: ISO Alpha-2 to Alpha-3 Mapping

**Decision**: Use `pycountry` library for programmatic mapping, with a curated display-name override dict

**Rationale**: The processed CSVs use ISO alpha-2 codes (e.g., `JP`). The puzzle schema requires alpha-3 (e.g., `JPN`). No mapping table exists in the project. `pycountry` resolves `alpha_2 → alpha_3` cleanly; when `pycountry.countries.get(alpha_2=code)` returns `None`, the row is skipped with a logged warning (satisfying FR-002). `pycountry`'s formal country names (e.g., "Russian Federation") are overridden by a curated dict of short/common names (e.g., "Russia") matching the game's established display style.

**Key alpha-2→alpha-3 pairs (from existing puzzle files)**:

| alpha-2 | alpha-3 | Display name |
|---------|---------|-------------|
| `jp` | `JPN` | Japan |
| `gb` | `GBR` | United Kingdom |
| `fr` | `FRA` | France |
| `in` | `IND` | India |
| `za` | `ZAF` | South Africa |
| `br` | `BRA` | Brazil |
| `de` | `DEU` | Germany |
| `ng` | `NGA` | Nigeria |
| `au` | `AUS` | Australia |

**Alternatives considered**:
- Static hardcoded dict: Viable but maintenance-heavy for 180+ countries; `pycountry` + override dict is cleaner.
- Embed mapping in `normalize_stats.py` output: The processed CSVs already output alpha-2; changing them would require re-running the normalization pipeline. Easier to handle the conversion in the dataset builder.

---

## Decision 4: Quintile-Band Country Selection Algorithm (FR-016)

**Decision**: Primary stat = `stats[0]` (first stat in reveal order). Five bands of equal rank-percentile width. Zero-value special case for coastline.

**Algorithm**:

Given N eligible (non-tied, available) countries for the primary stat:

```
Band 1: ranks 1            …  floor(N × 0.20)       ← top quintile
Band 2: ranks floor(N×0.20)+1 … floor(N × 0.40)
Band 3: ranks floor(N×0.40)+1 … floor(N × 0.60)
Band 4: ranks floor(N×0.60)+1 … floor(N × 0.80)
Band 5: ranks floor(N×0.80)+1 … N                   ← bottom quintile
```

One country is drawn from each band. This is checked per-stat; if a secondary stat causes a tie for any of the five selected countries, a different country within the same band is substituted.

**Zero-value special case** (e.g., coastline where landlocked countries have 0 km):
- Countries with value `0` are pre-flagged in the dataset as `zero_value: true`.
- For such stats: pick one zero-value country for band 5; divide the remaining non-zero countries into four quartile bands (0–25%, 25–50%, 50–75%, 75–100%) and pick one from each.

**Satisfiability**: The smallest stat (`modify_olympic_medals.csv`) has 127 eligible countries; each of 5 bands contains ~25 countries. All bands are always satisfiable across all 17 stats. If a band cannot be filled (edge case), the generator tries alternative stats before falling back with a warning (spec allows at most one empty band).

**Primary stat selection**: `stats[0]` is the correct anchor because (a) it is revealed first and sets the player's initial mental model of the puzzle's difficulty, (b) its value spread directly determines how "hard" the ranking challenge feels.

**Rationale**: Equal-width percentile bands ensure the five countries span the full distribution, making every stat non-trivial to rank. A puzzle with 5 top-10 countries is too easy (all big/rich/populous); a puzzle with 5 mid-range countries is indistinguishable. The quintile constraint eliminates these degenerate cases.

---

## Decision 5: Test Coverage for Scripts

**Decision**: Add `tests/scripts/` directory with pytest unit tests for all pure pipeline functions

**Rationale**: The constitution mandates Test-First Development (Principle II). Scripts currently have zero tests. The pipeline contains testable pure functions: alpha-2 mapping, numeric parsing, rank computation, quintile-band assignment, constraint validation. These MUST be tested before implementation. The Vitest coverage threshold does not apply to Python scripts; pytest with a simple test file per script is sufficient.

**Tests to write**:
- `tests/scripts/test_build_dataset.py` — alpha-2→alpha-3 mapping, numeric parsing, tied-rank detection, zero-value flagging, idempotency
- `tests/scripts/test_generate_puzzles.py` — quintile-band algorithm, tie rejection, category-variety validation, schema conformance of output

**Note**: The Vitest/RTL/Playwright infrastructure is unchanged. No new Vitest tests are needed for the pipeline scripts; they are Python-only tools outside the `src/` tree.

---

## Resolved Clarifications

| Item | Resolution |
|------|-----------|
| Dataset format | Single `data/dataset.json` |
| Script language | Python |
| Alpha-2 mapping | `pycountry` + curated override dict |
| Primary stat for quintile | `stats[0]` (first in reveal order) |
| Quintile satisfiability | Always satisfiable; min band size ~25 countries |
| Script testing | pytest in `tests/scripts/` |
| Existing puzzle-api contract | Exists at `specs/001-worldorder-daily-game/contracts/puzzle-api.md`; no changes needed |
