# Quickstart: Exponential Scoring Formula Reference

**Feature**: Exponential Scoring Model
**Date**: 2026-05-27

A quick reference for implementing and verifying the new scoring model.

---

## The Formula

```
scoreForRound(n) = max(0, round(33 × 0.65^n))
```

- `n` = wrong guess count = `guesses.length - 1` for any solved round
- `round` = standard rounding (0.5 rounds up)
- `max(0, …)` ensures no negative score

```
totalScore = sum(scoreForRound(n) for each of 3 rounds)
           + (1 if all three rounds scored 33, else 0)
```

---

## Score Table

| Wrong guesses | Round score | Typical 3-round total |
|---|---|---|
| 0 (perfect) | **33** | **100** (with perfect-game bonus) |
| 1 | 21 | 63 |
| 2 | 14 | 42 |
| 3 | 9 | 27 |
| 4 | 6 | 18 |
| 5 | 4 | 12 |
| 6 | 2 | 6 |
| ≥ 8 | 0 | 0 |

---

## Key Acceptance Tests

```
scoreForRound(0) === 33
scoreForRound(3) < 16         // below half-max (FR-005)
scoreForRound(n) >= 0         // floor (FR-006)
totalScore([perfect×3]) === 100   // SC-001
totalScore([3-wrong×3]) < 50      // SC-002
```

---

## Files to Touch

1. `src/lib/scoring.ts` — primary rewrite
2. `tests/unit/scoring.test.ts` — full test rewrite (test-first per Constitution II)
3. `src/types/index.ts` — update `0–150` range comments to `0–100`
4. `src/app/page.tsx` — announcement string
5. `src/components/game/ResultCard.tsx` — `performanceLabel` thresholds, `/ 150` → `/ 100`
6. `src/components/game/ScoreDisplay.tsx` — `/ 150` → `/ 100`
7. `tests/e2e/game-flow.spec.ts` — update max-score assertions
