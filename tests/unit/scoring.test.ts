import { describe, it, expect } from 'vitest';
import { scoreForStat, totalScore, buildShareText } from '../../src/lib/scoring';
import type { Guess, StatSession, GameState } from '../../src/types';

const solution = ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'];

function makeGuess(order: string[], sol: string[]): Guess {
  return {
    order,
    bulls: order.map((id, i) => id === sol[i]),
  };
}

describe('scoreForStat', () => {
  it('returns 50 for a single all-bull guess (5 positions × 10 pts)', () => {
    const guess = makeGuess(solution, solution);
    expect(scoreForStat([guess], solution)).toBe(50);
  });

  it('reduces a position contribution to 8 for one miss (10 − 2×1)', () => {
    // Swap first two so position 0 and 1 are both wrong
    const wrongGuess = makeGuess(['BRA', 'NGA', 'DEU', 'JPN', 'AUS'], solution);
    const correctGuess = makeGuess(solution, solution);
    // Position 0: wrong once → 10 - 2 = 8; Position 1: wrong once → 8; rest correct on first
    // After wrong guess, positions 0 and 1 each have n=1 → 8 pts each; positions 2-4 have n=0 → 10 pts each
    // But correctGuess is second, so positions 0,1 have been wrong once → 8 pts each
    const score = scoreForStat([wrongGuess, correctGuess], solution);
    expect(score).toBe(8 + 8 + 10 + 10 + 10); // 46
  });

  it('drives a position contribution to 0 for 5 misses (max(10-2×5,0) = 0)', () => {
    const badOrder = ['BRA', 'NGA', 'AUS', 'DEU', 'JPN']; // all wrong
    const badGuesses = Array(5).fill(null).map(() => makeGuess(badOrder, solution));
    const correctGuess = makeGuess(solution, solution);
    const score = scoreForStat([...badGuesses, correctGuess], solution);
    expect(score).toBe(0);
  });

  it('floors at 0 for 6+ misses per position (no negative scores)', () => {
    const badOrder = ['BRA', 'NGA', 'AUS', 'DEU', 'JPN'];
    const badGuesses = Array(6).fill(null).map(() => makeGuess(badOrder, solution));
    const correctGuess = makeGuess(solution, solution);
    const score = scoreForStat([...badGuesses, correctGuess], solution);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBe(0);
  });
});

describe('totalScore', () => {
  it('sums three stat scores (max 150 = 3 × 50)', () => {
    const perfectGuess = makeGuess(solution, solution);
    const sessions: StatSession[] = [
      { statId: 'stat_1', solved: true, guesses: [perfectGuess] },
      { statId: 'stat_2', solved: true, guesses: [perfectGuess] },
      { statId: 'stat_3', solved: true, guesses: [perfectGuess] },
    ];
    const solutions = [solution, solution, solution];
    expect(totalScore(sessions, solutions)).toBe(150);
  });

  it('correctly sums partial scores across stats', () => {
    const wrongGuess = makeGuess(['BRA', 'NGA', 'DEU', 'JPN', 'AUS'], solution);
    const correctGuess = makeGuess(solution, solution);
    const sessions: StatSession[] = [
      { statId: 'stat_1', solved: true, guesses: [correctGuess] },           // 50
      { statId: 'stat_2', solved: true, guesses: [wrongGuess, correctGuess] }, // 8+8+10+10+10 = 46
      { statId: 'stat_3', solved: true, guesses: [correctGuess] },           // 50
    ];
    const solutions = [solution, solution, solution];
    expect(totalScore(sessions, solutions)).toBe(50 + 46 + 50); // 146
  });
});

describe('buildShareText', () => {
  function makeState(guesses: Guess[][]): GameState {
    return {
      puzzleNumber: 42,
      dateUTC: '2026-05-22',
      status: 'complete',
      activeStatIndex: 2,
      stats: guesses.map((g, i) => ({ statId: `stat_${i + 1}`, solved: true, guesses: g })),
      runningScore: 130,
      finalScore: 130,
      updatedAt: Date.now(),
    };
  }

  it('starts with "Rankle #N — X pts" header', () => {
    const state = makeState([[makeGuess(solution, solution)], [makeGuess(solution, solution)], [makeGuess(solution, solution)]]);
    state.finalScore = 150;
    const text = buildShareText(state, 42);
    expect(text.startsWith('Rankle #42 — 150 pts')).toBe(true);
  });

  it('has a blank second line', () => {
    const state = makeState([[makeGuess(solution, solution)], [makeGuess(solution, solution)], [makeGuess(solution, solution)]]);
    const lines = buildShareText(state, 1).split('\n');
    expect(lines[1]).toBe('');
  });

  it('each stat produces one line with emoji per guess separated by " / "', () => {
    const wrongGuess = makeGuess(['BRA', 'NGA', 'DEU', 'JPN', 'AUS'], solution);
    const correctGuess = makeGuess(solution, solution);
    const state = makeState([[correctGuess], [wrongGuess, correctGuess], [correctGuess]]);
    const lines = buildShareText(state, 1).split('\n');
    expect(lines[2]).toBe('Stat 1: 🟩🟩🟩🟩🟩');
    expect(lines[3]).toBe('Stat 2: 🟥🟥🟩🟩🟩 / 🟩🟩🟩🟩🟩');
    expect(lines[4]).toBe('Stat 3: 🟩🟩🟩🟩🟩');
  });

  it('does not include any country names (spoiler-free)', () => {
    const state = makeState([[makeGuess(solution, solution)], [makeGuess(solution, solution)], [makeGuess(solution, solution)]]);
    const text = buildShareText(state, 1);
    expect(text).not.toContain('NGA');
    expect(text).not.toContain('BRA');
    expect(text).not.toContain('DEU');
  });

  it('single perfect guess produces "Stat 1: 🟩🟩🟩🟩🟩"', () => {
    const state = makeState([[makeGuess(solution, solution)], [makeGuess(solution, solution)], [makeGuess(solution, solution)]]);
    const lines = buildShareText(state, 1).split('\n');
    expect(lines[2]).toBe('Stat 1: 🟩🟩🟩🟩🟩');
  });
});
