import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatPanel } from '../../src/components/game/StatPanel';
import type { StatDef } from '../../src/types';

const mockStat: StatDef = {
  id: 'stat_1',
  label: 'Population',
  category: 'demographics',
  tooltip: 'Total resident population.',
  direction: 'desc',
  solution: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'],
};

describe('StatPanel', () => {
  it('renders null when stat is null', () => {
    const { container } = render(<StatPanel stat={null} isSolved={false} statIndex={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the stat label', () => {
    render(<StatPanel stat={mockStat} isSolved={false} statIndex={0} />);
    expect(screen.getByText('Population')).toBeInTheDocument();
  });

  it('renders the line-placement label for desc direction (least left, most right)', () => {
    render(<StatPanel stat={mockStat} isSolved={false} statIndex={0} />);
    expect(screen.getByTestId('stat-direction')).toHaveTextContent(
      'Place on the line: least Population left, most Population right',
    );
  });

  it('renders the same least→most line label regardless of direction', () => {
    const ascStat = { ...mockStat, direction: 'asc' as const, label: 'Debt' };
    render(<StatPanel stat={ascStat} isSolved={false} statIndex={0} />);
    expect(screen.getByTestId('stat-direction')).toHaveTextContent(
      'Place on the line: least Debt left, most Debt right',
    );
  });

  it('shows solved badge when isSolved is true', () => {
    render(<StatPanel stat={mockStat} isSolved={true} statIndex={0} />);
    expect(screen.getByText(/Solved/)).toBeInTheDocument();
  });

  it('does not show solved badge when isSolved is false', () => {
    render(<StatPanel stat={mockStat} isSolved={false} statIndex={0} />);
    expect(screen.queryByText(/Solved/)).not.toBeInTheDocument();
  });

  it('has data-stat-index attribute', () => {
    render(<StatPanel stat={mockStat} isSolved={false} statIndex={1} />);
    expect(screen.getByTestId('stat-panel')).toHaveAttribute('data-stat-index', '1');
  });
});
