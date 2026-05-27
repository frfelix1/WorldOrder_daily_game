import { describe, it, expect } from 'vitest';

// Integration tests for GET /api/puzzles
// Requires a running server (skip unless RUN_INTEGRATION=true).

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
const RUN_INTEGRATION = process.env.RUN_INTEGRATION === 'true';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EPOCH = '2026-01-01';

describe.skipIf(!RUN_INTEGRATION)('GET /api/puzzles', () => {
  it('returns HTTP 200', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzles`);
    expect(res.status).toBe(200);
  });

  it('returns a JSON array of strings', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzles`);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    for (const item of body) {
      expect(typeof item).toBe('string');
    }
  });

  it('first element is the epoch date "2026-01-01"', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzles`);
    const body: string[] = await res.json();
    expect(body[0]).toBe(EPOCH);
  });

  it('last element is today\'s UTC date', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`${BASE_URL}/api/puzzles`);
    const body: string[] = await res.json();
    expect(body[body.length - 1]).toBe(today);
  });

  it('array is sorted in ascending chronological order', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzles`);
    const body: string[] = await res.json();
    for (let i = 1; i < body.length; i++) {
      expect(body[i] > body[i - 1]).toBe(true);
    }
  });

  it('contains no duplicate dates', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzles`);
    const body: string[] = await res.json();
    expect(new Set(body).size).toBe(body.length);
  });

  it('all entries match YYYY-MM-DD format', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzles`);
    const body: string[] = await res.json();
    for (const date of body) {
      expect(date).toMatch(DATE_REGEX);
    }
  });
});
