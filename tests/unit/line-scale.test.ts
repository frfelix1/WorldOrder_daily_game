import { describe, it, expect } from 'vitest';
import {
  clamp01,
  valueAtFraction,
  fractionForValue,
  deriveOrder,
  trueFractions,
  placementAccuracy,
} from '../../src/lib/line-scale';

describe('clamp01', () => {
  it('returns the value unchanged when within [0, 1]', () => {
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1)).toBe(1);
  });

  it('clamps values below 0 up to 0', () => {
    expect(clamp01(-0.3)).toBe(0);
    expect(clamp01(-1000)).toBe(0);
  });

  it('clamps values above 1 down to 1', () => {
    expect(clamp01(1.4)).toBe(1);
    expect(clamp01(999)).toBe(1);
  });
});

describe('valueAtFraction', () => {
  it('returns min at fraction 0 (far left)', () => {
    expect(valueAtFraction(0, 100, 900)).toBe(100);
  });

  it('returns max at fraction 1 (far right)', () => {
    expect(valueAtFraction(1, 100, 900)).toBe(900);
  });

  it('returns the linear midpoint at fraction 0.5', () => {
    expect(valueAtFraction(0.5, 100, 900)).toBe(500);
  });

  it('interpolates linearly at an arbitrary fraction', () => {
    expect(valueAtFraction(0.25, 0, 1000)).toBe(250);
  });

  it('clamps the fraction into [0, 1] before interpolating', () => {
    expect(valueAtFraction(-1, 100, 900)).toBe(100);
    expect(valueAtFraction(2, 100, 900)).toBe(900);
  });

  it('returns min when max === min (degenerate scale, no divide-by-zero)', () => {
    expect(valueAtFraction(0.5, 400, 400)).toBe(400);
  });
});

describe('fractionForValue', () => {
  it('maps min → 0', () => {
    expect(fractionForValue(100, 100, 900)).toBe(0);
  });

  it('maps max → 1', () => {
    expect(fractionForValue(900, 100, 900)).toBe(1);
  });

  it('maps the midpoint value → 0.5', () => {
    expect(fractionForValue(500, 100, 900)).toBe(0.5);
  });

  it('clamps out-of-range values into [0, 1]', () => {
    expect(fractionForValue(50, 100, 900)).toBe(0);
    expect(fractionForValue(1000, 100, 900)).toBe(1);
  });

  it('returns 0 when max === min (degenerate scale, no divide-by-zero)', () => {
    expect(fractionForValue(400, 400, 400)).toBe(0);
  });
});

describe('deriveOrder', () => {
  it('orders country IDs ascending by fraction (left → right)', () => {
    const positions = { USA: 0.9, JPN: 0.1, BRA: 0.5 };
    expect(deriveOrder(positions)).toEqual(['JPN', 'BRA', 'USA']);
  });

  it('breaks ties deterministically by country ID (ascending)', () => {
    const positions = { USA: 0.5, BRA: 0.5, JPN: 0.5 };
    expect(deriveOrder(positions)).toEqual(['BRA', 'JPN', 'USA']);
  });

  it('is deterministic regardless of key insertion order', () => {
    const a = deriveOrder({ CHN: 0.2, IND: 0.2, RUS: 0.8 });
    const b = deriveOrder({ RUS: 0.8, IND: 0.2, CHN: 0.2 });
    expect(a).toEqual(b);
    expect(a).toEqual(['CHN', 'IND', 'RUS']);
  });

  it('handles a single placed country', () => {
    expect(deriveOrder({ USA: 0.42 })).toEqual(['USA']);
  });

  it('returns an empty array when nothing is placed', () => {
    expect(deriveOrder({})).toEqual([]);
  });
});

describe('trueFractions', () => {
  it('maps each country value onto its fraction against the five-country min/max', () => {
    const values = { A: 0, B: 250, C: 500, D: 750, E: 1000 };
    expect(trueFractions(values)).toEqual({ A: 0, B: 0.25, C: 0.5, D: 0.75, E: 1 });
  });

  it('returns 0 for all countries when all values are equal (degenerate)', () => {
    const values = { A: 5, B: 5, C: 5 };
    expect(trueFractions(values)).toEqual({ A: 0, B: 0, C: 0 });
  });
});

describe('placementAccuracy', () => {
  it('returns 1 when every placement is exactly at its true fraction', () => {
    const values = { A: 0, B: 500, C: 1000 };
    const positions = { A: 0, B: 0.5, C: 1 };
    expect(placementAccuracy(positions, values)).toBe(1);
  });

  it('returns less than 1 when placements are off', () => {
    const values = { A: 0, B: 500, C: 1000 }; // true fractions 0, 0.5, 1
    const positions = { A: 0, B: 0.5, C: 0 }; // C off by 1
    // mean abs error = (0 + 0 + 1) / 3 = 0.3333 → A = 0.6667
    expect(placementAccuracy(positions, values)).toBeCloseTo(2 / 3, 5);
  });

  it('returns 0 for maximally-wrong placements', () => {
    const values = { A: 0, B: 1000 }; // true fractions 0, 1
    const positions = { A: 1, B: 0 }; // each off by 1
    expect(placementAccuracy(positions, values)).toBe(0);
  });

  it('is symmetric in the direction of error (absolute error)', () => {
    const values = { A: 0, B: 1000 };
    const over = placementAccuracy({ A: 0.2, B: 1 }, values);
    const under = placementAccuracy({ A: 0, B: 0.8 }, values);
    expect(over).toBeCloseTo(under, 5);
  });

  it('returns 1 when max === min (degenerate scale — any placement is "on value")', () => {
    const values = { A: 7, B: 7, C: 7 };
    const positions = { A: 0.1, B: 0.9, C: 0.5 };
    expect(placementAccuracy(positions, values)).toBe(1);
  });

  it('is bounded within [0, 1]', () => {
    const values = { A: 0, B: 500, C: 1000 };
    const positions = { A: 0.7, B: 0.1, C: 0.4 };
    const acc = placementAccuracy(positions, values);
    expect(acc).toBeGreaterThanOrEqual(0);
    expect(acc).toBeLessThanOrEqual(1);
  });
});
