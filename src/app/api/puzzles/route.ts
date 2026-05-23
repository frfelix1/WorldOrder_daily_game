import { NextResponse } from 'next/server';
import { readdirSync } from 'fs';
import { join } from 'path';

/**
 * GET /api/puzzles
 * Returns a sorted list of all available puzzle dates.
 * Used by the dev seed switcher panel.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const dir = join(process.cwd(), 'data', 'puzzles');
    const dates = readdirSync(dir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map((f) => f.replace('.json', ''))
      .sort();
    return NextResponse.json({ dates });
  } catch {
    return NextResponse.json({ dates: [] });
  }
}
