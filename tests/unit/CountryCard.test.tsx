import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountryCard } from '../../src/components/game/CountryCard';
import type { Country } from '../../src/types';

const country: Country = {
  id: 'BRA',
  name: 'Brazil',
  flagCode: 'br',
};

// Minimal dnd-kit mock — CountryCard uses useSortable internally
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: { 'aria-roledescription': 'sortable item' },
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
  sortableKeyboardCoordinates: {},
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

describe('CountryCard', () => {
  it('renders the country name', () => {
    render(<CountryCard country={country} />);
    expect(screen.getByText('Brazil')).toBeInTheDocument();
  });

  it('renders a <span> with class fi fi-{flagCode}', () => {
    const { container } = render(<CountryCard country={country} />);
    const flagSpan = container.querySelector('.fi.fi-br');
    expect(flagSpan).not.toBeNull();
  });

  it('applies aria-roledescription="sortable item" when draggable', () => {
    render(<CountryCard country={country} />);
    // The aria-roledescription comes from useSortable attributes
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-roledescription', 'sortable item');
  });

  it('accepts isDragging prop without error', () => {
    expect(() => render(<CountryCard country={country} isDragging />)).not.toThrow();
  });
});
