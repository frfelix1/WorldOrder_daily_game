import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RankingList } from '../../src/components/game/RankingList';
import type { Country } from '../../src/types';

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: {},
  arrayMove: (arr: unknown[], from: number, to: number) => {
    const result = [...(arr as string[])];
    const [item] = result.splice(from, 1);
    result.splice(to, 0, item);
    return result;
  },
  useSortable: () => ({
    attributes: { 'aria-roledescription': 'sortable item' },
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

const countries: Country[] = [
  { id: 'NGA', name: 'Nigeria',   flagCode: 'ng' },
  { id: 'BRA', name: 'Brazil',    flagCode: 'br' },
  { id: 'DEU', name: 'Germany',   flagCode: 'de' },
  { id: 'JPN', name: 'Japan',     flagCode: 'jp' },
  { id: 'AUS', name: 'Australia', flagCode: 'au' },
];

const order = countries.map((c) => c.id);

describe('RankingList', () => {
  it('renders all 5 country cards', () => {
    render(<RankingList countries={countries} order={order} onReorder={vi.fn()} />);
    const cards = screen.getAllByTestId('country-card');
    expect(cards).toHaveLength(5);
  });

  it('renders country names', () => {
    render(<RankingList countries={countries} order={order} onReorder={vi.fn()} />);
    expect(screen.getByText('Nigeria')).toBeInTheDocument();
    expect(screen.getByText('Brazil')).toBeInTheDocument();
  });

  it('renders in disabled mode with aria-disabled', () => {
    render(<RankingList countries={countries} order={order} onReorder={vi.fn()} disabled />);
    const list = screen.getByTestId('ranking-list');
    expect(list).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders data-testid="ranking-list"', () => {
    render(<RankingList countries={countries} order={order} onReorder={vi.fn()} />);
    expect(screen.getByTestId('ranking-list')).toBeInTheDocument();
  });
});
