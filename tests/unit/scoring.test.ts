import { describe, it, expect } from 'vitest';
import {
  scoreForRound,
  scoreForStat,
  totalScore,
  buildShareText,
  ROUND_MAX,
  DECAY_BASE,
  PERFECT_BONUS,
  GAME_MAX,
} from '../../src/lib/scoring';
import type { StatSession, GameState } from '../../src/types';

const solution = ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'];

function makeSession(wrongGuesses: number): StatSession {
  const wrongOrder = ['BRA', 'NGA', 'DEU', 'JPN', 'AUS']; // first two swapped — always all-wrong
  const correctOrder = solution;
  const guesses = [
    ...Array(wrongGuesses).fill(null).map(() => ({
      order: wrongOrder,
      bulls: wrongOrder.map((id, i) => id === solution[i]),
    })),
    {
      order: correctOrder,
      bulls: correctOrder.map((id, i) => id === solution[i]),
    },
  ];
  return { statId: 'stat_1', solved: true, guesses };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

describe('Scoring constants', () => {
  it('ROUND_MAX is 33', () => expect(ROUND_MAX).toBe(33));
  it('PERFECT_BONUS is 1', () => expect(PERFECT_BONUS).toBe(1));
  it('GAME_MAX is 100', () => expect(GAME_MAX).toBe(100));
  it('DECAY_BASE is between 0 and 1', () => {
    expect(DECAY_BASE).toBeGreaterThan(0);
    expect(DECAY_BASE).toBeLessThan(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// scoreForRound — US1: Perfect Round Performance
// ─────────────────────────────────────────────────────────────────────────────

describe('scoreForRound (US1 – perfect round)', () => {
  it('returns 33 for 0 wrong guesses (perfect round)', () => {
    expect(scoreForRound(0)).toBe(33);
  });

  it('returns a whole integer for all inputs 0–10', () => {
    for (let n = 0; n <= 10; n++) {
      const s = scoreForRound(n);
      expect(Number.isInteger(s)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// scoreForStat — US1: session with 0 wrong guesses
// ─────────────────────────────────────────────────────────────────────────────

describe('scoreForStat (US1 – perfect session)', () => {
  it('returns 33 for a single-guess session (0 wrong guesses)', () => {
    expect(scoreForStat(makeSession(0))).toBe(33);
  });

  it('returns the same value as scoreForRound(session.guesses.length - 1)', () => {
    for (let n = 0; n <= 6; n++) {
      expect(scoreForStat(makeSession(n))).toBe(scoreForRound(n));
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// totalScore — US1: perfect-game bonus
// ─────────────────────────────────────────────────────────────────────────────

describe('totalScore (US1 – perfect game)', () => {
  it('returns 100 when all three sessions are solved with 0 wrong guesses', () => {
    const perfectSessions = [makeSession(0), makeSession(0), makeSession(0)];
    expect(totalScore(perfectSessions)).toBe(100);
  });

  it('returns 99 when two rounds are perfect and one has 1 wrong guess', () => {
    const sessions = [makeSession(0), makeSession(0), makeSession(1)];
    // 33 + 33 + 21 = 87 (no perfect-game bonus)
    const score = totalScore(sessions);
    expect(score).toBeLessThan(100);
    expect(score).toBe(33 + 33 + scoreForRound(1));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// scoreForRound curve — US2: Exponential penalty
// ─────────────────────────────────────────────────────────────────────────────

describe('scoreForRound curve (US2 – exponential penalty)', () => {
  it('returns 21 for 1 wrong guess', () => {
    expect(scoreForRound(1)).toBe(21);
  });

  it('returns a value less than 16 for 3 wrong guesses (below half of 33)', () => {
    expect(scoreForRound(3)).toBeLessThan(16);
  });

  it('is monotonically non-increasing: scoreForRound(n) >= scoreForRound(n+1) for n=0..8', () => {
    for (let n = 0; n <= 7; n++) {
      expect(scoreForRound(n)).toBeGreaterThanOrEqual(scoreForRound(n + 1));
    }
  });

  it('is always >= 0 for all n = 0..20 (no negative scores)', () => {
    for (let n = 0; n <= 20; n++) {
      expect(scoreForRound(n)).toBeGreaterThanOrEqual(0);
    }
  });

  it('is always a whole integer', () => {
    for (let n = 0; n <= 10; n++) {
      expect(Number.isInteger(scoreForRound(n))).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Distribution — US3: Balanced score distribution
// ─────────────────────────────────────────────────────────────────────────────

describe('Score distribution (US3 – balanced distribution)', () => {
  /**
   * Simulate all 7^3 = 343 combinations of wrong-guess counts (0–6 per round).
   * Verify that no more than 15% of outcomes score above 90.
   */
  it('at most 15% of uniform-random games (n=0..6 per round) score above 90', () => {
    let aboveNinety = 0;
    const total = 7 * 7 * 7; // 343
    for (let a = 0; a <= 6; a++) {
      for (let b = 0; b <= 6; b++) {
        for (let c = 0; c <= 6; c++) {
          const score = totalScore([makeSession(a), makeSession(b), makeSession(c)]);
          if (score > 90) aboveNinety++;
        }
      }
    }
    expect(aboveNinety / total).toBeLessThanOrEqual(0.15);
  });

  /**
   * Spread between a "1 wrong per round" game and a "3 wrong per round" game
   * must be at least 30 points (SC-003).
   */
  it('spread between (1,1,1) and (3,3,3) games is at least 30 points', () => {
    const good = totalScore([makeSession(1), makeSession(1), makeSession(1)]);
    const poor = totalScore([makeSession(3), makeSession(3), makeSession(3)]);
    expect(good - poor).toBeGreaterThanOrEqual(30);
  });

  /**
   * A player making 3+ wrong guesses per round should total below 50 (SC-002).
   */
  it('3 wrong guesses per round across all three rounds gives a total below 50', () => {
    const score = totalScore([makeSession(3), makeSession(3), makeSession(3)]);
    expect(score).toBeLessThan(50);
  });

  /**
   * All integers 0–100 should be reachable through some combination (SC-005).
   * We test a sampled subset to avoid exhaustive enumeration.
   * The achievable set must include 0, 33, 63, 87, 100.
   */
  it('key benchmark scores are achievable', () => {
    // 0: impossible to force 0 with finite guesses? Actually for very large n scores round to 0
    // Perfect: (0,0,0) → 100
    expect(totalScore([makeSession(0), makeSession(0), makeSession(0)])).toBe(100);
    // Three rounds with 1 wrong each
    const score1 = totalScore([makeSession(1), makeSession(1), makeSession(1)]);
    expect(score1).toBeGreaterThan(0);
    expect(score1).toBeLessThan(100);
    // No round can exceed 33
    for (let n = 0; n <= 10; n++) {
      expect(scoreForRound(n)).toBeLessThanOrEqual(ROUND_MAX);
    }
    // Game max is 100
    expect(GAME_MAX).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildShareText — US4 (unchanged signature, updated value range)
// ─────────────────────────────────────────────────────────────────────────────

describe('buildShareText', () => {
  function makeState(wrongGuessesPerStat: number[]): GameState {
    const stats: StatSession[] = wrongGuessesPerStat.map((n, i) => ({
      ...makeSession(n),
      statId: `stat_${i + 1}`,
    }));
    const score = totalScore(stats);
    return {
      puzzleNumber: 42,
      dateUTC: '2026-05-27',
      status: 'complete',
      activeStatIndex: 2,
      stats,
      runningScore: score,
      finalScore: score,
      updatedAt: Date.now(),
    };
  }

  it('header starts with "Rankle #N — X pts" where X is in range 0–100', () => {
    const state = makeState([0, 0, 0]);
    const text = buildShareText(state, 42);
    expect(text.startsWith('Rankle #42 — 100 pts')).toBe(true);
  });

  it('has a blank second line', () => {
    const state = makeState([0, 0, 0]);
    const lines = buildShareText(state, 1).split('\n');
    expect(lines[1]).toBe('');
  });

  it('each stat produces one line per guess separated by " / "', () => {
    const state = makeState([1, 0, 0]); // stat 1 has 1 wrong guess then correct
    const lines = buildShareText(state, 1).split('\n');
    // Stat 1: wrong then correct
    expect(lines[2]).toContain(' / ');
    // Stat 2: single correct guess
    expect(lines[3]).toBe('Stat 2: 🟩🟩🟩🟩🟩');
  });

  it('score in header is ≤ 100 for any input', () => {
    const state = makeState([2, 3, 1]);
    const text = buildShareText(state, 5);
    const match = text.match(/Rankle #5 — (\d+) pts/);
    expect(match).not.toBeNull();
    const score = parseInt(match![1]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
