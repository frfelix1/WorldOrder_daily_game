import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsView } from '../../src/components/game/StatsView';
import type { DailyResult, StatsHistory } from '../../src/types';

const record = (puzzleNumber: number, dateUTC: string, finalScore: number | null): DailyResult => ({
  version: 1,
  puzzleNumber,
  dateUTC,
  completed: true,
  finalScore,
});

const history = (records: DailyResult[], storageStatus: StatsHistory['storageStatus'] = 'ready'): StatsHistory => ({
  records,
  storageStatus,
});

describe('StatsView', () => {
  it('renders a deterministic loading state before browser history is available', () => {
    render(<StatsView history={null} currentDateUTC="2026-05-22" currentPuzzleNumber={2} />);
    expect(screen.getByRole('heading', { name: /daily stats/i })).toBeInTheDocument();
    expect(screen.getByText(/loading history/i)).toBeInTheDocument();
  });

  it('renders newest-first completed rows and scores', () => {
    render(<StatsView
      history={history([record(2, '2026-05-22', 900), record(1, '2026-05-21', 700)])}
      currentDateUTC="2026-05-22"
      currentPuzzleNumber={2}
    />);

    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('2026-05-22');
    expect(rows[0]).toHaveTextContent('900');
    expect(rows[1]).toHaveTextContent('2026-05-21');
    expect(screen.getAllByText(/completed/i)).not.toHaveLength(0);
  });

  it('shows incomplete today and a useful empty state', () => {
    render(<StatsView
      history={history([], 'empty')}
      currentDateUTC="2026-05-22"
      currentPuzzleNumber={2}
    />);

    expect(screen.getByText(/incomplete/i)).toBeInTheDocument();
    expect(screen.getByText(/no completed games/i)).toBeInTheDocument();
  });

  it('retains completed status when score is unavailable', () => {
    render(<StatsView
      history={history([record(1, '2026-05-21', null)], 'corrupt')}
      currentDateUTC="2026-05-22"
      currentPuzzleNumber={2}
    />);

    expect(screen.getByText(/score unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/history contains invalid data/i)).toBeInTheDocument();
  });

  it('distinguishes unsupported history from empty history', () => {
    render(<StatsView
      history={history([], 'unsupported')}
      currentDateUTC="2026-05-22"
      currentPuzzleNumber={2}
    />);

    expect(screen.getByText(/unsupported history/i)).toBeInTheDocument();
  });
});
