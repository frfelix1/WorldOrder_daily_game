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
});
