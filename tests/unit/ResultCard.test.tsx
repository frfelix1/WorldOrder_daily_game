import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ResultCard } from '../../src/components/game/ResultCard';
import type { GameState, PuzzleFile } from '../../src/types';

const solution = ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'];

const mockPuzzle: PuzzleFile = {
  date: '2026-05-22',
  countries: [
    { id: 'BRA', name: 'Brazil',    flagCode: 'br' },
    { id: 'DEU', name: 'Germany',   flagCode: 'de' },
    { id: 'NGA', name: 'Nigeria',   flagCode: 'ng' },
    { id: 'JPN', name: 'Japan',     flagCode: 'jp' },
    { id: 'AUS', name: 'Australia', flagCode: 'au' },
  ],
  stats: [
    { id: 'stat_1', label: 'Population', category: 'demographics', tooltip: 'Population', direction: 'desc', solution },
    { id: 'stat_2', label: 'Land Area',  category: 'geography',    tooltip: 'Land Area',  direction: 'desc', solution },
    { id: 'stat_3', label: 'Urban %',    category: 'demographics', tooltip: 'Urban %',    direction: 'desc', solution },
  ],
};

// Puzzle variant with values and unit for testing CorrectValuesRow rendering
const mockPuzzleWithValues: PuzzleFile = {
  date: '2026-05-22',
  countries: [
    { id: 'BRA', name: 'Brazil',    flagCode: 'br' },
    { id: 'DEU', name: 'Germany',   flagCode: 'de' },
    { id: 'NGA', name: 'Nigeria',   flagCode: 'ng' },
    { id: 'JPN', name: 'Japan',     flagCode: 'jp' },
    { id: 'AUS', name: 'Australia', flagCode: 'au' },
  ],
  stats: [
    {
      id: 'stat_1', label: 'Population', category: 'demographics', tooltip: 'Population', direction: 'desc', solution,
      values: { NGA: 218000000, BRA: 215000000, DEU: 84000000, JPN: 125000000, AUS: 26000000 },
      unit: 'people',
    },
    {
      id: 'stat_2', label: 'Land Area', category: 'geography', tooltip: 'Land Area', direction: 'desc', solution,
      values: { NGA: 923768, BRA: 8515767, DEU: 357114, JPN: 377975, AUS: 7692024 },
      unit: 'km²',
    },
    {
      id: 'stat_3', label: 'Urban %', category: 'demographics', tooltip: 'Urban %', direction: 'desc', solution,
      values: { NGA: 53, BRA: 87, DEU: 77, JPN: 92, AUS: 86 },
      unit: '%',
    },
  ],
};

const mockState: GameState = {
  puzzleNumber: 42,
  dateUTC: '2026-05-22',
  status: 'complete',
  activeStatIndex: 2,
  stats: [
    { statId: 'stat_1', solved: true, guesses: [{ order: solution, bulls: [true, true, true, true, true] }] },
    { statId: 'stat_2', solved: true, guesses: [{ order: solution, bulls: [true, true, true, true, true] }] },
    { statId: 'stat_3', solved: true, guesses: [{ order: solution, bulls: [true, true, true, true, true] }] },
  ],
  runningScore: 100,
  finalScore: 100,
  updatedAt: Date.now(),
};

beforeEach(() => {
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    share: undefined,
  });
});

describe('ResultCard', () => {
  it('renders the final score', () => {
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    expect(screen.getByTestId('final-score')).toHaveTextContent('100');
  });

  it('renders one emoji row per guess per stat', () => {
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    const rows = screen.getAllByTestId('feedback-row');
    expect(rows.length).toBe(3); // 1 guess per stat × 3 stats
  });

  it('renders a share button with accessible label', () => {
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    const btn = screen.getByRole('button', { name: /share/i });
    expect(btn).toBeInTheDocument();
  });

  it('calls navigator.clipboard.writeText with share text on share click', async () => {
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    const btn = screen.getByRole('button', { name: /share/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('WorldOrder #42'),
      );
    });
  });

  it('shows "Copied!" confirmation text after successful clipboard write', async () => {
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    const btn = screen.getByRole('button', { name: /share/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText(/Copied!/)).toBeInTheDocument();
    });
  });

  // T010: never calls navigator.share even when it is available (replaces old "uses navigator.share" test)
  it('never calls navigator.share even when it is available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      share: mockShare,
    });
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    const btn = screen.getByRole('button', { name: /share/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
    expect(mockShare).not.toHaveBeenCalled();
  });

  // T010: error state when clipboard.writeText rejects
  it('shows "Copy failed" when clipboard.writeText rejects', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      share: undefined,
    });
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    const btn = screen.getByRole('button', { name: /share/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('Copy failed')).toBeInTheDocument();
    });
  });

  // T010: button reverts after error
  it('button reverts to "Share Result" 2 s after a copy error', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      share: undefined,
    });
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    const btn = screen.getByRole('button', { name: /share/i });

    // Click and flush the rejected promise (multiple flushes ensure catch block runs)
    await act(async () => {
      fireEvent.click(btn);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // 'Copy failed' should now be visible
    expect(screen.getByText('Copy failed')).toBeInTheDocument();

    // Advance fake timers by 2 s — the setTimeout callback should fire
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText('Share Result')).toBeInTheDocument();

    vi.useRealTimers();
  });
});

// T002: Revamped stat sections (US1)
describe('ResultCard — revamped stat sections (US1)', () => {
  it('renders three <section> elements with aria-labels matching stat labels', () => {
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    expect(screen.getByRole('region', { name: 'Population' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Land Area' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Urban %' })).toBeInTheDocument();
  });

  it('stat sections appear in state.stats order (Population first)', () => {
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    const sections = screen.getAllByRole('region');
    expect(sections[0]).toHaveAttribute('aria-label', 'Population');
    expect(sections[1]).toHaveAttribute('aria-label', 'Land Area');
    expect(sections[2]).toHaveAttribute('aria-label', 'Urban %');
  });

  it('renders CorrectValuesRow inside each stat section when values and unit are present', () => {
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzleWithValues} />);
    const rows = screen.getAllByTestId('correct-values-row');
    expect(rows).toHaveLength(3);
  });

  it('does not render CorrectValuesRow when stat.values is absent', () => {
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    expect(screen.queryAllByTestId('correct-values-row')).toHaveLength(0);
  });

  it('does not crash when stat.values is absent (no values/unit in puzzle)', () => {
    expect(() => {
      render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    }).not.toThrow();
  });
});

// T007: Score bar in ResultCard has no transition
describe('ResultCard — static score bar (US2)', () => {
  it('score bar has no transition in its inline style', () => {
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    const bar = screen.getByTestId('score-bar');
    expect(bar.style.transition).toBe('');
  });
});

describe('ResultCard — performanceLabel variants', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      share: undefined,
    });
  });

  function makeState(finalScore: number): GameState {
    return {
      ...mockState,
      runningScore: finalScore,
      finalScore,
    };
  }

  it('shows Perfect label for score === 100', () => {
    render(<ResultCard state={makeState(100)} puzzleNumber={1} puzzle={mockPuzzle} />);
    expect(screen.getByRole('img', { name: /perfect/i })).toBeInTheDocument();
  });

  it('shows Excellent label for score >= 80', () => {
    render(<ResultCard state={makeState(85)} puzzleNumber={1} puzzle={mockPuzzle} />);
    expect(screen.getByRole('img', { name: /excellent/i })).toBeInTheDocument();
  });

  it('shows Great label for score >= 60', () => {
    render(<ResultCard state={makeState(65)} puzzleNumber={1} puzzle={mockPuzzle} />);
    expect(screen.getByRole('img', { name: /great/i })).toBeInTheDocument();
  });

  it('shows Good label for score >= 40', () => {
    render(<ResultCard state={makeState(45)} puzzleNumber={1} puzzle={mockPuzzle} />);
    expect(screen.getByRole('img', { name: /good/i })).toBeInTheDocument();
  });

  it('shows Keep Exploring label for score below 40', () => {
    render(<ResultCard state={makeState(30)} puzzleNumber={1} puzzle={mockPuzzle} />);
    expect(screen.getByRole('img', { name: /keep exploring/i })).toBeInTheDocument();
  });
});
