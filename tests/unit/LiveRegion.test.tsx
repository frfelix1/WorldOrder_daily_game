import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveRegion } from '../../src/components/ui/LiveRegion';

describe('LiveRegion', () => {
  it('has aria-live="polite" attribute', () => {
    render(<LiveRegion message="test" />);
    const el = screen.getByText('test');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  it('has aria-atomic="true" attribute', () => {
    render(<LiveRegion message="test" />);
    const el = screen.getByText('test');
    expect(el).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders the message prop content in the DOM', () => {
    render(<LiveRegion message="Stat 1 solved!" />);
    expect(screen.getByText('Stat 1 solved!')).toBeInTheDocument();
  });

  it('is visually hidden via sr-only class', () => {
    render(<LiveRegion message="test" />);
    const el = screen.getByText('test');
    expect(el.className).toContain('sr-only');
  });
});
