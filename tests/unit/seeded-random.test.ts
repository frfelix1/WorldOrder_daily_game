import { describe, it, expect } from 'vitest';
import {
  createRng,
  nextFloat,
  pickRandom,
  shuffle,
  type RngState,
} from '../../src/lib/seeded-random';

describe('createRng', () => {
  it('returns a stable RngState for the same seed', () => {
    const a: RngState = createRng(42);
    const b: RngState = createRng(42);
    expect(a).toEqual(b);
  });

  it('returns different states for different seeds', () => {
    const a: RngState = createRng(1);
    const b: RngState = createRng(2);
    expect(a).not.toEqual(b);
  });
});

describe('nextFloat', () => {
  it('returns a value in [0, 1)', () => {
    let state = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const [value, next] = nextFloat(state);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      state = next;
    }
  });

  it('does not mutate the input state', () => {
    const state = createRng(42);
    const stateBefore = { ...state };
    nextFloat(state);
    expect(state).toEqual(stateBefore);
  });

  it('same seed produces same sequence', () => {
    let stateA = createRng(99);
    let stateB = createRng(99);
    for (let i = 0; i < 20; i++) {
      const [valA, nextA] = nextFloat(stateA);
      const [valB, nextB] = nextFloat(stateB);
      expect(valA).toBe(valB);
      stateA = nextA;
      stateB = nextB;
    }
  });

  it('different seeds produce different sequences', () => {
    let stateA = createRng(1);
    let stateB = createRng(2);
    const valsA: number[] = [];
    const valsB: number[] = [];
    for (let i = 0; i < 20; i++) {
      const [a, nextA] = nextFloat(stateA);
      const [b, nextB] = nextFloat(stateB);
      valsA.push(a);
      valsB.push(b);
      stateA = nextA;
      stateB = nextB;
    }
    expect(valsA).not.toEqual(valsB);
  });

  it('advances state on each call', () => {
    const state = createRng(42);
    const [val1, state2] = nextFloat(state);
    const [val2] = nextFloat(state2);
    expect(val1).not.toBe(val2);
  });
});

describe('pickRandom', () => {
  it('throws RangeError on empty array', () => {
    const state = createRng(42);
    expect(() => pickRandom([], state)).toThrow(RangeError);
  });

  it('always returns the only element from a single-element array', () => {
    const state = createRng(42);
    const [item] = pickRandom(['only'], state);
    expect(item).toBe('only');
  });

  it('returns an element that exists in the array', () => {
    let state = createRng(42);
    const arr = ['a', 'b', 'c', 'd', 'e'];
    for (let i = 0; i < 100; i++) {
      const [item, next] = pickRandom(arr, state);
      expect(arr).toContain(item);
      state = next;
    }
  });

  it('does not mutate the input array', () => {
    const state = createRng(42);
    const arr = [1, 2, 3];
    const copy = [...arr];
    pickRandom(arr, state);
    expect(arr).toEqual(copy);
  });

  it('returns advanced state', () => {
    const state = createRng(42);
    const arr = ['x', 'y', 'z'];
    const [, next] = pickRandom(arr, state);
    expect(next).not.toEqual(state);
  });

  it('produces approximately uniform distribution over 1000 samples', () => {
    let state = createRng(42);
    const arr = ['a', 'b', 'c', 'd'];
    const counts: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };
    const N = 1000;
    for (let i = 0; i < N; i++) {
      const [item, next] = pickRandom(arr, state);
      counts[item]++;
      state = next;
    }
    // Each item should appear roughly N/4 times (allow ±20%)
    const expected = N / arr.length;
    for (const key of arr) {
      expect(counts[key]).toBeGreaterThan(expected * 0.8);
      expect(counts[key]).toBeLessThan(expected * 1.2);
    }
  });
});

describe('shuffle', () => {
  it('returns array with same elements', () => {
    const state = createRng(42);
    const arr = [1, 2, 3, 4, 5];
    const [shuffled] = shuffle(arr, state);
    expect(shuffled.slice().sort()).toEqual(arr.slice().sort());
  });

  it('does not mutate the input array', () => {
    const state = createRng(42);
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    shuffle(arr, state);
    expect(arr).toEqual(copy);
  });

  it('returns a new array reference', () => {
    const state = createRng(42);
    const arr = [1, 2, 3];
    const [shuffled] = shuffle(arr, state);
    expect(shuffled).not.toBe(arr);
  });

  it('returns advanced state', () => {
    const state = createRng(42);
    const [, next] = shuffle([1, 2, 3], state);
    expect(next).not.toEqual(state);
  });

  it('same seed produces same shuffle', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    const [shuffledA] = shuffle(arr, createRng(7));
    const [shuffledB] = shuffle(arr, createRng(7));
    expect(shuffledA).toEqual(shuffledB);
  });

  it('different seeds produce different shuffles (probabilistically)', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const [shuffledA] = shuffle(arr, createRng(1));
    const [shuffledB] = shuffle(arr, createRng(2));
    // Extremely unlikely to be identical
    expect(shuffledA).not.toEqual(shuffledB);
  });

  it('handles single-element array', () => {
    const state = createRng(42);
    const [shuffled] = shuffle([99], state);
    expect(shuffled).toEqual([99]);
  });

  it('handles empty array', () => {
    const state = createRng(42);
    const [shuffled] = shuffle([], state);
    expect(shuffled).toEqual([]);
  });
});
