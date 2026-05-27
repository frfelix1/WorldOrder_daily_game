/**
 * Seeded deterministic PRNG using Mulberry32.
 *
 * All functions are pure: they accept a RngState value and return a new
 * RngState alongside their result — no global state, no mutation.
 *
 * Seed formula used by puzzle-generator.ts:
 *   seed = BASE_SEED + getPuzzleNumberForDate(dateStr) + attemptIndex
 */

/** Opaque PRNG state. Thread this through all calls to advance the sequence. */
export interface RngState {
  readonly seed: number;
}

/**
 * Create a new PRNG state from an integer seed.
 * The same seed always produces the same sequence.
 */
export function createRng(seed: number): RngState {
  return { seed: seed >>> 0 };
}

/**
 * Mulberry32 step: return a float in [0, 1) and the advanced state.
 * Pure — does not mutate the input state.
 */
export function nextFloat(state: RngState): [value: number, next: RngState] {
  let t = (state.seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  t = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  const next: RngState = { seed: ((state.seed + 0x6d2b79f5) >>> 0) };
  return [t, next];
}

/**
 * Pick a uniformly random element from a non-empty array.
 * Returns the chosen element and the advanced state.
 * Throws RangeError if the array is empty.
 */
export function pickRandom<T>(
  arr: readonly T[],
  state: RngState,
): [item: T, next: RngState] {
  if (arr.length === 0) {
    throw new RangeError('pickRandom: array must not be empty');
  }
  const [f, next] = nextFloat(state);
  const index = Math.floor(f * arr.length);
  return [arr[index], next];
}

/**
 * Fisher-Yates shuffle. Returns a new shuffled copy and the advanced state.
 * Does not mutate the input array.
 */
export function shuffle<T>(
  arr: readonly T[],
  state: RngState,
): [shuffled: T[], next: RngState] {
  const result = [...arr];
  let current = state;
  for (let i = result.length - 1; i > 0; i--) {
    const [f, next] = nextFloat(current);
    const j = Math.floor(f * (i + 1));
    current = next;
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return [result, current];
}
