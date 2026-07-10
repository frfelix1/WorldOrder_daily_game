import type { StatSession } from '../types';
import { deriveOrder, trueFractions } from './line-scale';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum points per stat (ordering + distance). */
export const STAT_MAX = 333;

/** Maximum achievable total game score (3 × STAT_MAX + PERFECT_BONUS). */
export const GAME_MAX = 1000;

/** Maximum points from ordering component per stat. */
export const ORDERING_MAX = 133;

/** Maximum points from distance component per stat. */
export const DISTANCE_MAX = 200;

/** Placement tolerance — error ≤ this yields full node score. */
export const TOLERANCE = 0.05;

/** Geometric decay per wrong guess applied to stat score. */
export const ATTEMPT_DECAY = 0.7;

/** Bonus awarded when all 3 stats achieve exactly STAT_MAX. */
export const PERFECT_BONUS = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Foundational scoring functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count concordant pairs between two orderings.
 * A pair (i, j) is concordant if both orderings agree on which comes first.
 * With 5 items there are C(5,2) = 10 possible pairs.
 *
 * @param order     - Player's submitted ordering (array of IDs).
 * @param trueOrder - Correct ordering (array of IDs).
 * @returns Number of concordant pairs [0–10].
 */
export function concordantPairs(order: string[], trueOrder: string[]): number {
  // Build rank maps: id → position index
  const rankA: Record<string, number> = {};
  const rankB: Record<string, number> = {};
  for (let i = 0; i < order.length; i++) rankA[order[i]] = i;
  for (let i = 0; i < trueOrder.length; i++) rankB[trueOrder[i]] = i;

  let count = 0;
  for (let i = 0; i < trueOrder.length; i++) {
    for (let j = i + 1; j < trueOrder.length; j++) {
      const a = trueOrder[i];
      const b = trueOrder[j];
      // Concordant if the relative order matches
      if ((rankA[a] - rankA[b]) * (rankB[a] - rankB[b]) > 0) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Score for a single node's distance from its true position.
 * Full 40 pts if within tolerance, linear decay otherwise.
 *
 * @param placedFraction - Player's placed fraction [0–1].
 * @param trueFraction   - True fraction [0–1].
 * @returns Score [0–40].
 */
export function nodeDistanceScore(placedFraction: number, trueFraction: number): number {
  const error = Math.abs(placedFraction - trueFraction);
  if (error <= TOLERANCE) return 40;
  const score = 40 * Math.max(0, 1 - (error - TOLERANCE) / (1 - TOLERANCE));
  return score;
}

/**
 * Ordering score: derives orders from positions/values, counts concordant pairs,
 * scales to [0–133].
 *
 * @param positions  - Player's positions Record<countryId, fraction>.
 * @param trueValues - True stat values Record<countryId, rawValue>.
 * @returns Integer [0–133].
 */
export function orderingScore(
  positions: Record<string, number>,
  trueValues: Record<string, number>,
): number {
  const playerOrder = deriveOrder(positions);
  const truePositions = trueFractions(trueValues);
  const trueOrder = deriveOrder(truePositions);
  const pairs = concordantPairs(playerOrder, trueOrder);
  return Math.round((pairs * ORDERING_MAX) / 10);
}

/**
 * Distance score: sum of per-node distance scores for all 5 nodes.
 *
 * @param positions  - Player's positions Record<countryId, fraction>.
 * @param trueValues - True stat values Record<countryId, rawValue>.
 * @returns Number [0–200].
 */
export function distanceScore(
  positions: Record<string, number>,
  trueValues: Record<string, number>,
): number {
  const trueFracs = trueFractions(trueValues);
  let total = 0;
  for (const id of Object.keys(trueValues)) {
    const placed = positions[id] ?? 0;
    const truth = trueFracs[id];
    total += nodeDistanceScore(placed, truth);
  }
  return total;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composite scoring functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score for a single stat: ordering + distance, multiplied by attempt decay.
 *
 * @param session    - The stat session (uses guesses.length for attempt count).
 * @param positions  - Final guess positions Record<countryId, fraction>.
 * @param trueValues - True stat values Record<countryId, rawValue>.
 * @returns Integer [0–333].
 */
export function scoreForStat(
  session: StatSession,
  positions: Record<string, number>,
  trueValues: Record<string, number>,
): number {
  const ordering = orderingScore(positions, trueValues);
  const distance = distanceScore(positions, trueValues);
  const rawTotal = ordering + distance;
  const wrongGuesses = Math.max(0, session.guesses.length - 1);
  const multiplier = Math.pow(ATTEMPT_DECAY, wrongGuesses);
  return Math.min(STAT_MAX, Math.max(0, Math.round(rawTotal * multiplier)));
}

/**
 * Total game score across all 3 stats.
 * Adds +1 perfect bonus when all 3 stat scores equal STAT_MAX.
 *
 * @param statScores - Array of 3 per-stat scores.
 * @returns Integer [0–1000].
 */
export function totalScore(statScores: number[]): number {
  const sum = statScores.reduce((acc, s) => acc + s, 0);
  const bonus = statScores.every((s) => s === STAT_MAX) ? PERFECT_BONUS : 0;
  return Math.min(GAME_MAX, sum + bonus);
}

// ─────────────────────────────────────────────────────────────────────────────
// Share text
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the share text for the result card.
 * Format:
 *   WorldOrder #N — X/1000 pts
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
  const header = `WorldOrder #${puzzleNumber} — ${score}/${GAME_MAX} pts`;

  const statLines = state.stats.map((session, i) => {
    const rows = session.guesses.map((guess) =>
      guess.bulls.map((bull) => (bull ? '🟩' : '🟥')).join(''),
    );
    return `Stat ${i + 1}: ${rows.join(' / ')}`;
  });

  return [header, '', ...statLines, '', 'https://world-order-daily-game.vercel.app'].join('\n');
}
