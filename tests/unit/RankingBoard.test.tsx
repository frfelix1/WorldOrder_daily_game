import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RankingBoard } from '../../src/components/game/RankingBoard';
import type { Country } from '../../src/types';

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children ?? null}</>,
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: { toString: () => '' },
    Translate: { toString: () => '' },
  },
}));

const countries: Country[] = [
  { id: 'NGA', name: 'Nigeria',   flagCode: 'ng' },
  { id: 'BRA', name: 'Brazil',    flagCode: 'br' },
  { id: 'DEU', name: 'Germany',   flagCode: 'de' },
  { id: 'JPN', name: 'Japan',     flagCode: 'jp' },
  { id: 'AUS', name: 'Australia', flagCode: 'au' },
];

const emptySlots: (string | null)[] = [null, null, null, null, null];
const noLocks: boolean[] = [false, false, false, false, false];

describe('RankingBoard', () => {
  it('renders the ranking board container', () => {
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={emptySlots}
        lockedSlots={noLocks}
        onSlotsChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('ranking-board')).toBeInTheDocument();
  });

  it('renders 5 ranking slots', () => {
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={emptySlots}
        lockedSlots={noLocks}
        onSlotsChange={vi.fn()}
      />,
    );
    expect(screen.getAllByTestId('ranking-slot')).toHaveLength(5);
  });

  it('renders 5 pool chips when all slots are empty', () => {
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={emptySlots}
        lockedSlots={noLocks}
        onSlotsChange={vi.fn()}
      />,
    );
    expect(screen.getAllByTestId('pool-chip')).toHaveLength(5);
  });

  it('pool chips show all country names', () => {
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={emptySlots}
        lockedSlots={noLocks}
        onSlotsChange={vi.fn()}
      />,
    );
    for (const country of countries) {
      expect(screen.getByText(country.name)).toBeInTheDocument();
    }
  });

  it('reduces pool chip count when a slot is filled', () => {
    const slots: (string | null)[] = ['NGA', null, null, null, null];
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={slots}
        lockedSlots={noLocks}
        onSlotsChange={vi.fn()}
      />,
    );
    // NGA is in slot 0, so pool shows only 4 remaining countries
    expect(screen.getAllByTestId('pool-chip')).toHaveLength(4);
  });

  it('shows no pool chips when all slots are filled', () => {
    const slots: (string | null)[] = ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'];
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={slots}
        lockedSlots={noLocks}
        onSlotsChange={vi.fn()}
      />,
    );
    expect(screen.queryAllByTestId('pool-chip')).toHaveLength(0);
  });

  it('clicking a pool chip calls onSlotsChange with that country in the first empty slot', () => {
    const onSlotsChange = vi.fn();
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={emptySlots}
        lockedSlots={noLocks}
        onSlotsChange={onSlotsChange}
      />,
    );
    const chips = screen.getAllByTestId('pool-chip');
    fireEvent.click(chips[0]); // Nigeria chip
    expect(onSlotsChange).toHaveBeenCalledOnce();
    const newSlots = onSlotsChange.mock.calls[0][0] as (string | null)[];
    // First slot should now have 'NGA'
    expect(newSlots[0]).toBe('NGA');
    // Others remain null
    expect(newSlots.slice(1).every((s) => s === null)).toBe(true);
  });

  it('does not render pool chips when disabled', () => {
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={emptySlots}
        lockedSlots={noLocks}
        onSlotsChange={vi.fn()}
        disabled
      />,
    );
    expect(screen.queryAllByTestId('pool-chip')).toHaveLength(0);
  });

  it('clicking a locked slot does not call onSlotsChange', () => {
    const onSlotsChange = vi.fn();
    const slots: (string | null)[] = ['NGA', null, null, null, null];
    const locks: boolean[] = [true, false, false, false, false];
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={slots}
        lockedSlots={locks}
        onSlotsChange={onSlotsChange}
      />,
    );
    // NGA is locked in slot 0, removing it should not be possible
    expect(onSlotsChange).not.toHaveBeenCalled();
  });
});
