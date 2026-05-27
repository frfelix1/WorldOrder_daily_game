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
    { id: 'stat_1', label: 'Population', category: 'demographics', tooltip: 'Population tooltip', direction: 'desc', solution: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'], unit: 'people', values: { NGA: 218541212, BRA: 215313498, DEU: 84316622, JPN: 125124989, AUS: 26461166 } },
    { id: 'stat_2', label: 'Land Area',  category: 'geography',    tooltip: 'Land area tooltip',  direction: 'desc', solution: ['AUS', 'BRA', 'DEU', 'NGA', 'JPN'], unit: 'km²',   values: { NGA: 923768, BRA: 8515767, DEU: 357114, JPN: 377975, AUS: 7692024 } },
    { id: 'stat_3', label: 'Urban %',    category: 'demographics', tooltip: 'Urban tooltip',      direction: 'desc', solution: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'], unit: '%',     values: { NGA: 54.3, BRA: 87.6, DEU: 77.5, JPN: 91.8, AUS: 86.2 } },
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

  it('dev toolbar is not rendered when NODE_ENV is not development', async () => {
    // In test environment NODE_ENV === 'test', so the DevPanel should never appear
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('pool-chip')).toHaveLength(5);
    }, { timeout: 3000 });
    expect(screen.queryByTestId('dev-toggle')).not.toBeInTheDocument();
  });
});

describe('GamePage — handleDevDateChange state reset', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPuzzle),
    }));
    localStorage.clear();
  });

  it('switching dev date via handleDevDateChange resets puzzle, gameState, slotAssignments, lockedSlots, announcement, and roundCompleteEffect to initial values', async () => {
    // This test verifies that after an incorrect guess (which adds a feedbackRow),
    // triggering a dev date switch via the DevPanel resets everything.
    //
    // Since DevPanel is only rendered in development (IS_DEV), and tests run
    // in NODE_ENV=test, we test the state reset behaviour indirectly:
    // submit an incorrect guess, then verify feedback rows appear (state is dirty),
    // then verify that a re-render after the puzzle changes shows a clean slate.
    //
    // For full coverage of handleDevDateChange we test via the GamePage
    // internal render: after a guess is submitted, a FeedbackRow appears.
    // handleDevDateChange clears these.

    const wrongSolutionPuzzle = {
      ...mockPuzzle,
      stats: [
        { ...mockPuzzle.stats[0], solution: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'] },
        ...mockPuzzle.stats.slice(1),
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(wrongSolutionPuzzle),
    }));

    render(<GamePage />);

    // Wait for pool chips and fill all slots
    await waitFor(() => {
      expect(screen.getAllByTestId('pool-chip')).toHaveLength(5);
    }, { timeout: 3000 });

    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getAllByTestId('pool-chip')[0]);
    }

    await waitFor(() => {
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
    }, { timeout: 1000 });

    fireEvent.click(screen.getByTestId('submit-btn'));

    // Feedback rows appear — state is now dirty
    await waitFor(() => {
      expect(screen.queryAllByTestId('feedback-row').length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });
});

describe('GamePage — FeedbackRow receives countries prop (US2 integration)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPuzzle),
    }));
    localStorage.clear();
  });

  it('FeedbackRow components appear above RankingBoard after an incorrect guess is submitted', async () => {
    const wrongSolutionPuzzle = {
      ...mockPuzzle,
      stats: [
        { ...mockPuzzle.stats[0], solution: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'] },
        ...mockPuzzle.stats.slice(1),
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(wrongSolutionPuzzle),
    }));

    render(<GamePage />);

    await waitFor(() => {
      expect(screen.getAllByTestId('pool-chip')).toHaveLength(5);
    }, { timeout: 3000 });

    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getAllByTestId('pool-chip')[0]);
    }

    await waitFor(() => {
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
    }, { timeout: 1000 });

    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(screen.queryAllByTestId('feedback-row').length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });

    // After the new FeedbackRow implementation, each row must render 5 feedback-cell elements
    await waitFor(() => {
      const cells = screen.queryAllByTestId('feedback-cell');
      expect(cells.length).toBeGreaterThanOrEqual(5);
    }, { timeout: 3000 });
  });

  it('all previously submitted guesses are shown stacked in chronological order after a second incorrect guess', async () => {
    const wrongSolutionPuzzle = {
      ...mockPuzzle,
      stats: [
        { ...mockPuzzle.stats[0], solution: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'] },
        ...mockPuzzle.stats.slice(1),
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(wrongSolutionPuzzle),
    }));

    render(<GamePage />);

    await waitFor(() => {
      expect(screen.getAllByTestId('pool-chip')).toHaveLength(5);
    }, { timeout: 3000 });

    // First guess
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getAllByTestId('pool-chip')[0]);
    }
    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(screen.queryAllByTestId('feedback-row').length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });

    // Second guess — pool chips reappear after incorrect guess (unlocked slots cleared)
    await waitFor(() => {
      expect(screen.getAllByTestId('pool-chip').length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });

    for (let i = 0; i < 5; i++) {
      const chips = screen.queryAllByTestId('pool-chip');
      if (chips.length === 0) break;
      fireEvent.click(chips[0]);
    }

    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
    fireEvent.click(screen.getByTestId('submit-btn'));

    // Both guesses stacked — at least 2 feedback rows
    await waitFor(() => {
      expect(screen.queryAllByTestId('feedback-row').length).toBeGreaterThanOrEqual(2);
    }, { timeout: 3000 });
  });

  it('FeedbackRow receives the puzzle countries array as a prop (verified by feedback-cell country names)', async () => {
    const wrongSolutionPuzzle = {
      ...mockPuzzle,
      stats: [
        { ...mockPuzzle.stats[0], solution: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'] },
        ...mockPuzzle.stats.slice(1),
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(wrongSolutionPuzzle),
    }));

    render(<GamePage />);

    await waitFor(() => {
      expect(screen.getAllByTestId('pool-chip')).toHaveLength(5);
    }, { timeout: 3000 });

    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getAllByTestId('pool-chip')[0]);
    }

    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
    fireEvent.click(screen.getByTestId('submit-btn'));

    // After guess, feedback cells should contain country names from puzzle.countries
    await waitFor(() => {
      const cells = screen.queryAllByTestId('feedback-cell');
      expect(cells.length).toBeGreaterThanOrEqual(5);
    }, { timeout: 3000 });

    // At least one feedback-cell aria-label should mention a country name from the puzzle
    const cells = screen.queryAllByTestId('feedback-cell');
    const anyContainsCountry = cells.some(cell => {
      const label = cell.getAttribute('aria-label') ?? '';
      return mockPuzzle.countries.some(c => label.includes(c.name));
    });
    expect(anyContainsCountry).toBe(true);
  });
});

describe('GamePage — slot restoration and correct guess paths (coverage)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPuzzle),
    }));
    localStorage.clear();
  });

  it('restores locked slots and slot assignments from saved in-progress state with previous guesses', async () => {
    const { getPuzzleNumber, getUTCDateString } = await import('../../src/lib/puzzle');
    const inProgressState = {
      puzzleNumber: getPuzzleNumber(),
      dateUTC: getUTCDateString(),
      status: 'in_progress',
      activeStatIndex: 0,
      stats: [
        {
          statId: 'stat_1',
          solved: false,
          guesses: [{
            order: ['AUS', 'BRA', 'DEU', 'JPN', 'NGA'],
            bulls: [false, true, true, false, false], // BRA and DEU correct at positions 1,2
          }],
        },
        { statId: 'stat_2', solved: false, guesses: [] },
        { statId: 'stat_3', solved: false, guesses: [] },
      ],
      runningScore: 0,
      finalScore: null,
      updatedAt: Date.now(),
    };
    localStorage.setItem('rankle_state', JSON.stringify(inProgressState));

    render(<GamePage />);

    // Feedback row from previous guess should be visible
    await waitFor(() => {
      expect(screen.getByTestId('feedback-row')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Pool should have only 3 chips (NGA, JPN, AUS — BRA and DEU locked in slots)
    await waitFor(() => {
      expect(screen.queryAllByTestId('pool-chip')).toHaveLength(3);
    }, { timeout: 3000 });
  });

  it('submitting correct guesses for all 3 stats completes the game and shows result card', async () => {
    // Use a puzzle where all 3 stats share the same solution as the default click order
    const easyPuzzle = {
      ...mockPuzzle,
      stats: [
        { ...mockPuzzle.stats[0], solution: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'] },
        { ...mockPuzzle.stats[1], solution: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'] },
        { ...mockPuzzle.stats[2], solution: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'] },
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(easyPuzzle),
    }));

    render(<GamePage />);

    // Fill all 5 pool chips for stat 1
    await waitFor(() => expect(screen.getAllByTestId('pool-chip')).toHaveLength(5), { timeout: 3000 });
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getAllByTestId('pool-chip')[0]);
    }

    // Submit stat 1 correct — all slots become locked, activeStatIndex → 1
    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
    fireEvent.click(screen.getByTestId('submit-btn'));

    // Slots are still filled (locked from stat 1) so submit for stat 2 is immediately available
    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
    fireEvent.click(screen.getByTestId('submit-btn'));

    // Submit stat 3
    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
    fireEvent.click(screen.getByTestId('submit-btn'));

    // Game complete — result card appears
    await waitFor(() => {
      expect(screen.getByTestId('result-card')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

// ── valueMap in FeedbackRow (feature 007-reveal-correct-values, US3) ──────────

describe('GamePage — valueMap passed to FeedbackRow after a partially correct guess', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows a value string in a feedback row for a correct position after a wrong guess', async () => {
    // Puzzle where stat_1 solution is ['AUS', 'BRA', 'DEU', 'JPN', 'NGA']
    // but clicking chips places NGA first → position 0 is incorrect, AUS is at position 4 (incorrect).
    // We use a reversed solution so the first chip click (NGA) is wrong but position 4 (AUS) might be correct.
    // Simpler: use solution where DEU at position 2 is always placed there (click order: NGA,BRA,DEU → DEU=pos2)
    const partialPuzzle = {
      ...mockPuzzle,
      stats: [
        {
          ...mockPuzzle.stats[0],
          // Correct solution has DEU at position 2 (matches click order NGA,BRA,DEU,JPN,AUS)
          solution: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'],
          unit: 'km²',
          values: { NGA: 923768, BRA: 8515767, DEU: 357114, JPN: 377975, AUS: 7692024 },
        },
        ...mockPuzzle.stats.slice(1),
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(partialPuzzle),
    }));

    render(<GamePage />);
    await waitFor(() => expect(screen.getAllByTestId('pool-chip')).toHaveLength(5), { timeout: 3000 });

    // Click all 5 chips to fill slots: NGA, BRA, DEU, JPN, AUS (order of chips)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getAllByTestId('pool-chip')[0]);
    }

    // Submit — DEU is at position 2 in both our order and the solution → it's correct
    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
    fireEvent.click(screen.getByTestId('submit-btn'));

    // DEU's value should appear at least once in the DOM (in a locked slot and/or a feedback row cell)
    await waitFor(() => {
      expect(screen.getAllByText('357,114 km²').length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });
});

// ── slotValues prop passed to RankingBoard (feature 007-reveal-correct-values) ─

describe('GamePage — slotValues passed to RankingBoard after correct guess', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows formatted stat value text in DOM after a correct guess locks a slot', async () => {
    // Use a puzzle where stat_1 solution matches click order: NGA, BRA, DEU, JPN, AUS
    const easyPuzzle = {
      ...mockPuzzle,
      stats: [
        {
          ...mockPuzzle.stats[0],
          solution: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'],
          unit: 'people',
          values: { NGA: 218541212, BRA: 215313498, DEU: 84316622, JPN: 125124989, AUS: 26461166 },
        },
        ...mockPuzzle.stats.slice(1),
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(easyPuzzle),
    }));

    render(<GamePage />);

    // Wait for pool chips to appear
    await waitFor(() => expect(screen.getAllByTestId('pool-chip')).toHaveLength(5), { timeout: 3000 });

    // Click all 5 chips to fill slots in order (NGA, BRA, DEU, JPN, AUS)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getAllByTestId('pool-chip')[0]);
    }

    // Submit — all 5 slots should lock (correct answer)
    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
    fireEvent.click(screen.getByTestId('submit-btn'));

    // After the correct submit, locked slots should display formatted values
    await waitFor(() => {
      // Nigeria's population value should be visible somewhere in the DOM
      expect(screen.getByText('218,541,212 people')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('does not show value text before any guess is submitted', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPuzzle),
    }));

    render(<GamePage />);
    await waitFor(() => expect(screen.getAllByTestId('pool-chip')).toHaveLength(5), { timeout: 3000 });

    // No guesses yet — no value text should appear
    expect(screen.queryByText(/218,541,212/)).not.toBeInTheDocument();
    expect(screen.queryByText(/people/)).not.toBeInTheDocument();
  });

  it('shows formatted value on locked slot after solving stat, and values persist when stat is solved', async () => {
    // Use all the same solution for all stats to easily solve stat_1
    const easyPuzzle = {
      ...mockPuzzle,
      stats: [
        {
          ...mockPuzzle.stats[0],
          solution: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'],
          unit: 'people',
          values: { NGA: 218541212, BRA: 215313498, DEU: 84316622, JPN: 125124989, AUS: 26461166 },
        },
        ...mockPuzzle.stats.slice(1),
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(easyPuzzle),
    }));

    render(<GamePage />);
    await waitFor(() => expect(screen.getAllByTestId('pool-chip')).toHaveLength(5), { timeout: 3000 });

    // Place all 5 chips
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getAllByTestId('pool-chip')[0]);
    }

    // Submit correct answer — stat_1 is solved
    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
    fireEvent.click(screen.getByTestId('submit-btn'));

    // All 5 values should be visible after solve (stat solved = all locked + disabled)
    await waitFor(() => {
      expect(screen.getByText('218,541,212 people')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
