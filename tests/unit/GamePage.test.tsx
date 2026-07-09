import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import GamePage from '../../src/app/page';
import type { PuzzleFile } from '../../src/types';

// Mock next/font/google used in layout
vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

/**
 * Mock the LineScaleBoard so tests can drive placements deterministically without
 * a real drag. The mock renders one button per country; clicking it places that
 * country at a fraction derived from a test-controlled position map, and exposes
 * the live `positions`/`locked`/`disabled` props for assertions.
 *
 * Tests set `window.__setPlacement(countryId, fraction)` before clicking a token
 * button, or use the convenience `placeAll` helper below.
 */
const placementForCountry: Record<string, number> = {};

vi.mock('../../src/components/game/LineScaleBoard', () => ({
  LineScaleBoard: ({
    countries,
    positions,
    locked,
    disabled,
    onPositionsChange,
  }: {
    countries: { id: string; name: string }[];
    positions: Record<string, number>;
    locked: Record<string, boolean>;
    disabled?: boolean;
    onPositionsChange: (p: Record<string, number>) => void;
  }) => (
    <div data-testid="line-scale-board" data-disabled={String(!!disabled)}>
      {countries.map((c) => (
        <button
          key={c.id}
          data-testid={`place-${c.id}`}
          data-placed={String(positions[c.id] != null)}
          data-locked={String(!!locked[c.id])}
          onClick={() =>
            onPositionsChange({ ...positions, [c.id]: placementForCountry[c.id] ?? 0.5 })
          }
        >
          {c.name}
        </button>
      ))}
    </div>
  ),
}));

const mockPuzzle: PuzzleFile = {
  date: new Date().toISOString().slice(0, 10),
  countries: [
    { id: 'NGA', name: 'Nigeria', flagCode: 'ng' },
    { id: 'BRA', name: 'Brazil', flagCode: 'br' },
    { id: 'DEU', name: 'Germany', flagCode: 'de' },
    { id: 'JPN', name: 'Japan', flagCode: 'jp' },
    { id: 'AUS', name: 'Australia', flagCode: 'au' },
  ],
  stats: [
    { id: 'stat_1', label: 'Population', category: 'demographics', tooltip: 'Population tooltip', direction: 'desc', solution: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'], unit: 'people', values: { NGA: 218541212, BRA: 215313498, DEU: 84316622, JPN: 125124989, AUS: 26461166 } },
    { id: 'stat_2', label: 'Land Area', category: 'geography', tooltip: 'Land area tooltip', direction: 'desc', solution: ['AUS', 'BRA', 'DEU', 'NGA', 'JPN'], unit: 'km²', values: { NGA: 923768, BRA: 8515767, DEU: 357114, JPN: 377975, AUS: 7692024 } },
    { id: 'stat_3', label: 'Urban %', category: 'demographics', tooltip: 'Urban tooltip', direction: 'desc', solution: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'], unit: '%', values: { NGA: 54.3, BRA: 87.6, DEU: 77.5, JPN: 91.8, AUS: 86.2 } },
  ],
};

/**
 * Place all five countries along the line so their left-to-right order matches
 * `order` (index 0 = leftmost). Assigns evenly spaced fractions.
 */
function placeInOrder(order: string[]) {
  order.forEach((id, i) => {
    placementForCountry[id] = order.length === 1 ? 0 : i / (order.length - 1);
  });
  for (const id of order) {
    fireEvent.click(screen.getByTestId(`place-${id}`));
  }
}

/**
 * The correct left-to-right order for a stat = country IDs ascending by value
 * (least → most), matching the value line's orientation. Ties broken by ID.
 */
function targetOrder(statIndex: number): string[] {
  const vals = mockPuzzle.stats[statIndex].values!;
  return Object.keys(vals).slice().sort((a, b) => {
    const diff = vals[a] - vals[b];
    return diff !== 0 ? diff : a < b ? -1 : 1;
  });
}

/** Solve a stat by placing tokens in the correct value-ascending order. */
function solveOrder(statIndex: number): string[] {
  return targetOrder(statIndex);
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockPuzzle),
  }));
  localStorage.clear();
  for (const k of Object.keys(placementForCountry)) delete placementForCountry[k];
});

describe('GamePage — loading & board', () => {
  it('shows loading spinner initially', () => {
    render(<GamePage />);
    expect(screen.getByText(/Loading today/)).toBeInTheDocument();
  });

  it('shows the line-scale board after puzzle loads', async () => {
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByTestId('line-scale-board')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders one placement control per country (5)', async () => {
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByTestId('place-NGA')).toBeInTheDocument();
    }, { timeout: 3000 });
    for (const c of mockPuzzle.countries) {
      expect(screen.getByTestId(`place-${c.id}`)).toBeInTheDocument();
    }
  });

  it('shows the stat panel and score display after load', async () => {
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByTestId('stat-panel')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByLabelText(/Running score: 0/)).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByText(/Couldn't load/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('GamePage — submit gating (US3)', () => {
  it('submit is disabled until all five countries are placed', async () => {
    render(<GamePage />);
    await waitFor(() => expect(screen.getByTestId('submit-btn')).toBeInTheDocument(), { timeout: 3000 });

    // Initially disabled.
    expect(screen.getByTestId('submit-btn')).toBeDisabled();

    // Place four of five — still disabled.
    for (const id of ['NGA', 'BRA', 'DEU', 'JPN']) {
      fireEvent.click(screen.getByTestId(`place-${id}`));
    }
    expect(screen.getByTestId('submit-btn')).toBeDisabled();

    // Place the fifth — now enabled.
    fireEvent.click(screen.getByTestId('place-AUS'));
    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
  });
});

describe('GamePage — wrong guess feedback (US3)', () => {
  it('submitting a wrong order records a feedback row and does not solve', async () => {
    render(<GamePage />);
    await waitFor(() => expect(screen.getByTestId('place-NGA')).toBeInTheDocument(), { timeout: 3000 });

    // Place in the exact reverse of the correct (value-ascending) order → all wrong
    // except any token that happens to land in the middle.
    const reversed = [...targetOrder(0)].reverse();
    placeInOrder(reversed);
    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });

    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(screen.queryAllByTestId('feedback-row').length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
    // Not solved → submit button still present (advance button not shown).
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('next-stage-btn')).not.toBeInTheDocument();
  });

  it('a correctly-positioned token becomes locked after a partially-correct guess', async () => {
    render(<GamePage />);
    await waitFor(() => expect(screen.getByTestId('place-NGA')).toBeInTheDocument(), { timeout: 3000 });

    // Reverse order keeps the middle token (rank 3 of 5) in its correct spot; it locks.
    const reversed = [...targetOrder(0)].reverse();
    const middle = reversed[2];
    placeInOrder(reversed);
    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId(`place-${middle}`)).toHaveAttribute('data-locked', 'true');
    }, { timeout: 3000 });
  });
});

describe('GamePage — solve, advance, complete (US3)', () => {
  async function solveStat(statIndex: number) {
    placeInOrder(solveOrder(statIndex));
    await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
    fireEvent.click(screen.getByTestId('submit-btn'));
  }

  it('solving a non-final stat shows the Next stage button and does not auto-advance', async () => {
    render(<GamePage />);
    await waitFor(() => expect(screen.getByTestId('place-NGA')).toBeInTheDocument(), { timeout: 3000 });

    await solveStat(0);

    await waitFor(() => {
      expect(screen.getByTestId('next-stage-btn')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByTestId('next-stage-btn')).toHaveTextContent(/Next stage/i);
    // Still on stat 1 until the user advances.
    expect(screen.getByTestId('stat-panel')).toBeInTheDocument();
  });

  it('solving all three stats completes the game and shows the result card', async () => {
    render(<GamePage />);
    await waitFor(() => expect(screen.getByTestId('place-NGA')).toBeInTheDocument(), { timeout: 3000 });

    await solveStat(0);
    await waitFor(() => expect(screen.getByTestId('next-stage-btn')).toBeInTheDocument(), { timeout: 3000 });
    fireEvent.click(screen.getByTestId('next-stage-btn'));

    await waitFor(() => expect(screen.getByTestId('place-NGA')).toBeInTheDocument(), { timeout: 3000 });
    await solveStat(1);
    await waitFor(() => expect(screen.getByTestId('next-stage-btn')).toBeInTheDocument(), { timeout: 3000 });
    fireEvent.click(screen.getByTestId('next-stage-btn'));

    await waitFor(() => expect(screen.getByTestId('place-NGA')).toBeInTheDocument(), { timeout: 3000 });
    await solveStat(2);
    await waitFor(() => expect(screen.getByTestId('next-stage-btn')).toBeInTheDocument(), { timeout: 3000 });
    // Final stage → button reads "Show Recap".
    expect(screen.getByTestId('next-stage-btn')).toHaveTextContent(/Show Recap/i);
    fireEvent.click(screen.getByTestId('next-stage-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('result-card')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('a perfect first-try solve of all three stats yields a score of 100', async () => {
    render(<GamePage />);
    await waitFor(() => expect(screen.getByTestId('place-NGA')).toBeInTheDocument(), { timeout: 3000 });

    // Place each stat exactly at its true fractions so accuracy = 1 and order is correct.
    for (let s = 0; s < 3; s++) {
      const stat = mockPuzzle.stats[s];
      const vals = stat.values!;
      const min = Math.min(...Object.values(vals));
      const max = Math.max(...Object.values(vals));
      for (const id of Object.keys(vals)) {
        placementForCountry[id] = max === min ? 0 : (vals[id] - min) / (max - min);
      }
      for (const id of solveOrder(s)) {
        fireEvent.click(screen.getByTestId(`place-${id}`));
      }
      await waitFor(() => expect(screen.getByTestId('submit-btn')).not.toBeDisabled(), { timeout: 1000 });
      fireEvent.click(screen.getByTestId('submit-btn'));
      await waitFor(() => expect(screen.getByTestId('next-stage-btn')).toBeInTheDocument(), { timeout: 3000 });
      fireEvent.click(screen.getByTestId('next-stage-btn'));
    }

    await waitFor(() => expect(screen.getByTestId('result-card')).toBeInTheDocument(), { timeout: 3000 });
    const saved = JSON.parse(localStorage.getItem('worldorder_state')!);
    expect(saved.finalScore).toBe(100);
  });
});

describe('GamePage — resume in progress (US3, FR-017)', () => {
  it('restores locked tokens and prior placements from saved state with previous guesses', async () => {
    const { getPuzzleNumber, getUTCDateString } = await import('../../src/lib/puzzle');
    // stat_1 solution: NGA,BRA,DEU,JPN,AUS. A prior guess got DEU (rank 3) correct.
    const priorPositions = { AUS: 0, JPN: 0.25, DEU: 0.5, BRA: 0.75, NGA: 1 };
    const savedState = {
      puzzleNumber: getPuzzleNumber(),
      dateUTC: getUTCDateString(),
      status: 'in_progress',
      activeStatIndex: 0,
      stats: [
        {
          statId: 'stat_1',
          solved: false,
          guesses: [
            {
              order: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'],
              bulls: [false, false, true, false, false],
              positions: priorPositions,
            },
          ],
        },
        { statId: 'stat_2', solved: false, guesses: [] },
        { statId: 'stat_3', solved: false, guesses: [] },
      ],
      runningScore: 0,
      finalScore: null,
      updatedAt: Date.now(),
    };
    localStorage.setItem('worldorder_state', JSON.stringify(savedState));

    render(<GamePage />);
    await waitFor(() => expect(screen.getByTestId('place-DEU')).toBeInTheDocument(), { timeout: 3000 });

    // DEU was correct previously → locked; all five have restored placements.
    expect(screen.getByTestId('place-DEU')).toHaveAttribute('data-locked', 'true');
    for (const c of mockPuzzle.countries) {
      expect(screen.getByTestId(`place-${c.id}`)).toHaveAttribute('data-placed', 'true');
    }
    // The prior feedback row is shown.
    expect(screen.queryAllByTestId('feedback-row').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the result card immediately if a completed state is in localStorage', async () => {
    const { getPuzzleNumber, getUTCDateString } = await import('../../src/lib/puzzle');
    const completedState = {
      puzzleNumber: getPuzzleNumber(),
      dateUTC: getUTCDateString(),
      status: 'complete',
      activeStatIndex: 2,
      stats: mockPuzzle.stats.map((s) => ({
        statId: s.id,
        solved: true,
        guesses: [{ order: s.solution, bulls: [true, true, true, true, true], positions: {} }],
      })),
      runningScore: 100,
      finalScore: 100,
      updatedAt: Date.now(),
    };
    localStorage.setItem('worldorder_state', JSON.stringify(completedState));

    render(<GamePage />);
    await waitFor(() => {
      expect(screen.getByTestId('result-card')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('GamePage — misc', () => {
  it('renders the WorldOrder title after load', async () => {
    render(<GamePage />);
    await waitFor(() => expect(screen.getByText('WorldOrder')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('does not render the dev toolbar when NODE_ENV is not development', async () => {
    render(<GamePage />);
    await waitFor(() => expect(screen.getByTestId('line-scale-board')).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.queryByTestId('dev-toggle')).not.toBeInTheDocument();
  });
});
