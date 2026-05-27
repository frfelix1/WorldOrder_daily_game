import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
        expect.stringContaining('Rankle #42'),
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

  it('uses navigator.share when available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      share: mockShare,
    });
    render(<ResultCard state={mockState} puzzleNumber={42} puzzle={mockPuzzle} />);
    const btn = screen.getByRole('button', { name: /share/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('Rankle #42') }),
      );
    });
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
