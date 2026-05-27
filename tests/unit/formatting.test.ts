import { describe, it, expect } from 'vitest';
import { formatStatValue } from '../../src/lib/formatting';

describe('formatStatValue', () => {
  // ── Integer values ──────────────────────────────────────────────────────────

  it('formats a large integer with thousands separators', () => {
    expect(formatStatValue(449964, 'km²')).toBe('449,964 km²');
  });

  it('formats a very large integer with thousands separators', () => {
    expect(formatStatValue(9596960, 'km²')).toBe('9,596,960 km²');
  });

  it('formats a small integer without separators', () => {
    expect(formatStatValue(83, 'years')).toBe('83 years');
  });

  it('formats a medium integer (3 digits) with no separator needed', () => {
    expect(formatStatValue(193, 'visa-free destinations')).toBe('193 visa-free destinations');
  });

  // ── Float values < 10 (HDI-style) ───────────────────────────────────────────

  it('formats an HDI-style float with up to 3 decimal places', () => {
    expect(formatStatValue(0.93, 'index (0–1)')).toBe('0.930 index (0–1)');
  });

  it('formats a small float (< 10) with 3 decimal places', () => {
    expect(formatStatValue(2.4, 'tonnes/person/year')).toBe('2.400 tonnes/person/year');
  });

  it('formats a float exactly at 1.0 — treated as integer since Number.isInteger(1.0) is true in JS', () => {
    // In JavaScript 1.0 === 1, so it formats as a whole number
    expect(formatStatValue(1.0, 'index (0–1)')).toBe('1 index (0–1)');
  });

  // ── Float values ≥ 10 ───────────────────────────────────────────────────────

  it('formats a float ≥ 10 with 1 decimal place', () => {
    expect(formatStatValue(20.6, '%')).toBe('20.6 %');
  });

  it('formats a large float with thousands separators and 1 decimal place', () => {
    expect(formatStatValue(25462.7, 'million USD')).toBe('25,462.7 million USD');
  });

  it('formats a float just above 10 with 1 decimal place', () => {
    expect(formatStatValue(12.2, 'litres/person/year')).toBe('12.2 litres/person/year');
  });

  it('formats a float with Mbit/s unit', () => {
    expect(formatStatValue(124.5, 'Mbit/s')).toBe('124.5 Mbit/s');
  });

  // ── Zero value ───────────────────────────────────────────────────────────────

  it('formats zero as "0 <unit>" not blank or undefined', () => {
    expect(formatStatValue(0, 'km²')).toBe('0 km²');
  });

  it('formats zero with any unit', () => {
    expect(formatStatValue(0, 'total medals')).toBe('0 total medals');
  });

  // ── All 17 stat unit strings round-trip ─────────────────────────────────────

  it.each([
    [449964,   'km²'],
    [7823,     'km'],
    [8848,     'm'],
    [25148,    'km'],
    [10099265, 'people'],
    [0.961,    'index (0–1)'],
    [543900,   'million USD'],
    [69287,    'USD'],
    [83,       'years'],
    [20.6,     '%'],
    [2500,     'mm/year'],
    [2.4,      'tonnes/person/year'],
    [68.5,     '%'],
    [12.2,     'litres/person/year'],
    [124.5,    'Mbit/s'],
    [2472,     'total medals'],
    [193,      'visa-free destinations'],
  ] as [number, string][])('formats value %s with unit "%s" as a non-empty string', (value, unit) => {
    const result = formatStatValue(value, unit);
    expect(result).toBeTruthy();
    expect(result.endsWith(unit)).toBe(true);
  });

  // ── Output invariants ────────────────────────────────────────────────────────

  it('always appends a space before the unit', () => {
    const result = formatStatValue(100, 'km²');
    expect(result).toMatch(/ km²$/);
  });

  it('returns a string type', () => {
    expect(typeof formatStatValue(42, 'units')).toBe('string');
  });
});
