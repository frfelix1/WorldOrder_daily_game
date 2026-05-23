import type { Guess } from '../../types';

interface FeedbackRowProps {
  guess: Guess;
  statIndex?: number;
  guessIndex?: number;
}

export function FeedbackRow({ guess, statIndex = 1, guessIndex = 1 }: FeedbackRowProps) {
  return (
    <div data-testid="feedback-row" style={{ display: 'flex', gap: '6px' }}>
      {guess.bulls.map((bull, pos) => (
        <span
          key={pos}
          aria-label={`Position ${pos + 1}: ${bull ? 'correct' : 'incorrect'}`}
          className="animate-pop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            fontSize: '17px',
            animationDelay: `${pos * 60}ms`,
            background: bull
              ? 'rgba(0, 232, 150, 0.10)'
              : 'rgba(255, 48, 98, 0.09)',
            border: bull
              ? '1px solid rgba(0, 232, 150, 0.32)'
              : '1px solid rgba(255, 48, 98, 0.28)',
            boxShadow: bull
              ? '0 0 10px rgba(0, 232, 150, 0.14), inset 0 1px 0 rgba(0,232,150,0.1)'
              : '0 0 10px rgba(255, 48, 98, 0.12), inset 0 1px 0 rgba(255,48,98,0.08)',
          }}
        >
          {bull ? '🟩' : '🟥'}
        </span>
      ))}
    </div>
  );
}
