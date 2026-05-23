import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { PuzzleFile } from '../../../types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const date = req.nextUrl.searchParams.get('date');

  if (!date || !DATE_REGEX.test(date)) {
    return NextResponse.json(
      { error: 'invalid_date', message: 'date parameter must be in YYYY-MM-DD format' },
      { status: 400 },
    );
  }

  try {
    const filePath = join(process.cwd(), 'data', 'puzzles', `${date}.json`);
    const raw = readFileSync(filePath, 'utf-8');
    const puzzle = JSON.parse(raw) as PuzzleFile;
    return NextResponse.json(puzzle, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'not_found', message: `No puzzle available for ${date}` },
      { status: 404 },
    );
  }
}
