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

export function ResultCard({ state, puzzleNumber, puzzle }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const finalScore = state.finalScore ?? state.runningScore;

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
    <div data-testid="result-card" className="w-full max-w-md flex flex-col items-center gap-6 py-8">
      <h1 className="text-3xl font-bold text-neutral-900">Rankle</h1>

      <p data-testid="final-score" className="text-4xl font-bold text-neutral-700">
        {finalScore} <span className="text-xl font-normal">/ 150 pts</span>
      </p>

      <div className="w-full flex flex-col gap-3">
        {state.stats.map((session, statIdx) => (
          <div key={session.statId} className="flex flex-col gap-1">
            <p className="text-xs text-neutral-500 font-medium">
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

      <button
        data-testid="share-btn"
        onClick={handleShare}
        aria-label="Share your result"
        className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        {copied ? 'Copied! 🎉' : 'Share Result'}
      </button>
    </div>
  );
}
