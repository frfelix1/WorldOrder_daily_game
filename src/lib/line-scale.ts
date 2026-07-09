/**
 * Line-scale placement pure logic (feature 010).
 *
 * All functions are pure: deterministic output, no side effects
 * (Constitution Principle IV — Game Logic Purity).
 *
 * Model: each country token sits on a horizontal value line at a fraction
 * `t ∈ [0, 1]`, where 0 = far left (smallest value of the five puzzle countries)
 * and 1 = far right (largest). Values interpolate linearly between the endpoints.
 */

/** Clamp a number into the closed interval [0, 1]. */
export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * The stat value at a given fraction along the line.
 *
 * @param t   - Fraction along the line; clamped into [0, 1].
 * @param min - Value at the far-left endpoint (smallest of the five).
 * @param max - Value at the far-right endpoint (largest of the five).
 * @returns   - `min + t*(max - min)`. Returns `min` when `max === min`.
 */
export function valueAtFraction(t: number, min: number, max: number): number {
  if (max === min) return min;
  return min + clamp01(t) * (max - min);
}

/**
 * The fraction along the line corresponding to a stat value.
 *
 * @param value - Raw stat value.
 * @param min   - Value at the far-left endpoint.
 * @param max   - Value at the far-right endpoint.
 * @returns     - `(value - min) / (max - min)`, clamped into [0, 1].
 *                Returns 0 when `max === min` (degenerate scale, no divide-by-zero).
 */
export function fractionForValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp01((value - min) / (max - min));
}

/**
 * Derive the left-to-right order of placed countries.
 *
 * Sorts country IDs ascending by their fraction. Ties (equal or effectively
 * equal fractions) are broken deterministically by country ID (ascending),
 * preserving reproducibility (Constitution IV).
 *
 * @param positions - Map of country ID → fraction t ∈ [0, 1].
 * @returns         - Country IDs ordered left (smallest fraction) → right.
 */
export function deriveOrder(positions: Record<string, number>): string[] {
  return Object.keys(positions).sort((a, b) => {
    const diff = positions[a] - positions[b];
    if (diff !== 0) return diff;
    // Deterministic tie-break by country ID.
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

/**
 * Map each country's raw value onto its "true" fraction along the line,
 * using the min/max of the supplied value set as the endpoints.
 *
 * @param values - Map of country ID → raw stat value (the five puzzle countries).
 * @returns      - Map of country ID → true fraction t* ∈ [0, 1].
 */
export function trueFractions(values: Record<string, number>): Record<string, number> {
  const nums = Object.values(values);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const result: Record<string, number> = {};
  for (const id of Object.keys(values)) {
    result[id] = fractionForValue(values[id], min, max);
  }
  return result;
}

/**
 * Placement accuracy of a set of token positions against the true positions.
 *
 * Computes `A = 1 - mean(|tᵢ - tᵢ*|)` over the countries present in `values`,
 * where `tᵢ*` is each country's true fraction. Result is bounded in [0, 1]
 * (1 = perfect placement). When `max === min` (all values identical), any
 * placement is considered "on value" and accuracy is 1.
 *
 * Countries missing from `positions` are treated as fraction 0 (unplaced),
 * which only occurs transiently before submission; scoring uses the final
 * (fully placed) guess.
 *
 * @param positions - Map of country ID → placed fraction t ∈ [0, 1].
 * @param values    - Map of country ID → raw stat value (defines true fractions).
 * @returns         - Accuracy A ∈ [0, 1].
 */
export function placementAccuracy(
  positions: Record<string, number>,
  values: Record<string, number>,
): number {
  const ids = Object.keys(values);
  if (ids.length === 0) return 1;

  const nums = Object.values(values);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (max === min) return 1;

  const truths = trueFractions(values);
  let errorSum = 0;
  for (const id of ids) {
    const placed = clamp01(positions[id] ?? 0);
    errorSum += Math.abs(placed - truths[id]);
  }
  const meanError = errorSum / ids.length;
  return clamp01(1 - meanError);
}
