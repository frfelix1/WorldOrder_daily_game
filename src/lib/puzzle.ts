// Epoch used to derive puzzle numbers — fixed reference date
const EPOCH_MS = new Date('2026-01-01T00:00:00Z').getTime();
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns an integer puzzle number based on the number of UTC days elapsed
 * since the fixed epoch date.
 */
export function getPuzzleNumber(): number {
  const nowMs = Date.now();
  const todayUtcMs = Math.floor(nowMs / MS_PER_DAY) * MS_PER_DAY;
  const epochUtcMs = Math.floor(EPOCH_MS / MS_PER_DAY) * MS_PER_DAY;
  return Math.floor((todayUtcMs - epochUtcMs) / MS_PER_DAY);
}

/**
 * Returns the puzzle number for an arbitrary YYYY-MM-DD date string.
 * Useful for dev/test tooling that needs to load a specific day's puzzle.
 */
export function getPuzzleNumberForDate(dateStr: string): number {
  const targetMs = new Date(`${dateStr}T00:00:00Z`).getTime();
  const targetUtcMs = Math.floor(targetMs / MS_PER_DAY) * MS_PER_DAY;
  const epochUtcMs = Math.floor(EPOCH_MS / MS_PER_DAY) * MS_PER_DAY;
  return Math.floor((targetUtcMs - epochUtcMs) / MS_PER_DAY);
}

/**
 * Returns the current UTC date as a string in YYYY-MM-DD format.
 */
export function getUTCDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
