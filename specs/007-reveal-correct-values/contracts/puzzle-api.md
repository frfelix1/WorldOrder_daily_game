# Puzzle API Contract: StatDef Extension

**Feature**: Reveal Correct Values (007)
**Date**: 2026-05-27
**Route**: `GET /api/puzzle?date=YYYY-MM-DD`

This document describes the additive change to the `StatDef` shape within the puzzle API response. The response type `PuzzleFile` gains `unit` and `values` on each stat definition.

---

## `StatDef` shape (after this feature)

```typescript
interface StatDef {
  id: string;           // e.g. "stat_1"
  label: string;        // e.g. "Land Area"
  category: string;     // e.g. "geography"
  tooltip: string;
  direction: 'asc' | 'desc';
  solution: string[];   // Country IDs, position 0 = rank 1

  // NEW fields
  unit: string;                    // e.g. "km²"
  values: Record<string, number>;  // country_id → raw value, exactly 5 entries
}
```

---

## Field Contracts

### `unit`

| Property | Value |
|---|---|
| Type | `string` |
| Non-empty | always |
| Source | `DatasetStat.unit` (verbatim) |
| Examples | `"km²"`, `"million USD"`, `"%"`, `"index (0–1)"`, `"Mbit/s"` |

### `values`

| Property | Value |
|---|---|
| Type | `Record<string, number>` |
| Key | ISO alpha-3 country ID (matches `PuzzleFile.countries[*].id`) |
| Value | Raw numeric measurement from `DatasetEntry.value` |
| Entry count | Exactly 5 (one per puzzle country) |
| Finite | All values pass `isFinite(v)` |
| Zero-value | Entries with `DatasetEntry.zeroValue === true` have `value: 0` — present, not omitted |

---

## Example response fragment

```json
{
  "date": "2026-05-27",
  "countries": [
    { "id": "SWE", "name": "Sweden", "flagCode": "se" },
    { "id": "NOR", "name": "Norway", "flagCode": "no" },
    { "id": "DEU", "name": "Germany", "flagCode": "de" },
    { "id": "JPN", "name": "Japan", "flagCode": "jp" },
    { "id": "KEN", "name": "Kenya", "flagCode": "ke" }
  ],
  "stats": [
    {
      "id": "stat_1",
      "label": "Land Area",
      "category": "geography",
      "tooltip": "Total land area in square kilometres",
      "direction": "desc",
      "solution": ["NOR", "SWE", "DEU", "KEN", "JPN"],
      "unit": "km²",
      "values": {
        "SWE": 449964,
        "NOR": 385207,
        "DEU": 357114,
        "JPN": 377975,
        "KEN": 580367
      }
    }
  ]
}
```

---

## Backwards compatibility

The two new fields are **additive** — existing clients that do not read `unit` or `values` continue to function without change. No existing fields are removed or modified. The `solution` field, which previously was the only derived field in `StatDef`, retains its existing shape and semantics.

---

## Display formatting

Consumers SHOULD use `formatStatValue(value, unit)` from `src/lib/formatting.ts` to produce the user-visible string. Direct interpolation (e.g., template literals) is not recommended because it skips thousands-separator formatting for large values.
