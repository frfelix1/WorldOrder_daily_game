import type { Guess, Country } from '../../types';

interface FeedbackRowProps {
  guess: Guess;
  countries: Country[];  // full list of 5 countries for this puzzle
  statIndex?: number;    // kept for aria/test context
  guessIndex?: number;   // kept for aria/test context
  /**
   * Pre-formatted value strings keyed by country ID.
   * When provided, correct positions in this row display the value under the country name.
   */
  valueMap?: Record<string, string>;
}

export function FeedbackRow({ guess, countries, statIndex = 1, guessIndex = 1, valueMap }: FeedbackRowProps) {
  return (
    <div
      data-testid="feedback-row"
      role="list"
      style={{ display: 'flex', gap: '6px' }}
    >
      {guess.order.map((countryId, pos) => {
        const country = countries.find((c) => c.id === countryId) ?? null;
        const isCorrect = guess.bulls[pos];
        const revealedValue = isCorrect && valueMap ? (valueMap[countryId] ?? null) : null;

        const borderColor = isCorrect
          ? 'rgba(0,232,150,0.35)'
          : 'rgba(255,48,98,0.3)';
        const bgColor = isCorrect
          ? 'rgba(0,232,150,0.07)'
          : 'rgba(255,48,98,0.08)';

        return (
          <div
            key={pos}
            role="listitem"
            data-testid="feedback-cell"
            aria-label={`Position ${pos + 1}: ${country?.name ?? 'Unknown'} — ${isCorrect ? 'correct' : 'incorrect'}`}
            className="animate-pop"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '4px 2px',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              background: bgColor,
              minWidth: 0,
              position: 'relative',
              animationDelay: `${pos * 60}ms`,
            }}
          >
            {/* Icon */}
            <span
              aria-hidden="true"
              style={{
                fontSize: '10px',
                color: isCorrect ? 'rgba(0,232,150,0.9)' : 'rgba(255,48,98,0.9)',
                lineHeight: 1,
              }}
            >
              {isCorrect ? '✓' : '✗'}
            </span>

            {/* Flag */}
            {country ? (
              <span
                className={`fi fi-${country.flagCode}`}
                aria-hidden="true"
                style={{ fontSize: '16px', borderRadius: '2px', overflow: 'hidden' }}
              />
            ) : (
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>?</span>
            )}

            {/* Country name */}
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-primary)',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                lineHeight: 1.2,
              }}
            >
              {country?.name ?? '?'}
            </span>

            {/* Revealed value — shown on correct positions when valueMap provided */}
            {revealedValue != null && (
              <span
                style={{
                  fontSize: '9px',
                  color: 'rgba(0,232,150,0.65)',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  lineHeight: 1.2,
                }}
              >
                {revealedValue}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
