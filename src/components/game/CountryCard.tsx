'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Country } from '../../types';

interface CountryCardProps {
  country: Country;
  isDragging?: boolean;
}

export function CountryCard({ country, isDragging = false }: CountryCardProps) {
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
        'flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg select-none cursor-grab',
        isDragging ? 'opacity-50 shadow-lg z-50' : 'shadow-sm hover:shadow-md',
      ].join(' ')}
      {...attributes}
      {...listeners}
    >
      <span className={`fi fi-${country.flagCode} text-2xl flex-shrink-0`} aria-hidden="true" />
      <span className="font-medium text-neutral-800">{country.name}</span>
    </li>
  );
}
