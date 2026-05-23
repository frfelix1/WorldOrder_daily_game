import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from '../../src/components/ui/Tooltip';

describe('Tooltip', () => {
  it('is hidden on initial render', () => {
    render(<Tooltip content="Tooltip text"><button>Trigger</button></Tooltip>);
    // Element exists in DOM but is not visible (hidden attribute)
    expect(screen.getByRole('tooltip', { hidden: true })).not.toBeVisible();
  });

  it('appears after mouseenter on trigger', () => {
    render(<Tooltip content="Tooltip text"><button>Trigger</button></Tooltip>);
    const trigger = screen.getByText('Trigger').closest('[aria-describedby]') as HTMLElement;
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('tooltip')).toBeVisible();
  });

  it('is hidden after mouseleave', () => {
    render(<Tooltip content="Tooltip text"><button>Trigger</button></Tooltip>);
    const trigger = screen.getByText('Trigger').closest('[aria-describedby]') as HTMLElement;
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseLeave(trigger);
    expect(screen.getByRole('tooltip', { hidden: true })).not.toBeVisible();
  });

  it('appears after focus on trigger', () => {
    render(<Tooltip content="Tooltip text"><button>Trigger</button></Tooltip>);
    const trigger = screen.getByText('Trigger').closest('[aria-describedby]') as HTMLElement;
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toBeVisible();
  });

  it('is hidden after blur on trigger', () => {
    render(<Tooltip content="Tooltip text"><button>Trigger</button></Tooltip>);
    const trigger = screen.getByText('Trigger').closest('[aria-describedby]') as HTMLElement;
    fireEvent.focus(trigger);
    fireEvent.blur(trigger);
    expect(screen.getByRole('tooltip', { hidden: true })).not.toBeVisible();
  });

  it('tooltip element has role="tooltip"', () => {
    render(<Tooltip content="My tooltip"><button>T</button></Tooltip>);
    // Use hidden: true since the tooltip may not be visible initially
    expect(screen.getByRole('tooltip', { hidden: true })).toBeInTheDocument();
  });

  it('trigger has aria-describedby pointing to tooltip id', () => {
    render(<Tooltip content="My tooltip"><button>T</button></Tooltip>);
    const trigger = screen.getByText('T').closest('[aria-describedby]') as HTMLElement;
    const tooltipId = trigger.getAttribute('aria-describedby');
    expect(tooltipId).toBeTruthy();
    const tooltipEl = document.getElementById(tooltipId!);
    expect(tooltipEl).not.toBeNull();
    expect(tooltipEl?.getAttribute('role')).toBe('tooltip');
  });
});
