import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DevPanel } from '../../src/components/dev/DevPanel';

// Stub global fetch for all tests
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ dates: ['2026-05-20', '2026-05-21', '2026-05-22', '2026-05-27'] }),
  }));
});

const TODAY = '2026-05-27';
const noop = vi.fn();

describe('DevPanel', () => {
  it('renders a toggle button with data-testid=dev-toggle', () => {
    render(<DevPanel currentDate={TODAY} todayDate={TODAY} onDateChange={noop} />);
    expect(screen.getByTestId('dev-toggle')).toBeInTheDocument();
  });

  it('does not render the panel body before toggle is clicked', () => {
    render(<DevPanel currentDate={TODAY} todayDate={TODAY} onDateChange={noop} />);
    expect(screen.queryByTestId('dev-panel')).not.toBeInTheDocument();
  });

  it('opens the panel when toggle is clicked', async () => {
    render(<DevPanel currentDate={TODAY} todayDate={TODAY} onDateChange={noop} />);
    fireEvent.click(screen.getByTestId('dev-toggle'));
    expect(screen.getByTestId('dev-panel')).toBeInTheDocument();
  });

  it('renders a Randomize button with data-testid=dev-randomize', async () => {
    render(<DevPanel currentDate={TODAY} todayDate={TODAY} onDateChange={noop} />);
    fireEvent.click(screen.getByTestId('dev-toggle'));
    expect(screen.getByTestId('dev-randomize')).toBeInTheDocument();
  });

  it('clicking Randomize calls onDateChange with a string from the available dates list', async () => {
    const onDateChange = vi.fn();
    render(<DevPanel currentDate={TODAY} todayDate={TODAY} onDateChange={onDateChange} />);
    fireEvent.click(screen.getByTestId('dev-toggle'));

    // Wait for fetch to resolve and dates to be populated
    await waitFor(() => {
      const btn = screen.getByTestId('dev-randomize');
      expect(btn).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('dev-randomize'));
    expect(onDateChange).toHaveBeenCalledOnce();
    const calledWith = onDateChange.mock.calls[0][0] as string;
    expect(['2026-05-20', '2026-05-21', '2026-05-22', '2026-05-27']).toContain(calledWith);
  });

  it('panel body renders no date list items (no <li> or date buttons other than reset)', async () => {
    render(<DevPanel currentDate={TODAY} todayDate={TODAY} onDateChange={noop} />);
    fireEvent.click(screen.getByTestId('dev-toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('dev-panel')).toBeInTheDocument();
    });

    const panel = screen.getByTestId('dev-panel');
    // No <li> elements inside the panel
    expect(panel.querySelectorAll('li')).toHaveLength(0);
    // No date-string buttons — only the Randomize button (and optionally Reset)
    const buttons = panel.querySelectorAll('button');
    // Should be exactly 1 (Randomize) when not overriding
    expect(buttons).toHaveLength(1);
  });

  it('Randomize button is disabled and shows "No puzzles available" when dates list is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ dates: [] }),
    }));

    render(<DevPanel currentDate={TODAY} todayDate={TODAY} onDateChange={noop} />);
    fireEvent.click(screen.getByTestId('dev-toggle'));

    await waitFor(() => {
      const btn = screen.getByTestId('dev-randomize');
      expect(btn).toBeDisabled();
      expect(btn).toHaveTextContent(/No puzzles available/i);
    });
  });

  it('Reset to today button (data-testid=dev-reset) appears when currentDate !== todayDate', async () => {
    render(<DevPanel currentDate="2026-05-20" todayDate={TODAY} onDateChange={noop} />);
    fireEvent.click(screen.getByTestId('dev-toggle'));
    expect(screen.getByTestId('dev-reset')).toBeInTheDocument();
  });

  it('Reset to today button is NOT shown when currentDate === todayDate', async () => {
    render(<DevPanel currentDate={TODAY} todayDate={TODAY} onDateChange={noop} />);
    fireEvent.click(screen.getByTestId('dev-toggle'));
    expect(screen.queryByTestId('dev-reset')).not.toBeInTheDocument();
  });

  it('clicking Reset to today calls onDateChange with todayDate', async () => {
    const onDateChange = vi.fn();
    render(<DevPanel currentDate="2026-05-20" todayDate={TODAY} onDateChange={onDateChange} />);
    fireEvent.click(screen.getByTestId('dev-toggle'));
    fireEvent.click(screen.getByTestId('dev-reset'));
    expect(onDateChange).toHaveBeenCalledWith(TODAY);
  });
});
