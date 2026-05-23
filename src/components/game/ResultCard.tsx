'use client';

import { useState } from 'react';
import type { GameState, PuzzleFile } from '../../types';
import { buildShareText } from '../../lib/scoring';
import { FeedbackRow } from './FeedbackRow';

interface ResultCardProps {
  state: GameState;
  puzzleNumber: number;
  puzzle: PuzzleFile;
}

function performanceLabel(score: number): { label: string; color: string } {
  if (score === 150) return { label: 'Perfect', color: 'var(--accent)' };
  if (score >= 120) return { label: 'Excellent', color: '#22d3ee' };
  if (score >= 90)  return { label: 'Great', color: 'var(--success)' };
  if (score >= 60)  return { label: 'Good', color: '#a3e635' };
  return { label: 'Keep practicing', color: 'var(--text-secondary)' };
}

export function ResultCard({ state, puzzleNumber, puzzle }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const finalScore = state.finalScore ?? state.runningScore;
  const perf = performanceLabel(finalScore);
  const pct = Math.round((finalScore / 150) * 100);

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
      // Fallback: show the text in the DOM (handled separately if needed)
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard write failed — do nothing (could show a modal with the text)
      }
    }
  }

  return (
    <div
      data-testid="result-card"
      className="w-full max-w-sm flex flex-col items-center gap-5 py-8 px-2"
    >
      {/* Brand */}
      <div
        className="text-4xl tracking-[0.2em] text-[var(--accent)]"
        style={{ fontFamily: 'var(--font-bebas)' }}
      >
        Rankle
      </div>

      {/* Score */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        <p
          data-testid="final-score"
          className="text-5xl font-extrabold tabular-nums"
          style={{ color: perf.color }}
        >
          {finalScore}
          <span className="text-xl font-normal text-[var(--text-muted)] ml-1">/ 150</span>
        </p>
        <span
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: perf.color }}
        >
          {perf.label}
        </span>
        {/* Score bar */}
        <div
          className="w-full h-1.5 rounded-full mt-2 overflow-hidden"
          style={{ background: 'var(--border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, var(--accent-dim), ${perf.color})`,
            }}
          />
        </div>
      </div>

      {/* Emoji grid by stat */}
      <div className="w-full flex flex-col gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
        {state.stats.map((session, statIdx) => (
          <div key={session.statId} className="flex flex-col gap-1.5">
            <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-widest">
              {puzzle.stats[statIdx]?.label ?? `Stat ${statIdx + 1}`}
            </p>
            {session.guesses.map((guess, guessIdx) => (
              <FeedbackRow
                key={guessIdx}
                guess={guess}
                statIndex={statIdx + 1}
                guessIndex={guessIdx + 1}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Puzzle number */}
      <p className="text-xs text-[var(--text-muted)] tracking-widest uppercase">
        Puzzle #{puzzleNumber}
      </p>

      {/* Share button */}
      <button
        data-testid="share-btn"
        onClick={handleShare}
        aria-label="Share your result"
        className={[
          'w-full py-3.5 font-bold rounded-xl transition-all active:scale-[0.98]',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg)]',
          'uppercase tracking-widest text-sm',
          copied
            ? 'bg-[var(--success)] text-black focus:ring-[var(--success)]'
            : 'bg-[var(--accent)] text-black hover:bg-amber-400 focus:ring-[var(--accent)]',
        ].join(' ')}
      >
        {copied ? 'Copied! 🎉' : 'Share Result'}
      </button>
    </div>
  );
}
