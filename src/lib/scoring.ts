import type { StatSession } from '../types';

/** Maximum points awarded for a single round (stat) with zero wrong guesses. */
export const ROUND_MAX = 33;

/** Geometric decay rate applied per wrong guess. */
export const DECAY_BASE = 0.65;

/** Bonus added to the total when all three rounds achieve ROUND_MAX. */
export const PERFECT_BONUS = 1;

/** Maximum achievable total game score (3 × ROUND_MAX + PERFECT_BONUS). */
export const GAME_MAX = 100;

/**
 * Computes the score for a single round given the number of wrong guesses.
 *
 * Formula: Math.max(0, Math.round(ROUND_MAX * DECAY_BASE ** wrongGuesses))
 *
 * @param wrongGuesses - Number of incorrect full-ranking attempts (≥ 0).
 *                       Equals guesses.length - 1 for a solved round.
 * @returns Integer in the range [0, 33].
 */
export function scoreForRound(wrongGuesses: number): number {
  return Math.max(0, Math.round(ROUND_MAX * Math.pow(DECAY_BASE, wrongGuesses)));
}

/**
 * Computes the score for a completed stat session.
 *
 * Delegates to scoreForRound using round-level wrong-guess count.
 * The last guess in a solved session is always the correct one, so
 * wrongGuesses = session.guesses.length - 1.
 *
 * @param session - A StatSession with at least one guess (the solving guess).
 * @returns Integer in the range [0, 33].
 */
export function scoreForStat(session: StatSession): number {
  const wrongGuesses = Math.max(0, session.guesses.length - 1);
  return scoreForRound(wrongGuesses);
}

/**
 * Computes the total game score across all three stat sessions.
 *
 * Applies a 1-point perfect-game bonus when all three round scores equal ROUND_MAX,
 * bringing the maximum from 99 to 100.
 *
 * @param statSessions - Exactly three StatSession objects (one per stat).
 * @returns Integer in the range [0, 100].
 */
export function totalScore(statSessions: StatSession[]): number {
  const roundScores = statSessions.map((s) => scoreForStat(s));
  const sum = roundScores.reduce((acc, s) => acc + s, 0);
  const bonus = roundScores.every((s) => s === ROUND_MAX) ? PERFECT_BONUS : 0;
  return sum + bonus;
}

/**
 * Builds the share text for the result card.
 * Format:
 *   WorldOrder #N — X pts
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
  const header = `WorldOrder #${puzzleNumber} — ${score} pts`;

  const statLines = state.stats.map((session, i) => {
    const rows = session.guesses.map((guess) =>
      guess.bulls.map((bull) => (bull ? '🟩' : '🟥')).join(''),
    );
    return `Stat ${i + 1}: ${rows.join(' / ')}`;
  });

  return [header, '', ...statLines].join('\n');
}
