import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { unstable_cache } from 'next/cache';
import { generatePuzzle } from '../../../lib/puzzle-generator';
import type { Dataset, PuzzleFile } from '../../../types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
} as const;

/**
 * Load and parse data/dataset.json once per deployment.
 * unstable_cache with no revalidate = cached indefinitely until redeploy.
 */
const getDataset = unstable_cache(
  async (): Promise<Dataset> => {
    const raw = readFileSync(join(process.cwd(), 'data', 'dataset.json'), 'utf-8');
    return JSON.parse(raw) as Dataset;
  },
  ['dataset'],
);

/**
 * Generate and cache a puzzle for a specific date.
 * Keyed by date string — each date gets its own persistent cache entry.
 */
const getCachedPuzzle = (date: string): Promise<PuzzleFile | null> =>
  unstable_cache(
    async (): Promise<PuzzleFile | null> => {
      const dataset = await getDataset();
      return generatePuzzle(date, dataset);
    },
    [`puzzle-${date}`],
  )();

export async function GET(req: NextRequest): Promise<NextResponse> {
  const date = req.nextUrl.searchParams.get('date');

  if (!date || !DATE_REGEX.test(date)) {
    return NextResponse.json(
      { error: 'invalid_date', message: 'date parameter must be in YYYY-MM-DD format' },
      { status: 400 },
    );
  }

  const puzzle = await getCachedPuzzle(date);

  if (puzzle === null) {
    return NextResponse.json(
      { error: 'not_found', message: `No puzzle available for ${date}` },
      { status: 404 },
    );
  }

  return NextResponse.json(puzzle, { headers: CACHE_HEADERS });
}
