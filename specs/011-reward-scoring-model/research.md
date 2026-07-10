# Research: Reward-Based Scoring Model

**Date**: 2026-07-10
**Feature**: `011-reward-scoring-model`

## Research Questions

### R1: Optimal split between ordering and distance components

**Decision**: 40/60 split — 133 points ordering, 200 points distance (per stat)

**Rationale**: The line-scale placement is the novel mechanic differentiating this game. Ordering (the original mechanic) still matters but the placement precision should be the primary skill expression. A 40/60 split ensures ordering alone can still yield a respectable score (~40% of max) but rewards players who master the distance mechanic significantly more.

**Alternatives considered**:
- 50/50 (equal weight): Rejected because it under-values the new mechanic that makes the game unique
- 30/70 (heavy distance): Rejected because ordering is still the "achievable" baseline and shouldn't feel insignificant
- 60/40 (heavy ordering): Rejected because it would make the line-scale feel like decoration

### R2: Pairwise ordering scoring (Kendall tau approach)

**Decision**: Score each of the 10 possible pairs from 5 countries. Each concordant pair earns points.

**Rationale**: Kendall tau distance is a well-established measure of ranking agreement. With 5 items there are C(5,2)=10 pairs. Each pair is either concordant (correct relative order) or discordant. This gives granular differentiation — swapping 2 adjacent items only loses 1 pair (~13 pts) while a full reversal loses all 10 pairs.

**Implementation detail**: 
- 10 pairs × 13.3 pts = 133 (use `Math.round(concordantPairs * 133 / 10)`)
- This naturally handles partial correctness — no cliff edges

**Alternatives considered**:
- Spearman rank correlation: Harder to explain to players, and negative correlations produce confusing results
- Position-exact matching (bulls): Too binary — 0 or full points per position
- Hamming distance on permutation: Doesn't capture "almost right" well

### R3: Distance scoring with tolerance band

**Decision**: Per-node scoring with 5% tolerance for full marks, linear decay to 0 at 100% error.

**Rationale**: 
- 5 nodes × 40 pts max = 200 pts per stat
- If `|placed - true| ≤ 0.05`: full 40 pts (player was "bang on")
- If `|placed - true| > 0.05`: `40 × max(0, 1 - (error - 0.05) / 0.95)` — linear from 40 down to 0
- The 5% tolerance accounts for imprecise touch/mouse input and the visual density of 5 nodes on a line

**Alternatives considered**:
- No tolerance band: Rejected — near-impossible to get pixel-perfect, frustrating UX
- 10% tolerance: Too generous — most placements would get full marks, reducing differentiation
- Exponential decay: Harder to reason about, and linear is intuitive ("closer = proportionally more points")
- Squared error: Over-penalizes moderate errors, under-differentiates near-misses

### R4: Attempt multiplier (geometric decay vs flat penalty)

**Decision**: Geometric decay at 0.7× per wrong guess, applied to total earned points for that stat.

**Rationale**: 
- 1st try: 100% (multiplier = 1.0)
- 2nd try: 70% (multiplier = 0.7)
- 3rd try: 49% (multiplier = 0.49)
- 4th try: 34% (multiplier = 0.343)
- This preserves meaningful reward even after multiple tries while clearly incentivizing fewer guesses
- Applied multiplicatively to (ordering + distance) so both components are affected equally

**Alternatives considered**:
- Flat subtraction (e.g., -50 pts per wrong guess): Can produce negative/zero scores too easily, defeating the "reward" feel
- Shallower decay (0.8×): After 3 tries you still have 51% — not enough incentive
- Steeper decay (0.5×): After 2 tries you're at 25% — too punishing, feels like the old model

### R5: Perfect bonus design

**Decision**: +1 point when all 3 stats are perfect (first try, all concordant, all within tolerance).

**Rationale**: 3 × 333 = 999. The +1 bonus makes 1000 achievable only for flawless play, creating a memorable "perfect game" moment. The bonus is tiny enough to not distort scoring but psychologically satisfying.

### R6: Performance tier thresholds at 1000-point scale

**Decision**: Proportional recalibration from old 100-point thresholds.

| Tier | Old threshold | New threshold |
|------|--------------|---------------|
| Perfect | 100 | 1000 |
| Excellent | ≥80 | ≥800 |
| Great | ≥60 | ≥600 |
| Good | ≥40 | ≥400 |
| Keep Exploring | <40 | <400 |

**Rationale**: Direct 10× scaling preserves the existing balance. May need tuning after playtesting but this is the sensible starting point.

## Summary

All research questions resolved. No external dependencies or unknowns remain. The scoring model is fully defined as pure math, compatible with the existing `placementAccuracy` and `deriveOrder` utilities from `src/lib/line-scale.ts`.
