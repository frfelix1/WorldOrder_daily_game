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
      <main className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-5">
          {/* Branded spinner */}
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--border)]" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--accent)]" />
          </div>
          <div className="flex flex-col items-center gap-1">
          <span
            className="text-2xl tracking-[0.2em] text-[var(--accent)]"
            style={{ fontFamily: 'var(--font-bebas)' }}
          >
            Rankle
          </span>
            <p className="text-xs text-[var(--text-muted)] tracking-widest uppercase">
              Loading today&apos;s puzzle
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (pageStatus === 'error') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-sm p-7 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]">
          <div
            className="text-3xl tracking-[0.15em] text-[var(--accent)]"
            style={{ fontFamily: 'var(--font-bebas)' }}
          >
            Rankle
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-4">Couldn&apos;t load today&apos;s puzzle. Check your connection and try again.</p>
          <button
            onClick={fetchPuzzle}
            className="px-6 py-2.5 bg-[var(--accent)] text-black font-semibold rounded-xl hover:bg-amber-400 active:scale-95 transition-all text-sm"
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
  const lastBulls = activeSession?.guesses.length
    ? activeSession.guesses[activeSession.guesses.length - 1].bulls
    : undefined;

  return (
    <main className="flex flex-col items-center min-h-screen">
      <div className="w-full max-w-md px-4 pt-6 pb-10 flex flex-col gap-4">

        {/* Header */}
        <header className="flex items-center justify-between mb-1">
          <h1
          className="text-4xl tracking-[0.15em] text-[var(--accent)]"
          style={{ fontFamily: 'var(--font-bebas)' }}
        >
          Rankle
          </h1>
          <span className="text-xs text-[var(--text-muted)] font-medium tracking-widest uppercase">
            #{puzzleNumber}
          </span>
        </header>

        <LiveRegion message={announcement} />

        {/* Score */}
        <ScoreDisplay score={gameState.runningScore} />

        {/* Stat progress stepper */}
        <div className="flex gap-2 items-center" aria-label="Round progress">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={[
                'h-1 flex-1 rounded-full transition-all duration-700',
                i < activeStatIndex
                  ? 'bg-[var(--success)]'
                  : i === activeStatIndex
                    ? 'bg-[var(--accent)]'
                    : 'bg-[var(--border)]',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Stat panel */}
        <div className="animate-fade-slide-down">
          <StatPanel
            stat={activeStat}
            isSolved={activeSession?.solved ?? false}
            statIndex={activeStatIndex}
          />
        </div>

        {/* Historical feedback rows for current stat */}
        {activeSession && activeSession.guesses.length > 0 && (
          <div className="flex flex-col gap-2">
            {activeSession.guesses.map((guess, i) => (
              <FeedbackRow key={i} guess={guess} statIndex={activeStatIndex + 1} guessIndex={i + 1} />
            ))}
          </div>
        )}

        {/* Ranking list */}
        <RankingList
          countries={puzzle.countries}
          order={currentOrder}
          onReorder={setCurrentOrder}
          disabled={activeSession?.solved ?? false}
          lastBulls={lastBulls}
        />

        {/* Submit */}
        {!activeSession?.solved && (
          <button
            data-testid="submit-btn"
            onClick={handleSubmit}
            className="w-full py-3.5 bg-[var(--accent)] text-black font-bold rounded-xl hover:bg-amber-400 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] uppercase tracking-widest text-sm"
          >
            Submit Ranking
          </button>
        )}
      </div>
    </main>
  );
}
