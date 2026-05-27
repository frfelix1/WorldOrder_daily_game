import { describe, it, expect } from 'vitest';
import {
  generatePuzzle,
  computeQuintileBands,
  deriveSolution,
  BASE_SEED,
  MAX_ATTEMPTS,
} from '../../src/lib/puzzle-generator';
import type { Dataset, DatasetEntry, DatasetStat } from '../../src/types';

// ---------------------------------------------------------------------------
// Minimal test fixture
// ---------------------------------------------------------------------------

/** Build a DatasetEntry with sensible defaults */
function makeEntry(
  id: string,
  rank: number,
  overrides: Partial<DatasetEntry> = {},
): DatasetEntry {
  return {
    id,
    name: `Country ${id}`,
    flagCode: id.toLowerCase(),
    value: 1000 - rank * 10, // descending values for asc rank
    rank,
    tied: false,
    zeroValue: false,
    available: true,
    ...overrides,
  };
}

/** Build a DatasetStat with 10 countries, ranks 1–10 */
function makeStat(
  category: string,
  entries?: DatasetEntry[],
): DatasetStat {
  const defaultEntries = Array.from({ length: 10 }, (_, i) =>
    makeEntry(`C${String(i + 1).padStart(2, '0')}`, i + 1),
  );
  return {
    label: `Test Stat (${category})`,
    category,
    direction: 'desc',
    unit: 'units',
    source: 'test',
    dataYear: 2024,
    tooltip: 'Test tooltip',
    entries: entries ?? defaultEntries,
  };
}

/**
 * A minimal but valid dataset:
 * - 10 countries (C01–C10), all available, no ties
 * - 3 "real" stats across 2 categories (economy + health)
 * - 11 placeholder stats to satisfy statCount ≥ 14
 * - countryCount set to 30 to pass validation (counter, not array length)
 */
function makeTestDataset(): Dataset {
  const econEntries = Array.from({ length: 10 }, (_, i) =>
    makeEntry(`C${String(i + 1).padStart(2, '0')}`, i + 1),
  );
  const healthEntries = Array.from({ length: 10 }, (_, i) =>
    makeEntry(`C${String(i + 1).padStart(2, '0')}`, 10 - i), // reversed ranks
  );
  const geoEntries = Array.from({ length: 10 }, (_, i) =>
    makeEntry(`C${String(i + 1).padStart(2, '0')}`, (i * 3 + 1) % 10 + 1),
  );

  const stats: Record<string, DatasetStat> = {
    econ1: { ...makeStat('economy'), entries: econEntries },
    health1: { ...makeStat('health'), entries: healthEntries },
    geo1: { ...makeStat('geography'), entries: geoEntries },
  };
  // Add placeholder stats to reach statCount ≥ 14
  for (let i = 4; i <= 14; i++) {
    stats[`placeholder${i}`] = makeStat('culture');
  }

  return {
    generatedAt: '2024-01-01T00:00:00Z',
    countryCount: 30,
    statCount: Object.keys(stats).length,
    stats,
  };
}

/**
 * A larger dataset for determinism/uniqueness tests:
 * - 50 countries (N01–N50), unique sequential ranks per stat
 * - 3 primary stats across 3 distinct categories
 * - 11 placeholder stats for statCount ≥ 14
 * - countryCount: 50 (passes ≥30 check)
 *
 * With 50 countries, each quintile band has ~10 entries, yielding ~10^5
 * possible combinations — consecutive-day collisions are effectively zero.
 */
function makeLargeTestDataset(): Dataset {
  const N = 50;
  const ids = Array.from({ length: N }, (_, i) => `N${String(i + 1).padStart(2, '0')}`);

  function makeStatWithRanks(category: string, rankOrder: string[]): DatasetStat {
    const entries: DatasetEntry[] = rankOrder.map((id, i) =>
      makeEntry(id, i + 1, { value: N - i }),
    );
    return {
      label: `Large Stat (${category})`,
      category,
      direction: 'desc',
      unit: 'units',
      source: 'test',
      dataYear: 2024,
      tooltip: 'Test',
      entries,
    };
  }

  // Three stats with different rank orderings across 3 categories
  const econOrder = [...ids]; // sequential
  const healthOrder = [...ids].reverse(); // reversed
  const geoOrder = ids.map((_, i) => ids[(i * 7) % N]); // pseudo-shuffled, may have duplicates

  const stats: Record<string, DatasetStat> = {
    big_econ: makeStatWithRanks('economy', econOrder),
    big_health: makeStatWithRanks('health', healthOrder),
    big_geo: makeStatWithRanks('geography', geoOrder),
  };
  for (let i = 4; i <= 14; i++) {
    stats[`big_placeholder${i}`] = {
      ...makeStatWithRanks('culture', ids),
    };
  }

  return {
    generatedAt: '2024-01-01T00:00:00Z',
    countryCount: N,
    statCount: Object.keys(stats).length,
    stats,
  };
}


describe('module constants', () => {
  it('BASE_SEED is 42', () => {
    expect(BASE_SEED).toBe(42);
  });

  it('MAX_ATTEMPTS is 20', () => {
    expect(MAX_ATTEMPTS).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// computeQuintileBands
// ---------------------------------------------------------------------------

describe('computeQuintileBands', () => {
  it('returns exactly 5 bands', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry(`C${i}`, i + 1),
    );
    const bands = computeQuintileBands(entries);
    expect(bands).toHaveLength(5);
  });

  it('every band has at least one entry', () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry(`C${i}`, i + 1),
    );
    const bands = computeQuintileBands(entries);
    for (const band of bands) {
      expect(band.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all entries appear in exactly one band', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry(`C${i}`, i + 1),
    );
    const bands = computeQuintileBands(entries);
    const allIds = bands.flat().map((e) => e.id);
    expect(allIds).toHaveLength(entries.length);
    expect(new Set(allIds).size).toBe(entries.length);
  });

  it('handles zero-value entries by placing them in the last band', () => {
    const entries = [
      makeEntry('C1', 1, { zeroValue: false, value: 100 }),
      makeEntry('C2', 2, { zeroValue: false, value: 80 }),
      makeEntry('C3', 3, { zeroValue: false, value: 60 }),
      makeEntry('C4', 4, { zeroValue: false, value: 40 }),
      makeEntry('C5', 5, { zeroValue: true, value: 0 }),
    ];
    const bands = computeQuintileBands(entries);
    const lastBand = bands[4];
    expect(lastBand.some((e) => e.zeroValue)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// deriveSolution
// ---------------------------------------------------------------------------

describe('deriveSolution', () => {
  it('sorts country IDs by rank ascending (rank 1 first)', () => {
    const entries = new Map<string, DatasetEntry>([
      ['A', makeEntry('A', 3)],
      ['B', makeEntry('B', 1)],
      ['C', makeEntry('C', 2)],
    ]);
    const solution = deriveSolution(['A', 'B', 'C'], entries);
    expect(solution).toEqual(['B', 'C', 'A']);
  });

  it('returns all provided country IDs', () => {
    const ids = ['C01', 'C02', 'C03', 'C04', 'C05'];
    const entries = new Map<string, DatasetEntry>(
      ids.map((id, i) => [id, makeEntry(id, i + 1)]),
    );
    const solution = deriveSolution(ids, entries);
    expect(solution).toHaveLength(ids.length);
    expect([...solution].sort()).toEqual([...ids].sort());
  });
});

// ---------------------------------------------------------------------------
// generatePuzzle — valid output shape
// ---------------------------------------------------------------------------

describe('generatePuzzle', () => {
  const dataset = makeTestDataset();

  it('returns a non-null PuzzleFile for a valid date and dataset', () => {
    const result = generatePuzzle('2026-06-01', dataset);
    expect(result).not.toBeNull();
  });

  it('result has exactly 5 countries', () => {
    const result = generatePuzzle('2026-06-01', dataset)!;
    expect(result.countries).toHaveLength(5);
  });

  it('result has exactly 3 stats', () => {
    const result = generatePuzzle('2026-06-01', dataset)!;
    expect(result.stats).toHaveLength(3);
  });

  it('result date matches the input date', () => {
    const result = generatePuzzle('2026-06-01', dataset)!;
    expect(result.date).toBe('2026-06-01');
  });

  it('each stat has id stat_1, stat_2, or stat_3', () => {
    const result = generatePuzzle('2026-06-01', dataset)!;
    const ids = result.stats.map((s) => s.id);
    expect(ids).toContain('stat_1');
    expect(ids).toContain('stat_2');
    expect(ids).toContain('stat_3');
  });

  it('each solution is a permutation of the 5 country IDs', () => {
    const result = generatePuzzle('2026-06-01', dataset)!;
    const countryIds = result.countries.map((c) => c.id).sort();
    for (const stat of result.stats) {
      expect(stat.solution.slice().sort()).toEqual(countryIds);
      expect(stat.solution).toHaveLength(5);
    }
  });

  it('stats span at least 2 distinct categories', () => {
    const result = generatePuzzle('2026-06-01', dataset)!;
    const categories = new Set(result.stats.map((s) => s.category));
    expect(categories.size).toBeGreaterThanOrEqual(2);
  });

  // ---------------------------------------------------------------------------
  // Dataset validation
  // ---------------------------------------------------------------------------

  it('returns null when countryCount < 30', () => {
    const small: Dataset = { ...dataset, countryCount: 29 };
    expect(generatePuzzle('2026-06-01', small)).toBeNull();
  });

  it('returns null when statCount < 14', () => {
    const small: Dataset = { ...dataset, statCount: 13 };
    expect(generatePuzzle('2026-06-01', small)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Determinism (US2)
// ---------------------------------------------------------------------------

describe('generatePuzzle determinism', () => {
  // Use a large dataset so consecutive-day collision probability is negligible
  const dataset = makeLargeTestDataset();

  it('same date and dataset always returns deeply equal results', () => {
    const a = generatePuzzle('2026-08-01', dataset);
    const b = generatePuzzle('2026-08-01', dataset);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('consecutive days produce different country sets', () => {
    const day1 = generatePuzzle('2026-08-01', dataset);
    const day2 = generatePuzzle('2026-08-02', dataset);
    expect(day1).not.toBeNull();
    expect(day2).not.toBeNull();
    const ids1 = new Set(day1!.countries.map((c) => c.id));
    const ids2 = new Set(day2!.countries.map((c) => c.id));
    const isIdentical = ids1.size === ids2.size && [...ids1].every((id) => ids2.has(id));
    expect(isIdentical).toBe(false);
  });

  it('5 sequential dates all have distinct country sets from their predecessor', () => {
    let prevIds: Set<string> | null = null;
    for (let dayOffset = 200; dayOffset < 205; dayOffset++) {
      const d = new Date('2026-01-01T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + dayOffset);
      const dateStr = d.toISOString().slice(0, 10);
      const puzzle = generatePuzzle(dateStr, dataset);
      expect(puzzle).not.toBeNull();
      const currentIds = new Set(puzzle!.countries.map((c) => c.id));
      if (prevIds !== null) {
        const isIdentical =
          prevIds.size === currentIds.size && [...prevIds].every((id) => currentIds.has(id));
        expect(isIdentical).toBe(false);
      }
      prevIds = currentIds;
    }
  });

  it('different dates produce different date fields', () => {
    const day1 = generatePuzzle('2026-09-01', dataset)!;
    const day2 = generatePuzzle('2026-09-02', dataset)!;
    expect(day1).not.toBeNull();
    expect(day2).not.toBeNull();
    expect(day1.date).not.toBe(day2.date);
  });
});
