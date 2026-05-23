'use client';

import { useEffect, useState, useCallback } from 'react';
import type { PuzzleFile, GameState, Guess, StatSession } from '../types';
import { getPuzzleNumberForDate, getUTCDateString } from '../lib/puzzle';
import { loadGameState, saveGameState, loadPlayerStats, savePlayerStats } from '../lib/game-state';
import { totalScore } from '../lib/scoring';
import { ScoreDisplay } from '../components/game/ScoreDisplay';
import { StatPanel } from '../components/game/StatPanel';
import { RankingBoard } from '../components/game/RankingBoard';
import { FeedbackRow } from '../components/game/FeedbackRow';
import { LiveRegion } from '../components/ui/LiveRegion';
import { ResultCard } from '../components/game/ResultCard';
import { DevPanel } from '../components/dev/DevPanel';

type PageStatus = 'loading' | 'error' | 'playing' | 'complete';

const EMPTY_SLOTS: (string | null)[] = [null, null, null, null, null];
const EMPTY_LOCKS: boolean[] = [false, false, false, false, false];

const IS_DEV = process.env.NODE_ENV === 'development';
const TODAY = getUTCDateString();

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

/** Accumulate which positions have been correct across all guesses for a stat. */
function computeLockedSlots(guesses: Guess[]): boolean[] {
  const locked = [false, false, false, false, false];
  for (const guess of guesses) {
    guess.bulls.forEach((b, i) => {
      if (b) locked[i] = true;
    });
  }
  return locked;
}

export default function GamePage() {
  const [puzzle, setPuzzle] = useState<PuzzleFile | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [slotAssignments, setSlotAssignments] = useState<(string | null)[]>([...EMPTY_SLOTS]);
  const [lockedSlots, setLockedSlots] = useState<boolean[]>([...EMPTY_LOCKS]);
  const [announcement, setAnnouncement] = useState('');

  // Dev seed override — only active in development
  const [devDate, setDevDate] = useState<string | null>(null);
  const effectiveDate = (IS_DEV && devDate) ? devDate : TODAY;
  const puzzleNumber = getPuzzleNumberForDate(effectiveDate);

  // Visual effects
  const [roundCompleteEffect, setRoundCompleteEffect] = useState(false);
  const [wrongGuessEffect, setWrongGuessEffect] = useState(false);
  const [wrongGuessCount, setWrongGuessCount] = useState(0);

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
        setGameState(savedState);
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
      setGameState(saved);
      if (saved.status === 'complete') {
        setPageStatus('complete');
      } else {
        const lastStatIndex = saved.activeStatIndex;
        const lastStat = saved.stats[lastStatIndex];
        if (lastStat.guesses.length > 0) {
          const locked = computeLockedSlots(lastStat.guesses);
          const lastOrder = lastStat.guesses[lastStat.guesses.length - 1].order;
          const restored: (string | null)[] = lastOrder.map((id, i) =>
            locked[i] ? id : null,
          );
          setLockedSlots(locked);
          setSlotAssignments(restored);
        } else {
          setSlotAssignments([...EMPTY_SLOTS]);
          setLockedSlots([...EMPTY_LOCKS]);
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
      setSlotAssignments([...EMPTY_SLOTS]);
      setLockedSlots([...EMPTY_LOCKS]);
      saveGameState(newState);
      setPageStatus('playing');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  // Reset all transient UI when the dev date changes
  const handleDevDateChange = useCallback((date: string) => {
    setPuzzle(null);
    setGameState(null);
    setSlotAssignments([...EMPTY_SLOTS]);
    setLockedSlots([...EMPTY_LOCKS]);
    setAnnouncement('');
    setRoundCompleteEffect(false);
    setWrongGuessEffect(false);
    setDevDate(date === TODAY ? null : date);
  }, []);

  function handleSubmit() {
    if (!puzzle || !gameState || pageStatus !== 'playing') return;
    if (slotAssignments.some((s) => s === null)) return;

    const statIndex = gameState.activeStatIndex;
    const stat = puzzle.stats[statIndex];
    const submitted = slotAssignments as string[];
    const bulls = computeBulls(submitted, stat.solution);
    const allBulls = bulls.every(Boolean);

    const newGuess: Guess = { order: [...submitted], bulls };
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

    // Lock correct slots; return incorrect ones to pool
    const newLockedSlots = [...lockedSlots];
    const newSlotAssignments = [...slotAssignments] as (string | null)[];
    bulls.forEach((isCorrect, i) => {
      if (isCorrect) {
        newLockedSlots[i] = true;
      } else {
        newSlotAssignments[i] = null;
      }
    });
    setLockedSlots(newLockedSlots);
    setSlotAssignments(newSlotAssignments);

    if (allBulls) {
      if (isComplete) {
        setAnnouncement(`Game complete! Your score is ${newRunningScore} out of 150 points.`);
        setPageStatus('complete');

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
        // Trigger round-complete visual
        setRoundCompleteEffect(true);
        setTimeout(() => {
          setSlotAssignments([...EMPTY_SLOTS]);
          setLockedSlots([...EMPTY_LOCKS]);
          setAnnouncement('');
        }, 800);
        setTimeout(() => setRoundCompleteEffect(false), 1800);
      }
    } else {
      // Wrong guess — trigger shake
      setWrongGuessCount((c) => c + 1);
      setWrongGuessEffect(true);
      setTimeout(() => setWrongGuessEffect(false), 600);
    }
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
              Rankle
            </span>
            <p className="text-xs tracking-[0.25em] uppercase" style={{ color: 'var(--text-muted)' }}>
              Loading today&apos;s puzzle
            </p>
          </div>
        </div>
        {IS_DEV && (
          <DevPanel
            currentDate={effectiveDate}
            todayDate={TODAY}
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
            Rankle
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
            todayDate={TODAY}
            onDateChange={handleDevDateChange}
          />
        )}
      </main>
    );
  }

  // ── Complete ─────────────────────────────────────────────────────────────────
  if (pageStatus === 'complete' && gameState && puzzle) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <LiveRegion message={announcement} />
        <ResultCard state={gameState} puzzleNumber={puzzleNumber} puzzle={puzzle} />
        {IS_DEV && (
          <DevPanel
            currentDate={effectiveDate}
            todayDate={TODAY}
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
  const allSlotsFilled = slotAssignments.every((s) => s !== null);

  return (
    <main className="flex flex-col items-center min-h-screen">
      {/* Animated aurora blobs */}
      <div
        aria-hidden="true"
        className="aurora-1"
        style={{
          position: 'fixed',
          top: '-8%',
          right: '-12%',
          width: '520px',
          height: '520px',
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
          width: '500px',
          height: '500px',
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
                width: '700px',
                height: '700px',
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
              fontSize: '2.8rem',
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

      <div className="w-full max-w-md px-4 pt-6 pb-12 flex flex-col gap-5" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <header
          className="flex items-center justify-between pb-4 animate-slide-up-fade"
          style={{ borderBottom: '1px solid rgba(232,197,71,0.08)' }}
        >
          <h1
            className="text-shimmer-gold tracking-[0.25em] text-4xl"
            style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 900 }}
          >
            Rankle
          </h1>
          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold tracking-[0.15em] uppercase"
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
                className="h-full rounded-full transition-all duration-1000 ease-out"
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
                  transition: 'width 1s ease-out, box-shadow 0.3s',
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
              <FeedbackRow key={i} guess={guess} statIndex={activeStatIndex + 1} guessIndex={i + 1} />
            ))}
          </div>
        )}

        {/* ── Ranking board (with shake wrapper) ── */}
        <div
          key={`shake-${wrongGuessCount}`}
          className={[
            'animate-slide-up-fade',
            wrongGuessEffect ? 'animate-shake' : '',
          ].join(' ')}
          style={{ animationDelay: '200ms' }}
        >
          <RankingBoard
            countries={puzzle.countries}
            slotAssignments={slotAssignments}
            lockedSlots={lockedSlots}
            onSlotsChange={setSlotAssignments}
            disabled={activeSession?.solved ?? false}
          />
        </div>

        {/* ── Submit ── */}
        {!activeSession?.solved && (
          <div className="animate-slide-up-fade" style={{ animationDelay: '240ms' }}>
            <button
              data-testid="submit-btn"
              onClick={handleSubmit}
              disabled={!allSlotsFilled}
              className="w-full py-4 font-bold rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 uppercase tracking-[0.2em] text-sm disabled:cursor-not-allowed"
              style={{
                background: allSlotsFilled
                  ? 'linear-gradient(135deg, var(--gold-dim) 0%, var(--gold) 50%, var(--gold-bright) 100%)'
                  : 'var(--surface-2)',
                color: allSlotsFilled ? '#000' : 'var(--text-muted)',
                fontFamily: 'var(--font-cinzel)',
                boxShadow: allSlotsFilled
                  ? '0 0 24px rgba(232,197,71,0.35), 0 4px 16px rgba(0,0,0,0.4)'
                  : 'none',
                border: allSlotsFilled
                  ? '1px solid rgba(245,215,110,0.4)'
                  : '1px solid var(--border)',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                opacity: allSlotsFilled ? 1 : 0.5,
                focusRingColor: 'var(--gold)',
                focusRingOffsetColor: 'var(--bg)',
              } as React.CSSProperties}
            >
              Submit Ranking
            </button>
          </div>
        )}
      </div>

      {IS_DEV && (
        <DevPanel
          currentDate={effectiveDate}
          todayDate={TODAY}
          onDateChange={handleDevDateChange}
        />
      )}
    </main>
  );
}
