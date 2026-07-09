# Phase 1 Data Model: Line-Scale Placement Mechanic

**Feature**: 010-line-scale-placement
**Date**: 2026-07-09
**Source**: [spec.md](./spec.md) Key Entities · [research.md](./research.md) Decisions 2, 3, 4, 5, 9

This feature is entirely client-side; there is **no database and no server persistence**. "Data model" here means the in-memory / `localStorage` TypeScript entities and their derivations. Types live in `src/types/index.ts`; pure operations live in `src/lib/line-scale.ts` and `src/lib/scoring.ts`. All values are derived from the existing `PuzzleFile` (unchanged) — no dataset/generator/API change.

---

## Existing types reused unchanged

- **`Country`** (`id`, `name`, `flagCode`) — the token identity/appearance.
- **`StatDef`** (`id`, `label`, `direction`, `solution: string[]`, `unit?`, `values?: Record<string, number>`) — provides the answer key (`solution`) and the per-country raw values (`values`) for the five puzzle countries. **`values` is required by this feature** (present in all puzzles since feature 007); the scale endpoints and true positions derive from it.
- **`PuzzleFile`**, **`GameState`**, **`PlayerStats`** — unchanged in shape except the additive `Guess` extension below.

---

## New / extended entities

### 1. Scale (derived, not persisted)

The value axis for the active stat. Derived once per stat from `StatDef.values`.

| Field | Type | Derivation / Rule |
|-------|------|-------------------|
| `min` | `number` | `Math.min(...Object.values(stat.values))` — smallest of the five |
| `max` | `number` | `Math.max(...Object.values(stat.values))` — largest of the five |
| `unit` | `string` | `stat.unit ?? ''` |

**Rules / invariants**:
- `min ≤ max`. If `min === max` (degenerate; not produced by the generator), interpolation returns `min` for all fractions and accuracy is treated as fully satisfied (see `line-scale.ts` guards).
- Endpoints are **labels only**; no country is auto-pinned (FR-004).

### 2. TokenPlacement (in-memory UI state)

Where each country currently sits on the line for the active stat.

| Field | Type | Rule |
|-------|------|------|
| `positions` | `Record<countryId, number>` | Fraction `t ∈ [0, 1]` per placed country. Absent key = not yet placed. |
| `locked` | `Record<countryId, boolean>` (or derived) | `true` when the country was in its correct relative position on a prior guess; locked tokens are not re-positionable (mirrors current lock-correct behavior). |

**Rules / invariants**:
- `0 ≤ t ≤ 1` always (clamped on drag end / keyboard move — FR-006).
- Submission blocked until all five country IDs have a `positions` entry (FR-008).
- Replaces the old `slotAssignments: (string|null)[]` + `lockedSlots: boolean[]` page state (research Decision 9).

### 3. Guess (extended — persisted in `GameState.stats[i].guesses`)

Additive, backwards-compatible extension of the existing `Guess`.

```ts
export interface Guess {
  order: string[];                       // existing: left-to-right order (derived from positions)
  bulls: boolean[];                      // existing: positional correctness vs. solution
  positions?: Record<string, number>;    // NEW (optional): submitted fraction per country
}
```

**Rules / invariants**:
- `order` is derived by sorting placed country IDs ascending by `positions[id]`, with deterministic **tie-break by country ID** (research Decision 3, FR-011).
- `bulls[i] = (order[i] === stat.solution[i])`; a stat is **solved** when every `bulls[i]` is `true` (FR-009). This reuses today's positional-correctness model so `FeedbackRow` and `buildShareText` keep working.
- `positions` is optional so older saved games (without it) still load and share correctly (FR-017/FR-018). When absent, accuracy-based scoring falls back gracefully (see scoring note below).

### 4. StatSession / GameState / PlayerStats (shapes unchanged)

- `StatSession` (`statId`, `solved`, `guesses[]`) — unchanged; `guesses` now hold extended `Guess` objects.
- `GameState` (`runningScore`, `finalScore`, `activeStatIndex`, …) — unchanged; scores still recomputed from `guesses[]` via `scoring.ts` (Constitution IV), never mutated in place.
- `PlayerStats` (`scoreDistribution`, streaks, …) — unchanged; because the total remains 0–100, existing buckets stay valid (research Decision 5).

---

## Pure operations (`src/lib/line-scale.ts`)

All deterministic, side-effect-free (Constitution IV), and unit-tested first (Constitution II).

| Function | Signature (conceptual) | Rule |
|----------|------------------------|------|
| `valueAtFraction` | `(t: number, min: number, max: number) => number` | `min + clamp01(t) × (max − min)`; if `max===min` → `min` |
| `fractionForValue` | `(value: number, min: number, max: number) => number` | `max===min ? 0 : clamp01((value − min)/(max − min))` |
| `deriveOrder` | `(positions: Record<string, number>) => string[]` | ascending by fraction; tie-break by country ID (stable, deterministic) |
| `trueFractions` | `(values: Record<string, number>) => Record<string, number>` | `fractionForValue` for each country against the five's min/max |
| `placementAccuracy` | `(positions, values) => number` | `A = 1 − mean(|tᵢ − tᵢ*|) ∈ [0,1]`; `max===min` ⇒ `A=1` |
| `clamp01` | `(n: number) => number` | `Math.min(1, Math.max(0, n))` |

## Pure operations (`src/lib/scoring.ts`, extended)

Keeps existing exports (`ROUND_MAX=33`, `DECAY_BASE=0.65`, `PERFECT_BONUS=1`, `GAME_MAX=100`, `scoreForRound`, `totalScore`, `buildShareText`). Adds:

| Symbol | Purpose |
|--------|---------|
| `ACCURACY_FLOOR = 0.8` | Minimum share of the penalty-adjusted base kept on a solve (research Decision 5) |
| `accuracyFactor(A)` | `ACCURACY_FLOOR + (1 − ACCURACY_FLOOR) × A` |
| `scoreForStat(session, accuracy)` | `round(scoreForRound(wrongGuesses) × accuracyFactor(A))`, clamped `[0, 33]` |

**Rules / invariants** (map to spec):
- Integer in `[0, 33]` per stat (FR-015). Total in `[0, 100]` (FR-016).
- Monotonic in wrong guesses (fewer ⇒ higher) and in accuracy (higher ⇒ ≥) — FR-013/FR-014, SC-004/SC-005.
- `PERFECT_BONUS` applies only when all three stats score the full 33 (0 wrong guesses **and** `A=1`) — SC-007.
- **Backwards-compat fallback**: for a legacy `Guess` lacking `positions`, `scoreForStat` uses `A = 1` (accuracy-neutral), yielding the pre-existing penalty-only score so historical/edge states never break.

---

## State transitions (per stat)

```
UNPLACED ──(place all 5 tokens; each has positions[id]∈[0,1])──► READY_TO_SUBMIT
READY_TO_SUBMIT ──submit; order === solution?──► SOLVED
                              │ no
                              ▼
        WRONG_GUESS: record Guess(order,bulls,positions); lock correct tokens;
        keep them fixed; allow repositioning the rest ──► READY_TO_SUBMIT (loop)
SOLVED ──advance──► next stat's UNPLACED, or (after stat 3) GAME_COMPLETE
```

- On every submit, `runningScore = totalScore(stats)` recomputed from `guesses[]` (+ each stat's accuracy from its final `positions`).
- On `GAME_COMPLETE`: `finalScore` set; `PlayerStats` updated (played/completed/best/streak/`scoreDistribution`) — same pipeline as today.
- **Resume**: on reload, restore `activeStatIndex`, solved stats, and reconstruct the current board (`positions` + locked tokens) from the last `Guess` of the active stat (FR-017, SC-010).

---

## Validation rules summary (traceability)

| Rule | Spec ref |
|------|----------|
| Token fraction always clamped to `[0,1]` | FR-006 |
| Place anywhere (no fixed slots) | FR-003 |
| Player places all five; endpoints are labels only | FR-004 |
| Cannot submit until all five placed | FR-008 |
| Solved iff derived order equals `solution` | FR-009 |
| Deterministic tie-break by country ID | FR-011 |
| Per-stat score integer within `[0,33]` | FR-015 |
| Total within `[0,100]`, perfect bonus preserved | FR-016 |
| In-progress positions/locks persisted & restored | FR-017 |
| Share/results reflect per-stat outcomes | FR-018 |
