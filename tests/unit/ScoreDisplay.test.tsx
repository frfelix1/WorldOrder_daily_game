import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreDisplay } from '../../src/components/game/ScoreDisplay';

describe('ScoreDisplay', () => {
  it('renders the score value in the DOM', () => {
    render(<ScoreDisplay score={42} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('re-renders when score prop changes', () => {
    const { rerender } = render(<ScoreDisplay score={10} />);
    expect(screen.getByText('10 / 100')).toBeInTheDocument();
    rerender(<ScoreDisplay score={100} />);
    expect(screen.getByText('100 / 100')).toBeInTheDocument();
  });

  it('includes accessible label "Running score: N / 100"', () => {
    render(<ScoreDisplay score={75} />);
    const el = screen.getByLabelText(/Running score: 75 \/ 100/);
    expect(el).toBeInTheDocument();
  });

  it('is always visible (not conditionally hidden)', () => {
    render(<ScoreDisplay score={0} />);
    const el = screen.getByLabelText(/Running score: 0 \/ 100/);
    expect(el).toBeVisible();
  });
});

// T006: Static score bar — no animation, no transition
describe('ScoreDisplay — static score bar (US2)', () => {
  it('inner bar has no animation inline style (should be empty or "none")', () => {
    render(<ScoreDisplay score={42} />);
    const bar = screen.getByTestId('score-bar');
    // Currently fails: animation = 'shimmerGold 2.5s linear infinite'
    expect(bar.style.animation === '' || bar.style.animation === 'none').toBe(true);
  });

  it('inner bar has no transition inline style', () => {
    render(<ScoreDisplay score={42} />);
    const bar = screen.getByTestId('score-bar');
    // Currently fails: transition = 'width 0.8s cubic-bezier(...)'
    expect(bar.style.transition).toBe('');
  });

  it('inner bar renders at the correct width percentage immediately', () => {
    render(<ScoreDisplay score={42} />);
    const bar = screen.getByTestId('score-bar');
    expect(bar).toHaveStyle({ width: '42%' });
  });

  it('bar width is 0% when score is 0', () => {
    render(<ScoreDisplay score={0} />);
    const bar = screen.getByTestId('score-bar');
    expect(bar).toHaveStyle({ width: '0%' });
  });
});
