import type { StatDef } from '../../types';
import { Tooltip } from '../ui/Tooltip';

interface StatPanelProps {
  stat: StatDef | null;
  isSolved: boolean;
  statIndex: number;
}

function directionLabel(stat: StatDef): string {
  return stat.direction === 'desc'
    ? `Rank from most ${stat.label} to least ${stat.label}`
    : `Rank from least ${stat.label} to most ${stat.label}`;
}

export function StatPanel({ stat, isSolved, statIndex }: StatPanelProps) {
  if (!stat) return null;

  return (
    <div
      data-testid="stat-panel"
      data-stat-index={statIndex}
      className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.18em]">
          Round {statIndex + 1} of 3
        </span>
        {isSolved && (
          <span className="text-[10px] font-bold text-[var(--success)] bg-[var(--success-faint)] border border-[var(--success)]/20 px-2 py-0.5 rounded-full tracking-wide uppercase">
            ✓ Solved
          </span>
        )}
      </div>

      <Tooltip content={stat.tooltip}>
        <span className="text-lg font-bold text-[var(--text-primary)] cursor-help underline decoration-dotted decoration-[var(--text-muted)] underline-offset-4">
          {stat.label}
        </span>
      </Tooltip>

      <p data-testid="stat-direction" className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
        {directionLabel(stat)}
      </p>
    </div>
  );
}
