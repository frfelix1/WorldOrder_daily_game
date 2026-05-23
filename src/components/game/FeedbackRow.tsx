import type { Guess } from '../../types';

interface FeedbackRowProps {
  guess: Guess;
  statIndex?: number;
  guessIndex?: number;
}

export function FeedbackRow({ guess, statIndex = 1, guessIndex = 1 }: FeedbackRowProps) {
  return (
    <div data-testid="feedback-row" className="flex gap-1.5">
      {guess.bulls.map((bull, pos) => (
        <span
          key={pos}
          aria-label={`Position ${pos + 1}: ${bull ? 'correct' : 'incorrect'}`}
          className={[
            'inline-flex items-center justify-center w-9 h-9 rounded-lg text-base',
            'border animate-pop',
            bull
              ? 'bg-[var(--success-faint)] border-[var(--success)]/30'
              : 'bg-[var(--wrong-faint)] border-[var(--wrong)]/25',
          ].join(' ')}
          style={{ animationDelay: `${pos * 55}ms` }}
        >
          {bull ? '🟩' : '🟥'}
        </span>
      ))}
    </div>
  );
}
