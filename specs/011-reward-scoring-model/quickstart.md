# Quickstart: Reward-Based Scoring Model

**Feature**: `011-reward-scoring-model`

## What's Changing

The scoring system in `src/lib/scoring.ts` is being rewritten from a decay-based model (start at max, subtract penalties) to a reward-based model (start at 0, earn points). Max score increases from 100 to 1000.

## Key Files

| File | Change |
|------|--------|
| `src/lib/scoring.ts` | Full rewrite — new constants, new scoring functions |
| `src/components/game/ScoreDisplay.tsx` | Display `/1000` instead of `/100` |
| `src/components/game/ResultCard.tsx` | Recalibrate tier thresholds (×10) |
| `tests/unit/scoring.test.ts` | Full rewrite — TDD for new model |
| `src/app/page.tsx` | Minor: ensure accuracy passed to new scoring functions |

## Development Approach (TDD)

1. **Write failing tests first** for the new scoring functions:
   - `orderingScore(positions, trueValues)` → [0, 133]
   - `distanceScore(positions, trueValues)` → [0, 200]
   - `scoreForStat(session, positions, trueValues)` → [0, 333]
   - `totalScore(statScores[])` → [0, 1000]

2. **Implement** the functions to make tests pass.

3. **Update components** to use new max (1000) and new tier thresholds.

4. **Run full suite**: `npm test` (coverage ≥80%) + `npm run test:e2e`

## Scoring Formula Quick Reference

```
Per stat (max 333):
  ordering = round(concordantPairs × 133 / 10)     # 10 pairs from 5 items
  distance = sum of per-node scores                  # 5 nodes × max 40 pts
    per node: error ≤ 0.05 → 40 pts
              error > 0.05 → 40 × max(0, 1 - (error - 0.05) / 0.95)
  
  rawTotal = ordering + distance
  multiplier = 0.7 ^ wrongGuesses
  statScore = round(rawTotal × multiplier)

Total (max 1000):
  sum(statScores) + perfectBonus(1 if all three = 333)
```

## Verification

```bash
npm test                  # Unit tests pass, coverage ≥80%
npm run build             # TypeScript compiles cleanly
npm run test:e2e          # Game flow works with new scores
```
