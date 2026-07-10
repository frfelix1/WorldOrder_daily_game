# Data Model: Reward-Based Scoring Model

**Feature**: `011-reward-scoring-model`

## Entities

### StatScore

Represents the computed score for a single stat round.

| Field | Type | Description |
|-------|------|-------------|
| orderingPoints | number | Points earned from correct pairwise ordering [0–133] |
| distancePoints | number | Points earned from placement proximity [0–200] |
| rawTotal | number | orderingPoints + distancePoints [0–333] |
| attemptMultiplier | number | Geometric decay factor: 0.7^wrongGuesses [0–1] |
| finalScore | number | Math.round(rawTotal × attemptMultiplier) [0–333] |

### GameScore

Aggregate score across all 3 stats.

| Field | Type | Description |
|-------|------|-------------|
| statScores | StatScore[3] | Individual stat scores |
| subtotal | number | Sum of statScores[].finalScore [0–999] |
| perfectBonus | number | 1 if all 3 stats have finalScore=333, else 0 |
| total | number | subtotal + perfectBonus [0–1000] |

### PerformanceTier

| Tier | Threshold | Label |
|------|-----------|-------|
| S | 1000 | Perfect |
| A | ≥800 | Excellent |
| B | ≥600 | Great |
| C | ≥400 | Good |
| D | <400 | Keep Exploring |

## State Transitions

No new state transitions. The existing `GameState` flow remains:
1. `in_progress` → player submits guesses per stat
2. Stat solved → `StatScore` computed from final guess positions + guess count
3. All 3 stats solved → `GameScore` computed → `status: 'complete'`

## Relationships

```
GameState
  └── stats: StatSession[3]
        └── guesses: Guess[]
              └── positions: Record<string, number>  ← input to scoring

GameScore (computed, not persisted separately)
  └── statScores: StatScore[3]
        ├── uses: Guess.positions → distance calculation
        ├── uses: deriveOrder(positions) → ordering calculation
        └── uses: guesses.length - 1 → attempt multiplier
```

## Validation Rules

- `orderingPoints` must be in [0, 133] and computed as `Math.round(concordantPairs * 133 / 10)`
- `distancePoints` must be in [0, 200] — sum of per-node scores (max 40 each × 5 nodes)
- `attemptMultiplier` = `Math.pow(0.7, wrongGuesses)` where wrongGuesses = guesses.length - 1
- `finalScore` clamped to [0, 333]
- `total` clamped to [0, 1000]
- Perfect bonus only awarded when all 3 `finalScore` values equal exactly 333
