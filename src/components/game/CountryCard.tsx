'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Country } from '../../types';

interface CountryCardProps {
  country: Country;
  isDragging?: boolean;
  rank?: number;
  isCorrect?: boolean;
}

export function CountryCard({ country, isDragging = false, rank, isCorrect }: CountryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: country.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-testid="country-card"
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-xl border select-none',
        'cursor-grab active:cursor-grabbing transition-all duration-200',
        isDragging
          ? 'opacity-60 shadow-2xl scale-[1.03] border-[var(--accent)]/40 z-50'
          : isCorrect
            ? 'bg-[var(--success-faint)] border-[var(--success)]/35 hover:border-[var(--success)]/55'
            : 'bg-[var(--surface-1)] border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)]',
      ].join(' ')}
      {...attributes}
      {...listeners}
    >
      {rank !== undefined && (
        <span className={[
          'text-xs font-bold w-4 text-center tabular-nums flex-shrink-0',
          isCorrect ? 'text-[var(--success)]' : 'text-[var(--text-muted)]',
        ].join(' ')}>
          {rank}
        </span>
      )}
      <span
        className={`fi fi-${country.flagCode} text-xl flex-shrink-0`}
        style={{ borderRadius: '2px', overflow: 'hidden' }}
        aria-hidden="true"
      />
      <span className="font-medium text-[var(--text-primary)] flex-1 text-sm">
        {country.name}
      </span>
      {/* Drag handle icon */}
      <svg
        className="text-[var(--text-muted)] flex-shrink-0"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 4.5h10M2 7h10M2 9.5h10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </li>
  );
}
