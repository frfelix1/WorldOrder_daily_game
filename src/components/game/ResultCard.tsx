'use client';

import { useState, useEffect } from 'react';
import type { GameState, PuzzleFile } from '../../types';
import { buildShareText } from '../../lib/scoring';
import { FeedbackRow } from './FeedbackRow';

interface ResultCardProps {
  state: GameState;
  puzzleNumber: number;
  puzzle: PuzzleFile;
}

// Deterministic confetti pieces (no Math.random() to avoid hydration issues)
const CONFETTI = Array.from({ length: 52 }, (_, i) => ({
  id: i,
  left: ((i * 37 + 11) % 100),
  delay: ((i * 13) % 21) * 0.09,
  duration: 2.6 + ((i * 7) % 5) * 0.45,
  size: 4 + (i % 5) * 2,
  color: ['#e8c547', '#00c4e8', '#00e896', '#ff6090', '#dde8f8', '#c4a6ff'][(i * 7) % 6],
  isRect: i % 3 !== 0,
  wobble: (i % 2 === 0) ? 1 : -1,
}));

function performanceLabel(score: number): { label: string; color: string; medal: string; glow: string } {
  if (score === 150) return { label: 'Perfect',         color: '#e8c547', medal: '🏆', glow: 'rgba(232,197,71,0.4)' };
  if (score >= 120)  return { label: 'Excellent',       color: '#00c4e8', medal: '🥇', glow: 'rgba(0,196,232,0.35)' };
  if (score >= 90)   return { label: 'Great',           color: '#00e896', medal: '🥈', glow: 'rgba(0,232,150,0.35)' };
  if (score >= 60)   return { label: 'Good',            color: '#a3e635', medal: '🥉', glow: 'rgba(163,230,53,0.3)' };
  return               { label: 'Keep Exploring',      color: '#7a90b0', medal: '💪', glow: 'rgba(122,144,176,0.25)' };
}

function PerformanceBadge({ perf }: { perf: ReturnType<typeof performanceLabel> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {/* Animated orbital badge */}
      <div style={{ position: 'relative', width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer slow ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `1px solid ${perf.color}25`,
            animation: 'orbitSpin 8s linear infinite',
          }}
        />
        {/* Dashed middle ring */}
        <div
          style={{
            position: 'absolute',
            inset: '8px',
            borderRadius: '50%',
            border: `1px dashed ${perf.color}40`,
            animation: 'orbitSpinReverse 5s linear infinite',
          }}
        />
        {/* Inner circle with medal */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${perf.color}10`,
            border: `1px solid ${perf.color}35`,
            boxShadow: `0 0 28px ${perf.glow}`,
            fontSize: '30px',
          }}
          role="img"
          aria-label={perf.label}
        >
          {perf.medal}
        </div>
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: perf.color,
          fontFamily: 'var(--font-cinzel)',
        }}
      >
        {perf.label}
      </span>
    </div>
  );
}

export function ResultCard({ state, puzzleNumber, puzzle }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const finalScore = state.finalScore ?? state.runningScore;
  const perf = performanceLabel(finalScore);
  const pct = Math.round((finalScore / 150) * 100);

  // Count-up: start at finalScore (so tests see correct value immediately),
  // then animate from 0 after a short delay.
  const [displayScore, setDisplayScore] = useState(finalScore);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;

    // Start confetti after brief delay
    const confettiTimeout = setTimeout(() => setShowConfetti(true), 200);

    timeoutId = setTimeout(() => {
      setDisplayScore(0);
      let current = 0;
      const step = Math.max(1, Math.ceil(finalScore / 50));
      intervalId = setInterval(() => {
        current = Math.min(current + step, finalScore);
        setDisplayScore(current);
        if (current >= finalScore) clearInterval(intervalId);
      }, 25);
    }, 400);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(confettiTimeout);
      clearInterval(intervalId);
    };
  }, [finalScore]);

  async function handleShare() {
    const text = buildShareText(state, puzzleNumber);
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard write failed
      }
    }
  }

  return (
    <>
      {/* Confetti rain */}
      {showConfetti && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 40,
          }}
        >
          {CONFETTI.map((p) => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.left}%`,
                top: '-24px',
                width: p.size,
                height: p.isRect ? p.size * 1.8 : p.size,
                backgroundColor: p.color,
                borderRadius: p.isRect ? '2px' : '50%',
                animationName: 'confettiDrop',
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                animationTimingFunction: 'linear',
                animationFillMode: 'both',
                opacity: 0.85,
              }}
            />
          ))}
        </div>
      )}

      {/* Result card */}
      <div
        data-testid="result-card"
        className="animate-slide-up-fade"
        style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0',
          position: 'relative',
          zIndex: 41,
        }}
      >
        {/* Top decorative line */}
        <div
          style={{
            width: '100%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${perf.color}50, transparent)`,
            marginBottom: '28px',
          }}
        />

        {/* Brand */}
        <div
          className="text-shimmer-gold"
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontWeight: 900,
            fontSize: '2rem',
            letterSpacing: '0.3em',
            marginBottom: '28px',
          }}
        >
          Rankle
        </div>

        {/* Performance badge */}
        <div className="animate-slide-up-fade" style={{ animationDelay: '150ms', marginBottom: '28px' }}>
          <PerformanceBadge perf={perf} />
        </div>

        {/* Score display */}
        <div
          className="animate-slide-up-fade"
          style={{
            animationDelay: '250ms',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            marginBottom: '28px',
          }}
        >
          <p
            data-testid="final-score"
            style={{
              fontSize: '5rem',
              fontWeight: 800,
              lineHeight: 1,
              tabularNums: true,
              color: perf.color,
              textShadow: `0 0 40px ${perf.glow}`,
              fontFamily: 'var(--font-cinzel)',
              letterSpacing: '-0.02em',
            } as React.CSSProperties}
          >
            {displayScore}
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 400,
                color: 'var(--text-muted)',
                marginLeft: '8px',
                letterSpacing: '0',
              }}
            >
              / 150
            </span>
          </p>

          {/* Score bar */}
          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '999px',
              overflow: 'hidden',
              background: 'var(--border)',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '999px',
                width: `${pct}%`,
                background: `linear-gradient(90deg, var(--gold-dim), ${perf.color})`,
                boxShadow: `0 0 12px ${perf.glow}`,
                transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--border-hover), transparent)',
            marginBottom: '20px',
          }}
        />

        {/* Emoji grid by stat */}
        <div
          className="animate-slide-up-fade"
          style={{
            animationDelay: '350ms',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            background: 'var(--surface-1)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            marginBottom: '20px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {/* Top inner decoration */}
          <div
            style={{
              width: '100%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(232,197,71,0.15), transparent)',
              marginBottom: '4px',
            }}
          />
          {state.stats.map((session, statIdx) => (
            <div key={session.statId} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: 'var(--text-muted)',
                }}
              >
                {puzzle.stats[statIdx]?.label ?? `Stat ${statIdx + 1}`}
              </p>
              {session.guesses.map((guess, guessIdx) => (
                <FeedbackRow
                  key={guessIdx}
                  guess={guess}
                  countries={puzzle.countries}
                  statIndex={statIdx + 1}
                  guessIndex={guessIdx + 1}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Puzzle number */}
        <p
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          Puzzle #{puzzleNumber}
        </p>

        {/* Share button */}
        <button
          data-testid="share-btn"
          onClick={handleShare}
          aria-label="Share your result"
          className="animate-slide-up-fade"
          style={{
            animationDelay: '450ms',
            width: '100%',
            padding: '16px',
            fontWeight: 700,
            borderRadius: '14px',
            fontSize: '13px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-cinzel)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            background: copied
              ? 'linear-gradient(135deg, #00c070, var(--success))'
              : `linear-gradient(135deg, var(--gold-dim), var(--gold), var(--gold-bright))`,
            color: '#000',
            border: copied
              ? '1px solid rgba(0,232,150,0.4)'
              : '1px solid rgba(245,215,110,0.4)',
            boxShadow: copied
              ? '0 0 24px rgba(0,232,150,0.4)'
              : `0 0 24px rgba(232,197,71,0.3), 0 4px 16px rgba(0,0,0,0.4)`,
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 36px rgba(232,197,71,0.5), 0 8px 24px rgba(0,0,0,0.4)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = copied
              ? '0 0 24px rgba(0,232,150,0.4)'
              : '0 0 24px rgba(232,197,71,0.3), 0 4px 16px rgba(0,0,0,0.4)';
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          }}
        >
          {copied ? 'Copied!' : 'Share Result'}
        </button>

        {/* Bottom decorative line */}
        <div
          style={{
            width: '100%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${perf.color}30, transparent)`,
            marginTop: '28px',
          }}
        />
      </div>
    </>
  );
}
