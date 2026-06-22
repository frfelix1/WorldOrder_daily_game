import type { StatDef, Country } from '../../types';
import { formatStatValue } from '../../lib/formatting';

interface CorrectValuesRowProps {
  stat: StatDef;
  countries: Country[];
}

export function CorrectValuesRow({ stat, countries }: CorrectValuesRowProps): React.ReactElement | null {
  if (!stat.values || !stat.unit) return null;

  const { values, unit, solution } = stat;

  return (
    <div
      data-testid="correct-values-row"
      style={{
        display: 'flex',
        gap: '4px',
        marginTop: '6px',
        paddingTop: '6px',
        borderTop: '1px solid var(--border)',
      }}
    >
      {solution.map((countryId) => {
        const country = countries.find((c) => c.id === countryId);
        const name = country?.name ?? '?';
        const flagCode = country?.flagCode;
        const rawValue = values[countryId];
        const display = formatStatValue(rawValue, unit);

        return (
          <div
            key={countryId}
            data-testid="correct-value-cell"
            aria-label={`${name}: ${display}`}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              fontSize: 'var(--fs-micro)',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            {flagCode ? (
              <span
                className={`fi fi-${flagCode}`}
                aria-hidden="true"
                style={{ fontSize: '12px' }}
              />
            ) : (
              <span aria-hidden="true" style={{ fontSize: '12px' }}>🏳</span>
            )}
            <span style={{ fontWeight: 600, fontSize: 'var(--fs-micro)', lineHeight: 1.2 }}>{name}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-micro)', lineHeight: 1.2 }}>
              {display}
            </span>
          </div>
        );
      })}
    </div>
  );
}
