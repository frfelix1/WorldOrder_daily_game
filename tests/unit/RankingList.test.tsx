import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { RankingList } from '../../src/components/game/RankingList';
import type { Country } from '../../src/types';
import type { DragEndEvent } from '@dnd-kit/core';

let capturedOnDragEnd: ((e: DragEndEvent) => void) | null = null;

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd?: (e: DragEndEvent) => void;
  }) => {
    capturedOnDragEnd = onDragEnd ?? null;
    return <>{children}</>;
  },
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

function makeDragEnd(activeId: string, overId: string | null): DragEndEvent {
  return {
    active: { id: activeId, rect: {} as never, data: {} as never },
    over: overId ? { id: overId, rect: {} as never, data: {} as never, disabled: false } : null,
    activatorEvent: {} as never,
    collisions: null,
    delta: { x: 0, y: 0 },
  } as unknown as DragEndEvent;
}

beforeEach(() => {
  capturedOnDragEnd = null;
});

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

  it('handleDragEnd calls onReorder when dragging one country over another', () => {
    const onReorder = vi.fn();
    render(<RankingList countries={countries} order={order} onReorder={onReorder} />);

    act(() => {
      capturedOnDragEnd!(makeDragEnd('NGA', 'BRA'));
    });

    expect(onReorder).toHaveBeenCalledOnce();
    // NGA (index 0) and BRA (index 1) should be swapped
    const result = onReorder.mock.calls[0][0] as string[];
    expect(result[0]).toBe('BRA');
    expect(result[1]).toBe('NGA');
  });

  it('handleDragEnd does nothing when dragging a country onto itself', () => {
    const onReorder = vi.fn();
    render(<RankingList countries={countries} order={order} onReorder={onReorder} />);

    act(() => {
      capturedOnDragEnd!(makeDragEnd('NGA', 'NGA'));
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('handleDragEnd does nothing when over is null', () => {
    const onReorder = vi.fn();
    render(<RankingList countries={countries} order={order} onReorder={onReorder} />);

    act(() => {
      capturedOnDragEnd!(makeDragEnd('NGA', null));
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('handleDragEnd does not reorder when lastBulls locks the source position', () => {
    const onReorder = vi.fn();
    const lastBulls = [true, false, false, false, false]; // NGA locked at position 0
    render(<RankingList countries={countries} order={order} onReorder={onReorder} lastBulls={lastBulls} />);

    act(() => {
      capturedOnDragEnd!(makeDragEnd('NGA', 'BRA'));
    });

    expect(onReorder).not.toHaveBeenCalled();
  });
});
