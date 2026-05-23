import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadGameState, saveGameState, loadPlayerStats, savePlayerStats } from '../../src/lib/game-state';
import type { GameState, PlayerStats } from '../../src/types';

const PUZZLE_NUMBER = 100;

const makeGameState = (puzzleNumber: number, status: GameState['status'] = 'in_progress'): GameState => ({
  puzzleNumber,
  dateUTC: '2026-05-22',
  status,
  activeStatIndex: 0,
  stats: [
    { statId: 'stat_1', solved: false, guesses: [] },
    { statId: 'stat_2', solved: false, guesses: [] },
    { statId: 'stat_3', solved: false, guesses: [] },
  ],
  runningScore: 0,
  finalScore: null,
  updatedAt: Date.now(),
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('loadGameState', () => {
  it('returns null on fresh localStorage', () => {
    expect(loadGameState(PUZZLE_NUMBER)).toBeNull();
  });

  it('returns state when puzzle number matches', () => {
    const state = makeGameState(PUZZLE_NUMBER);
    saveGameState(state);
    const loaded = loadGameState(PUZZLE_NUMBER);
    expect(loaded).not.toBeNull();
    expect(loaded?.puzzleNumber).toBe(PUZZLE_NUMBER);
  });

  it('returns null (stale discard) when stored puzzleNumber differs', () => {
    const state = makeGameState(PUZZLE_NUMBER - 1);
    saveGameState(state);
    expect(loadGameState(PUZZLE_NUMBER)).toBeNull();
  });

  it('returns state with status "complete" when game was finished', () => {
    const state = makeGameState(PUZZLE_NUMBER, 'complete');
    state.finalScore = 150;
    saveGameState(state);
    const loaded = loadGameState(PUZZLE_NUMBER);
    expect(loaded?.status).toBe('complete');
    expect(loaded?.finalScore).toBe(150);
  });

  it('returns null if localStorage contains invalid JSON', () => {
    localStorage.setItem('rankle_state', '{invalid json}');
    expect(loadGameState(PUZZLE_NUMBER)).toBeNull();
  });
});

describe('saveGameState', () => {
  it('roundtrips state correctly through JSON', () => {
    const state = makeGameState(PUZZLE_NUMBER);
    state.runningScore = 42;
    saveGameState(state);
    const loaded = loadGameState(PUZZLE_NUMBER);
    expect(loaded?.runningScore).toBe(42);
    expect(loaded?.dateUTC).toBe('2026-05-22');
  });
});

describe('loadPlayerStats', () => {
  it('returns zero-initialised struct on first call', () => {
    const stats = loadPlayerStats();
    expect(stats.played).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.totalScore).toBe(0);
    expect(stats.bestScore).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(0);
    expect(stats.lastCompletedPuzzleNumber).toBeNull();
    expect(stats.scoreDistribution).toEqual({});
  });
});

describe('savePlayerStats', () => {
  it('persists and reloads correctly', () => {
    const stats: PlayerStats = {
      played: 5,
      completed: 4,
      totalScore: 500,
      bestScore: 150,
      currentStreak: 2,
      maxStreak: 3,
      lastCompletedPuzzleNumber: PUZZLE_NUMBER,
      scoreDistribution: { '150': 2 },
    };
    savePlayerStats(stats);
    const loaded = loadPlayerStats();
    expect(loaded.played).toBe(5);
    expect(loaded.bestScore).toBe(150);
    expect(loaded.scoreDistribution).toEqual({ '150': 2 });
  });
});

describe('rotation scenarios (US4)', () => {
  it('returns null when stored puzzleNumber is n-1 (midnight cutover discards stale state)', () => {
    const staleState = makeGameState(PUZZLE_NUMBER - 1);
    saveGameState(staleState);
    expect(loadGameState(PUZZLE_NUMBER)).toBeNull();
  });

  it('returns completed state when puzzleNumber matches and status is complete', () => {
    const completedState = makeGameState(PUZZLE_NUMBER, 'complete');
    completedState.finalScore = 120;
    saveGameState(completedState);
    const loaded = loadGameState(PUZZLE_NUMBER);
    expect(loaded).not.toBeNull();
    expect(loaded?.status).toBe('complete');
    expect(loaded?.finalScore).toBe(120);
    expect(loaded?.puzzleNumber).toBe(PUZZLE_NUMBER);
  });

  it('does not mutate the stored object on load', () => {
    const state = makeGameState(PUZZLE_NUMBER);
    saveGameState(state);
    const loaded1 = loadGameState(PUZZLE_NUMBER);
    const loaded2 = loadGameState(PUZZLE_NUMBER);
    // Both are separate objects parsed from JSON
    expect(loaded1).not.toBe(loaded2);
  });
});
