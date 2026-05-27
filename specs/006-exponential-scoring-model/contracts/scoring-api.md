# Scoring API Contract

**Feature**: Exponential Scoring Model
**Date**: 2026-05-27
**File**: `src/lib/scoring.ts`

This document defines the public TypeScript function contract for the scoring module after the exponential model change. All three exported functions are modified or replaced.

---

## `scoreForRound`

**New function** — the core exponential formula.

```typescript
/**
 * Computes the score for a single round given the number of wrong guesses.
 *
 * Formula: Math.max(0, Math.round(ROUND_MAX * DECAY_BASE ** wrongGuesses))
 *   ROUND_MAX  = 33
 *   DECAY_BASE = 0.65
 *
 * @param wrongGuesses - Number of incorrect full-ranking attempts (≥ 0).
 *                       Equals guesses.length - 1 for a solved round.
 * @returns Integer in the range [0, 33].
 */
export function scoreForRound(wrongGuesses: number): number
```

**Behaviour table**:

| `wrongGuesses` | Return value |
|---|---|
| 0 | 33 |
| 1 | 21 |
| 2 | 14 |
| 3 | 9 |
| 4 | 6 |
| 5 | 4 |
| 6 | 2 |
| 7 | 1 |
| ≥ 8 | 0 |

**Invariants**:
- Return value is always an integer (`Number.isInteger(result) === true`)
- Return value is always `≥ 0`
- Return value is always `≤ 33`
- `scoreForRound(0) === 33` (perfect round)
- `scoreForRound(n) >= scoreForRound(n + 1)` for all `n ≥ 0` (monotonically non-increasing)

---

## `scoreForStat` (updated signature)

Wraps `scoreForRound` for a `StatSession`. Replaces the old per-position scoring.

```typescript
/**
 * Computes the score for a completed stat session.
 *
 * Delegates to scoreForRound using round-level wrong-guess count.
 * The last guess in a solved session is always correct, so
 * wrongGuesses = session.guesses.length - 1.
 *
 * @param session - A StatSession with at least one guess (the solving guess).
 * @returns Integer in the range [0, 33].
 */
export function scoreForStat(session: StatSession): number
```

**Breaking change from previous signature**:

| | Old | New |
|---|---|---|
| Parameters | `(guesses: Guess[], solution: string[])` | `(session: StatSession)` |
| Max return value | `50` | `33` |
| Scoring granularity | Per-position (`bulls[]`) | Per-round (`guesses.length`) |

**Call sites that must be updated**: `src/app/page.tsx` (line ~183).

---

## `totalScore` (updated signature)

Sums three round scores and applies the perfect-game bonus.

```typescript
/**
 * Computes the total game score across all three stat sessions.
 *
 * Applies a 1-point perfect-game bonus when all three round scores equal 33,
 * bringing the maximum from 99 to 100.
 *
 * @param statSessions - Exactly three StatSession objects (one per stat).
 * @returns Integer in the range [0, 100].
 */
export function totalScore(statSessions: StatSession[]): number
```

**Breaking change from previous signature**:

| | Old | New |
|---|---|---|
| Parameters | `(statSessions: StatSession[], solutions: string[][])` | `(statSessions: StatSession[])` |
| Max return value | `150` | `100` |
| Perfect bonus | None | `+1` when all rounds score 33 |

**Invariants**:
- Return value is always an integer
- Return value is always in `[0, 100]`
- `totalScore([s1, s2, s3]) === 100` if and only if all three sessions solved on first guess
- `totalScore([s1, s2, s3]) <= 99` if any session has `guesses.length > 1`

**Call sites that must be updated**: `src/app/page.tsx` (line ~183).

---

## `buildShareText` (unchanged signature)

No signature change. The function reads `state.finalScore` which will now be in range 0–100 rather than 0–150. No logic change required.

```typescript
export function buildShareText(
  state: { stats: StatSession[]; finalScore: number | null },
  puzzleNumber: number,
): string
```

**Behavioural change**: The score in the header line (`Rankle #N — X pts`) will now be in range 0–100.

---

## Constants (exported for test use)

```typescript
/** Maximum score per round. */
export const ROUND_MAX: number  // = 33

/** Geometric decay rate per wrong guess. */
export const DECAY_BASE: number  // = 0.65

/** Bonus applied when all three rounds achieve ROUND_MAX. */
export const PERFECT_BONUS: number  // = 1

/** Maximum total game score. */
export const GAME_MAX: number  // = 100
```

Exporting constants allows unit tests and display components to use them as canonical values rather than hard-coding `33` or `100`.
