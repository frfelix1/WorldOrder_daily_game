# Data Model: Revamp Results Screen

**Feature**: 008 — Revamp Results Screen
**Date**: 2026-05-27

---

## Overview

Feature 008 introduces no new storage, no new API fields, and no new TypeScript interfaces in `src/types/index.ts`. All necessary data already exists:

- `PuzzleFile.stats[n].values` — per-country correct values (added in feature 007, optional)
- `PuzzleFile.stats[n].unit` — unit string for formatting (added in feature 007, optional)
- `PuzzleFile.stats[n].solution` — country IDs in rank order (always present)
- `GameState.stats[n].guesses` — all guess rows for each stat (always present)

The data model changes in this feature are **display-only**: new component props, a new UI component, and a new local state union type.

---

## New Component: `CorrectValuesRow`

**Location**: `src/components/game/CorrectValuesRow.tsx`

### Props Interface

```typescript
interface CorrectValuesRowProps {
  /** The stat definition; uses .solution, .values, and .unit */
  stat: StatDef;
  /** All five puzzle countries, for ID → name/flag lookup */
  countries: Country[];
}
```

### Behaviour

| `stat.values` / `stat.unit` | Render |
|-----------------------------|--------|
| Both present | Five cells in `solution` order, each showing flag + name + formatted value |
| Either absent (pre-007 puzzle) | Returns `null` — nothing rendered |

### Cell Data (per country in `solution` order)

| Field | Source | Notes |
|-------|--------|-------|
| `country` | `countries.find(c => c.id === countryId)` | `null` if not found (graceful: show `?`) |
| `formattedValue` | `formatStatValue(stat.values[countryId], stat.unit)` | Only rendered when both are defined |
| `rank` | Index in `stat.solution` + 1 | Position 1 = rank 1 |

---

## Modified Component: `ResultCard`

### New Local State

```typescript
// Replaces: const [copied, setCopied] = useState(false)
const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle');
```

### Derived Display Map (share button label)

| `shareState` | Button text |
|-------------|-------------|
| `'idle'` | `'Share Result'` |
| `'copied'` | `'Copied!'` |
| `'error'` | `'Copy failed'` |

### `handleShare` Control Flow (revised)

```
handleShare():
  text ← buildShareText(state, puzzleNumber)
  try:
    await navigator.clipboard.writeText(text)
    setShareState('copied')
    setTimeout(() → setShareState('idle'), 2000)
  catch:
    setShareState('error')
    setTimeout(() → setShareState('idle'), 2000)
```

No `navigator.share` branch. No silent catches.

### Stat Section Structure (per `state.stats[i]`)

```
<section aria-label={puzzle.stats[i].label}>
  <p>  ← stat label heading (existing style)
  <FeedbackRow> × N  ← one per guess (existing, no valueMap)
  <CorrectValuesRow>  ← new; renders null if values/unit absent
</section>
```

---

## Modified Component: `ScoreDisplay`

### Animation Properties Removed

| Property | Old Value | New Value |
|----------|-----------|-----------|
| `animation` | `'shimmerGold 2.5s linear infinite'` | removed |
| `backgroundSize` | `'200% auto'` | removed |
| `transition` | `'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)'` | removed |

Static properties (`backgroundImage` gradient, `boxShadow`) are retained as non-animated decoration.

### ResultCard Score Bar

| Property | Old Value | New Value |
|----------|-----------|-----------|
| `transition` | `'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)'` | removed |

---

## Validation Rules

| Rule | Source | How Enforced |
|------|--------|--------------|
| `CorrectValuesRow` renders `null` when `values` or `unit` absent | Spec edge case | TypeScript optional-chaining; tests |
| `shareState` never stays at `'error'` or `'copied'` indefinitely | FR-009, FR-010 | `setTimeout(() → 'idle', 2000)` in both branches |
| `handleShare` never calls `navigator.share` | FR-007, FR-008 | No `navigator.share` call exists in the new implementation |
| Score bar renders at full width immediately (no animated transition) | FR-002 | `transition` property removed; `pct` = `Math.round((finalScore / 100) * 100)` always |

---

## State Transitions: `shareState`

```
idle  ──[click]──▶  clipboard.writeText
                         │
                   ┌─────┴─────┐
                 success     failure
                   │           │
                 copied      error
                   │           │
              [2 s timeout] [2 s timeout]
                   └─────┬─────┘
                        idle
```

---

## No New Types Required

All required types are already in `src/types/index.ts`:
- `StatDef` (with optional `values` and `unit` from feature 007)
- `Country`
- `GameState`, `StatSession`, `Guess`

The `'idle' | 'copied' | 'error'` union is local to `ResultCard` and does not require a named export.
