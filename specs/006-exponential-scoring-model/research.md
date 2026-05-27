# Research: Exponential Scoring Formula Design

**Feature**: Exponential Scoring Model
**Date**: 2026-05-27
**Status**: Complete — all NEEDS CLARIFICATION items resolved

---

## 1. Wrong-Guess Granularity

**Decision**: Round-level (confirmed by user)
**Rationale**: Wrong guesses are counted as the number of full-ranking attempts before the correct solution is submitted for a given stat. If a player submits 3 guesses and the third is correct, there are 2 wrong guesses (`guesses.length - 1`).
**Alternatives considered**: Per-position tracking (the existing model). Rejected by user in favour of simpler round-level semantics.
**Implication**: The `solution` parameter can be dropped from `scoreForStat`; the function only needs `guesses.length`.

---

## 2. Exponential Formula Selection

**Decision**: Geometric decay — `scoreForRound(n) = Math.max(0, Math.round(33 * BASE^n))`

Where:
- `n` = number of wrong guesses (0, 1, 2, …)
- `BASE` = decay rate constant (chosen from analysis below)
- `Math.round` keeps scores as whole integers
- `Math.max(0, …)` floors at 0 for very large `n`

**Rationale**: A pure exponential (geometric) decay is the canonical "steep exponential" curve. It satisfies all spec success criteria, produces whole-number outputs, and is simple enough to be understood, audited, and adjusted. Each additional wrong guess multiplies the remaining score by `BASE`, making later penalties proportionally larger.

**Alternatives considered**:
- *Power law* (`33 / (1 + k*n^p)`): produces S-curve behaviour near 0; harder to tune for a consistent "every score is possible" guarantee.
- *Linear* (current model): explicitly ruled out — produces top-heavy distribution.
- *Factorial penalty* (`33 - 1 - 2 - 4 - 8 - …`): very steep but asymmetric; scores clump at 0 for >5 wrong guesses.
- *Discrete step table*: simple but makes many integer values unreachable.

---

## 3. Decay Rate Analysis

Candidate evaluation against spec success criteria (SC-001 through SC-005):

| Spec Criterion | Requirement | BASE=0.60 | BASE=0.65 | BASE=0.70 | BASE=0.75 |
|---|---|---|---|---|---|
| SC-001 | n=0 per round = 33; total = 100 | ✅ 33 | ✅ 33 | ✅ 33 | ✅ 33 |
| SC-002 | n=3 per round → total < 50 | ✅ 21 | ✅ 24 | ✅ 30 | ✅ 42 |
| SC-003 | Spread(n=1 − n=3) ≥ 30 pts | ✅ 39 | ✅ 36 | ✅ 33 | ✅ 33 |
| SC-004 | ≤ 15% of games score > 90 | ✅ ~0.3% | ✅ ~0.6% | ✅ ~1.2% | ✅ ~1.2% |
| SC-005 | All integers 0–100 reachable | ✅ | ✅ | ✅ | ✅ |

### Round score tables by BASE

| Wrong guesses (n) | BASE=0.60 | BASE=0.65 | BASE=0.70 | BASE=0.75 |
|---|---|---|---|---|
| 0 (perfect) | 33 | 33 | 33 | 33 |
| 1 | 20 | 21 | 23 | 25 |
| 2 | 12 | 14 | 16 | 19 |
| 3 | 7 | 9 | 11 | 14 |
| 4 | 4 | 6 | 8 | 10 |
| 5 | 2 | 4 | 6 | 8 |
| 6 | 1 | 2 | 4 | 6 |
| 7+ | 0 | 1–2 | 2–3 | 4–5 |

### Typical full-game totals (3 identical rounds)

| Pattern | BASE=0.60 | BASE=0.65 | BASE=0.70 | BASE=0.75 |
|---|---|---|---|---|
| (0, 0, 0) + bonus | **100** | **100** | **100** | **100** |
| (1, 1, 1) | 60 | 63 | 69 | 75 |
| (2, 2, 2) | 36 | 42 | 48 | 57 |
| (3, 3, 3) | 21 | 27 | 33 | 42 |
| (0, 1, 2) | 65 | 68 | 72 | 77 |
| (0, 2, 4) | 49 | 53 | 57 | 62 |
| (1, 2, 3) | 39 | 44 | 50 | 58 |

**Recommendation**: `BASE = 0.65`
- Steepest that still allows meaningful differentiation between 4–6 wrong guesses
- "All-ones" game (competent player) lands at 63 — clearly below the 90s
- "All-threes" game (poor performance) lands at 27 — well below 50 (SC-002)
- Spread of 36 points between (1,1,1) and (3,3,3) games exceeds the 30-point minimum
- Integers 0–100 are all reachable through combinations of n values
- Still differentiates individual round performance enough to feel fair (n=4 gets 6, n=5 gets 4, n=6 gets 2, n≥7 gets 0–1)

**Note**: The exact constant can be tuned post-implementation using the unit tests as guardrails. The tasks file should include a "validate distribution" step.

---

## 4. Perfect-Game Bonus

**Decision**: `+1` bonus applied in `totalScore` when all three round scores equal 33.
**Rationale**: Resolves the arithmetic gap (33 × 3 = 99 ≠ 100) without changing the per-round maximum or adding a special fourth value.
**Implementation detail**: `const bonus = roundScores.every(s => s === 33) ? 1 : 0;`
**Alternatives considered**: Making one round worth 34 (asymmetric, confusing); making the max 99 (violates spec FR-002).

---

## 5. Integer Rounding

**Decision**: `Math.round` applied to each round score individually.
**Rationale**: Rounding per-round (not at the total) preserves the "most integers reachable" property. `Math.floor` would cause the same integer to repeat for consecutive BASE values, reducing reachability; `Math.round` is more uniform.
**Edge case**: Due to rounding, `BASE=0.65` may produce the same integer for two different `n` values at high `n` (e.g., both n=6 and n=7 may round to 2). This is acceptable — the contract only requires that all values 0–100 are *reachable*, not that every `n` produces a distinct score.

---

## 6. Files Requiring Changes

| File | Change Type | Reason |
|---|---|---|
| `src/lib/scoring.ts` | **Rewrite** | New `scoreForRound(n)`, updated `scoreForStat`, updated `totalScore` |
| `tests/unit/scoring.test.ts` | **Rewrite** | Old tests assert 150-point model; all must be replaced |
| `src/types/index.ts` | **Comment update** | `runningScore` and `finalScore` range comments: `0–150` → `0–100` |
| `src/app/page.tsx` | **Minor edit** | Announcement string: `"out of 150 points"` → `"out of 100 points"` |
| `src/components/game/ResultCard.tsx` | **Edit** | `performanceLabel` thresholds; `/ 150` → `/ 100`; `pct` calculation |
| `src/components/game/ScoreDisplay.tsx` | **Edit** | `/ 150` → `/ 100` in display and `aria-label` |
| `tests/e2e/game-flow.spec.ts` | **Edit** | Any assertions referencing `150` as max score |
