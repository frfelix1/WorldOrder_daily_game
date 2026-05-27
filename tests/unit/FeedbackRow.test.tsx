import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackRow } from '../../src/components/game/FeedbackRow';
import type { Guess } from '../../src/types';
import type { Country } from '../../src/types';

const testCountries: Country[] = [
  { id: 'NGA', name: 'Nigeria',   flagCode: 'ng' },
  { id: 'BRA', name: 'Brazil',    flagCode: 'br' },
  { id: 'DEU', name: 'Germany',   flagCode: 'de' },
  { id: 'JPN', name: 'Japan',     flagCode: 'jp' },
  { id: 'AUS', name: 'Australia', flagCode: 'au' },
];

const allBullsGuess: Guess = {
  order: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'],
  bulls: [true, true, true, true, true],
};

const mixedGuess: Guess = {
  order: ['BRA', 'NGA', 'DEU', 'JPN', 'AUS'],
  bulls: [false, false, true, true, true],
};

describe('FeedbackRow — country display (new contract)', () => {
  it('renders 5 feedback cells (data-testid=feedback-cell) for a 5-position guess', () => {
    render(<FeedbackRow guess={allBullsGuess} countries={testCountries} />);
    expect(screen.getAllByTestId('feedback-cell')).toHaveLength(5);
  });

  it('each cell aria-label contains the position number, country name, and correct/incorrect', () => {
    render(<FeedbackRow guess={mixedGuess} countries={testCountries} />);
    const cells = screen.getAllByTestId('feedback-cell');
    // Position 1 is BRA (incorrect)
    expect(cells[0]).toHaveAttribute('aria-label', expect.stringContaining('1'));
    expect(cells[0]).toHaveAttribute('aria-label', expect.stringContaining('Brazil'));
    expect(cells[0]).toHaveAttribute('aria-label', expect.stringContaining('incorrect'));
    // Position 3 is DEU (correct)
    expect(cells[2]).toHaveAttribute('aria-label', expect.stringContaining('3'));
    expect(cells[2]).toHaveAttribute('aria-label', expect.stringContaining('Germany'));
    expect(cells[2]).toHaveAttribute('aria-label', expect.stringContaining('correct'));
  });

  it('correct position cells have success border/bg styling', () => {
    render(<FeedbackRow guess={allBullsGuess} countries={testCountries} />);
    const cells = screen.getAllByTestId('feedback-cell');
    // All 5 are correct — check first cell for success styling
    const style = (cells[0] as HTMLElement).style;
    expect(style.borderColor ?? style.border).toMatch(/rgba\(0,\s*232,\s*150/i);
  });

  it('incorrect position cells have wrong border/bg styling', () => {
    render(<FeedbackRow guess={mixedGuess} countries={testCountries} />);
    const cells = screen.getAllByTestId('feedback-cell');
    // First two positions are incorrect
    const style = (cells[0] as HTMLElement).style;
    expect(style.borderColor ?? style.border).toMatch(/rgba\(255,\s*48,\s*98/i);
  });

  it('correct cells render ✓ icon and incorrect cells render ✗ icon (both aria-hidden)', () => {
    render(<FeedbackRow guess={mixedGuess} countries={testCountries} />);
    const cells = screen.getAllByTestId('feedback-cell');

    // Position 1 (incorrect) → should contain ✗
    expect(cells[0].textContent).toContain('✗');
    // Position 3 (correct) → should contain ✓
    expect(cells[2].textContent).toContain('✓');
  });

  it('each cell renders a flag span with class fi fi-{flagCode}', () => {
    const { container } = render(<FeedbackRow guess={allBullsGuess} countries={testCountries} />);
    // Nigeria is first (NGA -> ng)
    expect(container.querySelector('.fi.fi-ng')).toBeInTheDocument();
    // Brazil is second (BRA -> br)
    expect(container.querySelector('.fi.fi-br')).toBeInTheDocument();
    // Germany is third
    expect(container.querySelector('.fi.fi-de')).toBeInTheDocument();
  });

  it('renders a ? placeholder cell when country id is not found in countries prop', () => {
    const unknownGuess: Guess = {
      order: ['XXX', 'BRA', 'DEU', 'JPN', 'AUS'],
      bulls: [false, false, false, false, false],
    };
    render(<FeedbackRow guess={unknownGuess} countries={testCountries} />);
    const cells = screen.getAllByTestId('feedback-cell');
    // First cell country lookup returns null → should show '?'
    expect(cells[0].textContent).toContain('?');
    // aria-label uses 'Unknown'
    expect(cells[0]).toHaveAttribute('aria-label', expect.stringContaining('Unknown'));
  });

  it('does NOT render 🟩 emoji (removed from new design)', () => {
    render(<FeedbackRow guess={allBullsGuess} countries={testCountries} />);
    expect(screen.queryByText('🟩')).not.toBeInTheDocument();
  });

  it('does NOT render 🟥 emoji (removed from new design)', () => {
    render(<FeedbackRow guess={mixedGuess} countries={testCountries} />);
    expect(screen.queryByText('🟥')).not.toBeInTheDocument();
  });
});

// ── valueMap prop — feature 007-reveal-correct-values ─────────────────────────

describe('FeedbackRow valueMap', () => {
  const valueMap: Record<string, string> = {
    NGA: '218,541,212 people',
    BRA: '215,313,498 people',
    DEU: '84,316,622 people',
    JPN: '125,124,989 people',
    AUS: '26,461,166 people',
  };

  it('renders the formatted value for a correct position when valueMap is provided', () => {
    render(<FeedbackRow guess={allBullsGuess} countries={testCountries} valueMap={valueMap} />);
    // NGA (Nigeria) is at position 1 and is correct — should show its value
    expect(screen.getByText('218,541,212 people')).toBeInTheDocument();
  });

  it('renders values for all correct cells when all positions are correct', () => {
    render(<FeedbackRow guess={allBullsGuess} countries={testCountries} valueMap={valueMap} />);
    expect(screen.getByText('218,541,212 people')).toBeInTheDocument();
    expect(screen.getByText('215,313,498 people')).toBeInTheDocument();
    expect(screen.getByText('84,316,622 people')).toBeInTheDocument();
    expect(screen.getByText('125,124,989 people')).toBeInTheDocument();
    expect(screen.getByText('26,461,166 people')).toBeInTheDocument();
  });

  it('does not render values for incorrect positions even when valueMap is provided', () => {
    // mixedGuess: positions 0, 1 are incorrect; positions 2, 3, 4 are correct
    render(<FeedbackRow guess={mixedGuess} countries={testCountries} valueMap={valueMap} />);
    // BRA is at position 0 (incorrect) — should NOT show its value
    expect(screen.queryByText('215,313,498 people')).not.toBeInTheDocument();
    // NGA is at position 1 (incorrect) — should NOT show its value
    expect(screen.queryByText('218,541,212 people')).not.toBeInTheDocument();
    // DEU is at position 2 (correct) — SHOULD show its value
    expect(screen.getByText('84,316,622 people')).toBeInTheDocument();
  });

  it('does not render any value text when valueMap is omitted', () => {
    render(<FeedbackRow guess={allBullsGuess} countries={testCountries} />);
    expect(screen.queryByText(/people/)).not.toBeInTheDocument();
  });

  it('does not render any value text when valueMap is empty', () => {
    render(<FeedbackRow guess={allBullsGuess} countries={testCountries} valueMap={{}} />);
    expect(screen.queryByText(/people/)).not.toBeInTheDocument();
  });
});
