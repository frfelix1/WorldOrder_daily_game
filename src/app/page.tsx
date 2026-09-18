'use client';

import { useEffect, useState, useCallback } from 'react';
import type { DailyResult, PuzzleFile, GameState, Guess, StatSession, StatsHistory } from '../types';
import { getPuzzleNumberForDate, getUTCDateString } from '../lib/puzzle';
import {
  loadGameState,
  saveGameState,
  loadPlayerStats,
  savePlayerStats,
  loadStatsHistory,
  saveDailyResult,
  repairDailyResult,
} from '../lib/game-state';
import { scoreForStat, totalScore } from '../lib/scoring';
import { deriveOrder, trueFractions } from '../lib/line-scale';
import { formatStatValue } from '../lib/formatting';
import { ScoreDisplay } from '../components/game/ScoreDisplay';
import { StatPanel } from '../components/game/StatPanel';
import { LineScaleBoard } from '../components/game/LineScaleBoard';
import { FeedbackRow } from '../components/game/FeedbackRow';
import { LiveRegion } from '../components/ui/LiveRegion';
import { ResultCard } from '../components/game/ResultCard';
import { DevPanel } from '../components/dev/DevPanel';
import { StatsView } from '../components/game/StatsView';

type PageStatus = 'loading' | 'error' | 'playing' | 'complete';

function FaqMenu() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'scoring' | 'data'>('scoring');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-20 rounded-lg border border-[rgba(232,197,71,0.35)] bg-[rgba(232,197,71,0.12)] px-3 py-2 text-xs font-semibold tracking-[0.18em] text-[var(--gold-bright)] shadow-[0_0_16px_rgba(232,197,71,0.12)] transition-colors hover:bg-[rgba(232,197,71,0.2)] hover:text-white"
        aria-haspopup="dialog"
        aria-label="FAQ"
      >
        FAQ
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-16 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-title"
            aria-label="Frequently asked questions"
            className="w-full max-w-md rounded-2xl border border-[var(--border-hover)] bg-[var(--surface-1)] p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">WorldOrder</p>
                <h2 id="faq-title" className="text-xl font-semibold text-[var(--text-primary)]">Frequently asked questions</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close FAQ"
                className="rounded-md px-2 py-1 text-xl leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ×
              </button>
            </div>

            <div role="tablist" aria-label="FAQ topics" className="mb-5 flex gap-1 border-b border-[var(--border)]">
              {[
                ['scoring', 'How scoring works'],
                ['data', 'Data & sources'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => setTab(value as 'scoring' | 'data')}
                  className="border-b-2 px-2 pb-3 text-xs font-semibold transition-colors"
                  style={{
                    borderColor: tab === value ? 'var(--gold)' : 'transparent',
                    color: tab === value ? 'var(--gold-bright)' : 'var(--text-muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'scoring' ? (
              <div role="tabpanel" className="space-y-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                <p>Your score combines three things:</p>
                <ul className="space-y-3">
                  <li><strong className="text-[var(--text-primary)]">Correct order</strong><br />Putting every item in the right order earns the most points.</li>
                  <li><strong className="text-[var(--text-primary)]">Distance from the true position</strong><br />The closer each item is to its actual position on the line, the better.</li>
                  <li><strong className="text-[var(--text-primary)]">Fewer attempts preserve more points</strong><br />Each additional attempt reduces the points you can keep.</li>
                </ul>
              </div>
            ) : (
              <div role="tabpanel" className="space-y-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                <p>The game&apos;s statistics are pulled from <strong className="text-[var(--text-primary)]">Wikipedia</strong>.</p>
                <p>The dataset is mostly made up of UN countries, but it also includes some territories, such as <strong className="text-[var(--text-primary)]">Aruba</strong>, when Wikipedia has useful data for them.</p>
                <p>Sources and coverage may grow over time.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

const EMPTY_POSITIONS: Record<string, number> = {};
const EMPTY_LOCKS: Record<string, boolean> = {};

const IS_DEV = process.env.NODE_ENV === 'development';
const MS_PER_DAY = 86_400_000;

function buildInitialSessions(puzzle: PuzzleFile): StatSession[] {
  return puzzle.stats.map((stat) => ({
    statId: stat.id,
    solved: false,
    guesses: [],
  }));
}

/**
 * Compute per-token correctness for a submitted left-to-right order against the
 * target order. bulls[i] = true when the token at left-to-right position i is the
 * country that belongs at that position.
 */
function computeBulls(order: string[], target: string[]): boolean[] {
  return order.map((id, i) => id === target[i]);
}

/**
 * The correct left-to-right order for a stat: country IDs sorted ascending by
 * value (least on the left, most on the right — the value line's orientation).
 * This is direction-agnostic: it does not depend on the stat's ranking direction,
 * only on the raw values. Ties are broken deterministically by country ID.
 */
function targetOrderForStat(
  countryIds: string[],
  values: Record<string, number> | undefined,
): string[] {
  if (!values) return [...countryIds];
  return countryIds.slice().sort((a, b) => {
    const diff = (values[a] ?? 0) - (values[b] ?? 0);
    if (diff !== 0) return diff;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

/**
 * Accumulate the set of countries that have been in their correct relative
 * position across all guesses for a stat. These tokens are "locked".
 */
function computeLockedCountries(guesses: Guess[]): Record<string, boolean> {
  const locked: Record<string, boolean> = {};
  for (const guess of guesses) {
    guess.bulls.forEach((b, i) => {
      if (b) locked[guess.order[i]] = true;
    });
  }
  return locked;
}

/**
 * Compute the running total score from current stat sessions using the new
 * reward-based scoring model (ordering + distance + attempt decay).
 */
function computeTotalScore(stats: StatSession[], puzzle: PuzzleFile): number {
  const statScores = stats.map((session) => {
    if (!session.solved || session.guesses.length === 0) return 0;
    const stat = puzzle.stats.find((s) => s.id === session.statId);
    if (!stat?.values) return 0;
    const lastGuess = session.guesses[session.guesses.length - 1];
    const positions = lastGuess.positions ?? {};
    return scoreForStat(session, positions, stat.values);
  });
  return totalScore(statScores);
}

export default function GamePage() {
  const [puzzle, setPuzzle] = useState<PuzzleFile | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [positions, setPositions] = useState<Record<string, number>>({ ...EMPTY_POSITIONS });
  const [locked, setLocked] = useState<Record<string, boolean>>({ ...EMPTY_LOCKS });
  const [announcement, setAnnouncement] = useState('');
  const [statsHistory, setStatsHistory] = useState<StatsHistory | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [persistenceStatus, setPersistenceStatus] = useState<'saved' | 'unsaved' | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setStatsHistory(loadStatsHistory()), 0);
    return () => window.clearTimeout(id);
  }, []);

  // Computed once per session at mount; refreshes automatically at UTC midnight
  // so a tab left open overnight will get the new puzzle without a manual reload.
  const [today, setToday] = useState(() => getUTCDateString());
  useEffect(() => {
    const msUntilMidnight = () => {
      const now = Date.now();
      return (Math.floor(now / MS_PER_DAY) + 1) * MS_PER_DAY - now;
    };
    const id = setTimeout(() => setToday(getUTCDateString()), msUntilMidnight());
    return () => clearTimeout(id);
  // Re-schedules the timer after each rollover so it fires again the next midnight.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);
  // Dev seed override — only active in development
  const [devDate, setDevDate] = useState<string | null>(null);
  const effectiveDate = (IS_DEV && devDate) ? devDate : today;
  const puzzleNumber = getPuzzleNumberForDate(effectiveDate);
  const currentResult = gameState?.status === 'complete' && gameState.finalScore !== null
    ? {
        version: 1 as const,
        puzzleNumber: gameState.puzzleNumber,
        dateUTC: gameState.dateUTC,
        completed: true as const,
        finalScore: gameState.finalScore,
      }
    : null;

  // Visual effects
  const [roundCompleteEffect, setRoundCompleteEffect] = useState(false);

  function completeGame(completedState: GameState, showRecap = true): void {
    const finalScore = completedState.finalScore ?? completedState.runningScore;
    const dailyResult: DailyResult = {
      version: 1,
      puzzleNumber: completedState.puzzleNumber,
      dateUTC: completedState.dateUTC,
      completed: true,
      finalScore,
    };
    const saved = saveDailyResult(dailyResult);

    setGameState(completedState);
    saveGameState(completedState);
    setStatsHistory(loadStatsHistory());
    setPersistenceStatus(saved ? 'saved' : 'unsaved');
    setAnnouncement(`Game complete! Your score is ${finalScore} out of 1000 points.`);
    if (showRecap) setPageStatus('complete');

    const playerStats = loadPlayerStats();
    const updatedPlayerStats = {
      ...playerStats,
      played: playerStats.played + 1,
      completed: playerStats.completed + 1,
      totalScore: playerStats.totalScore + finalScore,
      bestScore: Math.max(playerStats.bestScore, finalScore),
      currentStreak: playerStats.currentStreak + 1,
      maxStreak: Math.max(playerStats.maxStreak, playerStats.currentStreak + 1),
      lastCompletedPuzzleNumber: puzzleNumber,
    };
    savePlayerStats(updatedPlayerStats);
  }


  const fetchPuzzle = useCallback(async (targetDate: string) => {
    setPageStatus('loading');
    try {
      const res = await fetch(`/api/puzzle?date=${targetDate}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PuzzleFile = await res.json();

      // Validate response date matches request (stale CDN guard)
      if (data.date !== targetDate) {
        const retryRes = await fetch(`/api/puzzle?date=${targetDate}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!retryRes.ok) throw new Error(`HTTP ${retryRes.status}`);
        const retryData: PuzzleFile = await retryRes.json();
        if (retryData.date !== targetDate) throw new Error('Date mismatch');
        setPuzzle(retryData);
      } else {
        setPuzzle(data);
      }
    } catch {
      setPageStatus('error');
    }
  }, []);

  // Re-initialize whenever the effective date changes (handles dev switching too)
  useEffect(() => {
    const pn = puzzleNumber;
    const savedState = loadGameState(pn);

    if (savedState) {
      if (savedState.status === 'complete') {
        // Restore persisted game state after the browser-only storage read.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGameState(savedState);
        const repaired = repairDailyResult(savedState);
        setPersistenceStatus(repaired ? 'saved' : 'unsaved');
        setStatsHistory(loadStatsHistory());
        setPageStatus('complete');
        fetchPuzzle(effectiveDate);
        return;
      }
      setGameState(savedState);
    }

    fetchPuzzle(effectiveDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveDate]);

  // Once puzzle loads, initialize game state if needed
  useEffect(() => {
    if (!puzzle) return;

    const pn = puzzleNumber;
    const saved = loadGameState(pn);

    if (saved) {
      // Restore persisted game state after the browser-only storage read.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGameState(saved);
      if (saved.status === 'complete') {
        const repaired = repairDailyResult(saved);
        setPersistenceStatus(repaired ? 'saved' : 'unsaved');
        setStatsHistory(loadStatsHistory());
        setPageStatus('complete');
      } else {
        const lastStatIndex = saved.activeStatIndex;
        const lastStat = saved.stats[lastStatIndex];
        if (lastStat.guesses.length > 0) {
          const lockedCountries = computeLockedCountries(lastStat.guesses);
          const lastGuess = lastStat.guesses[lastStat.guesses.length - 1];
          // Restore prior placements (locked tokens stay fixed; the rest resume
          // where the player left off). Falls back to empty for legacy guesses
          // that predate line-scale positions.
          const restored: Record<string, number> = { ...(lastGuess.positions ?? {}) };
          setLocked(lockedCountries);
          setPositions(restored);
        } else {
          setPositions({ ...EMPTY_POSITIONS });
          setLocked({ ...EMPTY_LOCKS });
        }
        setPageStatus('playing');
      }
    } else {
      const newState: GameState = {
        puzzleNumber: pn,
        dateUTC: effectiveDate,
        status: 'in_progress',
        activeStatIndex: 0,
        stats: buildInitialSessions(puzzle),
        runningScore: 0,
        finalScore: null,
        updatedAt: Date.now(),
      };
      setGameState(newState);
      setPositions({ ...EMPTY_POSITIONS });
      setLocked({ ...EMPTY_LOCKS });
      saveGameState(newState);
      setPageStatus('playing');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  // Reset all transient UI when the dev date changes
  const handleDevDateChange = useCallback((date: string) => {
    setPuzzle(null);
    setGameState(null);
    setPositions({ ...EMPTY_POSITIONS });
    setLocked({ ...EMPTY_LOCKS });
    setAnnouncement('');
    setRoundCompleteEffect(false);
    setDevDate(date === today ? null : date);
  }, []);

  function handleSubmit() {
    if (!puzzle || !gameState || pageStatus !== 'playing') return;
    // All five countries must be placed on the line before submitting.
    if (puzzle.countries.some((c) => positions[c.id] == null)) return;

    const statIndex = gameState.activeStatIndex;
    const stat = puzzle.stats[statIndex];
    const order = deriveOrder(positions);
    const target = targetOrderForStat(
      puzzle.countries.map((c) => c.id),
      stat.values,
    );
    const bulls = computeBulls(order, target);
    const allBulls = bulls.every(Boolean);

    const newGuess: Guess = { order, bulls, positions: { ...positions } };
    const updatedStats = gameState.stats.map((s, i) => {
      if (i !== statIndex) return s;
      return { ...s, solved: allBulls, guesses: [...s.guesses, newGuess] };
    });

    const newRunningScore = computeTotalScore(updatedStats, puzzle);

    const isLastStat = statIndex === 2;
    const isComplete = allBulls && isLastStat;

    const updatedState: GameState = {
      ...gameState,
      activeStatIndex: statIndex,
      stats: updatedStats,
      runningScore: newRunningScore,
      finalScore: isComplete ? newRunningScore : gameState.finalScore,
      status: isComplete ? 'complete' : 'in_progress',
      updatedAt: Date.now(),
    };

    if (isComplete) {
      completeGame(updatedState, false);
    } else {
      setGameState(updatedState);
      saveGameState(updatedState);
    }

    // Lock correctly-positioned countries; keep all placements on the line so the
    // player can nudge the remaining (unlocked) tokens for the next guess.
    const newLocked: Record<string, boolean> = { ...locked };
    order.forEach((countryId, i) => {
      if (bulls[i]) newLocked[countryId] = true;
    });
    setLocked(newLocked);

    if (allBulls) {
      setAnnouncement(isComplete ? 'Final stage solved!' : `Stat ${statIndex + 1} solved!`);
      setRoundCompleteEffect(true);
      setTimeout(() => setRoundCompleteEffect(false), 1800);
    } else {
      // Wrong guess — no visual effect
    }
  }

  function handleAdvanceStage() {
    if (!gameState || pageStatus !== 'playing') return;

    const statIndex = gameState.activeStatIndex;
    const activeSession = gameState.stats[statIndex];
    if (!activeSession?.solved) return;

    if (statIndex === 2) {
      setPageStatus('complete');
      return;
    }

    const nextStatIndex = statIndex + 1;
    const nextState: GameState = {
      ...gameState,
      activeStatIndex: nextStatIndex,
      updatedAt: Date.now(),
    };

    setGameState(nextState);
    saveGameState(nextState);
    setPositions({ ...EMPTY_POSITIONS });
    setLocked({ ...EMPTY_LOCKS });
    setAnnouncement('');
    setRoundCompleteEffect(false);
  }

  if (showStats) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <StatsView
          history={statsHistory}
          currentDateUTC={effectiveDate}
          currentPuzzleNumber={puzzleNumber}
          currentResult={currentResult}
          persistenceStatus={persistenceStatus}
          onClose={() => setShowStats(false)}
        />
      </main>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (pageStatus === 'loading') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8">
          {/* Orbital loader */}
          <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
            {/* Track ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: '1px solid var(--border-hover)' }}
            />
            {/* Outer spinning arc */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: '1px solid transparent',
                borderTopColor: 'var(--gold)',
                borderRightColor: 'rgba(232,197,71,0.3)',
                animation: 'orbitSpin 1.8s linear infinite',
              }}
            />
            {/* Inner spinning arc — reverse */}
            <div
              className="absolute rounded-full"
              style={{
                inset: '12px',
                border: '1px solid transparent',
                borderTopColor: 'var(--teal)',
                animation: 'orbitSpinReverse 2.4s linear infinite',
              }}
            />
            {/* Center pulse */}
            <div
              className="rounded-full"
              style={{
                width: 12,
                height: 12,
                background: 'var(--gold)',
                opacity: 0.7,
                animation: 'pulseBeat 1.6s ease-in-out infinite',
              }}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <span
              className="text-shimmer-gold tracking-[0.3em] text-3xl"
              style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 900 }}
            >
              WorldOrder
            </span>
            <p className="text-xs tracking-[0.25em] uppercase" style={{ color: 'var(--text-muted)' }}>
              Loading today&apos;s puzzle
            </p>
          </div>
        </div>
        {IS_DEV && (
          <DevPanel
            currentDate={effectiveDate}
            todayDate={today}
            onDateChange={handleDevDateChange}
          />
        )}
      </main>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (pageStatus === 'error') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <div
          className="text-center max-w-sm p-8 rounded-2xl animate-slide-up-fade"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            boxShadow: '0 0 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Decorative top line */}
          <div
            className="w-full h-px mb-6"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(232,197,71,0.4), transparent)' }}
          />
          <div
            className="text-3xl tracking-[0.25em] mb-3"
            style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 900, color: 'var(--gold)' }}
          >
            WorldOrder
          </div>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Couldn&apos;t load today&apos;s puzzle.
            <br />Check your connection and try again.
          </p>
          <button
            onClick={() => fetchPuzzle(effectiveDate)}
            className="px-8 py-3 font-semibold rounded-xl transition-all active:scale-95 text-sm tracking-widest uppercase"
            style={{
              background: 'var(--gold)',
              color: '#000',
              boxShadow: '0 0 20px rgba(232,197,71,0.3)',
            }}
          >
            Try Again
          </button>
          <div
            className="w-full h-px mt-6"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(232,197,71,0.2), transparent)' }}
          />
        </div>
        {IS_DEV && (
          <DevPanel
            currentDate={effectiveDate}
            todayDate={today}
            onDateChange={handleDevDateChange}
          />
        )}
      </main>
    );
  }

  // ── Complete ─────────────────────────────────────────────────────────────────
  if (pageStatus === 'complete' && gameState && puzzle) {
    return (
      <main
        className="flex flex-col items-center justify-center min-h-screen"
        style={{
          paddingTop: 'var(--space-page-top)',
          paddingBottom: 'max(var(--space-page), env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'max(var(--space-page), env(safe-area-inset-left, 0px))',
          paddingRight: 'max(var(--space-page), env(safe-area-inset-right, 0px))',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <FaqMenu />
        <LiveRegion message={announcement} />
        <ResultCard
          state={gameState}
          puzzleNumber={puzzleNumber}
          puzzle={puzzle}
          onDailyStats={() => setShowStats(true)}
        />
        {IS_DEV && (
          <DevPanel
            currentDate={effectiveDate}
            todayDate={today}
            onDateChange={handleDevDateChange}
          />
        )}
      </main>
    );
  }

  if (!puzzle || !gameState) return null;

  const activeStatIndex = gameState.activeStatIndex;
  const activeStat = puzzle.stats[activeStatIndex] ?? null;
  const activeSession = gameState.stats[activeStatIndex];
  const allPlaced = puzzle.countries.every((c) => positions[c.id] != null);

  /**
   * Value-line endpoints for the active stat: the smallest and largest values
   * among the five puzzle countries. Falls back to [0, 1] if values are missing
   * (legacy puzzles pre-dating feature 007).
   */
  const activeValues = activeStat?.values ?? null;
  const activeUnit = activeStat?.unit ?? '';
  const lineMin = activeValues ? Math.min(...Object.values(activeValues)) : 0;
  const lineMax = activeValues ? Math.max(...Object.values(activeValues)) : 1;

  /** Pre-formatted value map for all 5 countries in the active stat (used by FeedbackRow). */
  const activeValueMap: Record<string, string> = (() => {
    const v = activeStat?.values;
    const u = activeStat?.unit;
    if (!v || !u) return {};
    return Object.fromEntries(puzzle.countries.map((c) => [c.id, formatStatValue(v[c.id] ?? 0, u)]));
  })();

  return (
    <main className="flex flex-col items-center min-h-screen">
      <FaqMenu />
      {/* Animated aurora blobs */}
      <div
        aria-hidden="true"
        className="aurora-1"
        style={{
          position: 'fixed',
          top: '-8%',
          right: '-12%',
          width: 'var(--blob-size)',
          height: 'var(--blob-size)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,197,71,0.08) 0%, transparent 65%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        className="aurora-2"
        style={{
          position: 'fixed',
          bottom: '-10%',
          left: '-12%',
          width: 'var(--blob-size)',
          height: 'var(--blob-size)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,196,232,0.06) 0%, transparent 65%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Round-complete overlay */}
      {roundCompleteEffect && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center"
          style={{ zIndex: 50 }}
        >
          {/* Expanding radial rings */}
          {[0, 280, 560].map((delay, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 'var(--overlay-ring)',
                height: 'var(--overlay-ring)',
                top: '50%',
                left: '50%',
                background: 'radial-gradient(circle, rgba(232,197,71,0.18) 0%, transparent 70%)',
                animationName: 'radialPulse',
                animationDuration: '1.3s',
                animationDelay: `${delay}ms`,
                animationTimingFunction: 'ease-out',
                animationFillMode: 'both',
              }}
            />
          ))}
          {/* SOLVED text */}
          <div
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontWeight: 900,
              fontSize: 'var(--solved-fs)',
              letterSpacing: '0.3em',
              color: 'var(--gold)',
              textShadow: '0 0 40px rgba(232,197,71,0.9), 0 0 80px rgba(232,197,71,0.4)',
              animationName: 'solvedBurst',
              animationDuration: '1.8s',
              animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              animationFillMode: 'both',
            }}
          >
            SOLVED
          </div>
        </div>
      )}

      <div
        data-testid="playing-surface"
        className="w-full flex flex-col"
        style={{
          position: 'relative',
          zIndex: 1,
           maxWidth: 'var(--playing-board-max, var(--board-max))',
          paddingTop: 'var(--space-page-top)',
          paddingBottom: 'max(var(--space-page), env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'max(var(--space-page), env(safe-area-inset-left, 0px))',
          paddingRight: 'max(var(--space-page), env(safe-area-inset-right, 0px))',
          gap: 'var(--gap-section)',
          alignSelf: 'center',
          width: '100%',
        }}
      >

        {/* ── Header ── */}
        <header
          className="flex flex-col items-center pb-4 animate-slide-up-fade"
          style={{ borderBottom: '1px solid rgba(232,197,71,0.08)' }}
        >
          <h1
            className="text-shimmer-gold tracking-[0.25em]"
            style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 900, fontSize: 'clamp(1.2rem, 5vw, var(--fs-brand))', whiteSpace: 'nowrap' }}
          >
            WorldOrder
          </h1>
           <div
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold tracking-[0.15em] uppercase mt-2"
            style={{
              border: '1px solid rgba(232,197,71,0.2)',
              color: 'var(--gold)',
              background: 'rgba(232,197,71,0.05)',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>#</span>
            <span>{puzzleNumber}</span>
          </div>
        </header>

        <LiveRegion message={announcement} />

        {/* ── Score ── */}
        <div className="animate-slide-up-fade" style={{ animationDelay: '60ms' }}>
          <ScoreDisplay score={gameState.runningScore} />
        </div>

        {/* ── Stat progress stepper ── */}
        <div
          className="flex gap-2 items-center animate-slide-up-fade"
          style={{ animationDelay: '100ms' }}
          aria-label="Round progress"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-full overflow-hidden relative"
              style={{ background: 'var(--border)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: i <= activeStatIndex ? '100%' : '0%',
                  background: i < activeStatIndex
                    ? 'var(--success)'
                    : i === activeStatIndex
                      ? 'linear-gradient(90deg, var(--gold-dim), var(--gold), var(--gold-bright))'
                      : 'transparent',
                  boxShadow: i === activeStatIndex
                    ? '0 0 8px rgba(232,197,71,0.6)'
                    : i < activeStatIndex
                      ? '0 0 6px rgba(0,232,150,0.4)'
                      : 'none',
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Stat panel ── */}
        <div
          key={activeStatIndex}
          className="animate-fade-slide-down"
          style={{ animationDelay: '140ms' }}
        >
          <StatPanel
            stat={activeStat}
            isSolved={activeSession?.solved ?? false}
            statIndex={activeStatIndex}
          />
        </div>

        {/* ── Historical feedback rows ── */}
        {activeSession && activeSession.guesses.length > 0 && (
          <div className="flex flex-col gap-2.5 animate-slide-up-fade" style={{ animationDelay: '160ms' }}>
            {activeSession.guesses.map((guess, i) => (
              <FeedbackRow key={i} guess={guess} countries={puzzle.countries} statIndex={activeStatIndex + 1} guessIndex={i + 1} valueMap={activeValueMap} />
            ))}
          </div>
        )}

        {/* ── Line-scale board ── */}
        <div
          className="animate-slide-up-fade"
          style={{
            animationDelay: '200ms',
            // Break out of the --board-max column to a wider, centered width.
            // Uses negative margin centering instead of transform to avoid
            // creating a containing block that breaks position:fixed in DragOverlay.
             width: 'var(--playing-line-board-width, var(--line-board-width))',
             marginLeft: 'calc(50% - var(--playing-line-board-width, var(--line-board-width)) / 2)',
          }}
        >
          <LineScaleBoard
            countries={puzzle.countries}
            min={lineMin}
            max={lineMax}
            unit={activeUnit}
            positions={positions}
            locked={locked}
            onPositionsChange={setPositions}
            disabled={activeSession?.solved ?? false}
            correctPositions={
              activeSession?.solved && activeValues
                ? trueFractions(activeValues)
                : undefined
            }
          />
        </div>

        {/* ── Submit / Advance ── */}
        {!activeSession?.solved && (
          <div className="animate-slide-up-fade" style={{ animationDelay: '240ms' }}>
            <button
              data-testid="submit-btn"
              onClick={handleSubmit}
              disabled={!allPlaced}
              className="w-full py-4 font-bold rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 uppercase tracking-[0.2em] text-sm disabled:cursor-not-allowed"
              style={{
                background: allPlaced
                  ? 'linear-gradient(135deg, var(--gold-dim) 0%, var(--gold) 50%, var(--gold-bright) 100%)'
                  : 'var(--surface-2)',
                color: allPlaced ? '#000' : 'var(--text-muted)',
                fontFamily: 'var(--font-cinzel)',
                boxShadow: allPlaced
                  ? '0 0 24px rgba(232,197,71,0.35), 0 4px 16px rgba(0,0,0,0.4)'
                  : 'none',
                border: allPlaced
                  ? '1px solid rgba(245,215,110,0.4)'
                  : '1px solid var(--border)',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                opacity: allPlaced ? 1 : 0.5,
                focusRingColor: 'var(--gold)',
                focusRingOffsetColor: 'var(--bg)',
              } as React.CSSProperties}
            >
              Submit Placement
            </button>
          </div>
        )}

        {activeSession?.solved && (
          <div className="animate-slide-up-fade" style={{ animationDelay: '240ms' }}>
            <button
              data-testid="next-stage-btn"
              onClick={handleAdvanceStage}
              className="w-full py-4 font-bold rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 uppercase tracking-[0.2em] text-sm"
              style={{
                background: activeStatIndex === 2
                  ? 'linear-gradient(135deg, var(--teal) 0%, var(--success) 100%)'
                  : 'linear-gradient(135deg, var(--gold-dim) 0%, var(--gold) 50%, var(--gold-bright) 100%)',
                color: '#000',
                fontFamily: 'var(--font-cinzel)',
                boxShadow: activeStatIndex === 2
                  ? '0 0 24px rgba(0,232,150,0.3), 0 4px 16px rgba(0,0,0,0.4)'
                  : '0 0 24px rgba(232,197,71,0.35), 0 4px 16px rgba(0,0,0,0.4)',
                border: activeStatIndex === 2
                  ? '1px solid rgba(0,232,150,0.35)'
                  : '1px solid rgba(245,215,110,0.4)',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
              } as React.CSSProperties}
            >
              {activeStatIndex === 2 ? 'Show Recap' : 'Next stage'}
            </button>
          </div>
        )}
      </div>

      {IS_DEV && (
        <DevPanel
          currentDate={effectiveDate}
          todayDate={today}
          onDateChange={handleDevDateChange}
        />
      )}
    </main>
  );
}
