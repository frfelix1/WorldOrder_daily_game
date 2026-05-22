# Quickstart: Rankle Development Setup

**Branch**: `001-rankle-daily-game`

## Prerequisites

- Node.js 20+ (LTS)
- npm 10+ (or pnpm/yarn — npm used in all examples below)

---

## 1. Create the Next.js Project

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-import-alias
```

Accept defaults. This creates the `app/` router, TypeScript, and Tailwind in one step.

> **Constitution gate (Principle I)**: Verify `tsconfig.json` includes `"strict": true` (create-next-app sets this by default). If absent, add it manually. Never downgrade. Add `@ts-ignore` only with an inline comment explaining the exceptional case.

---

## 2. Install Dependencies

```bash
# Drag-to-reorder
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Country flags
npm install flag-icons
```

---

## 3. Set Up Flag Assets

Add a `postinstall` script to copy SVG flag assets to `public/`:

```json
// package.json
{
  "scripts": {
    "postinstall": "cp -r node_modules/flag-icons/flags/4x3 public/flags"
  }
}
```

Then run:

```bash
npm install   # triggers postinstall
```

Flags are now available at `/flags/{code}.svg` (e.g. `/flags/br.svg`).

Import the CSS in `src/app/globals.css`:

```css
@import 'flag-icons/css/flag-icons.min.css';
```

---

## 4. Create the Puzzle Data Directory

```bash
mkdir -p data/puzzles
```

Create a sample puzzle for today:

```bash
# Get today's date
TODAY=$(date -u +%Y-%m-%d)

cat > data/puzzles/$TODAY.json << 'EOF'
{
  "date": "REPLACE_WITH_DATE",
  "countries": [
    { "id": "BRA", "name": "Brazil",    "flagCode": "br" },
    { "id": "DEU", "name": "Germany",   "flagCode": "de" },
    { "id": "NGA", "name": "Nigeria",   "flagCode": "ng" },
    { "id": "JPN", "name": "Japan",     "flagCode": "jp" },
    { "id": "AUS", "name": "Australia", "flagCode": "au" }
  ],
  "stats": [
    {
      "id": "stat_1",
      "label": "Population",
      "category": "demographics",
      "tooltip": "Total resident population as of the most recent census estimate.",
      "direction": "desc",
      "solution": ["NGA", "BRA", "DEU", "JPN", "AUS"]
    },
    {
      "id": "stat_2",
      "label": "Land Area",
      "category": "geography",
      "tooltip": "Total land area in square kilometres, excluding inland water.",
      "direction": "desc",
      "solution": ["AUS", "BRA", "DEU", "NGA", "JPN"]
    },
    {
      "id": "stat_3",
      "label": "Urban Population %",
      "category": "demographics",
      "tooltip": "Percentage of the population living in urban areas.",
      "direction": "desc",
      "solution": ["AUS", "JPN", "DEU", "BRA", "NGA"]
    }
  ]
}
EOF
```

Update `"date"` in the file to match `$TODAY`.

---

## 5. Create the Puzzle API Route

Create `src/app/api/puzzle/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'invalid_date', message: 'date parameter must be in YYYY-MM-DD format' },
      { status: 400 }
    );
  }

  try {
    const filePath = join(process.cwd(), 'data', 'puzzles', `${date}.json`);
    const raw = readFileSync(filePath, 'utf-8');
    const puzzle = JSON.parse(raw);
    return NextResponse.json(puzzle, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'not_found', message: `No puzzle available for ${date}` },
      { status: 404 }
    );
  }
}
```

---

## 6. Set Up Testing

```bash
# Vitest + React Testing Library
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom

# Playwright (E2E)
npm install -D @playwright/test
npx playwright install chromium
```

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

> **Constitution gate (Principle II)**: `npm test` runs with `--coverage`. Vitest will fail the run if global coverage across `src/` drops below 80%. Configure the threshold in `vitest.config.ts` (see below).

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      thresholds: {
        global: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  },
});
```

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

---

## 7. Run the Dev Server

```bash
npm run dev
```

Visit `http://localhost:3000` — game shell loads.
Test puzzle API: `http://localhost:3000/api/puzzle?date=2026-05-22`

---

## 8. Verify the Setup

```bash
# Confirm flags are in place
ls public/flags/ | head -5   # should list e.g. ad.svg, ae.svg ...

# Confirm API responds
curl "http://localhost:3000/api/puzzle?date=$(date -u +%Y-%m-%d)" | head -c 200

# Run unit tests (once tests exist)
npm test
```

---

## Key File Locations

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Game shell (client component) |
| `src/app/api/puzzle/route.ts` | Puzzle API route |
| `src/lib/game-state.ts` | localStorage read/write |
| `src/lib/scoring.ts` | Exponential scoring engine |
| `src/lib/puzzle.ts` | Puzzle number from UTC epoch |
| `src/types/index.ts` | Shared TypeScript interfaces |
| `data/puzzles/YYYY-MM-DD.json` | Daily puzzle content files |
| `public/flags/` | Self-hosted SVG flag assets |
| `specs/001-rankle-daily-game/` | Spec, plan, data model, contracts |
