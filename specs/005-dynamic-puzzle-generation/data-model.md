# Data Model: Dynamic Puzzle Generation

**Feature**: 005-dynamic-puzzle-generation

---

## Overview

This feature introduces a server-side puzzle generation function that replaces static JSON file reads. No new persistent storage is introduced. The changes extend existing TypeScript types and add a new in-memory computation layer.

---

## Existing Types (unchanged)

These types from `src/types/index.ts` are the established domain model and must not be modified.

### `Country`

```typescript
interface Country {
  id: string;       // ISO 3166-1 alpha-3 (e.g. "JPN")
  name: string;     // Display name (e.g. "Japan")
  flagCode: string; // ISO 3166-1 alpha-2 lowercase (e.g. "jp")
}
```

### `StatDef`

```typescript
interface StatDef {
  id: string;             // Stable slot ID: "stat_1" | "stat_2" | "stat_3"
  label: string;          // Human-readable name (e.g. "Life Expectancy")
  category: string;       // One of: geography | demographics | economy | health | environment | culture
  tooltip: string;        // Description shown in the UI
  direction: 'asc'|'desc'; // Ranking direction
  solution: string[];     // Ordered array of Country.id, position 0 = rank 1
}
```

### `PuzzleFile`

The API response shape. Unchanged — clients (the game UI) consume this format exactly.

```typescript
interface PuzzleFile {
  date: string;         // "YYYY-MM-DD" UTC date
  countries: Country[]; // Always exactly 5 entries
  stats: StatDef[];     // Always exactly 3 entries in reveal order
}
```

---

## New Types (added to `src/types/index.ts`)

### `DatasetEntry`

Represents one country's data for a single stat. Parsed from `data/dataset.json`.

```typescript
interface DatasetEntry {
  id: string;         // ISO alpha-3
  name: string;       // Display name
  flagCode: string;   // ISO alpha-2 lowercase
  value: number;      // Raw stat value
  rank: number;       // Integer rank, 1 = highest/best (ascending by rank = descending by value)
  tied: boolean;      // True if two or more countries share this rank
  zeroValue: boolean; // True if value is 0 (special banding treatment)
  available: boolean; // True if this country should be eligible for selection
}
```

### `DatasetStat`

One complete stat definition plus all country entries. Keyed by stat ID in `Dataset.stats`.

```typescript
interface DatasetStat {
  label: string;
  category: string;
  direction: 'asc' | 'desc';
  unit: string;
  source: string;
  dataYear: number;
  tooltip: string;
  entries: DatasetEntry[];
}
```

### `Dataset`

The full parsed `data/dataset.json`. Loaded once and cached by the API route.

```typescript
interface Dataset {
  generatedAt: string;          // ISO timestamp string (informational)
  countryCount: number;         // Total countries in dataset
  statCount: number;            // Total stat definitions
  stats: Record<string, DatasetStat>; // Keyed by stat_id (e.g. "area", "population")
}
```

---

## New Modules

### `src/lib/seeded-random.ts`

Pure PRNG utilities. No imports from `next/*` or Node built-ins.

**Exports**:

```typescript
// Create a PRNG state from a seed integer
function createRng(seed: number): RngState

// Return a float in [0, 1) and advance state
function nextFloat(state: RngState): [float: number, nextState: RngState]

// Pick a random element from an array; returns [element, nextState]
function pickRandom<T>(arr: T[], state: RngState): [T, RngState]

// Fisher-Yates shuffle; returns [shuffled copy, nextState]
function shuffle<T>(arr: T[], state: RngState): [T[], RngState]
```

**`RngState`**: An opaque value type (e.g. `{ seed: number }`) that is threaded through calls, making the PRNG a pure function. Implemented with Mulberry32.

**Seed formula** (used by `puzzle-generator.ts`):
```
seed = BASE_SEED + getPuzzleNumberForDate(dateStr)
BASE_SEED = 42
```

On retry attempt `i` (0-indexed): `seed = BASE_SEED + puzzleNumber + i`

---

### `src/lib/puzzle-generator.ts`

Pure puzzle generation. Depends only on `src/lib/seeded-random.ts`, `src/lib/puzzle.ts`, and `src/types/index.ts`.

**Exports**:

```typescript
// Primary export: deterministic puzzle generation
// Returns null if no valid puzzle can be constructed after all retries
function generatePuzzle(
  dateStr: string,
  dataset: Dataset,
): PuzzleFile | null

// Compute quintile bands for a stat's eligible entries
// Returns 5 arrays of DatasetEntry, one per band
// Exported for unit testing
function computeQuintileBands(
  entries: DatasetEntry[]
): [DatasetEntry[], DatasetEntry[], DatasetEntry[], DatasetEntry[], DatasetEntry[]]

// Derive solution order (sorted by rank ascending)
// Exported for unit testing
function deriveSolution(
  countryIds: string[],
  entriesByCountryId: Map<string, DatasetEntry>
): string[]
```

**Algorithm** (ported from Python — see `research.md` Decision 4 and Python source):

1. Validate dataset (countryCount ≥ 30, statCount ≥ 14)
2. For attempt 0..19 (with seed `BASE_SEED + puzzleNumber + attempt`):
   a. Filter to usable stats (≥5 eligible entries: `available && !tied`)
   b. Pick primary stat (random)
   c. Pick second stat from a different category
   d. Pick third stat from remaining (not same as first two)
   e. Compute quintile bands on primary stat entries
   f. For each band, pick one country that is eligible in all 3 stats
   g. Validate candidate (5 constraints — see spec FR-003)
   h. Check consecutive-day uniqueness: generate day−1 with its own seed; reject if same 5 countries
   i. If valid, return `PuzzleFile`
3. Return `null` if all attempts failed

**Constraints validated** (matching spec FR-003 and FR-006):
- All 5 selected countries have `available=true` and `tied=false` in all 3 stats
- No two countries share a rank in any stat
- Stats span ≥2 distinct categories
- Countries cover all 5 quintile bands of the primary stat
- All 5 countries have a derivable rank in all 3 stats (solution arrays are valid permutations)
- The set of 5 country IDs does not match the previous calendar day's set

---

## API Route Changes

### `src/app/api/puzzle/route.ts` (modified)

**Before**: `readFileSync('data/puzzles/${date}.json')`

**After**:
1. Parse and validate `?date=` query parameter (unchanged)
2. Call `getCachedPuzzle(date)` — an `unstable_cache`-wrapped function that:
   - Loads dataset from `data/dataset.json` (filesystem, Node.js runtime)
   - Calls `generatePuzzle(date, dataset)`
   - Returns the `PuzzleFile` or throws if null
3. Return JSON response with same `Cache-Control` header as before
4. Return 404 if `generatePuzzle` returns null (no valid puzzle constructable)

**Validation rules unchanged**: 400 for invalid date format, 404 for generation failure.

---

### `src/app/api/puzzles/route.ts` (modified)

**Before**: Scans `data/puzzles/` directory for filenames.

**After**: Computes and returns all UTC dates from epoch (`2026-01-01`) through today's UTC date, sorted ascending. No filesystem access.

---

## State Transitions (Generation Attempt)

```
Input: dateStr, dataset
     │
     ▼
Validate dataset ──fail──► return null
     │
     ▼
attempt = 0
     │
  ┌──▼──────────────────────────────────────────────────┐
  │ seed = BASE_SEED + puzzleNumber + attempt            │
  │ pick 3 stats (primary + 2)                          │
  │ compute quintile bands on primary stat              │
  │ pick 1 country per band                             │
  │ build candidate                                     │
  │ validate 5 constraints                              │
  │ check consecutive-day uniqueness                    │
  │                                                     │
  │  valid? ──yes──► return PuzzleFile                  │
  │                                                     │
  │  attempt++ ◄── no                                   │
  │  attempt < 20? ──yes──► loop                        │
  └────────────────────────────────────────────────────┘
     │
  attempt == 20
     │
     ▼
  return null
```

---

## Files Removed

| Path | Reason |
|------|--------|
| `data/puzzles/*.json` | Replaced by runtime generation |
| `scripts/generate_puzzles.py` | Logic ported to TypeScript |
| `scripts/country_pool.py` | Inlined into dataset; no longer needed for generation |

## Files Retained

| Path | Reason |
|------|--------|
| `data/dataset.json` | Authoritative data source; loaded at runtime |
| `scripts/build_dataset.py` | Dataset maintenance tool; not part of daily generation |
| `scripts/normalize_stats.py` | Raw data preprocessing; not part of daily generation |
| `scripts/stat_definitions.py` | Used by dataset build; not part of daily generation |
