import { NextResponse } from 'next/server';
import { getUTCDateString } from '../../../lib/puzzle';

/** Game epoch — first valid puzzle date */
const EPOCH = '2026-01-01';

/**
 * GET /api/puzzles
 * Returns a sorted array of all valid puzzle dates from the game epoch
 * through today's UTC date. Used by the dev seed-switcher panel.
 *
 * No filesystem access — the date range is computed from the epoch constant
 * and the current UTC date, so every date is valid by definition.
 */
export async function GET(): Promise<NextResponse> {
  const today = getUTCDateString();
  const dates = _dateRange(EPOCH, today);
  return NextResponse.json(dates);
}

/** Generate all YYYY-MM-DD strings from `start` through `end` (inclusive). */
function _dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);

  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}
