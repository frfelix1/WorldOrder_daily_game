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
