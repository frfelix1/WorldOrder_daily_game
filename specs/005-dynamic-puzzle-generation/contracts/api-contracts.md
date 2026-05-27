# API Contracts: Dynamic Puzzle Generation

**Feature**: `005-dynamic-puzzle-generation`
**Phase**: 1 — Design

This document defines the API contracts for all HTTP endpoints affected by this feature. These contracts are the ground truth for both the implementation and the integration tests. Any deviation in either the route handler or test files is a contract violation.

---

## 1. `GET /api/puzzle` — Puzzle Retrieval (modified)

### Purpose

Returns a complete, playable puzzle for the given UTC date. The contract (request shape, response shape, status codes, cache headers) is **unchanged** from the existing implementation. Only the data source changes: puzzles are now generated at runtime rather than read from pre-generated files.

### Request

```
GET /api/puzzle?date=YYYY-MM-DD
```

| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `date` | string | Yes | Must match `/^\d{4}-\d{2}-\d{2}$/` |

### Response — 200 OK

Content-Type: `application/json`

```typescript
interface PuzzleResponse {
  date: string;         // "YYYY-MM-DD" — echoes the requested date
  countries: Country[]; // Exactly 5 entries; order is arbitrary (not the solution)
  stats: StatDef[];     // Exactly 3 entries; order = reveal order in game
}

interface Country {
  id: string;       // ISO 3166-1 alpha-3, e.g. "JPN"
  name: string;     // Display name, e.g. "Japan"
  flagCode: string; // ISO 3166-1 alpha-2 lowercase, e.g. "jp"
}

interface StatDef {
  id: string;              // "stat_1" | "stat_2" | "stat_3"
  label: string;           // e.g. "Life Expectancy"
  category: string;        // geography | demographics | economy | health | environment | culture
  tooltip: string;         // Description shown to player
  direction: 'asc'|'desc'; // Ranking direction
  solution: string[];      // Ordered Country.id values; position 0 = rank 1
}
```

**Invariants** (must hold for every successful response):

- `countries.length === 5`
- `stats.length === 3`
- For every `StatDef`: `solution.length === 5`
- For every `StatDef`: `solution` is a permutation of `countries.map(c => c.id)`
- `stats` span at least 2 distinct `category` values
- All `Country.id` values are valid ISO alpha-3 codes present in `dataset.json`
- `stats[0].id === "stat_1"`, `stats[1].id === "stat_2"`, `stats[2].id === "stat_3"`

### Response — 400 Bad Request

```json
{ "error": "invalid_date" }
```

Returned when `?date` is absent or does not match `/^\d{4}-\d{2}-\d{2}$/`.

### Response — 404 Not Found

```json
{ "error": "not_found" }
```

Returned when the generation algorithm cannot construct a valid puzzle for the requested date after all retry attempts. (Previously returned when the pre-generated file did not exist.)

### Cache Headers

```
Cache-Control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600
```

Identical to the existing implementation. Set on every 200 response.

### Generation Guarantees

- **Deterministic**: Two requests for the same `date` at any time always return identical JSON.
- **Unique consecutive days**: The 5 countries in today's puzzle differ from yesterday's puzzle.
- **Server-side cache**: Results are cached server-side (via `unstable_cache`) for the duration of the deployment, so the generation function runs at most once per date per deployment.

---

## 2. `GET /api/puzzles` — Available Dates List (modified)

### Purpose

Returns the list of all playable puzzle dates, used by the dev seed-switcher panel. Previously returned the dates of pre-generated JSON files on disk. Now returns all UTC calendar dates from the game epoch through today.

### Request

```
GET /api/puzzles
```

No parameters.

### Response — 200 OK

Content-Type: `application/json`

```typescript
type PuzzlesListResponse = string[]; // Array of "YYYY-MM-DD" strings, sorted ascending
```

**Invariants**:

- First element is always `"2026-01-01"` (game epoch)
- Last element is always today's UTC date
- All strings match `/^\d{4}-\d{2}-\d{2}$/`
- Array is sorted in ascending chronological order
- No duplicates

**Example**:
```json
["2026-01-01", "2026-01-02", ..., "2026-05-27"]
```

### Breaking Change from Previous Behaviour

Previously, this endpoint only returned dates for which a pre-generated file existed in `data/puzzles/`. After this feature, it returns all dates from epoch through today — a larger and automatically expanding set.

**Impact**: The dev panel receives more date entries. No visual or functional changes to the dev panel are required.

---

## 3. Generation Function Contract (internal)

This is not an HTTP endpoint but defines the contract for the TypeScript generation function in `src/lib/puzzle-generator.ts`. It is the basis for unit tests.

### Signature

```typescript
function generatePuzzle(
  dateStr: string,
  dataset: Dataset
): PuzzleFile | null
```

### Pre-conditions

| Condition | What happens if violated |
|-----------|--------------------------|
| `dateStr` matches `/^\d{4}-\d{2}-\d{2}$/` | Undefined behaviour — caller must validate |
| `dataset.countryCount >= 30` | Returns `null` |
| `dataset.statCount >= 14` | Returns `null` |

### Post-conditions (when return value is non-null)

- All `PuzzleResponse` invariants listed in section 1 hold
- `result.date === dateStr`
- Result is identical for any two calls with the same `dateStr` and `dataset`
- Result's country set differs from `generatePuzzle(previousDayDateStr, dataset)?.countries.map(c => c.id)`

### Return value

- `PuzzleFile` — valid puzzle satisfying all constraints
- `null` — no valid puzzle could be constructed after 20 attempts (constraint satisfaction failure)

---

## 4. PRNG Contract (internal)

Defines the contract for `src/lib/seeded-random.ts`. Basis for unit tests.

### Exported Functions

```typescript
type RngState = { readonly seed: number }

function createRng(seed: number): RngState
// Creates a new PRNG state from an integer seed.
// Same seed always produces the same sequence.

function nextFloat(state: RngState): [value: number, next: RngState]
// Returns a float in [0, 1) and the advanced state.
// Pure: does not mutate state.

function pickRandom<T>(arr: readonly T[], state: RngState): [item: T, next: RngState]
// Returns a uniformly random element and advanced state.
// Throws RangeError if arr is empty.

function shuffle<T>(arr: readonly T[], state: RngState): [shuffled: T[], next: RngState]
// Returns a new shuffled copy (Fisher-Yates) and advanced state.
// Does not mutate the input array.
```

### Invariants

- All functions are pure (no side effects, no global state)
- `createRng(42)` followed by the same call sequence always produces the same outputs
- `pickRandom` result is uniformly distributed over all elements (verified by statistical tests in unit suite)
