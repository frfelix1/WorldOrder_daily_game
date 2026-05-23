interface ScoreDisplayProps {
  score: number;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const pct = Math.min(100, Math.round((score / 150) * 100));

  return (
    <div aria-label={`Running score: ${score} / 150`}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.28em',
            color: 'var(--text-muted)',
          }}
        >
          Score
        </span>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            background: 'linear-gradient(90deg, var(--gold-dim), var(--gold), var(--gold-bright))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {score} / 150
        </span>
      </div>
      {/* Progress track */}
      <div
        style={{
          height: '6px',
          borderRadius: '999px',
          overflow: 'hidden',
          background: 'var(--border)',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '999px',
            width: `${pct}%`,
            backgroundImage: pct > 0
              ? 'linear-gradient(90deg, var(--gold-dim), var(--gold), var(--gold-bright))'
              : 'none',
            backgroundSize: '200% auto',
            animation: pct > 0 ? 'shimmerGold 2.5s linear infinite' : 'none',
            boxShadow: pct > 0
              ? '0 0 10px rgba(232, 197, 71, 0.6), 0 0 4px rgba(232, 197, 71, 0.9)'
              : 'none',
            transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
    </div>
  );
}
