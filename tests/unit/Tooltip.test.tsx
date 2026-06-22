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
    const triggerBtn = screen.getByTestId('tooltip-trigger');
    fireEvent.focus(triggerBtn);
    expect(screen.getByRole('tooltip')).toBeVisible();
  });

  it('is hidden after blur on trigger', () => {
    render(<Tooltip content="Tooltip text"><button>Trigger</button></Tooltip>);
    const triggerBtn = screen.getByTestId('tooltip-trigger');
    fireEvent.focus(triggerBtn);
    fireEvent.blur(triggerBtn);
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

  // T025: Tap/click to toggle open and dismiss (mobile accessibility)
  it('T025: clicking/tapping the trigger toggles the tooltip open', () => {
    render(<Tooltip content="Tap tooltip"><button>Tap me</button></Tooltip>);
    const triggerBtn = screen.getByTestId('tooltip-trigger');
    // Initially hidden
    expect(screen.getByRole('tooltip', { hidden: true })).not.toBeVisible();
    // Click to open
    fireEvent.click(triggerBtn);
    expect(screen.getByRole('tooltip')).toBeVisible();
  });

  it('T025: clicking outside the tooltip dismisses it', () => {
    render(
      <div>
        <Tooltip content="Tap tooltip"><button>Tap me</button></Tooltip>
        <div data-testid="outside">Outside</div>
      </div>
    );
    const triggerBtn = screen.getByTestId('tooltip-trigger');
    // Open
    fireEvent.click(triggerBtn);
    expect(screen.getByRole('tooltip')).toBeVisible();
    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.getByRole('tooltip', { hidden: true })).not.toBeVisible();
  });

  it('T025: pressing Escape dismisses the tooltip', () => {
    render(<Tooltip content="Tap tooltip"><button>Tap me</button></Tooltip>);
    const triggerBtn = screen.getByTestId('tooltip-trigger');
    // Open
    fireEvent.click(triggerBtn);
    expect(screen.getByRole('tooltip')).toBeVisible();
    // Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('tooltip', { hidden: true })).not.toBeVisible();
  });

  it('T025: tooltip trigger has data-testid="tooltip-trigger"', () => {
    render(<Tooltip content="Test"><button>Click</button></Tooltip>);
    expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
  });
});
