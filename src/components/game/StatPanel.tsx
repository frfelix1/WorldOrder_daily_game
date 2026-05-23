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

  const accentColor = isSolved ? 'var(--success)' : 'var(--gold)';
  const accentFaint = isSolved ? 'rgba(0, 232, 150, 0.07)' : 'rgba(232, 197, 71, 0.06)';
  const borderColor = isSolved ? 'rgba(0, 232, 150, 0.28)' : 'rgba(232, 197, 71, 0.2)';
  const glowColor = isSolved
    ? '0 0 28px rgba(0, 232, 150, 0.07), inset 0 0 0 1px rgba(0, 232, 150, 0.05)'
    : '0 0 28px rgba(232, 197, 71, 0.07), inset 0 0 0 1px rgba(232, 197, 71, 0.05)';

  return (
    <div
      data-testid="stat-panel"
      data-stat-index={statIndex}
      style={{
        padding: '18px 20px',
        borderRadius: '16px',
        border: `1px solid ${borderColor}`,
        background: 'var(--surface-1)',
        boxShadow: glowColor,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${accentColor}50, transparent)`,
        }}
      />

      {/* Round indicator row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                  background: i <= statIndex
                    ? (isSolved && i === statIndex ? 'var(--success)' : i < statIndex ? 'var(--success)' : 'var(--gold)')
                    : 'var(--border-hover)',
                  boxShadow: i === statIndex && !isSolved
                    ? '0 0 6px rgba(232,197,71,0.6)'
                    : i <= statIndex && isSolved
                      ? '0 0 5px rgba(0,232,150,0.5)'
                      : 'none',
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: accentColor,
            }}
          >
            Round {statIndex + 1} of 3
          </span>
        </div>

        {isSolved && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--success)',
              background: 'rgba(0, 232, 150, 0.08)',
              border: '1px solid rgba(0, 232, 150, 0.2)',
              padding: '3px 10px',
              borderRadius: '999px',
            }}
          >
            ✓ Solved
          </span>
        )}
      </div>

      {/* Stat label */}
      <Tooltip content={stat.tooltip}>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-cinzel)',
            cursor: 'help',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            textDecorationColor: 'var(--text-muted)',
            textUnderlineOffset: '4px',
          }}
        >
          {stat.label}
        </span>
      </Tooltip>

      {/* Direction */}
      <p
        data-testid="stat-direction"
        style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginTop: '8px',
          lineHeight: 1.6,
        }}
      >
        {directionLabel(stat)}
      </p>
    </div>
  );
}
