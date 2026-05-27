import { describe, it, expect } from 'vitest';

// API contract tests for GET /api/puzzle
// These run against the Next.js dev server, so they use fetch()
// against the base URL configured in the test environment.
// Skip when the dev server is not running (e.g., in unit test mode).

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
const RUN_INTEGRATION = process.env.RUN_INTEGRATION === 'true';

describe.skipIf(!RUN_INTEGRATION)('GET /api/puzzle', () => {
  it('returns 200 with valid puzzle for a known date', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzle?date=2026-05-22`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('date', '2026-05-22');
    expect(Array.isArray(body.countries)).toBe(true);
    expect(body.countries).toHaveLength(5);
    expect(Array.isArray(body.stats)).toBe(true);
    expect(body.stats).toHaveLength(3);
  });

  it('includes Cache-Control header with s-maxage=86400', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzle?date=2026-05-22`);
    const cacheControl = res.headers.get('cache-control') ?? '';
    expect(cacheControl).toContain('s-maxage=86400');
  });

  it('returns 400 with error "invalid_date" when date param is missing', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzle`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'invalid_date');
  });

  it('returns 400 with error "invalid_date" for malformed date', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzle?date=not-a-date`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'invalid_date');
  });

  it('returns 404 with error "not_found" for non-existent date', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzle?date=9999-12-31`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'not_found');
  });

  // Generation-specific assertions: verify puzzles are served for dates
  // beyond any pre-generated files (dynamic generation must be working).
  it('returns 200 for a future date with no pre-generated file (2027-06-01)', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzle?date=2027-06-01`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('date', '2027-06-01');
    expect(body.countries).toHaveLength(5);
    expect(body.stats).toHaveLength(3);
  });

  it('Cache-Control header is set on generated puzzle response', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzle?date=2027-06-01`);
    const cacheControl = res.headers.get('cache-control') ?? '';
    expect(cacheControl).toContain('max-age=86400');
    expect(cacheControl).toContain('s-maxage=86400');
  });

  it('two requests for the same date return identical puzzle content', async () => {
    const [res1, res2] = await Promise.all([
      fetch(`${BASE_URL}/api/puzzle?date=2027-06-15`),
      fetch(`${BASE_URL}/api/puzzle?date=2027-06-15`),
    ]);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    const [body1, body2] = await Promise.all([res1.json(), res2.json()]);
    expect(body1.countries.map((c: { id: string }) => c.id).sort()).toEqual(
      body2.countries.map((c: { id: string }) => c.id).sort(),
    );
    for (let i = 0; i < 3; i++) {
      expect(body1.stats[i].solution).toEqual(body2.stats[i].solution);
    }
  });

  // ── StatDef unit + values fields (feature 007-reveal-correct-values) ────────

  it('each stat in the response includes a non-empty unit string', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzle?date=2026-05-22`);
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const stat of body.stats) {
      expect(typeof stat.unit).toBe('string');
      expect(stat.unit.length).toBeGreaterThan(0);
    }
  });

  it('each stat in the response includes a values object with exactly 5 country-ID keys', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzle?date=2026-05-22`);
    expect(res.status).toBe(200);
    const body = await res.json();
    const countryIds: string[] = body.countries.map((c: { id: string }) => c.id).sort();
    for (const stat of body.stats) {
      expect(typeof stat.values).toBe('object');
      expect(stat.values).not.toBeNull();
      const valueKeys = Object.keys(stat.values).sort();
      expect(valueKeys).toHaveLength(5);
      expect(valueKeys).toEqual(countryIds);
    }
  });

  it('all values in stat.values are finite numbers', async () => {
    const res = await fetch(`${BASE_URL}/api/puzzle?date=2026-05-22`);
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const stat of body.stats) {
      for (const val of Object.values(stat.values)) {
        expect(typeof val).toBe('number');
        expect(isFinite(val as number)).toBe(true);
      }
    }
  });
});

