import { describe, it, expect } from 'vitest';
import {
  concordantPairs,
  orderingScore,
  nodeDistanceScore,
  distanceScore,
  scoreForStat,
  totalScore,
  buildShareText,
  STAT_MAX,
  GAME_MAX,
  ORDERING_MAX,
  DISTANCE_MAX,
  TOLERANCE,
  ATTEMPT_DECAY,
  PERFECT_BONUS,
} from '../../src/lib/scoring';
import type { StatSession } from '../../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const COUNTRIES = ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'];

/** True values that produce order: NGA(10) < BRA(30) < DEU(50) < JPN(70) < AUS(90) */
const TRUE_VALUES: Record<string, number> = {
  NGA: 10, BRA: 30, DEU: 50, JPN: 70, AUS: 90,
};

/** Perfect positions (matching true fractions): 0, 0.25, 0.5, 0.75, 1.0 */
const PERFECT_POSITIONS: Record<string, number> = {
  NGA: 0, BRA: 0.25, DEU: 0.5, JPN: 0.75, AUS: 1.0,
};

function makeSession(wrongGuesses: number, positions?: Record<string, number>): StatSession {
  const pos = positions ?? PERFECT_POSITIONS;
  const guesses = [
    ...Array(wrongGuesses).fill(null).map(() => ({
      order: ['BRA', 'NGA', 'DEU', 'JPN', 'AUS'], // wrong order
      bulls: [false, false, true, true, true],
      positions: { NGA: 0.3, BRA: 0.1, DEU: 0.5, JPN: 0.75, AUS: 1.0 },
    })),
    {
      order: COUNTRIES,
      bulls: [true, true, true, true, true],
      positions: pos,
    },
  ];
  return { statId: 'stat_1', solved: true, guesses };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

describe('Scoring constants', () => {
  it('STAT_MAX is 333', () => expect(STAT_MAX).toBe(333));
  it('GAME_MAX is 1000', () => expect(GAME_MAX).toBe(1000));
  it('ORDERING_MAX is 133', () => expect(ORDERING_MAX).toBe(133));
  it('DISTANCE_MAX is 200', () => expect(DISTANCE_MAX).toBe(200));
  it('TOLERANCE is 0.05', () => expect(TOLERANCE).toBe(0.05));
  it('ATTEMPT_DECAY is 0.7', () => expect(ATTEMPT_DECAY).toBe(0.7));
  it('PERFECT_BONUS is 1', () => expect(PERFECT_BONUS).toBe(1));
});

// ─────────────────────────────────────────────────────────────────────────────
// T002: concordantPairs tests
// ─────────────────────────────────────────────────────────────────────────────

describe('concordantPairs', () => {
  const trueOrder = ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'];

  it('returns 10 for identical order (all pairs concordant)', () => {
    expect(concordantPairs(trueOrder, trueOrder)).toBe(10);
  });

  it('returns 0 for fully reversed order', () => {
    const reversed = [...trueOrder].reverse();
    expect(concordantPairs(reversed, trueOrder)).toBe(0);
  });

  it('returns 9 for a single adjacent swap', () => {
    const swapped = ['BRA', 'NGA', 'DEU', 'JPN', 'AUS'];
    expect(concordantPairs(swapped, trueOrder)).toBe(9);
  });

  it('returns a value between 0 and 10 for random permutations', () => {
    const perm = ['DEU', 'NGA', 'AUS', 'BRA', 'JPN'];
    const result = concordantPairs(perm, trueOrder);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T003: orderingScore tests
// ─────────────────────────────────────────────────────────────────────────────

describe('orderingScore', () => {
  it('returns 133 for perfect ordering', () => {
    expect(orderingScore(PERFECT_POSITIONS, TRUE_VALUES)).toBe(133);
  });

  it('returns 0 for fully reversed ordering', () => {
    const reversed: Record<string, number> = {
      NGA: 1.0, BRA: 0.75, DEU: 0.5, JPN: 0.25, AUS: 0,
    };
    expect(orderingScore(reversed, TRUE_VALUES)).toBe(0);
  });

  it('returns proportional score for partial ordering', () => {
    // Swap first two: 9/10 pairs
    const partial: Record<string, number> = {
      NGA: 0.25, BRA: 0, DEU: 0.5, JPN: 0.75, AUS: 1.0,
    };
    const score = orderingScore(partial, TRUE_VALUES);
    expect(score).toBe(Math.round(9 * 133 / 10)); // 120
  });

  it('is in range [0, 133]', () => {
    const score = orderingScore(PERFECT_POSITIONS, TRUE_VALUES);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(133);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T004: nodeDistanceScore tests
// ─────────────────────────────────────────────────────────────────────────────

describe('nodeDistanceScore', () => {
  it('returns 40 when within tolerance', () => {
    expect(nodeDistanceScore(0.5, 0.52)).toBe(40);
  });

  it('returns 40 at exactly the tolerance boundary', () => {
    expect(nodeDistanceScore(0.5, 0.55)).toBe(40);
  });

  it('returns less than 40 beyond tolerance (linear decay)', () => {
    const score = nodeDistanceScore(0.5, 0.7);
    expect(score).toBeLessThan(40);
    expect(score).toBeGreaterThan(0);
  });

  it('returns 0 for max error (error = 1.0)', () => {
    expect(nodeDistanceScore(0, 1)).toBeCloseTo(0, 5);
  });

  it('decays linearly between tolerance and max error', () => {
    // At error = 0.525 (midway between 0.05 and 1.0):
    // decay = 40 * (1 - (0.525 - 0.05)/0.95) = 40 * 0.5 = 20
    const score = nodeDistanceScore(0.0, 0.525);
    expect(score).toBeCloseTo(20, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T005: distanceScore tests
// ─────────────────────────────────────────────────────────────────────────────

describe('distanceScore', () => {
  it('returns 200 for perfect placement (all within tolerance)', () => {
    expect(distanceScore(PERFECT_POSITIONS, TRUE_VALUES)).toBe(200);
  });

  it('returns 200 when all are within tolerance', () => {
    // Shift each by 0.03 (within 0.05 tolerance)
    const closePositions: Record<string, number> = {
      NGA: 0.03, BRA: 0.28, DEU: 0.53, JPN: 0.72, AUS: 0.97,
    };
    expect(distanceScore(closePositions, TRUE_VALUES)).toBe(200);
  });

  it('degrades linearly for worse placement', () => {
    // Move all nodes significantly off
    const farPositions: Record<string, number> = {
      NGA: 0.5, BRA: 0.5, DEU: 0.5, JPN: 0.5, AUS: 0.5,
    };
    const score = distanceScore(farPositions, TRUE_VALUES);
    expect(score).toBeLessThan(200);
    expect(score).toBeGreaterThan(0);
  });

  it('is in range [0, 200]', () => {
    const score = distanceScore(PERFECT_POSITIONS, TRUE_VALUES);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T010: scoreForStat tests
// ─────────────────────────────────────────────────────────────────────────────

describe('scoreForStat', () => {
  it('combines ordering + distance for a perfect first-try solve = 333', () => {
    const session = makeSession(0);
    expect(scoreForStat(session, PERFECT_POSITIONS, TRUE_VALUES)).toBe(333);
  });

  it('applies attempt multiplier (0.7^wrongGuesses)', () => {
    const session = makeSession(1);
    const score = scoreForStat(session, PERFECT_POSITIONS, TRUE_VALUES);
    // (133 + 200) * 0.7 = 333 * 0.7 = 233.1 → 233
    expect(score).toBe(Math.round(333 * 0.7));
  });

  it('clamps to [0, 333]', () => {
    const session = makeSession(0);
    const score = scoreForStat(session, PERFECT_POSITIONS, TRUE_VALUES);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(333);
  });

  it('handles multiple wrong guesses (2 wrong = 0.49 multiplier)', () => {
    const session = makeSession(2);
    const score = scoreForStat(session, PERFECT_POSITIONS, TRUE_VALUES);
    expect(score).toBe(Math.round(333 * 0.49));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T011: totalScore tests
// ─────────────────────────────────────────────────────────────────────────────

describe('totalScore', () => {
  it('sums 3 stat scores', () => {
    expect(totalScore([200, 150, 100])).toBe(450);
  });

  it('adds perfect bonus when all = 333', () => {
    expect(totalScore([333, 333, 333])).toBe(1000);
  });

  it('no bonus when not all = 333', () => {
    expect(totalScore([333, 333, 332])).toBe(998);
  });

  it('max is 1000', () => {
    expect(totalScore([333, 333, 333])).toBe(GAME_MAX);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T012: perfect game yields exactly 1000
// ─────────────────────────────────────────────────────────────────────────────

describe('Perfect game', () => {
  it('perfect game (0 wrong, exact placement, all 3 stats) yields exactly 1000', () => {
    const scores = [0, 1, 2].map(() => {
      const session = makeSession(0);
      return scoreForStat(session, PERFECT_POSITIONS, TRUE_VALUES);
    });
    expect(scores).toEqual([333, 333, 333]);
    expect(totalScore(scores)).toBe(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T017-T018: US2 - Score differentiation
// ─────────────────────────────────────────────────────────────────────────────

describe('Score differentiation (US2)', () => {
  it('better placement scores meaningfully higher than worse placement (same ordering, same attempts)', () => {
    // Both maintain correct order. True fractions: NGA=0, BRA=0.25, DEU=0.5, JPN=0.75, AUS=1.0
    // Good: within tolerance → full distance (200), total = 333
    const positionsGood: Record<string, number> = {
      NGA: 0.04, BRA: 0.27, DEU: 0.52, JPN: 0.74, AUS: 0.97,
    };
    // Poor: very far off (clustered near center) but correctly ordered
    const positionsPoor: Record<string, number> = {
      NGA: 0.20, BRA: 0.35, DEU: 0.50, JPN: 0.65, AUS: 0.80,
    };

    const sessionGood = makeSession(0, positionsGood);
    const sessionPoor = makeSession(0, positionsPoor);
    const scoreGood = scoreForStat(sessionGood, positionsGood, TRUE_VALUES);
    const scorePoor = scoreForStat(sessionPoor, positionsPoor, TRUE_VALUES);

    // Distance component differentiates: 200 vs ~183 = ~17 pts difference
    // This verifies the scoring model produces meaningful differentiation
    expect(scoreGood).toBeGreaterThan(scorePoor);
    expect(scoreGood - scorePoor).toBeGreaterThanOrEqual(15);
  });

  it('all nodes within tolerance = full distance score (200)', () => {
    expect(distanceScore(PERFECT_POSITIONS, TRUE_VALUES)).toBe(200);
  });

  it('nodes exactly at tolerance boundary = full score', () => {
    // Each node at exactly 0.05 error
    const atBoundary: Record<string, number> = {
      NGA: 0.05, BRA: 0.30, DEU: 0.55, JPN: 0.70, AUS: 0.95,
    };
    expect(distanceScore(atBoundary, TRUE_VALUES)).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T020-T021: US3 - Ordering correctness
// ─────────────────────────────────────────────────────────────────────────────

describe('Ordering correctness (US3)', () => {
  it('perfect order = 133 pts', () => {
    expect(orderingScore(PERFECT_POSITIONS, TRUE_VALUES)).toBe(133);
  });

  it('single adjacent swap = ~120 pts (9/10 pairs)', () => {
    const swapped: Record<string, number> = {
      NGA: 0.25, BRA: 0, DEU: 0.5, JPN: 0.75, AUS: 1.0,
    };
    expect(orderingScore(swapped, TRUE_VALUES)).toBe(Math.round(9 * 133 / 10));
  });

  it('complete reversal = 0 pts', () => {
    const reversed: Record<string, number> = {
      NGA: 1.0, BRA: 0.75, DEU: 0.5, JPN: 0.25, AUS: 0,
    };
    expect(orderingScore(reversed, TRUE_VALUES)).toBe(0);
  });

  it('correct ordering + poor placement still earns full 133 ordering points', () => {
    // Order is correct but positions are way off (but still ordered correctly)
    const poorPlacement: Record<string, number> = {
      NGA: 0.01, BRA: 0.02, DEU: 0.03, JPN: 0.04, AUS: 0.05,
    };
    expect(orderingScore(poorPlacement, TRUE_VALUES)).toBe(133);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T023-T024: US4 - Attempt penalty
// ─────────────────────────────────────────────────────────────────────────────

describe('Attempt penalty (US4)', () => {
  it('0 wrong = 100% of earned', () => {
    const session = makeSession(0);
    const score = scoreForStat(session, PERFECT_POSITIONS, TRUE_VALUES);
    expect(score).toBe(333);
  });

  it('1 wrong = 70% of earned', () => {
    const session = makeSession(1);
    const score = scoreForStat(session, PERFECT_POSITIONS, TRUE_VALUES);
    expect(score).toBe(Math.round(333 * 0.7));
  });

  it('2 wrong = 49% of earned', () => {
    const session = makeSession(2);
    const score = scoreForStat(session, PERFECT_POSITIONS, TRUE_VALUES);
    expect(score).toBe(Math.round(333 * 0.49));
  });

  it('3 wrong = ~34% of earned', () => {
    const session = makeSession(3);
    const score = scoreForStat(session, PERFECT_POSITIONS, TRUE_VALUES);
    expect(score).toBe(Math.round(333 * Math.pow(0.7, 3)));
  });

  it('score never goes below 0 regardless of wrong guess count', () => {
    for (let n = 0; n <= 20; n++) {
      const session = makeSession(n);
      const score = scoreForStat(session, PERFECT_POSITIONS, TRUE_VALUES);
      expect(score).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildShareText
// ─────────────────────────────────────────────────────────────────────────────

describe('buildShareText', () => {
  it('header shows score/1000 format', () => {
    const state = {
      stats: [makeSession(0), makeSession(0), makeSession(0)],
      finalScore: 1000,
    };
    const text = buildShareText(state, 42);
    expect(text.startsWith('WorldOrder #42 — 1000/1000 pts')).toBe(true);
  });

  it('has a blank second line', () => {
    const state = {
      stats: [makeSession(0), makeSession(0), makeSession(0)],
      finalScore: 500,
    };
    const lines = buildShareText(state, 1).split('\n');
    expect(lines[1]).toBe('');
  });

  it('each stat produces one line per guess separated by " / "', () => {
    const state = {
      stats: [makeSession(1), makeSession(0), makeSession(0)],
      finalScore: 800,
    };
    const lines = buildShareText(state, 1).split('\n');
    expect(lines[2]).toContain(' / ');
    expect(lines[3]).toBe('Stat 2: 🟩🟩🟩🟩🟩');
  });
});
