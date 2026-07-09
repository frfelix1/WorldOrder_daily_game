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
 * Minimum share of the penalty-adjusted base score retained on a solve,
 * regardless of placement accuracy (feature 010). A solved stat always keeps
 * at least this fraction of its base; perfect placement earns the full base.
 */
export const ACCURACY_FLOOR = 0.8;

/**
 * Maps placement accuracy A ∈ [0, 1] to a multiplicative factor in
 * [ACCURACY_FLOOR, 1]. A = 0 → ACCURACY_FLOOR, A = 1 → 1.0 (linear).
 *
 * @param accuracy - Placement accuracy in [0, 1] (see src/lib/line-scale.ts).
 * @returns Factor in [ACCURACY_FLOOR, 1].
 */
export function accuracyFactor(accuracy: number): number {
  const a = Math.min(1, Math.max(0, accuracy));
  return ACCURACY_FLOOR + (1 - ACCURACY_FLOOR) * a;
}

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
 * Computes the score for a completed stat session, blending the wrong-guess
 * penalty with placement proximity (feature 010).
 *
 * Formula: round( base(wrongGuesses) × accuracyFactor(accuracy) ), clamped to [0, 33].
 * where base = ROUND_MAX × DECAY_BASE ^ wrongGuesses (before rounding).
 *
 * The last guess in a solved session is always the correct one, so
 * wrongGuesses = session.guesses.length - 1.
 *
 * @param session  - A StatSession with at least one guess (the solving guess).
 * @param accuracy - Placement accuracy A ∈ [0, 1]. Defaults to 1 (accuracy-neutral)
 *                   for backwards-compatibility with guesses lacking positions.
 * @returns Integer in the range [0, 33].
 */
export function scoreForStat(session: StatSession, accuracy: number = 1): number {
  const wrongGuesses = Math.max(0, session.guesses.length - 1);
  const base = ROUND_MAX * Math.pow(DECAY_BASE, wrongGuesses);
  const scaled = base * accuracyFactor(accuracy);
  return Math.min(ROUND_MAX, Math.max(0, Math.round(scaled)));
}

/**
 * Computes the total game score across all three stat sessions.
 *
 * Applies a 1-point perfect-game bonus when all three round scores equal ROUND_MAX,
 * bringing the maximum from 99 to 100. With proximity scoring, a stat only reaches
 * ROUND_MAX when solved with 0 wrong guesses AND perfect placement (accuracy 1).
 *
 * @param statSessions - Exactly three StatSession objects (one per stat).
 * @param accuracies   - Optional per-stat placement accuracies (A ∈ [0, 1]), aligned
 *                       by index with statSessions. Defaults to accuracy-neutral (1).
 * @returns Integer in the range [0, 100].
 */
export function totalScore(
  statSessions: StatSession[],
  accuracies?: number[],
): number {
  const roundScores = statSessions.map((s, i) => scoreForStat(s, accuracies?.[i] ?? 1));
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
