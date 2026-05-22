# Research: Rankle — Daily Geography Ranking Game

**Date**: 2026-05-22 | **Branch**: `001-rankle-daily-game`

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

**localStorage key**: `rankle_state` — single object storing `puzzleNumber`, `status`, `guesses`, `runningScore`; lifetime stats in separate key `rankle_stats`.

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
  "runningScore": 950
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

**Decision**: Exponential per-country penalty, starting score 1000 per stat

**Formula**:
```
penalty(k) = base_penalty × multiplier^k
base_penalty = 50
multiplier = 2
```

Where `k` = number of prior incorrect placements of the same country within the same stat.

```
stat_score = max(0, 1000 - Σ penalties across all countries and all guesses for that stat)
total_score = stat_1_score + stat_2_score + stat_3_score  (max 3000)
```

**Penalty progression per country per stat**:

| Miss # | Incremental | Cumulative |
|--------|-------------|------------|
| 1      | 50          | 50         |
| 2      | 100         | 150        |
| 3      | 200         | 350        |
| 4      | 400         | 750        |
| 5      | 800         | 1550 → capped at 0 |

A single country misplaced 5+ times exhausts the full 1000-point stat budget on its own; floor at 0 prevents negative scores.

**Tuning levers** (deferred to post-MVP playtesting per spec):
- Raise `base_penalty` (e.g. 75) for harsher single-mistake punishment
- Lower `multiplier` (e.g. 1.5) for a gentler exponential curve
- The formula above is the concrete baseline for the initial implementation
