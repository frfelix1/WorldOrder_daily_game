# Implementation Plan: Rankle — Daily Geography Ranking Game

**Branch**: `001-rankle-daily-game` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-rankle-daily-game/spec.md`

## Summary

Rankle is a daily browser-based geography game where players rank five countries against three sequential stats using drag-to-reorder, receive bulls-only positional feedback until each stat is solved, and share a final score. The technical approach is a Next.js 14+ App Router application: a statically-served React client for all game interaction, a lightweight API route that serves the date-keyed daily puzzle, and localStorage for anonymous per-device game state persistence — no accounts, no database.

## Technical Context

**Language/Version**: TypeScript 5+

**Primary Dependencies**:
- `next` 14+ (App Router) — framework, static shell + API routes
- `@dnd-kit/core` + `@dnd-kit/sortable` — drag-to-reorder on mouse and touch
- `flag-icons` — self-hosted SVG country flags (ISO 3166-1 alpha-2)
- `tailwindcss` — utility-first styling for clean minimal UI

**Storage**: `localStorage` — client-side game state keyed by puzzle number (integer offset from epoch); no server-side database

**Testing**:
- `vitest` + `@testing-library/react` — unit and component tests
- `playwright` — end-to-end game flow tests

**Target Platform**: Web browser (desktop mouse + mobile touch); deployed to Vercel (or equivalent Next.js host)

**Project Type**: Web application — static React SPA shell + Next.js API route

**Performance Goals**:
- Puzzle API response ≤ 200ms p95
- Page interactive (TTI) ≤ 1.5s on a 4G connection
- Drag interaction updates at 60fps (no layout thrash during drag)

**Constraints**:
- Anonymous — no authentication, no server-side user state
- Game playable after initial load even on flaky connections (state in localStorage)
- Correct answer delivered to client (client-side validation); server-side guess validation is out of scope for MVP
- All countries in a puzzle must have distinct stat values (enforced at puzzle authoring time, not runtime)
- Puzzle data is static JSON on the server (no live data fetching from external APIs per request)

**Scale/Scope**: Daily single-puzzle; target 1k–50k concurrent page loads at puzzle reset (UTC midnight). Puzzle API response is effectively static per date and can be cached at the CDN edge.

## Constitution Check

The project constitution (`/.specify/memory/constitution.md`) was ratified
2026-05-22 at version 1.0.0. All active gates are listed below.

| Gate | Requirement | Status |
|------|-------------|--------|
| I. TypeScript Strict | `"strict": true` in `tsconfig.json`; no `any`; explicit param/return annotations on all `src/lib/` functions | ✅ Required — see quickstart |
| II. Test-First (NON-NEGOTIABLE) | Red-Green-Refactor: tests written and confirmed failing before implementation; `vitest --coverage` ≥ 80% globally blocks merge | ✅ Gate active — see quickstart scripts |
| III. App Router Discipline | `'use client'` at lowest viable boundary; GET-only API routes | ⚠ Justified exception: `app/page.tsx` is `'use client'` at page level. Every child component requires browser APIs (drag-and-drop, localStorage, real-time score updates). This is the narrowest viable boundary for this game. |
| IV. Game Logic Purity | `src/lib/` pure functions; `localStorage` exclusively via `game-state.ts`; UTC logic exclusively via `puzzle.ts` | ✅ Gate active — enforced by project structure |
| V. Accessibility | WCAG 2.1 AA; dnd-kit `KeyboardSensor` active; bull/miss conveyed by shape (🟩/⬜) not color alone; `aria-live` on stat-solved and game-complete events | ✅ Gate active — accessibility requirements are implementation tasks |
| Performance Budget | API p95 ≤ 200ms + `Cache-Control` required; TTI ≤ 1.5s on 4G; drag animations MUST use CSS `transform` only (no `top`/`left`/`width` during drag) | ✅ Gate active |
| Puzzle Data Integrity | Solution arrays are valid permutations of `countries[*].id`; no ties; stats span ≥ 2 categories; authoring checklist in `contracts/puzzle-api.md` must be followed | ✅ Gate active |
| Styling | Tailwind utility classes only; no CSS-in-JS; no inline `style={}` props; `globals.css` for third-party imports only | ✅ Gate active |

**No blocking violations.** One justified exception documented for Principle III.

## Project Structure

### Documentation (this feature)

```text
specs/001-rankle-daily-game/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── puzzle-api.md    # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                # Root layout, font, global styles
│   ├── page.tsx                  # Game shell ('use client')
│   ├── globals.css
│   └── api/
│       └── puzzle/
│           └── route.ts          # GET /api/puzzle?date=YYYY-MM-DD
├── components/
│   ├── game/
│   │   ├── CountryCard.tsx       # Country name + flag chip
│   │   ├── RankingList.tsx       # Drag-to-reorder sortable list
│   │   ├── StatPanel.tsx         # Active stat label + tooltip + direction label
│   │   ├── FeedbackRow.tsx       # Historical guess row with bull/miss indicators (🟩/⬜ — shape not color alone)
│   │   ├── ScoreDisplay.tsx      # Live running score
│   │   └── ResultCard.tsx        # Post-game emoji grid + share action
│   └── ui/
│       ├── Tooltip.tsx           # Hover/tap tooltip primitive
│       └── LiveRegion.tsx        # aria-live region for stat-solved + game-complete announcements
├── lib/
│   ├── game-state.ts             # localStorage read/write + stale detection
│   ├── scoring.ts                # Exponential penalty scoring engine
│   └── puzzle.ts                 # Puzzle number calculation from UTC epoch
└── types/
    └── index.ts                  # Shared TypeScript types

tests/
├── unit/
│   ├── scoring.test.ts           # Scoring algorithm edge cases
│   ├── game-state.test.ts        # State persistence, stale detection
│   └── puzzle.test.ts            # Puzzle number / date utilities
├── integration/
│   └── api/
│       └── puzzle.test.ts        # API route contract tests
└── e2e/
    └── game-flow.spec.ts         # Full game loop, share action, day-change

public/
└── flags/                        # Self-hosted flag-icons SVG assets (build-time copy)

data/
└── puzzles/
    └── YYYY-MM-DD.json           # One static puzzle file per day (server-read by API route)
```

**Structure Decision**: Single Next.js project. The game shell is a single client-side page; the API route is a thin file-system reader that loads the correct day's puzzle JSON and returns it. No monorepo, no separate backend service.

## Complexity Tracking

No constitution violations. No complexity justification required.
