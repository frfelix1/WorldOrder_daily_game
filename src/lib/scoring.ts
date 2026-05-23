import type { Guess, StatSession } from '../types';

/**
 * Computes the score for a single stat given all guesses and the solution.
 * Linear formula: for each position, n = number of wrong guesses; score = max(10 - 2n, 0).
 * Maximum: 5 positions × 10 pts = 50 pts per stat.
 */
export function scoreForStat(guesses: Guess[], solution: string[]): number {
  let score = 0;
  for (let pos = 0; pos < solution.length; pos++) {
    const n = guesses.filter((g) => !g.bulls[pos]).length;
    score += Math.max(10 - 2 * n, 0);
  }
  return score;
}

/**
 * Computes the total score across all three stats.
 * Maximum: 3 stats × 50 pts = 150 pts.
 */
export function totalScore(statSessions: StatSession[], solutions: string[][]): number {
  return statSessions.reduce(
    (sum, session, i) => sum + scoreForStat(session.guesses, solutions[i]),
    0,
  );
}

/**
 * Builds the share text for the result card.
 * Format:
 *   Rankle #N — X pts
 *
 *   Stat 1: 🟩🟥... / 🟩🟩🟩🟩🟩
 *   Stat 2: ...
 *   Stat 3: ...
 */
export function buildShareText(
  state: { stats: StatSession[]; finalScore: number | null },
  puzzleNumber: number,
): string {
  const score = state.finalScore ?? 0;
  const header = `Rankle #${puzzleNumber} — ${score} pts`;

  const statLines = state.stats.map((session, i) => {
    const rows = session.guesses.map((guess) =>
      guess.bulls.map((bull) => (bull ? '🟩' : '🟥')).join(''),
    );
    return `Stat ${i + 1}: ${rows.join(' / ')}`;
  });

  return [header, '', ...statLines].join('\n');
}
