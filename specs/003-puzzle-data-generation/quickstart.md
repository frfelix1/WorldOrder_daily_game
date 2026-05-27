# Quickstart: Puzzle Data Generation Pipeline

**Feature**: `003-puzzle-data-generation`

---

## Prerequisites

- Python 3.10+ with the project virtualenv active: `source venv/bin/activate`
- Processed CSV files present in `data/stats/processed/` (run `scripts/normalize_stats.py` if not)
- Install pipeline dependencies: `pip install pycountry` (if not already in `venv`)

---

## Step 1: Build the Dataset

Reads all 17 processed CSVs, maps alpha-2→alpha-3 country codes, parses numeric values, computes rankings, and writes the structured dataset.

```bash
python scripts/build_dataset.py --verbose
```

Output: `data/dataset.json`

Expected warnings (not errors):
- `modify_population_density.csv` — all rows dropped (malformed source)
- `modify_temperature.csv` — column name error, file skipped
- `modify_corruption_index.csv` — column name error, file skipped

All other files should process successfully. At the end you should see a summary like:

```
Dataset written to data/dataset.json
  Stats: 14
  Countries: 52
  Warnings: 3 files skipped
```

---

## Step 2: Generate Puzzle Files

Generates one puzzle file per day for the requested date range.

```bash
# Generate today's puzzle
python scripts/generate_puzzles.py

# Generate the next 30 days
python scripts/generate_puzzles.py \
  --start-date 2026-05-27 \
  --end-date 2026-06-25

# Preview without writing files
python scripts/generate_puzzles.py \
  --start-date 2026-05-27 \
  --end-date 2026-06-25 \
  --dry-run

# Regenerate existing files
python scripts/generate_puzzles.py \
  --start-date 2026-05-27 \
  --end-date 2026-06-25 \
  --force

# Reproducible generation (same output every run)
python scripts/generate_puzzles.py \
  --start-date 2026-05-27 \
  --end-date 2026-06-25 \
  --seed 42
```

Output: one `data/puzzles/YYYY-MM-DD.json` per date.

---

## Step 3: Verify Output

Start the dev server and load a generated puzzle date:

```bash
npm run dev
curl "http://localhost:3000/api/puzzle?date=2026-05-27" | python -m json.tool
```

Confirm:
- Response has `countries` (5 entries) and `stats` (3 entries)
- Each `solution` array is a permutation of `countries[*].id`
- `tooltip` fields include a source attribution

---

## Running Tests

```bash
# Python pipeline unit tests
python -m pytest tests/scripts/ -v

# TypeScript unit tests (unchanged game logic)
npm test

# E2E tests (requires dev server running)
npm run test:e2e
```

---

## File Reference

| File | Purpose |
|------|---------|
| `scripts/build_dataset.py` | Dataset builder entry point |
| `scripts/generate_puzzles.py` | Puzzle generator entry point |
| `scripts/iso_map.py` | Alpha-2 → alpha-3 mapping + display name overrides |
| `scripts/stat_definitions.py` | Static metadata for all 17 stats |
| `scripts/country_pool.py` | Curated 30–60 country pool definition |
| `data/dataset.json` | Built dataset (generated, not committed by default) |
| `data/puzzles/YYYY-MM-DD.json` | Puzzle files served by the API |
| `tests/scripts/test_build_dataset.py` | Unit tests for dataset builder |
| `tests/scripts/test_generate_puzzles.py` | Unit tests for puzzle generator |

---

## Troubleshooting

**"No module named pycountry"**
```bash
source venv/bin/activate
pip install pycountry
```

**"data/dataset.json not found" when generating puzzles**
Run `build_dataset.py` first (Step 1).

**"0 puzzles generated, 1 unsatisfiable"**
Run with `--verbose` to see which constraint failed. Most commonly a tie detection or insufficient countries in a quintile band for the chosen stats.

**Game shows "No puzzle available for DATE"**
Confirm the file `data/puzzles/DATE.json` exists. The API route only serves dates with a matching file.
