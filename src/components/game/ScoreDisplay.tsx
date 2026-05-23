interface ScoreDisplayProps {
  score: number;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const pct = Math.min(100, Math.round((score / 150) * 100));

  return (
    <div aria-label={`Running score: ${score} / 150`}>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">
          Score
        </span>
        <span className="text-[var(--text-secondary)] tabular-nums text-sm font-semibold">
          {score} / 150
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--accent-dim), var(--accent))',
          }}
        />
      </div>
    </div>
  );
}
