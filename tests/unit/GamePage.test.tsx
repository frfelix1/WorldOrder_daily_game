import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import GamePage from '../../src/app/page';
import type { PuzzleFile } from '../../src/types';

// Mock next/font/google used in layout
vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

// Mock @dnd-kit/core — RankingBoard uses useDraggable, useDroppable, DragOverlay
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

// Mock @dnd-kit/sortable — still needed for CountryCard (kept as legacy)
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: {},
  arrayMove: vi.fn(),
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
  CSS: {
    Transform: { toString: () => '' },
    Translate: { toString: () => '' },
  },
}));

const mockPuzzle: PuzzleFile = {
  date: new Date().toISOString().slice(0, 10),
  countries: [
    { id: 'NGA', name: 'Nigeria',   flagCode: 'ng' },
    { id: 'BRA', name: 'Brazil',    flagCode: 'br' },
    { id: 'DEU', name: 'Germany',   flagCode: 'de' },
    { id: 'JPN', name: 'Japan',     flagCode: 'jp' },
    { id: 'AUS', name: 'Australia', flagCode: 'au' },
  ],
  stats: [
    { id: 'stat_1', label: 'Population', category: 'demographics', tooltip: 'Population tooltip', direction: 'desc', solution: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'] },
    { id: 'stat_2', label: 'Land Area',  category: 'geography',    tooltip: 'Land area tooltip',  direction: 'desc', solution: ['AUS', 'BRA', 'DEU', 'NGA', 'JPN'] },
    { id: 'stat_3', label: 'Urban %',    category: 'demographics', tooltip: 'Urban tooltip',      direction: 'desc', solution: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'] },
  ],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockPuzzle),
  }));
  localStorage.clear();
});

describe('GamePage', () => {
  it('shows loading spinner initially', () => {
    render(<GamePage />);
    expect(screen.getByText(/Loading today/)).toBeInTheDocument();
  });

  it('shows 5 pool chips after puzzle loads', async () => {
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('pool-chip')).toHaveLength(5);
    }, { timeout: 3000 });
  });

  it('shows ranking board after puzzle loads', async () => {
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByTestId('ranking-board')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows stat panel after puzzle loads', async () => {
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByTestId('stat-panel')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows error state when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByText(/Couldn't load/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows result card immediately if completed state is in localStorage', async () => {
    const { getPuzzleNumber, getUTCDateString } = await import('../../src/lib/puzzle');
    const completedState = {
      puzzleNumber: getPuzzleNumber(),
      dateUTC: getUTCDateString(),
      status: 'complete',
      activeStatIndex: 2,
      stats: [
        { statId: 'stat_1', solved: true, guesses: [{ order: mockPuzzle.stats[0].solution, bulls: [true, true, true, true, true] }] },
        { statId: 'stat_2', solved: true, guesses: [{ order: mockPuzzle.stats[1].solution, bulls: [true, true, true, true, true] }] },
        { statId: 'stat_3', solved: true, guesses: [{ order: mockPuzzle.stats[2].solution, bulls: [true, true, true, true, true] }] },
      ],
      runningScore: 150,
      finalScore: 150,
      updatedAt: Date.now(),
    };
    localStorage.setItem('rankle_state', JSON.stringify(completedState));

    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByTestId('result-card')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders score display after puzzle loads', async () => {
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Running score: 0/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows submit button after puzzle loads', async () => {
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('submit button is disabled when slots are not all filled', async () => {
    render(<GamePage />);
    await waitFor(() => {
      const btn = screen.getByTestId('submit-btn');
      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
    }, { timeout: 3000 });
  });

  it('shows retry button and error message on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('submitting a ranking with all slots filled adds a feedback row', async () => {
    // Use a puzzle where the default click order is NOT the solution
    const wrongSolutionPuzzle = {
      ...mockPuzzle,
      stats: [
        { ...mockPuzzle.stats[0], solution: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'] }, // reversed
        ...mockPuzzle.stats.slice(1),
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(wrongSolutionPuzzle),
    }));

    render(<GamePage />);

    // Wait for pool chips to appear
    await waitFor(() => {
      expect(screen.getAllByTestId('pool-chip')).toHaveLength(5);
    }, { timeout: 3000 });

    // Click each pool chip in turn to fill all 5 slots
    for (let i = 0; i < 5; i++) {
      const chips = screen.getAllByTestId('pool-chip');
      fireEvent.click(chips[0]);
    }

    // Submit button should now be enabled
    await waitFor(() => {
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
    }, { timeout: 1000 });

    fireEvent.click(screen.getByTestId('submit-btn'));

    // A feedback row with incorrect results should appear
    await waitFor(() => {
      const feedbackRows = screen.queryAllByTestId('feedback-row');
      expect(feedbackRows.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it('renders Rankle title after load', async () => {
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByText('Rankle')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
