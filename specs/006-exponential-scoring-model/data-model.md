# Data Model: Exponential Scoring Model

**Feature**: Exponential Scoring Model
**Date**: 2026-05-27

This document describes the data entities affected by the scoring model change. No new entities are introduced. All changes are value-range updates or comment corrections on existing fields.

---

## Changed Entities

### `GameState` (`src/types/index.ts`)

The `GameState` interface captures live and final scores during a game session. Two fields change their documented range:

| Field | Before | After | Notes |
|---|---|---|---|
| `runningScore: number` | range `0–150` (comment) | range `0–100` (comment) | Value is recomputed after each guess via `totalScore()`; the type itself (`number`) does not change. |
| `finalScore: number \| null` | range `0–150` (comment) | range `0–100` (comment) | Set when `status` becomes `'complete'`. |

No structural change to `GameState`. Existing `localStorage`-persisted states are automatically migrated because scores are always recomputed from `guesses[]` on load (Constitution Principle IV). Stale saved games with old 0–150 scores will be overwritten on first interaction.

---

### `PlayerStats` (`src/types/index.ts`)

`PlayerStats` accumulates scores across all completed games:

| Field | Before | After | Notes |
|---|---|---|---|
| `totalScore: number` | sum of 0–150 scores | sum of 0–100 scores | Accumulated lifetime total; will grow more slowly per game. Historical values are not migrated (acceptable — no migration mechanism exists). |
| `bestScore: number` | max 150 | max 100 | Best single-game score. Old persisted values of 100–150 will be stale but `PlayerStats` has no migration; old high scores will naturally be replaced over time. |
| `scoreDistribution: Record<string, number>` | keys `"0"` through `"150"` | keys `"0"` through `"100"` | Distribution histogram of final scores. Old keys above 100 become unreachable. |

---

### `ResultCard` (`src/types/index.ts`)

`ResultCard` is a derived type (not persisted). It is computed and immediately displayed:

| Field | Before | After | Notes |
|---|---|---|---|
| `finalScore: number` | range `0–150` | range `0–100` | No structural change; value changes because it derives from `GameState.finalScore`. |

---

## Entities with No Change

| Entity | Reason unaffected |
|---|---|
| `Guess` | Structure unchanged — still `{ order: string[], bulls: boolean[] }`. Bulls are still determined position-by-position for game logic (highlighting correct positions); only the scoring function ignores per-position counts. |
| `StatSession` | Structure unchanged — `guesses[]` array is the source of truth. Scoring now reads `guesses.length` instead of per-position miss counts. |
| `PuzzleFile` / `StatDef` | Purely puzzle data — no scoring information stored here. |
| `DatasetEntry` / `DatasetStat` / `Dataset` | Raw data layer — unaffected. |

---

## Scoring Formula Constants (not stored — inline in `scoring.ts`)

These are implementation constants, not persisted data. Documented here for reference:

| Constant | Value | Meaning |
|---|---|---|
| `ROUND_MAX` | `33` | Maximum points per round |
| `DECAY_BASE` | `0.65` | Geometric decay rate per wrong guess (see research.md §3) |
| `PERFECT_BONUS` | `1` | Bonus added when all 3 rounds score `ROUND_MAX` |
| `GAME_MAX` | `100` | `3 × ROUND_MAX + PERFECT_BONUS` |

---

## State Transitions

```
Game starts
  → runningScore = 0
  
Each guess submitted (wrong)
  → runningScore = totalScore(updatedStats)  [0–100, partial game]

Stat solved
  → runningScore updated with full round score for that stat

All 3 stats solved
  → status = 'complete'
  → finalScore = runningScore  [0–100]
  → PlayerStats.bestScore updated if finalScore > previous best
  → PlayerStats.scoreDistribution[String(finalScore)] incremented
```

No state transitions change structurally — only the numeric range of score values changes.
