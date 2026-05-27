/**
 * Formatting utilities for stat values.
 *
 * All functions are pure: deterministic output, no side effects.
 * (Constitution Principle IV — Game Logic Purity)
 */

/**
 * Format a raw numeric stat value with its unit for display.
 *
 * Formatting rules:
 *  - Whole numbers: thousands-separated integer (0 decimal places)
 *  - Fractions where value < 10: up to 3 decimal places (covers HDI 0–1 range)
 *  - Fractions where value ≥ 10: 1 decimal place with thousands separator
 *
 * @param value - Raw numeric value (may be 0, integer, or float)
 * @param unit  - Unit string from DatasetStat.unit (e.g. "km²", "million USD")
 * @returns Formatted string like "449,964 km²" or "0.930 index (0–1)"
 */
export function formatStatValue(value: number, unit: string): string {
  let formatted: string;

  if (Number.isInteger(value)) {
    formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(value);
  } else if (Math.abs(value) < 10) {
    formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 3,
      minimumFractionDigits: 3,
    }).format(value);
  } else {
    formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(value);
  }

  return `${formatted} ${unit}`;
}
