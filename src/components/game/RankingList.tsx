'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { Country } from '../../types';
import { CountryCard } from './CountryCard';

interface RankingListProps {
  countries: Country[];
  order: string[];
  onReorder: (newOrder: string[]) => void;
  disabled?: boolean;
}

export function RankingList({ countries, order, onReorder, disabled = false }: RankingListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortedCountries = order
    .map((id) => countries.find((c) => c.id === id))
    .filter((c): c is Country => c !== undefined);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(active.id as string);
      const newIndex = order.indexOf(over.id as string);
      onReorder(arrayMove(order, oldIndex, newIndex));
    }
  }

  if (disabled) {
    return (
      <ul
        data-testid="ranking-list"
        aria-disabled="true"
        className="flex flex-col gap-2"
      >
        {sortedCountries.map((country) => (
          <CountryCard key={country.id} country={country} />
        ))}
      </ul>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ul data-testid="ranking-list" className="flex flex-col gap-2">
          {sortedCountries.map((country) => (
            <CountryCard key={country.id} country={country} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
