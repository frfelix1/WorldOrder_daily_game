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
    disabled: isCorrect === true,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '14px',
    border: isCorrect
      ? '1px solid rgba(0, 232, 150, 0.25)'
      : isDragging
        ? '1px solid rgba(232,197,71,0.4)'
        : '1px solid var(--border)',
    background: isCorrect
      ? 'rgba(0, 20, 14, 0.80)'
      : isDragging
        ? 'var(--surface-2)'
        : 'var(--surface-1)',
    boxShadow: isDragging
      ? '0 0 24px rgba(232,197,71,0.2), 0 12px 40px rgba(0,0,0,0.5)'
      : isCorrect
        ? '0 0 16px rgba(0,232,150,0.08)'
        : 'none',
    userSelect: 'none',
    cursor: isCorrect ? 'default' : isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.5 : 1,
    backdropFilter: isCorrect ? 'blur(10px)' : 'none',
    WebkitBackdropFilter: isCorrect ? 'blur(10px)' : 'none',
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-testid="country-card"
      className={isCorrect ? 'animate-lock-in' : ''}
      {...attributes}
      {...listeners}
    >
      {rank !== undefined && (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            width: '18px',
            textAlign: 'center',
            flexShrink: 0,
            fontFamily: 'var(--font-cinzel)',
            color: isCorrect ? 'var(--success)' : 'var(--text-muted)',
          }}
        >
          {rank}
        </span>
      )}
      <span
        className={`fi fi-${country.flagCode} flex-shrink-0`}
        style={{ fontSize: '18px', borderRadius: '3px', overflow: 'hidden' }}
        aria-hidden="true"
      />
      <span
        className="font-medium flex-1"
        style={{ fontSize: '14px', color: 'var(--text-primary)' }}
      >
        {country.name}
      </span>

      {/* Checkmark when correct, drag handle otherwise */}
      {isCorrect ? (
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full"
          style={{
            width: 20,
            height: 20,
            background: 'rgba(0, 232, 150, 0.12)',
            border: '1px solid rgba(0, 232, 150, 0.3)',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M2.5 7.5L5.5 10.5L11.5 3.5"
              stroke="var(--success)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        <svg
          className="flex-shrink-0"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
          style={{ color: 'var(--text-muted)' }}
        >
          <path
            d="M2 4.5h10M2 7h10M2 9.5h10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </li>
  );
}
