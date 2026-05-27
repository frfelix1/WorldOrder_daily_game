# Data Model: Reveal Correct Values

**Feature**: 007-reveal-correct-values
**Date**: 2026-05-27

---

## Modified Types

### `StatDef` — extended (`src/types/index.ts`)

Adds two new fields to the existing puzzle API response type:

```typescript
export interface StatDef {
  id: string;
  label: string;
  category: string;
  tooltip: string;
  direction: 'asc' | 'desc';
  solution: string[];
  /** Unit of measurement, e.g. "km²", "million USD", "%". Sourced from DatasetStat.unit. */
  unit: string;
  /**
   * Per-country raw values for the 5 selected countries.
   * Keys are ISO alpha-3 country IDs matching PuzzleFile.countries[*].id.
   * Values are the raw numeric measurement from DatasetEntry.value.
   */
  values: Record<string, number>;
}
```

**Constraints**:
- `unit` is a non-empty string
- `values` contains exactly 5 entries — one per country in `PuzzleFile.countries`
- Each value in `values` is a finite number (`isFinite(v) === true`)
- `values[id]` exists for every `id` in `PuzzleFile.countries[*].id`

---

## New Pure Function

### `formatStatValue` — new (`src/lib/formatting.ts`)

```typescript
/**
 * Format a raw numeric stat value with its unit for display.
 *
 * Formatting rules:
 *  - Whole numbers: thousands-separated integer (no decimal places)
 *  - Fractions < 10: up to 3 decimal places (covers HDI 0–1 range)
 *  - Fractions ≥ 10: 1 decimal place with thousands separator
 *
 * @param value - Raw numeric value (may be 0, integer, or float)
 * @param unit  - Unit string from DatasetStat.unit
 * @returns Formatted string like "449,964 km²" or "0.930 index (0–1)"
 */
export function formatStatValue(value: number, unit: string): string
```

**Examples**:

| `value` | `unit` | Result |
|---|---|---|
| `449964` | `"km²"` | `"449,964 km²"` |
| `0.930` | `"index (0–1)"` | `"0.930 index (0–1)"` |
| `25462.7` | `"million USD"` | `"25,462.7 million USD"` |
| `20.6` | `"%"` | `"20.6 %"` |
| `0` | `"km²"` | `"0 km²"` |
| `83` | `"years"` | `"83 years"` |
| `124.5` | `"Mbit/s"` | `"124.5 Mbit/s"` |

**Invariants**:
- Always returns a non-empty string
- Output always ends with `" " + unit`
- `formatStatValue(0, unit)` returns `"0 " + unit` (not blank or omitted)

---

## Modified Component Props

### `RankingBoardProps` — extended (`src/components/game/RankingBoard.tsx`)

```typescript
export interface RankingBoardProps {
  countries: Country[];
  slotAssignments: (string | null)[];
  lockedSlots: boolean[];
  onSlotsChange: (assignments: (string | null)[]) => void;
  disabled?: boolean;
  /**
   * Pre-formatted value strings for each slot position (index 0–4).
   * null means no value to display (slot unlocked, empty, or value unavailable).
   * When provided, locked slots render their value alongside the country name.
   */
  slotValues?: (string | null)[];
}
```

### `FeedbackRowProps` — extended (`src/components/game/FeedbackRow.tsx`)

```typescript
interface FeedbackRowProps {
  guess: Guess;
  countries: Country[];
  statIndex?: number;
  guessIndex?: number;
  /**
   * Pre-formatted value strings keyed by country ID.
   * When provided, correct positions in this row display the value under the country name.
   */
  valueMap?: Record<string, string>;
}
```

---

## State Flow

```
DatasetStat.unit          ─┐
DatasetEntry.value (×5)   ─┤──► puzzle-generator.ts ──► StatDef.unit
                           └──► puzzle-generator.ts ──► StatDef.values

StatDef.unit  ──┐
StatDef.values ─┤──► page.tsx (formatStatValue) ──► slotValues: (string|null)[]
lockedSlots    ─┘                                       │
                                                        ▼
                                               RankingBoard.tsx
                                               (renders value on locked slots)

StatDef.unit   ──┐
StatDef.values  ─┤──► page.tsx (formatStatValue) ──► valueMap: Record<string,string>
                 └──────────────────────────────────────│
                                                        ▼
                                               FeedbackRow.tsx (P3)
                                               (renders value on correct cells)
```
