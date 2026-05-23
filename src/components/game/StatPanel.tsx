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
      className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <Tooltip content={stat.tooltip}>
          <span className="text-lg font-semibold text-neutral-800 cursor-help underline decoration-dotted">
            {stat.label}
          </span>
        </Tooltip>
        {isSolved && (
          <span className="ml-auto text-green-600 font-bold text-sm">✓ Solved</span>
        )}
      </div>
      <p data-testid="stat-direction" className="text-sm text-neutral-500 mt-1">
        {directionLabel(stat)}
      </p>
    </div>
  );
}
