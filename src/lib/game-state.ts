import type { DailyResult, GameState, PlayerStats, StatsHistory, StatsStorageStatus } from '../types';

const GAME_STATE_KEY = 'worldorder_state';
const PLAYER_STATS_KEY = 'worldorder_stats';
const DAILY_KEY_PREFIX = 'worldorder_daily_';
const DAILY_VERSION = 1 as const;

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

export function saveDailyResult(result: DailyResult): boolean {
  try {
    const key = `${DAILY_KEY_PREFIX}${result.puzzleNumber}`;
    const existing = localStorage.getItem(key);
    if (existing) {
      const parsed: unknown = JSON.parse(existing);
      if (isRecord(parsed) && parsed.version !== DAILY_VERSION) return false;
      if (!isDailyResult(parsed)) return false;
    }
    localStorage.setItem(key, JSON.stringify(result));
    return true;
  } catch {
    return false;
  }
}

export function loadStatsHistory(): StatsHistory {
  try {
    localStorage.getItem(DAILY_KEY_PREFIX);
    const records: DailyResult[] = [];
    let sawCorrupt = false;
    let sawUnsupported = false;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(DAILY_KEY_PREFIX)) continue;

      const keyPuzzleNumber = Number(key.slice(DAILY_KEY_PREFIX.length));
      const raw = localStorage.getItem(key);
      if (!Number.isSafeInteger(keyPuzzleNumber) || keyPuzzleNumber < 0 || raw === null) {
        sawCorrupt = true;
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        sawCorrupt = true;
        continue;
      }

      if (!isRecord(parsed) || parsed.version !== DAILY_VERSION) {
        sawUnsupported = true;
        continue;
      }
      if (parsed.puzzleNumber !== keyPuzzleNumber || parsed.completed !== true || !isDateUTC(parsed.dateUTC)) {
        sawCorrupt = true;
        continue;
      }

      const finalScore = isValidScore(parsed.finalScore) ? parsed.finalScore : null;
      if (finalScore === null && parsed.finalScore !== null) sawCorrupt = true;
      records.push({
        version: DAILY_VERSION,
        puzzleNumber: keyPuzzleNumber,
        dateUTC: parsed.dateUTC,
        completed: true,
        finalScore,
      });
    }

    records.sort((a, b) => b.puzzleNumber - a.puzzleNumber);
    const storageStatus: StatsStorageStatus = records.length === 0
      ? sawUnsupported ? 'unsupported' : sawCorrupt ? 'corrupt' : 'empty'
      : sawCorrupt ? 'corrupt' : sawUnsupported ? 'unsupported' : 'ready';
    return { records, storageStatus };
  } catch {
    return { records: [], storageStatus: 'unavailable' };
  }
}

export function repairDailyResult(state: GameState): boolean {
  if (state.status !== 'complete' || !Number.isFinite(state.finalScore)) return false;
  return saveDailyResult({
    version: DAILY_VERSION,
    puzzleNumber: state.puzzleNumber,
    dateUTC: state.dateUTC,
    completed: true,
    finalScore: state.finalScore,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDateUTC(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1000;
}

function isDailyResult(value: unknown): value is DailyResult {
  return isRecord(value)
    && value.version === DAILY_VERSION
    && Number.isSafeInteger(value.puzzleNumber)
    && typeof value.puzzleNumber === 'number'
    && value.puzzleNumber >= 0
    && isDateUTC(value.dateUTC)
    && value.completed === true
    && (value.finalScore === null || isValidScore(value.finalScore));
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
