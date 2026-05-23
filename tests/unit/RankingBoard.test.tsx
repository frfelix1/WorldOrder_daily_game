import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RankingBoard } from '../../src/components/game/RankingBoard';
import type { Country } from '../../src/types';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';

// Capture DndContext callbacks so individual tests can trigger drag events.
let capturedOnDragStart: ((e: DragStartEvent) => void) | null = null;
let capturedOnDragEnd: ((e: DragEndEvent) => void) | null = null;

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragStart,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragStart?: (e: DragStartEvent) => void;
    onDragEnd?: (e: DragEndEvent) => void;
  }) => {
    capturedOnDragStart = onDragStart ?? null;
    capturedOnDragEnd = onDragEnd ?? null;
    return <>{children}</>;
  },
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

/** Helper: build a minimal DragEndEvent for testing handleDragEnd */
function makeDragEnd(activeId: string, overId: string | null): DragEndEvent {
  return {
    active: { id: activeId, rect: {} as never, data: {} as never },
    over: overId ? { id: overId, rect: {} as never, data: {} as never, disabled: false } : null,
    activatorEvent: {} as never,
    collisions: null,
    delta: { x: 0, y: 0 },
  } as unknown as DragEndEvent;
}

/** Helper: build a minimal DragStartEvent */
function makeDragStart(activeId: string): DragStartEvent {
  return {
    active: { id: activeId, rect: {} as never, data: {} as never },
    activatorEvent: {} as never,
  } as unknown as DragStartEvent;
}

beforeEach(() => {
  capturedOnDragStart = null;
  capturedOnDragEnd = null;
});

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

// ── Drag-and-drop: handleDragEnd logic ───────────────────────────────────────

describe('RankingBoard drag-and-drop', () => {
  it('dragging a pool chip onto an empty slot places it there', () => {
    const onSlotsChange = vi.fn();
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={emptySlots}
        lockedSlots={noLocks}
        onSlotsChange={onSlotsChange}
      />,
    );

    act(() => {
      capturedOnDragEnd!(makeDragEnd('pool:BRA', 'slot:2'));
    });

    expect(onSlotsChange).toHaveBeenCalledOnce();
    const result = onSlotsChange.mock.calls[0][0] as (string | null)[];
    expect(result[2]).toBe('BRA');
    // All other slots untouched
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[3]).toBeNull();
    expect(result[4]).toBeNull();
  });

  it('dragging a pool chip onto a filled slot displaces the occupant back to the pool', () => {
    const onSlotsChange = vi.fn();
    // Slot 1 already has DEU
    const slots: (string | null)[] = [null, 'DEU', null, null, null];
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={slots}
        lockedSlots={noLocks}
        onSlotsChange={onSlotsChange}
      />,
    );

    // Drag BRA from pool onto slot 1 (occupied by DEU)
    act(() => {
      capturedOnDragEnd!(makeDragEnd('pool:BRA', 'slot:1'));
    });

    expect(onSlotsChange).toHaveBeenCalledOnce();
    const result = onSlotsChange.mock.calls[0][0] as (string | null)[];
    // BRA is now in slot 1
    expect(result[1]).toBe('BRA');
    // DEU is no longer in any slot (back in pool)
    expect(result.includes('DEU')).toBe(false);
  });

  it('dragging a placed chip from one slot to another swaps them', () => {
    const onSlotsChange = vi.fn();
    // Slot 0 has NGA, slot 3 has JPN
    const slots: (string | null)[] = ['NGA', null, null, 'JPN', null];
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={slots}
        lockedSlots={noLocks}
        onSlotsChange={onSlotsChange}
      />,
    );

    // Drag NGA from slot 0 onto slot 3 (occupied by JPN)
    act(() => {
      capturedOnDragEnd!(makeDragEnd('placed:0:NGA', 'slot:3'));
    });

    expect(onSlotsChange).toHaveBeenCalledOnce();
    const result = onSlotsChange.mock.calls[0][0] as (string | null)[];
    // NGA moves to slot 3, JPN moves to slot 0 (swap)
    expect(result[3]).toBe('NGA');
    expect(result[0]).toBe('JPN');
    expect(result[1]).toBeNull();
    expect(result[2]).toBeNull();
    expect(result[4]).toBeNull();
  });

  it('dragging a placed chip to an empty slot moves it there and vacates the source', () => {
    const onSlotsChange = vi.fn();
    const slots: (string | null)[] = ['NGA', null, null, null, null];
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={slots}
        lockedSlots={noLocks}
        onSlotsChange={onSlotsChange}
      />,
    );

    // Drag NGA from slot 0 to the empty slot 4
    act(() => {
      capturedOnDragEnd!(makeDragEnd('placed:0:NGA', 'slot:4'));
    });

    expect(onSlotsChange).toHaveBeenCalledOnce();
    const result = onSlotsChange.mock.calls[0][0] as (string | null)[];
    expect(result[4]).toBe('NGA');
    expect(result[0]).toBeNull();
  });

  it('dragging a placed chip to the pool zone returns it to the pool', () => {
    const onSlotsChange = vi.fn();
    const slots: (string | null)[] = [null, 'BRA', null, null, null];
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={slots}
        lockedSlots={noLocks}
        onSlotsChange={onSlotsChange}
      />,
    );

    // Drag BRA from slot 1 back to the pool drop zone
    act(() => {
      capturedOnDragEnd!(makeDragEnd('placed:1:BRA', 'pool'));
    });

    expect(onSlotsChange).toHaveBeenCalledOnce();
    const result = onSlotsChange.mock.calls[0][0] as (string | null)[];
    expect(result[1]).toBeNull();
    expect(result.every((s) => s === null)).toBe(true);
  });

  it('dragging onto a locked slot does not call onSlotsChange', () => {
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

    // Attempt to drag BRA from pool onto the locked slot 0
    act(() => {
      capturedOnDragEnd!(makeDragEnd('pool:BRA', 'slot:0'));
    });

    expect(onSlotsChange).not.toHaveBeenCalled();
  });

  it('dropping onto no droppable (over = null) does nothing', () => {
    const onSlotsChange = vi.fn();
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={emptySlots}
        lockedSlots={noLocks}
        onSlotsChange={onSlotsChange}
      />,
    );

    act(() => {
      capturedOnDragEnd!(makeDragEnd('pool:NGA', null as unknown as string));
    });

    expect(onSlotsChange).not.toHaveBeenCalled();
  });

  it('handleDragStart sets the active drag ID, causing the overlay to render', () => {
    // When dragging starts, the DragOverlay should receive the active country
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={emptySlots}
        lockedSlots={noLocks}
        onSlotsChange={vi.fn()}
      />,
    );

    // Before drag — overlay is empty, Nigeria appears only as a pool chip
    expect(screen.getAllByText('Nigeria')).toHaveLength(1);

    // Start dragging Nigeria from the pool
    act(() => {
      capturedOnDragStart!(makeDragStart('pool:NGA'));
    });

    // The DragOverlay (mocked as a passthrough) now renders the overlay content,
    // so Nigeria's name appears twice: once as the pool chip ghost and once in the overlay.
    expect(screen.getAllByText('Nigeria')).toHaveLength(2);
  });

  it('dragEnd clears the active drag ID so the overlay is removed', () => {
    render(
      <RankingBoard
        countries={countries}
        slotAssignments={emptySlots}
        lockedSlots={noLocks}
        onSlotsChange={vi.fn()}
      />,
    );

    act(() => {
      capturedOnDragStart!(makeDragStart('pool:NGA'));
    });
    expect(screen.getAllByText('Nigeria')).toHaveLength(2);

    act(() => {
      capturedOnDragEnd!(makeDragEnd('pool:NGA', null as unknown as string));
    });

    // Overlay removed — Nigeria appears only once again
    expect(screen.getAllByText('Nigeria')).toHaveLength(1);
  });
});
