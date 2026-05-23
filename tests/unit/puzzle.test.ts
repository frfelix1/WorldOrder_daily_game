import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPuzzleNumber, getUTCDateString } from '../../src/lib/puzzle';

describe('getPuzzleNumber', () => {
  it('returns a non-negative integer', () => {
    const n = getPuzzleNumber();
    expect(n).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(n)).toBe(true);
  });

  it('returns a consistent value for the same point in time', () => {
    // Two calls within the same UTC day should return the same number
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-22T12:00:00Z'));
    const n1 = getPuzzleNumber();
    const n2 = getPuzzleNumber();
    expect(n1).toBe(n2);
    vi.useRealTimers();
  });

  it('returns different numbers for different UTC dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-22T00:00:00Z'));
    const n1 = getPuzzleNumber();
    vi.setSystemTime(new Date('2026-05-23T00:00:00Z'));
    const n2 = getPuzzleNumber();
    expect(n2).toBe(n1 + 1);
    vi.useRealTimers();
  });
});

describe('getUTCDateString', () => {
  it('returns today date in YYYY-MM-DD format', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-22T15:30:00Z'));
    const date = getUTCDateString();
    expect(date).toBe('2026-05-22');
    vi.useRealTimers();
  });

  it('returns a string matching YYYY-MM-DD pattern', () => {
    const date = getUTCDateString();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('is UTC-based and not affected by local timezone', () => {
    vi.useFakeTimers();
    // Midnight UTC — should return the UTC date, not local date
    vi.setSystemTime(new Date('2026-05-23T00:00:00Z'));
    const date = getUTCDateString();
    expect(date).toBe('2026-05-23');
    vi.useRealTimers();
  });
});
