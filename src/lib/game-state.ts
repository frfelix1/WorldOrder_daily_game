import type { GameState, PlayerStats } from '../types';

const GAME_STATE_KEY = 'rankle_state';
const PLAYER_STATS_KEY = 'rankle_stats';

/**
 * Loads the game state for the given puzzle number.
 * Returns null if:
 * - No state is stored
 * - The stored puzzle number doesn't match (stale discard)
 * - The stored JSON is invalid
 */
export function loadGameState(currentPuzzleNumber: number): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.puzzleNumber !== currentPuzzleNumber) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Saves the game state to localStorage.
 */
export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded) — no-op
  }
}

/**
 * Loads lifetime player stats.
 * Returns a zero-initialised struct if not found.
 */
export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(PLAYER_STATS_KEY);
    if (!raw) return defaultPlayerStats();
    return JSON.parse(raw) as PlayerStats;
  } catch {
    return defaultPlayerStats();
  }
}

/**
 * Saves player stats to localStorage.
 */
export function savePlayerStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
  } catch {
    // localStorage unavailable — no-op
  }
}

function defaultPlayerStats(): PlayerStats {
  return {
    played: 0,
    completed: 0,
    totalScore: 0,
    bestScore: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastCompletedPuzzleNumber: null,
    scoreDistribution: {},
  };
}
