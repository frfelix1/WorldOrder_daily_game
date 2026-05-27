/**
 * Puzzle generator — pure TypeScript port of scripts/generate_puzzles.py.
 *
 * All exported functions are pure: same inputs always produce the same outputs,
 * no I/O, no side effects. (Constitution Principle IV)
 *
 * Determinism guarantee:
 *   seed = BASE_SEED + getPuzzleNumberForDate(dateStr) + attemptIndex
 *   The same dateStr and dataset always produce the same PuzzleFile.
 */

import { createRng, pickRandom, shuffle } from './seeded-random';
import { getPuzzleNumberForDate } from './puzzle';
import type {
  Dataset,
  DatasetEntry,
  DatasetStat,
  PuzzleFile,
  Country,
  StatDef,
} from '../types';
import type { RngState } from './seeded-random';

/** Base seed added to the puzzle number to produce per-day seeds. */
export const BASE_SEED = 42;

/** Maximum generation attempts per date before returning null. */
export const MAX_ATTEMPTS = 20;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic puzzle for the given UTC date string.
 *
 * Returns null if the dataset is too small or if no valid puzzle can be
 * constructed after MAX_ATTEMPTS (including the consecutive-day uniqueness
 * check).
 */
export function generatePuzzle(
  dateStr: string,
  dataset: Dataset,
): PuzzleFile | null {
  if (!_validateDataset(dataset)) return null;

  const puzzleNumber = getPuzzleNumberForDate(dateStr);

  // Compute the previous day's country set once (no recursive consecutive check)
  const prevIds = _getPreviousDayCountryIds(dateStr, dataset, puzzleNumber);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const seed = BASE_SEED + puzzleNumber + attempt;
    const rng = createRng(seed);
    const candidate = _tryGenerateCandidate(dateStr, dataset, rng);
    if (candidate === null) continue;

    // Consecutive-day uniqueness check
    if (prevIds !== null) {
      const candidateIds = new Set(candidate.countries.map((c) => c.id));
      if (
        prevIds.size === candidateIds.size &&
        [...prevIds].every((id) => candidateIds.has(id))
      ) {
        continue; // same countries as previous day — retry
      }
    }

    return candidate;
  }

  return null;
}

/**
 * Compute five quintile bands from a list of eligible entries.
 *
 * - If any entries have `zeroValue=true`: bands 1–4 are quartiles of non-zero
 *   entries (cuts 0%, 25%, 50%, 75%, 100%); band 5 holds the zero-value entries.
 * - Otherwise: 5 equal-width quintile bands (cuts 0%, 20%, 40%, 60%, 80%, 100%).
 *
 * A `max(floor(N * pct), prevBandEnd)` guard ensures each band makes progress
 * even when rounding produces zero-width windows.
 *
 * Exported for unit testing.
 */
export function computeQuintileBands(
  entries: DatasetEntry[],
): [DatasetEntry[], DatasetEntry[], DatasetEntry[], DatasetEntry[], DatasetEntry[]] {
  const zeroEntries = entries.filter((e) => e.zeroValue);
  const nonZero = entries.filter((e) => !e.zeroValue);
  const N = nonZero.length;

  if (N === 0) {
    // All zero-value or empty — everything in band 1
    return [entries, [], [], [], []];
  }

  const bands: DatasetEntry[][] = [[], [], [], [], []];

  if (zeroEntries.length > 0) {
    // 4 quartile bands for non-zero + zero entries in band 5
    const cuts = [0, 0.25, 0.5, 0.75, 1.0];
    for (let b = 0; b < 4; b++) {
      const prevEnd = bands.slice(0, b).reduce((s, a) => s + a.length, 0);
      const start = Math.max(Math.floor(N * cuts[b]), prevEnd);
      const end = b === 3 ? N : Math.floor(N * cuts[b + 1]);
      bands[b] = nonZero.slice(start, Math.max(end, start + 1 > N ? start : start + 1));
    }
    // Trim band 3 to end exactly at N
    const usedByBands03 = bands.slice(0, 4).reduce((s, a) => s + a.length, 0);
    if (usedByBands03 < N) {
      bands[3] = [...bands[3], ...nonZero.slice(usedByBands03, N)];
    }
    bands[4] = zeroEntries;
  } else {
    // 5 equal quintile bands
    const cuts = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    for (let b = 0; b < 5; b++) {
      const prevEnd = bands.slice(0, b).reduce((s, a) => s + a.length, 0);
      const start = Math.max(Math.floor(N * cuts[b]), prevEnd);
      const end = b === 4 ? N : Math.floor(N * cuts[b + 1]);
      bands[b] = nonZero.slice(start, end);
    }
    // Ensure any remainder goes into the last band
    const used = bands.reduce((s, a) => s + a.length, 0);
    if (used < N) {
      bands[4] = [...bands[4], ...nonZero.slice(used, N)];
    }
  }

  return bands as [DatasetEntry[], DatasetEntry[], DatasetEntry[], DatasetEntry[], DatasetEntry[]];
}

/**
 * Sort country IDs by their rank in the given entries map (rank 1 = position 0).
 * Exported for unit testing.
 */
export function deriveSolution(
  countryIds: string[],
  entriesByCountryId: Map<string, DatasetEntry>,
): string[] {
  return countryIds.slice().sort((a, b) => {
    const rankA = entriesByCountryId.get(a)?.rank ?? Infinity;
    const rankB = entriesByCountryId.get(b)?.rank ?? Infinity;
    return rankA - rankB;
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _validateDataset(dataset: Dataset): boolean {
  return dataset.countryCount >= 30 && dataset.statCount >= 14;
}

/**
 * Generate the previous day's country set WITHOUT the consecutive check,
 * to avoid infinite recursion.
 * Returns null if the previous day is before epoch or no puzzle can be made.
 */
function _getPreviousDayCountryIds(
  dateStr: string,
  dataset: Dataset,
  puzzleNumber: number,
): Set<string> | null {
  if (puzzleNumber <= 0) return null;

  const prevDate = _offsetDate(dateStr, -1);
  const prevPuzzleNumber = puzzleNumber - 1;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const seed = BASE_SEED + prevPuzzleNumber + attempt;
    const rng = createRng(seed);
    const prev = _tryGenerateCandidate(prevDate, dataset, rng);
    if (prev !== null) {
      return new Set(prev.countries.map((c) => c.id));
    }
  }
  return null;
}

/**
 * One generation attempt: pick stats, pick countries per quintile band,
 * validate constraints, return PuzzleFile or null.
 * Does NOT perform the consecutive-day uniqueness check.
 */
function _tryGenerateCandidate(
  dateStr: string,
  dataset: Dataset,
  rng: RngState,
): PuzzleFile | null {
  // Filter to usable stats: ≥ 5 eligible entries (available && !tied)
  const usableStats = Object.entries(dataset.stats).filter(
    ([, stat]) => _usableEntries(stat).length >= 5,
  );

  if (usableStats.length < 3) return null;

  // Pick 3 stats spanning ≥ 2 categories
  const statResult = _pickStats(usableStats, rng);
  if (statResult === null) return null;
  const [[primaryId, secondId, thirdId], rng2] = statResult;

  const primaryStat = dataset.stats[primaryId];
  const eligiblePrimary = _usableEntries(primaryStat);
  const bands = computeQuintileBands(eligiblePrimary);

  // All 5 bands must be non-empty for selection
  if (bands.some((b) => b.length === 0)) return null;

  // Build intersection of eligible country IDs across all 3 stats
  const eligible2 = new Set(_usableEntries(dataset.stats[secondId]).map((e) => e.id));
  const eligible3 = new Set(_usableEntries(dataset.stats[thirdId]).map((e) => e.id));

  const selected: DatasetEntry[] = [];
  const usedIds = new Set<string>();
  let rngCurrent = rng2;

  for (const band of bands) {
    const candidates = band.filter(
      (e) => eligible2.has(e.id) && eligible3.has(e.id) && !usedIds.has(e.id),
    );
    if (candidates.length === 0) return null;

    const [picked, nextRng] = pickRandom(candidates, rngCurrent);
    rngCurrent = nextRng;
    selected.push(picked);
    usedIds.add(picked.id);
  }

  if (selected.length !== 5) return null;

  const selectedIds = selected.map((e) => e.id);

  // Validate all constraints
  if (!_validateCandidate(selectedIds, [primaryId, secondId, thirdId], dataset)) {
    return null;
  }

  const countries: Country[] = selected.map((e) => ({
    id: e.id,
    name: e.name,
    flagCode: e.flagCode,
  }));

  const statDefs: StatDef[] = [primaryId, secondId, thirdId].map(
    (statId, index): StatDef => {
      const stat = dataset.stats[statId];
      const entriesById = new Map(stat.entries.map((e) => [e.id, e]));
      return {
        id: `stat_${index + 1}`,
        label: stat.label,
        category: stat.category,
        tooltip: stat.tooltip,
        direction: stat.direction,
        solution: deriveSolution(selectedIds, entriesById),
      };
    },
  );

  return { date: dateStr, countries, stats: statDefs };
}

/** Return entries eligible for puzzle selection */
function _usableEntries(stat: DatasetStat): DatasetEntry[] {
  return stat.entries.filter((e) => e.available && !e.tied);
}

/**
 * Pick 3 stats spanning ≥ 2 categories.
 * Shuffles the stat list then does a greedy search.
 * Returns [[id1, id2, id3], advancedRngState] or null.
 */
function _pickStats(
  usableStats: [string, DatasetStat][],
  rng: RngState,
): [[string, string, string], RngState] | null {
  const [shuffled, rng2] = shuffle(usableStats, rng);

  for (let i = 0; i < shuffled.length; i++) {
    const primary = shuffled[i];
    for (let j = 0; j < shuffled.length; j++) {
      if (j === i) continue;
      const second = shuffled[j];
      if (second[1].category === primary[1].category) continue;

      for (let k = 0; k < shuffled.length; k++) {
        if (k === i || k === j) continue;
        const third = shuffled[k];
        const cats = new Set([
          primary[1].category,
          second[1].category,
          third[1].category,
        ]);
        if (cats.size >= 2) {
          return [[primary[0], second[0], third[0]], rng2];
        }
      }
    }
  }
  return null;
}

/** Validate all 5 puzzle integrity constraints */
function _validateCandidate(
  selectedIds: string[],
  statIds: [string, string, string],
  dataset: Dataset,
): boolean {
  for (const statId of statIds) {
    const entriesById = new Map(
      dataset.stats[statId].entries.map((e) => [e.id, e]),
    );
    const ranks: number[] = [];
    for (const id of selectedIds) {
      const entry = entriesById.get(id);
      if (!entry || !entry.available) return false;
      if (entry.tied) return false;
      ranks.push(entry.rank);
    }
    if (new Set(ranks).size !== ranks.length) return false;
  }
  const cats = new Set(statIds.map((id) => dataset.stats[id].category));
  return cats.size >= 2;
}

/** Return a YYYY-MM-DD string offset by `days` from `dateStr` */
function _offsetDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
