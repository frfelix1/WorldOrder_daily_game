# Research: WorldOrder — Daily Geography Ranking Game

**Date**: 2026-05-22 | **Branch**: `001-worldorder-daily-game`

## 1. Web Framework

**Decision**: Next.js 14+ (App Router)

**Rationale**:
- API routes are colocated — a single `app/api/puzzle/route.ts` handles puzzle delivery without a separate deployment or service
- React ecosystem gives access to the best drag-and-drop libraries (dnd-kit); SvelteKit has no equivalent
- The game shell is fully static (`'use client'` + localStorage); Next.js serves it from CDN edge with no SSR overhead
- Deployment is a single `git push` to Vercel or Netlify with zero config for edge-cached API routes

**Alternatives considered**:
- *React + Vite*: Best if a separate API already existed; rejected because it forces a second deployment for puzzle serving
- *SvelteKit*: Competitive on bundle size (~30kb vs ~130kb runtime) and DX, but rejected due to thinner drag-and-drop ecosystem

---

## 2. Drag-to-Reorder Library

**Decision**: `@dnd-kit/core` + `@dnd-kit/sortable`

**Rationale**:
- `SortableContext` + `useSortable` maps directly to a vertical ranked list of N items
- `PointerSensor` handles mouse and touch natively; `KeyboardSensor` provides accessible reordering
- Actively maintained with React 19 support; first-class TypeScript types
- `arrayMove` utility makes reorder logic a one-liner
- Modular — only the sortable preset is shipped

**Alternatives considered**:
- *react-beautiful-dnd*: Abandoned by Atlassian ~2022; broken on mobile; React 18+ issues — eliminated
- *@hello-pangea/dnd*: Community fork of rbd, works but inherits aging architecture — viable fallback only
- *pragmatic-drag-and-drop*: Very performant but intentionally low-level (DIY animations, accessibility); overkill for 5 cards

**Implementation note**: Configure `activationConstraint: { distance: 8 }` on `PointerSensor` to distinguish tap from drag on touch devices.

---

## 3. Country Flag Display

**Decision**: `flag-icons` CSS library — self-hosted SVG assets

**Rationale**:
- SVG quality renders correctly on all browsers including Windows (emoji flags render as letter codes on Windows — dealbreaker)
- Self-hosted from `public/flags/` — zero runtime CDN dependency
- Simple markup: `<span class="fi fi-{code}"></span>` with ISO 3166-1 alpha-2 codes
- Only the 5 flags shown per puzzle are loaded; per-flag size is 1–10 KB with HTTP/2 parallelism

**Alternatives considered**:
- *Unicode flag emoji*: Zero dependencies but broken on Windows (renders two-letter codes, not images) — eliminated for a geography game
- *flagcdn.com CDN*: Simplest URL pattern (`img src="https://flagcdn.com/w80/gb.png"`) but external runtime dependency — eliminated per spec constraint
- *country-flag-icons npm*: SVG React components, viable but bundling 200 SVGs into JS is less efficient than static assets

**Build step required**: Copy `node_modules/flag-icons/flags/4x3/` to `public/flags/` as part of `postinstall` or build script.

**Edge cases**: Kosovo uses non-standard code `xk`; subdivision flags (England, Scotland, Wales) require flag-icons v7+.

---

## 4. Game State Persistence (localStorage)

**Decision**: Puzzle-number keyed state, integer offset from UTC epoch

**Rationale**:
- Puzzle number is an integer derived from a fixed epoch: `Math.floor((Date.now() - EPOCH_MS) / 86_400_000)`
- Day-change detection is a single integer comparison (`storedPuzzleNumber !== currentPuzzleNumber`) — no string parsing, no timezone edge cases
- Stale state is silently discarded on load, producing a fresh game — no explicit expiry/cleanup logic required
- Pattern validated by open-source Wordle clones (MikhaD/wordle uses identical approach)

**localStorage key**: `worldorder_state` — single object storing `puzzleNumber`, `status`, `guesses`, `runningScore`; lifetime stats in separate key `worldorder_stats`.

**State shape** (see data-model.md for full TypeScript types):

```json
{
  "puzzleNumber": 42,
  "dateUTC": "2026-05-22",
  "status": "in_progress",
  "activeStatIndex": 0,
  "stats": [
    {
      "solved": false,
      "guesses": [
        { "order": ["BRA","DEU","NGA","JPN","AUS"], "bulls": [false,true,false,true,false] }
      ]
    }
  ],
  "runningScore": 44
}
```

---

## 5. Puzzle API Design

**Decision**: `GET /api/puzzle?date=YYYY-MM-DD` — client-side answer validation

**Rationale**:
- Date parameter (vs. `/today`) decouples server clock from client; enables precise edge caching (same date → same response forever); allows retry with explicit date after a near-midnight load
- Client-side validation is industry standard for casual daily games (Wordle, Worldle, etc.)
- Server-side validation per guess would add 100–300ms latency to every drag-and-drop submission — unacceptable UX for a real-time interaction
- Determined cheaters can always inspect localStorage; the audience is not adversarial

**Response includes**: `date`, `countries[]` (id, name, flagCode), `stats[]` (id, label, category, tooltip, direction, solution[])

**`solution`** is an ordered array of country IDs representing the correct ranking (position 0 = rank 1). Delivered to the client as the answer key.

**Caching**: Response for a given date is immutable; set `Cache-Control: public, max-age=86400, s-maxage=86400` to allow CDN caching. Puzzle JSON files live in `data/puzzles/YYYY-MM-DD.json` on the server.

---

## 6. Scoring Algorithm

**Decision**: Linear per-position scoring, max 150 points total

**Formula**:
```
position_score = max(10 − 2 × n, 0)
```

Where `n` = number of guesses in which that position was wrong (across all guesses for the stat, counting from the first guess until the stat is solved).

```
stat_score  = sum of 5 position scores  (max 50)
total_score = stat_1_score + stat_2_score + stat_3_score  (max 150)
```

**Score progression per position**:

| Misses (n) | Position score |
|------------|---------------|
| 0          | 10 (first guess correct) |
| 1          | 8 |
| 2          | 6 |
| 3          | 4 |
| 4          | 2 |
| 5+         | 0 (floor) |

A perfect game (every position correct on the first guess) scores 150. Getting any position wrong once costs 2 points; 5+ misses on a position scores 0 for that position with a floor at 0 (no negative scores).

**Why linear**: Simple, transparent, and intuitive to players — every miss costs exactly 2 points per position. No exponential complexity to explain or tune.
