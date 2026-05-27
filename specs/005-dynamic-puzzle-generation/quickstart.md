# Quickstart: Dynamic Puzzle Generation

**Feature**: 005-dynamic-puzzle-generation
**Branch**: `005-dynamic-puzzle-generation`

---

## What This Feature Does

Replaces static pre-generated puzzle JSON files with a runtime puzzle generation function. After this change, the game generates each day's puzzle on demand — no manual file creation or deployment steps are needed for new dates.

---

## Prerequisites

- Node.js ≥ 18
- `npm install` run at project root
- `data/dataset.json` present (already committed to repo; do not delete it)

---

## Running the App Locally

```bash
npm run dev
```

The game opens at `http://localhost:3000`. The puzzle for today's UTC date is generated automatically on the first request to `/api/puzzle`.

---

## Testing the Puzzle API

**Get today's puzzle:**
```bash
curl "http://localhost:3000/api/puzzle?date=$(date -u +%Y-%m-%d)"
```

**Get a specific date's puzzle:**
```bash
curl "http://localhost:3000/api/puzzle?date=2026-07-04"
```

**Verify determinism** (run twice, results must be identical):
```bash
curl -s "http://localhost:3000/api/puzzle?date=2026-08-01" | sha256sum
curl -s "http://localhost:3000/api/puzzle?date=2026-08-01" | sha256sum
```

**List all available puzzle dates:**
```bash
curl "http://localhost:3000/api/puzzles"
```

---

## Running Tests

**All unit tests** (must pass before any implementation work):
```bash
npm test
```

**Unit tests only, watch mode:**
```bash
npm run test:watch
```

**E2E tests** (starts dev server automatically):
```bash
npm run test:e2e
```

**Coverage report** (must be ≥ 80% globally):
```bash
npm test -- --reporter=verbose
```

---

## Key Files

| Path | Role |
|------|------|
| `src/lib/seeded-random.ts` | New: deterministic PRNG (Mulberry32) |
| `src/lib/puzzle-generator.ts` | New: pure `generatePuzzle(dateStr, dataset)` function |
| `src/app/api/puzzle/route.ts` | Modified: calls generator instead of reading files |
| `src/app/api/puzzles/route.ts` | Modified: returns computed date range instead of directory listing |
| `src/types/index.ts` | Modified: add `Dataset`, `DatasetStat`, `DatasetEntry` types |
| `data/dataset.json` | Unchanged: the authoritative country/stat data source |
| `tests/unit/seeded-random.test.ts` | New: unit tests for PRNG |
| `tests/unit/puzzle-generator.test.ts` | New: unit tests for generation algorithm |
| `tests/integration/api/puzzle.test.ts` | Modified: add generation-specific assertions |

---

## Development Flow (Test-First)

Per the project constitution, tests must be written and confirmed failing before implementation.

**Order of work:**

1. Add new TypeScript types (`Dataset`, `DatasetStat`, `DatasetEntry`) to `src/types/index.ts`
2. Write `tests/unit/seeded-random.test.ts` — confirm it fails (`npm test`)
3. Implement `src/lib/seeded-random.ts` — confirm tests pass
4. Write `tests/unit/puzzle-generator.test.ts` — confirm it fails
5. Implement `src/lib/puzzle-generator.ts` — confirm tests pass
6. Update `tests/integration/api/puzzle.test.ts` with generation assertions — confirm failure
7. Update `src/app/api/puzzle/route.ts` — confirm integration tests pass
8. Update `src/app/api/puzzles/route.ts`
9. Remove `data/puzzles/*.json` files
10. Run full test suite (`npm test && npm run test:e2e`) — all must pass

---

## Deploying to Vercel

No special configuration is required. The `data/dataset.json` file is committed to the repository and deployed automatically.

```bash
# Standard Vercel deploy (from project root)
vercel deploy
# or push to the connected branch for automatic deployment
git push origin 005-dynamic-puzzle-generation
```

**Verify on Vercel:**
```bash
curl "https://your-vercel-url.vercel.app/api/puzzle?date=$(date -u +%Y-%m-%d)"
```

---

## Troubleshooting

**`data/dataset.json` not found on Vercel:**
- Ensure `data/dataset.json` is committed and not in `.vercelignore` or `.gitignore`
- The file must be at the project root (sibling of `src/` and `package.json`)

**Generation returns null (404):**
- Extremely rare; means the algorithm exhausted all 20 attempts
- Check `data/dataset.json` integrity: it must have `countryCount ≥ 30` and `statCount ≥ 14`
- If a specific future date always fails, the dataset may need refreshing

**Puzzle changes between requests in development:**
- This should not happen. If it does, verify the seeded PRNG is pure and not using `Math.random()`
- Run the determinism check above twice and compare SHA256 hashes

**Tests fail with "cannot find module `src/lib/seeded-random`":**
- The test was written before the implementation (expected). Implement the module and re-run.
