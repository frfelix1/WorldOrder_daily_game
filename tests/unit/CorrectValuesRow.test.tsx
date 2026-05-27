import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CorrectValuesRow } from '../../src/components/game/CorrectValuesRow';
import type { StatDef, Country } from '../../src/types';

const countries: Country[] = [
  { id: 'BRA', name: 'Brazil',    flagCode: 'br' },
  { id: 'DEU', name: 'Germany',   flagCode: 'de' },
  { id: 'NGA', name: 'Nigeria',   flagCode: 'ng' },
  { id: 'JPN', name: 'Japan',     flagCode: 'jp' },
  { id: 'AUS', name: 'Australia', flagCode: 'au' },
];

const statWithValues: StatDef = {
  id: 'stat_1',
  label: 'Population',
  category: 'demographics',
  tooltip: 'Population',
  direction: 'desc',
  solution: ['NGA', 'BRA', 'JPN', 'DEU', 'AUS'],
  values: {
    NGA: 218000000,
    BRA: 215000000,
    JPN: 125000000,
    DEU: 84000000,
    AUS: 26000000,
  },
  unit: 'people',
};

const statWithoutValues: StatDef = {
  id: 'stat_2',
  label: 'Land Area',
  category: 'geography',
  tooltip: 'Land Area',
  direction: 'desc',
  solution: ['NGA', 'BRA', 'JPN', 'DEU', 'AUS'],
  // No values, no unit
};

const statWithoutUnit: StatDef = {
  ...statWithValues,
  id: 'stat_3',
  unit: undefined,
};

describe('CorrectValuesRow', () => {
  it('renders five value cells in solution order when values and unit are present', () => {
    render(<CorrectValuesRow stat={statWithValues} countries={countries} />);
    const cells = screen.getAllByTestId('correct-value-cell');
    expect(cells).toHaveLength(5);
  });

  it('renders cells in stat.solution order (first cell is first in solution)', () => {
    render(<CorrectValuesRow stat={statWithValues} countries={countries} />);
    const cells = screen.getAllByTestId('correct-value-cell');
    // solution[0] = 'NGA' = Nigeria
    expect(cells[0]).toHaveAttribute('aria-label', expect.stringContaining('Nigeria'));
  });

  it('each cell aria-label contains the country name', () => {
    render(<CorrectValuesRow stat={statWithValues} countries={countries} />);
    expect(screen.getByLabelText(/Nigeria/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Brazil/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Japan/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Germany/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Australia/)).toBeInTheDocument();
  });

  it('each cell aria-label contains the formatted value', () => {
    render(<CorrectValuesRow stat={statWithValues} countries={countries} />);
    // NGA: 218,000,000 people
    expect(screen.getByLabelText(/218,000,000 people/)).toBeInTheDocument();
  });

  it('renders null (empty DOM) when stat.values is undefined', () => {
    const { container } = render(
      <CorrectValuesRow stat={statWithoutValues} countries={countries} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders null (empty DOM) when stat.unit is undefined', () => {
    const { container } = render(
      <CorrectValuesRow stat={statWithoutUnit} countries={countries} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows "?" for country name when a country ID in solution is not found in countries array', () => {
    const statWithUnknown: StatDef = {
      ...statWithValues,
      solution: ['NGA', 'BRA', 'JPN', 'DEU', 'UNKNOWN'],
      values: {
        NGA: 218000000,
        BRA: 215000000,
        JPN: 125000000,
        DEU: 84000000,
        UNKNOWN: 1000,
      },
    };
    render(<CorrectValuesRow stat={statWithUnknown} countries={countries} />);
    const cells = screen.getAllByTestId('correct-value-cell');
    // Last cell is for 'UNKNOWN' — should show '?' as country name
    expect(cells[4]).toHaveTextContent('?');
  });

  it('renders the wrapper with data-testid="correct-values-row"', () => {
    render(<CorrectValuesRow stat={statWithValues} countries={countries} />);
    expect(screen.getByTestId('correct-values-row')).toBeInTheDocument();
  });
});
