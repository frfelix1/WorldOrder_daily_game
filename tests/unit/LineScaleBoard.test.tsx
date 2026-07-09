import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { LineScaleBoard } from '../../src/components/game/LineScaleBoard';
import type { Country } from '../../src/types';
import type { DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/core';

// Capture DndContext callbacks so tests can trigger drag events directly.
let capturedOnDragStart: ((e: DragStartEvent) => void) | null = null;
let capturedOnDragEnd: ((e: DragEndEvent) => void) | null = null;
let capturedOnDragMove: ((e: DragMoveEvent) => void) | null = null;

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragStart,
    onDragEnd,
    onDragMove,
  }: {
    children: React.ReactNode;
    onDragStart?: (e: DragStartEvent) => void;
    onDragEnd?: (e: DragEndEvent) => void;
    onDragMove?: (e: DragMoveEvent) => void;
  }) => {
    capturedOnDragStart = onDragStart ?? null;
    capturedOnDragEnd = onDragEnd ?? null;
    capturedOnDragMove = onDragMove ?? null;
    return <>{children}</>;
  },
  DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children ?? null}</>,
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  TouchSensor: vi.fn(),
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
  { id: 'NGA', name: 'Nigeria', flagCode: 'ng' },
  { id: 'BRA', name: 'Brazil', flagCode: 'br' },
  { id: 'DEU', name: 'Germany', flagCode: 'de' },
  { id: 'JPN', name: 'Japan', flagCode: 'jp' },
  { id: 'AUS', name: 'Australia', flagCode: 'au' },
];

const TRACK_WIDTH = 1000;
const TRACK_LEFT = 0;

function makeDragEnd(activeId: string, deltaX: number): DragEndEvent {
  return {
    active: { id: activeId, rect: {} as never, data: {} as never },
    over: null,
    activatorEvent: {} as never,
    collisions: null,
    delta: { x: deltaX, y: 0 },
  } as unknown as DragEndEvent;
}

function makeDragStart(activeId: string): DragStartEvent {
  return {
    active: { id: activeId, rect: {} as never, data: {} as never },
    activatorEvent: {} as never,
  } as unknown as DragStartEvent;
}

function makeDragMove(activeId: string, deltaX: number): DragMoveEvent {
  return {
    active: { id: activeId, rect: {} as never, data: {} as never },
    over: null,
    activatorEvent: {} as never,
    collisions: null,
    delta: { x: deltaX, y: 0 },
  } as unknown as DragMoveEvent;
}

// Force the track to report a known geometry so fraction math is deterministic.
beforeEach(() => {
  capturedOnDragStart = null;
  capturedOnDragEnd = null;
  capturedOnDragMove = null;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    return {
      x: TRACK_LEFT,
      y: 0,
      left: TRACK_LEFT,
      top: 0,
      right: TRACK_LEFT + TRACK_WIDTH,
      bottom: 40,
      width: TRACK_WIDTH,
      height: 40,
      toJSON: () => {},
    } as DOMRect;
  });
});

const noPositions: Record<string, number> = {};
const noLocks: Record<string, boolean> = {};

describe('LineScaleBoard — structure (US1)', () => {
  it('renders the board container', () => {
    render(
      <LineScaleBoard
        countries={countries}
        min={100}
        max={900}
        unit="km²"
        positions={noPositions}
        locked={noLocks}
        onPositionsChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('line-scale-board')).toBeInTheDocument();
  });

  it('renders the horizontal track', () => {
    render(
      <LineScaleBoard
        countries={countries}
        min={100}
        max={900}
        unit="km²"
        positions={noPositions}
        locked={noLocks}
        onPositionsChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('line-scale-track')).toBeInTheDocument();
  });

  it('renders exactly five country tokens with data-country ids', () => {
    render(
      <LineScaleBoard
        countries={countries}
        min={100}
        max={900}
        unit="km²"
        positions={noPositions}
        locked={noLocks}
        onPositionsChange={vi.fn()}
      />,
    );
    const tokens = screen.getAllByTestId('line-token');
    expect(tokens).toHaveLength(5);
    const ids = tokens.map((t) => t.getAttribute('data-country')).sort();
    expect(ids).toEqual(['AUS', 'BRA', 'DEU', 'JPN', 'NGA']);
  });

  it('labels the endpoints with the min and max values formatted with the unit', () => {
    render(
      <LineScaleBoard
        countries={countries}
        min={100}
        max={900}
        unit="km²"
        positions={noPositions}
        locked={noLocks}
        onPositionsChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('line-endpoint-min')).toHaveTextContent('100 km²');
    expect(screen.getByTestId('line-endpoint-max')).toHaveTextContent('900 km²');
  });

  it('shows all country names', () => {
    render(
      <LineScaleBoard
        countries={countries}
        min={100}
        max={900}
        unit="km²"
        positions={noPositions}
        locked={noLocks}
        onPositionsChange={vi.fn()}
      />,
    );
    for (const c of countries) {
      expect(screen.getByText(c.name)).toBeInTheDocument();
    }
  });
});

describe('LineScaleBoard — placement (US1)', () => {
  it('placing a token via drag calls onPositionsChange with a fraction and does not mutate the input', () => {
    const onPositionsChange = vi.fn();
    const positions = {}; // frozen-ish: assert not mutated
    render(
      <LineScaleBoard
        countries={countries}
        min={0}
        max={1000}
        unit="km²"
        positions={positions}
        locked={noLocks}
        onPositionsChange={onPositionsChange}
      />,
    );

    // Start dragging BRA, then release 250px from the left of a 1000px track → fraction 0.25.
    act(() => {
      capturedOnDragStart!(makeDragStart('token:BRA'));
      capturedOnDragEnd!(makeDragEnd('token:BRA', 250));
    });

    expect(onPositionsChange).toHaveBeenCalled();
    const result = onPositionsChange.mock.calls.at(-1)![0] as Record<string, number>;
    expect(result.BRA).toBeCloseTo(0.25, 5);
    // Input object not mutated
    expect(positions).toEqual({});
  });

  it('clamps a token dropped past the right end to fraction 1', () => {
    const onPositionsChange = vi.fn();
    render(
      <LineScaleBoard
        countries={countries}
        min={0}
        max={1000}
        unit="km²"
        positions={{}}
        locked={noLocks}
        onPositionsChange={onPositionsChange}
      />,
    );

    act(() => {
      capturedOnDragStart!(makeDragStart('token:JPN'));
      capturedOnDragEnd!(makeDragEnd('token:JPN', 5000)); // way past the right edge
    });

    const result = onPositionsChange.mock.calls.at(-1)![0] as Record<string, number>;
    expect(result.JPN).toBe(1);
  });

  it('clamps a token dropped past the left end to fraction 0', () => {
    const onPositionsChange = vi.fn();
    // DEU already near the left; drag it further left.
    render(
      <LineScaleBoard
        countries={countries}
        min={0}
        max={1000}
        unit="km²"
        positions={{ DEU: 0.1 }}
        locked={noLocks}
        onPositionsChange={onPositionsChange}
      />,
    );

    act(() => {
      capturedOnDragStart!(makeDragStart('token:DEU'));
      capturedOnDragEnd!(makeDragEnd('token:DEU', -5000));
    });

    const result = onPositionsChange.mock.calls.at(-1)![0] as Record<string, number>;
    expect(result.DEU).toBe(0);
  });

  it('does not move a locked token', () => {
    const onPositionsChange = vi.fn();
    render(
      <LineScaleBoard
        countries={countries}
        min={0}
        max={1000}
        unit="km²"
        positions={{ NGA: 0.2 }}
        locked={{ NGA: true }}
        onPositionsChange={onPositionsChange}
      />,
    );

    act(() => {
      capturedOnDragStart!(makeDragStart('token:NGA'));
      capturedOnDragEnd!(makeDragEnd('token:NGA', 300));
    });

    expect(onPositionsChange).not.toHaveBeenCalled();
  });

  it('does not move any token when disabled', () => {
    const onPositionsChange = vi.fn();
    render(
      <LineScaleBoard
        countries={countries}
        min={0}
        max={1000}
        unit="km²"
        positions={{ BRA: 0.3 }}
        locked={noLocks}
        onPositionsChange={onPositionsChange}
        disabled
      />,
    );

    act(() => {
      capturedOnDragStart!(makeDragStart('token:BRA'));
      capturedOnDragEnd!(makeDragEnd('token:BRA', 300));
    });

    expect(onPositionsChange).not.toHaveBeenCalled();
  });
});

describe('LineScaleBoard — live value readout (US2)', () => {
  it('renders a value readout region with an aria-live announcement', () => {
    render(
      <LineScaleBoard
        countries={countries}
        min={100}
        max={900}
        unit="km²"
        positions={{}}
        locked={noLocks}
        onPositionsChange={vi.fn()}
      />,
    );
    const readout = screen.getByTestId('line-value-readout');
    expect(readout).toBeInTheDocument();
    expect(readout).toHaveAttribute('aria-live', 'polite');
  });

  it('shows the min value while dragging a token at the far left (fraction 0)', () => {
    render(
      <LineScaleBoard
        countries={countries}
        min={100}
        max={900}
        unit="km²"
        positions={{}}
        locked={noLocks}
        onPositionsChange={vi.fn()}
      />,
    );
    act(() => {
      capturedOnDragStart!(makeDragStart('token:BRA'));
      capturedOnDragMove!(makeDragMove('token:BRA', 0)); // start unplaced → fraction 0
    });
    expect(screen.getByTestId('line-value-readout')).toHaveTextContent('100 km²');
  });

  it('shows the max value while dragging a token to the far right (fraction 1)', () => {
    render(
      <LineScaleBoard
        countries={countries}
        min={100}
        max={900}
        unit="km²"
        positions={{}}
        locked={noLocks}
        onPositionsChange={vi.fn()}
      />,
    );
    act(() => {
      capturedOnDragStart!(makeDragStart('token:BRA'));
      capturedOnDragMove!(makeDragMove('token:BRA', TRACK_WIDTH)); // move full width → fraction 1
    });
    expect(screen.getByTestId('line-value-readout')).toHaveTextContent('900 km²');
  });

  it('shows the interpolated midpoint value while dragging to the middle (fraction 0.5)', () => {
    render(
      <LineScaleBoard
        countries={countries}
        min={0}
        max={1000}
        unit="km²"
        positions={{}}
        locked={noLocks}
        onPositionsChange={vi.fn()}
      />,
    );
    act(() => {
      capturedOnDragStart!(makeDragStart('token:BRA'));
      capturedOnDragMove!(makeDragMove('token:BRA', TRACK_WIDTH / 2)); // → fraction 0.5
    });
    expect(screen.getByTestId('line-value-readout')).toHaveTextContent('500 km²');
  });
});

describe('LineScaleBoard — accessibility & keyboard (US5)', () => {
  /** Get the token element for a specific country (testid is shared across tokens). */
  function token(countryId: string): HTMLElement {
    return screen
      .getAllByTestId('line-token')
      .find((el) => el.getAttribute('data-country') === countryId)!;
  }

  it('a placed token is a focusable slider exposing its value via aria-valuetext', () => {
    render(
      <LineScaleBoard
        countries={countries}
        min={0}
        max={1000}
        unit="km²"
        positions={{ BRA: 0.5 }}
        locked={noLocks}
        onPositionsChange={vi.fn()}
      />,
    );
    const t = token('BRA');
    expect(t).toHaveAttribute('role', 'slider');
    expect(t).toHaveAttribute('tabindex', '0');
    expect(t).toHaveAttribute('aria-valuetext', '500 km²');
  });

  it('ArrowRight nudges a placed token to a higher fraction', () => {
    const onPositionsChange = vi.fn();
    render(
      <LineScaleBoard
        countries={countries}
        min={0}
        max={1000}
        unit="km²"
        positions={{ BRA: 0.5 }}
        locked={noLocks}
        onPositionsChange={onPositionsChange}
      />,
    );
    fireEvent.keyDown(token('BRA'), { key: 'ArrowRight' });
    const result = onPositionsChange.mock.calls.at(-1)![0] as Record<string, number>;
    expect(result.BRA).toBeGreaterThan(0.5);
  });

  it('ArrowLeft nudges a placed token to a lower fraction', () => {
    const onPositionsChange = vi.fn();
    render(
      <LineScaleBoard
        countries={countries}
        min={0}
        max={1000}
        unit="km²"
        positions={{ BRA: 0.5 }}
        locked={noLocks}
        onPositionsChange={onPositionsChange}
      />,
    );
    fireEvent.keyDown(token('BRA'), { key: 'ArrowLeft' });
    const result = onPositionsChange.mock.calls.at(-1)![0] as Record<string, number>;
    expect(result.BRA).toBeLessThan(0.5);
  });

  it('Home moves a placed token to the far left (fraction 0) and End to the far right (1)', () => {
    const onPositionsChange = vi.fn();
    const { rerender } = render(
      <LineScaleBoard
        countries={countries}
        min={0}
        max={1000}
        unit="km²"
        positions={{ BRA: 0.5 }}
        locked={noLocks}
        onPositionsChange={onPositionsChange}
      />,
    );
    fireEvent.keyDown(token('BRA'), { key: 'Home' });
    expect((onPositionsChange.mock.calls.at(-1)![0] as Record<string, number>).BRA).toBe(0);

    rerender(
      <LineScaleBoard
        countries={countries}
        min={0}
        max={1000}
        unit="km²"
        positions={{ BRA: 0.5 }}
        locked={noLocks}
        onPositionsChange={onPositionsChange}
      />,
    );
    fireEvent.keyDown(token('BRA'), { key: 'End' });
    expect((onPositionsChange.mock.calls.at(-1)![0] as Record<string, number>).BRA).toBe(1);
  });

  it('a locked token is not keyboard-movable and is marked correct with an icon', () => {
    const onPositionsChange = vi.fn();
    render(
      <LineScaleBoard
        countries={countries}
        min={0}
        max={1000}
        unit="km²"
        positions={{ BRA: 0.5 }}
        locked={{ BRA: true }}
        onPositionsChange={onPositionsChange}
      />,
    );
    const t = token('BRA');
    expect(t).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(t, { key: 'ArrowRight' });
    expect(onPositionsChange).not.toHaveBeenCalled();
    // Correct state conveyed by an icon/shape (label "correct"), not color alone.
    expect(screen.getByLabelText('correct')).toBeInTheDocument();
  });
});
