# Data Model: Puzzle Data Generation Pipeline

**Feature**: `003-puzzle-data-generation`
**Date**: 2026-05-27

---

## Overview

This feature introduces a two-stage offline pipeline:

1. **Dataset Builder** (`scripts/build_dataset.py`) — ingests 17 processed CSVs → writes `data/dataset.json`
2. **Puzzle Generator** (`scripts/generate_puzzles.py`) — reads `data/dataset.json` → writes `data/puzzles/YYYY-MM-DD.json`

The game's runtime (`src/app/api/puzzle/route.ts`) is unchanged; it continues to serve files from `data/puzzles/`. No TypeScript types change.

---

## Existing Types (unchanged)

These live in `src/types/index.ts` and are the output format the generator must conform to.

```typescript
// Country as it appears in a puzzle file
interface Country {
  id: string;       // ISO 3166-1 alpha-3 (e.g. "JPN")
  name: string;     // Display name (e.g. "Japan")
  flagCode: string; // ISO 3166-1 alpha-2 lowercase (e.g. "jp")
}

// One stat within a puzzle file
interface StatDef {
  id: string;         // "stat_1" | "stat_2" | "stat_3"
  label: string;      // Short display label (e.g. "Land Area")
  category: string;   // Category slug (e.g. "geography")
  tooltip: string;    // Plain-language explanation + source attribution
  direction: 'asc' | 'desc';
  solution: string[]; // Ordered country IDs; position 0 = rank 1
}

// The full puzzle file schema
interface PuzzleFile {
  date: string;         // "YYYY-MM-DD"
  countries: Country[]; // Exactly 5 entries
  stats: StatDef[];     // Exactly 3 entries, in reveal order
}
```

---

## New Data Structures (pipeline-only)

These structures live inside the Python pipeline and in `data/dataset.json`. They are never served to the browser.

### `DatasetEntry` (per country, per stat)

Represents one resolved data point in the local dataset.

```python
@dataclass
class DatasetEntry:
    id: str           # ISO alpha-3 (e.g. "JPN")
    name: str         # Curated display name (e.g. "Japan")
    flag_code: str    # ISO alpha-2 lowercase (e.g. "jp")
    value: float      # Parsed numeric value
    rank: int         # 1-based rank within this stat (1 = best)
    tied: bool        # True if two or more countries share this rank
    zero_value: bool  # True if value == 0 (special case for coastline etc.)
    available: bool   # False if value was missing/N-a in source CSV
```

**Validation rules**:
- `rank` is 1-based and computed by sorting all available (non-missing) entries by `value` in the stat's `direction`.
- If two entries share the same `value`, both receive the same `rank` and `tied = True`.
- `available = False` entries are stored for traceability but excluded from all puzzle-generation queries.
- `zero_value = True` entries are also eligible for puzzle use (they just trigger the special quartile algorithm).

---

### `StatDefinition` (per stat, static config)

Static configuration for each of the 17 processed stats. Maintained as a Python dict in `scripts/stat_definitions.py`, not derived from CSV filenames.

```python
@dataclass
class StatDefinition:
    stat_id: str         # Stable slug (e.g. "area", "life_expectancy")
    label: str           # Display label (e.g. "Land Area")
    category: str        # Category slug; one of: geography, demographics,
                         #   economy, health, environment, culture
    direction: str       # "desc" or "asc"
    unit: str            # Human-readable unit (e.g. "km²", "years", "USD")
    source: str          # Attribution string (e.g. "Wikipedia, 2023")
    data_year: int       # Year data was collected (e.g. 2023)
    tooltip_template: str  # Plain-language description; {source} and {year}
                           # are interpolated at build time
    csv_filename: str    # Corresponding filename under data/stats/processed/
```

**The 17 stat definitions** (to be implemented in `scripts/stat_definitions.py`):

| stat_id | label | category | direction | csv_filename |
|---------|-------|----------|-----------|-------------|
| `area` | Land Area | geography | desc | `area.csv` |
| `capital_distance` | Distance from Equator | geography | desc | `capital_distance_from_equator.csv` |
| `elevation` | Highest Elevation | geography | desc | `elevation.csv` |
| `life_expectancy` | Life Expectancy | health | desc | `life_expectancy.csv` |
| `alcohol_per_capita` | Alcohol Consumption | culture | desc | `modify_alcohol_per_capita.csv` |
| `annual_rainfall` | Annual Rainfall | environment | desc | `modify_annual_rainfall.csv` |
| `co2_per_capita` | CO₂ per Capita | environment | desc | `modify_co2_per_capita.csv` |
| `coastline` | Coastline Length | geography | desc | `modify_coastline.csv` |
| `forest_coverage` | Forest Coverage | environment | desc | `modify_forest_coverage.csv` |
| `gdp` | GDP (Total) | economy | desc | `modify_gdp.csv` |
| `gdp_per_capita` | GDP per Capita | economy | desc | `modify_gdp_per_capita.csv` |
| `hdi` | Human Development Index | demographics | desc | `modify_HDI.csv` |
| `internet_speed` | Internet Speed | culture | desc | `modify_internet_speed.csv` |
| `obesity_rate` | Obesity Rate | health | desc | `modify_obesity_rate.csv` |
| `olympic_medals` | Olympic Medals (All-Time) | culture | desc | `modify_olympic_medals.csv` |
| `passport_power` | Passport Power | culture | desc | `modify_passport_power.csv` |
| `population` | Population | demographics | desc | `modify_population.csv` |

*Three files expected to fail* (`modify_population_density.csv`, `modify_temperature.csv`, `modify_corruption_index.csv`) are not in the above table; they are skipped with logged warnings.

---

### `LocalDataset` (the output of `build_dataset.py`)

The full dataset stored in `data/dataset.json`.

```json
{
  "generatedAt": "2026-05-27T00:00:00Z",
  "countryCount": 52,
  "statCount": 14,
  "stats": {
    "area": {
      "label": "Land Area",
      "category": "geography",
      "direction": "desc",
      "unit": "km²",
      "source": "Wikipedia — List of countries by area",
      "dataYear": 2023,
      "tooltip": "Total land area in square kilometres, excluding inland water. Source: Wikipedia, 2023.",
      "entries": [
        {
          "id": "RUS",
          "name": "Russia",
          "flagCode": "ru",
          "value": 17098242,
          "rank": 1,
          "tied": false,
          "zeroValue": false,
          "available": true
        }
      ]
    }
  }
}
```

**Constraints**:
- `stats` is a dict keyed by `stat_id`.
- `entries` contains only countries from the curated 30–60 country pool (filtered during ingestion).
- `entries` is sorted by `rank` ascending (rank 1 first) within each stat, for easy indexed lookup.
- Countries in the pool but with no data for a stat appear with `"available": false` and a placeholder `value` of `null`.

---

### `PuzzleCandidate` (ephemeral, used only during generation)

An in-progress selection validated before a puzzle file is written.

```python
@dataclass
class PuzzleCandidate:
    date: str                   # "YYYY-MM-DD"
    country_ids: list[str]      # 5 ISO alpha-3 IDs (one per quintile band)
    stat_ids: list[str]         # 3 stat_ids (in reveal order)
    # Populated during validation:
    countries: list[dict]       # Country dicts matching PuzzleFile.countries
    stats: list[dict]           # StatDef dicts matching PuzzleFile.stats
    violations: list[str]       # Non-empty if any constraint is violated
```

**Validation pipeline** (all must pass before writing):
1. All 5 countries have `available = True` for each of the 3 stats.
2. All 5 countries have `tied = False` for each of the 3 stats (distinct ranks required).
3. The 3 stats span at least 2 distinct categories.
4. The 5 countries are drawn from 5 distinct quintile bands of the primary stat (`stat_ids[0]`).
5. The `solution` arrays are derived from pre-computed `rank` values (not from on-the-fly sorting).

---

## Entity Relationships

```
ProcessedStatFile (17 CSVs)
    │
    ▼ build_dataset.py (alpha-2→alpha-3, numeric parse, rank compute)
    │
    ├── CountryDefinition × 30-60 (curated pool: id, name, flagCode)
    │
    └── LocalDataset (data/dataset.json)
            │
            └── stat_id → StatDefinition + entries[]
                              │
                              └── DatasetEntry per country
                                        │
                                        ▼ generate_puzzles.py
                                        │
                                        PuzzleCandidate (5 countries, 3 stats)
                                                │
                                                ▼ validate + write
                                                │
                                                PuzzleFile (data/puzzles/YYYY-MM-DD.json)
                                                [conforms to existing PuzzleFile TypeScript type]
```

---

## Country Pool

The curated pool of 30–60 countries is defined in `scripts/country_pool.py` as a list of alpha-2 codes (matching the processed CSV `isoCode` column). Inclusion criteria: countries recognizable to a general international audience, with reliable data across most stats. Disputed territories, micro-states, and territories without alpha-3 codes are excluded.

Countries already used in the existing hand-curated puzzles are automatically included:
`JP, GB, FR, IN, ZA, BR, DE, NG, AU` (and their alpha-3 equivalents).

---

## State Transitions

```
ProcessedStatFile  →  [build_dataset.py]  →  LocalDataset
                                                    │
LocalDataset       →  [generate_puzzles.py]  →  PuzzleCandidate
                                                    │
                        constraint checks pass?
                            YES → PuzzleFile written to data/puzzles/
                            NO  → error logged, no file written
```

---

## Idempotency

- `build_dataset.py` produces the same `data/dataset.json` for the same CSV inputs (same `generatedAt` timestamp when run with `--stable-timestamp` flag; otherwise timestamp updates but content is identical).
- `generate_puzzles.py` with the same `--seed` value produces the same puzzle files for the same date range.
- Existing files in `data/puzzles/` are never overwritten unless `--force` is passed.
