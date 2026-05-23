'use client';

import { useEffect, useState, useCallback } from 'react';
import type { PuzzleFile, GameState, Guess, StatSession } from '../types';
import { getPuzzleNumber, getUTCDateString } from '../lib/puzzle';
import { loadGameState, saveGameState, loadPlayerStats, savePlayerStats } from '../lib/game-state';
import { scoreForStat, totalScore } from '../lib/scoring';
import { ScoreDisplay } from '../components/game/ScoreDisplay';
import { StatPanel } from '../components/game/StatPanel';
import { RankingList } from '../components/game/RankingList';
import { FeedbackRow } from '../components/game/FeedbackRow';
import { LiveRegion } from '../components/ui/LiveRegion';
import { ResultCard } from '../components/game/ResultCard';

type PageStatus = 'loading' | 'error' | 'playing' | 'complete';

function buildInitialSessions(puzzle: PuzzleFile): StatSession[] {
  return puzzle.stats.map((stat) => ({
    statId: stat.id,
    solved: false,
    guesses: [],
  }));
}

function computeBulls(submitted: string[], solution: string[]): boolean[] {
  return submitted.map((id, i) => id === solution[i]);
}

export default function GamePage() {
  const [puzzle, setPuzzle] = useState<PuzzleFile | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [currentOrder, setCurrentOrder] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [puzzleNumber] = useState(() => getPuzzleNumber());

  const fetchPuzzle = useCallback(async () => {
    setPageStatus('loading');
    const dateStr = getUTCDateString();
    try {
      const res = await fetch(`/api/puzzle?date=${dateStr}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PuzzleFile = await res.json();

      // Validate response date matches request (stale CDN guard)
      if (data.date !== dateStr) {
        const retryRes = await fetch(`/api/puzzle?date=${dateStr}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!retryRes.ok) throw new Error(`HTTP ${retryRes.status}`);
        const retryData: PuzzleFile = await retryRes.json();
        if (retryData.date !== dateStr) throw new Error('Date mismatch');
        setPuzzle(retryData);
      } else {
        setPuzzle(data);
      }
    } catch {
      setPageStatus('error');
    }
  }, []);

  useEffect(() => {
    const pn = puzzleNumber;
    const savedState = loadGameState(pn);

    if (savedState) {
      if (savedState.status === 'complete') {
        setGameState(savedState);
        setPageStatus('complete');
        // Still need puzzle data for result display if re-loading
        fetchPuzzle();
        return;
      }
      setGameState(savedState);
    }

    fetchPuzzle();
  }, [puzzleNumber, fetchPuzzle]);

  // Once puzzle loads, initialize game state if needed
  useEffect(() => {
    if (!puzzle) return;

    const pn = puzzleNumber;
    const saved = loadGameState(pn);

    if (saved) {
      setGameState(saved);
      if (saved.status === 'complete') {
        setPageStatus('complete');
      } else {
        const lastStatIndex = saved.activeStatIndex;
        const lastStat = saved.stats[lastStatIndex];
        if (lastStat.guesses.length > 0) {
          setCurrentOrder(lastStat.guesses[lastStat.guesses.length - 1].order);
        } else {
          setCurrentOrder(puzzle.countries.map((c) => c.id));
        }
        setPageStatus('playing');
      }
    } else {
      const newState: GameState = {
        puzzleNumber: pn,
        dateUTC: getUTCDateString(),
        status: 'in_progress',
        activeStatIndex: 0,
        stats: buildInitialSessions(puzzle),
        runningScore: 0,
        finalScore: null,
        updatedAt: Date.now(),
      };
      setGameState(newState);
      setCurrentOrder(puzzle.countries.map((c) => c.id));
      saveGameState(newState);
      setPageStatus('playing');
    }
  }, [puzzle, puzzleNumber]);

  function handleSubmit() {
    if (!puzzle || !gameState || pageStatus !== 'playing') return;

    const statIndex = gameState.activeStatIndex;
    const stat = puzzle.stats[statIndex];
    const bulls = computeBulls(currentOrder, stat.solution);
    const allBulls = bulls.every(Boolean);

    const newGuess: Guess = { order: [...currentOrder], bulls };
    const updatedStats = gameState.stats.map((s, i) => {
      if (i !== statIndex) return s;
      return { ...s, solved: allBulls, guesses: [...s.guesses, newGuess] };
    });

    const solutions = puzzle.stats.map((s) => s.solution);
    const newRunningScore = totalScore(updatedStats, solutions);

    const isLastStat = statIndex === 2;
    const newActiveStatIndex = allBulls && !isLastStat ? statIndex + 1 : statIndex;
    const isComplete = allBulls && isLastStat;

    const updatedState: GameState = {
      ...gameState,
      activeStatIndex: newActiveStatIndex,
      stats: updatedStats,
      runningScore: newRunningScore,
      finalScore: isComplete ? newRunningScore : gameState.finalScore,
      status: isComplete ? 'complete' : 'in_progress',
      updatedAt: Date.now(),
    };

    setGameState(updatedState);
    saveGameState(updatedState);

    if (allBulls) {
      if (isComplete) {
        setAnnouncement(`Game complete! Your score is ${newRunningScore} out of 150 points.`);
        setPageStatus('complete');

        // Update player stats
        const playerStats = loadPlayerStats();
        const updatedPlayerStats = {
          ...playerStats,
          played: playerStats.played + 1,
          completed: playerStats.completed + 1,
          totalScore: playerStats.totalScore + newRunningScore,
          bestScore: Math.max(playerStats.bestScore, newRunningScore),
          currentStreak: playerStats.currentStreak + 1,
          maxStreak: Math.max(playerStats.maxStreak, playerStats.currentStreak + 1),
          lastCompletedPuzzleNumber: puzzleNumber,
        };
        savePlayerStats(updatedPlayerStats);
      } else {
        const nextStatNum = newActiveStatIndex + 1;
        setAnnouncement(`Stat ${statIndex + 1} solved!`);
        // After 800ms delay, reset order for next stat
        setTimeout(() => {
          setCurrentOrder(puzzle.countries.map((c) => c.id));
          setAnnouncement('');
        }, 800);
      }
    }
  }

  if (pageStatus === 'loading') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-neutral-300 border-t-neutral-700" />
          <p className="text-neutral-600">Loading today&apos;s puzzle…</p>
        </div>
      </main>
    );
  }

  if (pageStatus === 'error') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600 mb-4">
            Couldn&apos;t load today&apos;s puzzle. Check your connection and try again.
          </p>
          <button
            onClick={fetchPuzzle}
            className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-600"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (pageStatus === 'complete' && gameState && puzzle) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <LiveRegion message={announcement} />
        <ResultCard state={gameState} puzzleNumber={puzzleNumber} puzzle={puzzle} />
      </main>
    );
  }

  if (!puzzle || !gameState) return null;

  const activeStatIndex = gameState.activeStatIndex;
  const activeStat = puzzle.stats[activeStatIndex] ?? null;
  const activeSession = gameState.stats[activeStatIndex];

  return (
    <main className="flex flex-col items-center min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-neutral-900 mb-2 mt-4">Rankle</h1>
      <p className="text-sm text-neutral-500 mb-6">#{puzzleNumber}</p>

      <LiveRegion message={announcement} />

      <div className="w-full mb-4">
        <ScoreDisplay score={gameState.runningScore} />
      </div>

      <div className="w-full mb-4">
        <StatPanel
          stat={activeStat}
          isSolved={activeSession?.solved ?? false}
          statIndex={activeStatIndex}
        />
      </div>

      {/* Historical feedback rows for current stat */}
      {activeSession && activeSession.guesses.length > 0 && (
        <div className="w-full mb-4 flex flex-col gap-1">
          {activeSession.guesses.map((guess, i) => (
            <FeedbackRow key={i} guess={guess} statIndex={activeStatIndex + 1} guessIndex={i + 1} />
          ))}
        </div>
      )}

      <div className="w-full mb-4">
        <RankingList
          countries={puzzle.countries}
          order={currentOrder}
          onReorder={setCurrentOrder}
          disabled={activeSession?.solved ?? false}
        />
      </div>

      {!activeSession?.solved && (
        <button
          data-testid="submit-btn"
          onClick={handleSubmit}
          className="w-full py-3 bg-neutral-800 text-white font-semibold rounded-lg hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-600"
        >
          Submit Ranking
        </button>
      )}
    </main>
  );
}
