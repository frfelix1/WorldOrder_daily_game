# Contract: Puzzle Generation Pipeline

**Version**: 1.0 | **Date**: 2026-05-27
**Related**: [`specs/001-worldorder-daily-game/contracts/puzzle-api.md`](../../001-worldorder-daily-game/contracts/puzzle-api.md)

---

## Overview

This contract defines the command-line interface and data contracts for the two pipeline scripts that replace hand-curated puzzle authoring:

1. `scripts/build_dataset.py` — builds the local dataset from processed CSVs
2. `scripts/generate_puzzles.py` — generates puzzle files from the dataset

The output of `generate_puzzles.py` must conform to the existing **Puzzle API contract** (`specs/001-worldorder-daily-game/contracts/puzzle-api.md`) exactly. This document covers the pipeline's own interface and the constraints it enforces.

---

## Script 1: `build_dataset.py`

### Command

```bash
python scripts/build_dataset.py [OPTIONS]
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--input-dir` | `data/stats/processed` | Directory containing processed CSV files |
| `--output` | `data/dataset.json` | Output path for the structured dataset |
| `--country-pool` | `scripts/country_pool.py` | Path to the curated country pool definition |
| `--stable-timestamp` | off | Use a fixed timestamp (`1970-01-01T00:00:00Z`) for reproducible output |
| `--verbose` | off | Print per-file ingestion summary |

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success — dataset written |
| `1` | Fatal error — no output written (e.g., input directory not found) |

**Partial success** (some CSVs skipped due to parse errors) exits `0` with warnings printed to stderr. The three expected failures (`modify_population_density.csv`, `modify_temperature.csv`, `modify_corruption_index.csv`) do not affect the exit code.

### Output: `data/dataset.json`

See `data-model.md` for the full JSON schema. Key guarantees:

- `stats` contains at least the 14 successfully processable stat IDs.
- Every `entry` in `entries[]` has `available: true` or `available: false`; no entry is missing either field.
- Entries within each stat are sorted by `rank` ascending.
- The `generatedAt` field is an ISO 8601 UTC timestamp.

### Idempotency Contract

Running `build_dataset.py` twice on the same input CSVs produces identical `stats` content (same countries, same values, same ranks). The `generatedAt` timestamp differs unless `--stable-timestamp` is passed.

---

## Script 2: `generate_puzzles.py`

### Command

```bash
python scripts/generate_puzzles.py [OPTIONS]
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--dataset` | `data/dataset.json` | Path to the local dataset |
| `--output-dir` | `data/puzzles` | Directory to write puzzle JSON files |
| `--start-date` | today (UTC) | First date to generate (inclusive), `YYYY-MM-DD` |
| `--end-date` | same as start | Last date to generate (inclusive), `YYYY-MM-DD` |
| `--seed` | none (random) | Integer seed for reproducible country/stat selection |
| `--force` | off | Overwrite existing puzzle files in `--output-dir` |
| `--verbose` | off | Print per-puzzle generation details |
| `--dry-run` | off | Validate candidates but do not write files; print what would be generated |

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All requested puzzle files generated (or already existed and `--force` not set) |
| `1` | One or more dates could not be satisfied — details printed to stderr |

### Puzzle File Output: `data/puzzles/YYYY-MM-DD.json`

Each generated file must conform to the `PuzzleFile` schema:

```json
{
  "date": "YYYY-MM-DD",
  "countries": [
    { "id": "JPN", "name": "Japan", "flagCode": "jp" },
    { "id": "BRA", "name": "Brazil", "flagCode": "br" },
    { "id": "NGA", "name": "Nigeria", "flagCode": "ng" },
    { "id": "DEU", "name": "Germany", "flagCode": "de" },
    { "id": "ZAF", "name": "South Africa", "flagCode": "za" }
  ],
  "stats": [
    {
      "id": "stat_1",
      "label": "Land Area",
      "category": "geography",
      "tooltip": "Total land area in square kilometres, excluding inland water. Source: Wikipedia, 2023.",
      "direction": "desc",
      "solution": ["BRA", "ZAF", "DEU", "NGA", "JPN"]
    },
    {
      "id": "stat_2",
      "label": "Population",
      "category": "demographics",
      "tooltip": "Total resident population. Source: Wikipedia, 2024.",
      "direction": "desc",
      "solution": ["NGA", "BRA", "DEU", "JPN", "ZAF"]
    },
    {
      "id": "stat_3",
      "label": "Life Expectancy",
      "category": "health",
      "tooltip": "Average life expectancy at birth in years. Source: WHO, 2022.",
      "direction": "desc",
      "solution": ["JPN", "DEU", "BRA", "ZAF", "NGA"]
    }
  ]
}
```

---

## Constraint Checklist (enforced automatically)

The generator validates every `PuzzleCandidate` against all of the following before writing a file. If any check fails, the candidate is rejected and the violation is logged; no partial file is written.

| # | Constraint | Rule Reference |
|---|-----------|---------------|
| 1 | All 5 countries have available data for all 3 stats | FR-006, FR-011 |
| 2 | All 5 countries have distinct (non-tied) ranks for all 3 stats | FR-006 |
| 3 | The 3 stats span at least 2 distinct categories | FR-007 |
| 4 | The 5 countries are drawn from 5 distinct quintile bands of `stat_1`'s ranked list | FR-016 |
| 5 | The `solution` array for each stat is derived from pre-computed `rank` values | FR-008 |
| 6 | No existing file for this date (unless `--force` is passed) | FR-012 |
| 7 | The output JSON conforms to the `PuzzleFile` schema | FR-009 |

---

## Quintile-Band Selection Contract (FR-016)

For a primary stat with N eligible countries (available, non-tied):

```
Band 1:  ranks 1              …  floor(N × 0.20)
Band 2:  ranks floor(N×0.20)+1 … floor(N × 0.40)
Band 3:  ranks floor(N×0.40)+1 … floor(N × 0.60)
Band 4:  ranks floor(N×0.60)+1 … floor(N × 0.80)
Band 5:  ranks floor(N×0.80)+1 … N
```

Exactly one country is selected from each band. Selection within a band is random (seeded by `--seed` if provided).

**Zero-value variant** (applies when ≥1 country has `value == 0` for the primary stat):

```
Band 5 (special):  one country with value == 0
Bands 1–4:         equal-width quartiles of non-zero ranked countries
```

**Fallback**: If a selected country causes a tie for a secondary stat, the generator substitutes a different country from the same band. If no substitute is available in that band, the generator tries an alternative primary stat. If still unresolvable, the date is logged as unsatisfiable and skipped (exit code 1).

---

## Batch Uniqueness Constraint

Within a single invocation, no two consecutive puzzle files may use the exact same set of 5 country IDs. This is checked after each file is generated; if the same set would repeat, the random selection is re-seeded until a distinct set is found (max 10 retries before the date is logged as unsatisfiable).

---

## Authoring Checklist (for manually-edited or generated puzzles)

Before merging any file in `data/puzzles/` to the main branch:

1. `solution` arrays are permutations of `countries[*].id` — no missing or extra IDs
2. All country-stat value pairs are distinct — no ties among the 5 countries for any stat
3. Stats span at least 2 distinct `category` values
4. Countries are from 5 distinct quintile bands of the first stat's full ranked list
5. Tooltips include source attribution and data year
6. File is deployed (or merged to `main`) before the puzzle date's UTC midnight
7. No puzzle in the preceding 30 calendar days uses the same set of 5 country IDs

*Steps 1–5 are automated by the generation pipeline. Steps 6–7 remain manual.*
