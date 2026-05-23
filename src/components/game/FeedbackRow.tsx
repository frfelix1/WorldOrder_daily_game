import type { Guess } from '../../types';

interface FeedbackRowProps {
  guess: Guess;
  statIndex?: number;
  guessIndex?: number;
}

export function FeedbackRow({ guess, statIndex = 1, guessIndex = 1 }: FeedbackRowProps) {
  return (
    <div data-testid="feedback-row" className="flex gap-1">
      {guess.bulls.map((bull, pos) => (
        <span
          key={pos}
          aria-label={`Position ${pos + 1}: ${bull ? 'correct' : 'incorrect'}`}
          className="text-xl"
        >
          {bull ? '🟩' : '🟥'}
        </span>
      ))}
    </div>
  );
}
