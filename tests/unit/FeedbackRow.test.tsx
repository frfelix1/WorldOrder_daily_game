import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackRow } from '../../src/components/game/FeedbackRow';
import type { Guess } from '../../src/types';

describe('FeedbackRow', () => {
  const allBullsGuess: Guess = {
    order: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'],
    bulls: [true, true, true, true, true],
  };

  const mixedGuess: Guess = {
    order: ['BRA', 'NGA', 'DEU', 'JPN', 'AUS'],
    bulls: [false, false, true, true, true],
  };

  it('renders exactly 5 emoji elements per guess', () => {
    const { container } = render(<FeedbackRow guess={allBullsGuess} />);
    const spans = container.querySelectorAll('[aria-label]');
    expect(spans.length).toBe(5);
  });

  it('renders 🟩 for bull positions', () => {
    render(<FeedbackRow guess={allBullsGuess} />);
    const bulls = screen.getAllByText('🟩');
    expect(bulls.length).toBe(5);
  });

  it('renders 🟥 for miss positions', () => {
    render(<FeedbackRow guess={mixedGuess} />);
    const misses = screen.getAllByText('🟥');
    expect(misses.length).toBe(2);
  });

  it('renders correct mix of 🟩 and 🟥', () => {
    render(<FeedbackRow guess={mixedGuess} />);
    const bulls = screen.getAllByText('🟩');
    const misses = screen.getAllByText('🟥');
    expect(bulls.length).toBe(3);
    expect(misses.length).toBe(2);
  });

  it('each position has an aria-label communicating correct/incorrect', () => {
    const { container } = render(<FeedbackRow guess={mixedGuess} />);
    const spans = container.querySelectorAll('[aria-label]');
    expect(spans[0]).toHaveAttribute('aria-label', expect.stringContaining('incorrect'));
    expect(spans[2]).toHaveAttribute('aria-label', expect.stringContaining('correct'));
  });
});
