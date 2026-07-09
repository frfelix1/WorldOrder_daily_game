# Implementation Plan: Line-Scale Placement Mechanic

**Branch**: `010-line-scale-placement` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-line-scale-placement/spec.md`

## Summary

Replace the current five-slot drag-and-drop ranking list with a single continuous horizontal **value line**. For each of the day's three stats, the player drags all five country tokens anywhere along the line; the far-left end represents the smallest value among the five puzzle countries and the far-right the largest, with a live value readout that follows a token as it moves. A stat is solved when the tokens' left-to-right order matches the true ranking. Scoring keeps the existing 0–100 total and per-stat cap of 33, but each stat's score now blends a per-wrong-guess penalty with a proximity bonus (final placements closer to true value positions score higher).

**Technical approach**: Keep the existing stack (Next.js App Router, React 19, TypeScript strict, `@dnd-kit/core`, Tailwind v4, Vitest + Playwright). Introduce a new client component (`LineScaleBoard`) that renders a horizontal track with draggable tokens positioned via CSS `transform`, backed by a small pure-logic module (`src/lib/line-scale.ts`) for value↔position interpolation, order derivation, tie-breaking, and proximity accuracy. Extend the pure scoring module (`src/lib/scoring.ts`) with a proximity-aware per-stat function that remains bounded to 33. Wire the new board into `src/app/page.tsx` in place of `RankingBoard`, replacing slot-index state with per-country position state while preserving the existing submit / lock-correct / advance / persist / share loop. No changes to the dataset, puzzle generator, or API — the mechanic derives everything from the per-country `StatDef.values` already present in each puzzle.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, per Constitution I); React 19.2.4

**Primary Dependencies**: Next.js 16.2.6 (App Router); `@dnd-kit/core` ^6.3.1 (drag with pointer/touch/keyboard sensors, retained per Constitution V); Tailwind CSS v4; `flag-icons` ^7.5.0

**Storage**: Browser `localStorage` only, accessed exclusively via `src/lib/game-state.ts` (Constitution IV). No server-side persistence.

**Testing**: Vitest ^4.1.7 + `@testing-library/react` (unit/component, jsdom), Playwright ^1.60.0 (e2e game-flow, desktop Chromium + mobile-chrome/Pixel 5). ≥80% global coverage gate (Constitution II).

**Target Platform**: Modern browsers (desktop + mobile web); responsive 320–414px baseline (aligns with feature 009).

**Project Type**: Web application (Next.js App Router single project; `src/` frontend + client-side game logic).

**Performance Goals**: Value readout updates within ~100 ms of token movement (SC-002); 60 fps drag using CSS `transform` only — no layout-triggering properties during drag (Constitution Performance Budget). Page TTI ≤ 1.5s on 4G.

**Constraints**: Offline-capable game logic (pure, deterministic); no new API/write endpoints; Tailwind utilities for styling (dynamic per-token drag translate is the only permitted inline dynamic style); reduced-motion honored; keyboard operability required.

**Scale/Scope**: Small. One new client component + one new pure-logic module + extension of `scoring.ts`; edits to `src/app/page.tsx`. Fixed 5 countries × 3 stats per day, single-player, no backend. Estimated a few hundred lines plus tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Gates derived from `.specify/memory/constitution.md` v1.1.0:

| # | Principle / Constraint | Applicability to this feature | Status |
|---|------------------------|-------------------------------|--------|
| I | **TypeScript Strict (NON-NEGOTIABLE)** | New module/component fully typed; no `any`; explicit param/return types; no unexplained `@ts-ignore`. New position state typed (`Record<countryId, number>` normalized 0–1). | PASS (by design) |
| II | **Test-First (NON-NEGOTIABLE)** | Red-Green-Refactor: unit tests for `line-scale.ts` and extended `scoring.ts` before implementation; RTL test for `LineScaleBoard` before component; e2e updated to cover placement/solve loop before shipping; keep ≥80% coverage. | PASS (enforced in tasks) |
| III | **App Router Discipline** | No new data fetching, no new routes, no write endpoints. New component is a leaf `'use client'` (interactivity/browser drag) mounted inside the already-client `page.tsx`; boundary stays at the lowest interactive node. No page/layout-level client escalation introduced. | PASS |
| IV | **Game Logic Purity** | All interpolation, order derivation, tie-breaking, proximity, and scoring live in pure `src/lib/*` functions (deterministic, no side effects). `localStorage` only via `game-state.ts`. Scoring recomputed from `guesses[]`, never mutated in place. Dates/puzzle numbers stay in `puzzle.ts` (untouched). | PASS (by design) |
| V | **Accessibility (WCAG 2.1 AA)** | dnd-kit KeyboardSensor retained (token moves along line via keyboard in discrete steps); correct/incorrect conveyed by icon+shape in addition to color; all tokens Tab-reachable; `aria-live` announcements for stat-solved/game-complete retained; value readout exposed to AT. | PASS (enforced in tasks) |
| — | **Performance Budget** | Drag uses CSS `transform` only; no `top/left/width` during drag. No API changes so puzzle p95/caching unaffected. Readout throttled to animation frames to hit ~100 ms. | PASS |
| — | **Puzzle Data Integrity** | No generator/dataset/`data/puzzles` changes. Reuses existing `StatDef.values` + `solution`. Determinism preserved (tie-break rule is deterministic). | PASS |
| — | **Styling** | Tailwind utilities only; custom CSS confined to `globals.css` if needed. The single justified exception is the per-token dynamic `transform: translateX()` computed from position — an inherently dynamic value dnd-kit already applies via style (consistent with existing `RankingBoard` drag transforms). | PASS (with noted, pre-existing-pattern exception) |
| — | **Quality Gates** | `npm run build`, `npm test` (0 failures + ≥80%), `npm run test:e2e` (game logic touched → required) must pass before merge. | PASS (enforced in tasks) |

**Result**: No violations. No entries required in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/010-line-scale-placement/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — decisions incl. scoring formula
├── data-model.md        # Phase 1 output — client entities & transitions
├── quickstart.md        # Phase 1 output — how to build/verify the feature
├── contracts/
│   └── line-scale-board.md   # UI/component contract (props, testids, a11y, events)
└── checklists/
    └── requirements.md  # Spec quality checklist (from /speckit.specify)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── page.tsx                     # MODIFY: swap RankingBoard → LineScaleBoard;
│                                    #         replace slot-index state with per-country
│                                    #         position state; update solve/lock/score wiring
├── components/
│   └── game/
│       ├── LineScaleBoard.tsx       # NEW: horizontal value line + draggable tokens +
│       │                            #      live value readout (leaf 'use client')
│       ├── RankingBoard.tsx         # DEPRECATE/REMOVE after cutover (tests updated)
│       ├── FeedbackRow.tsx          # REUSE (per-guess correctness row) — may adapt labels
│       ├── StatPanel.tsx            # REUSE (stat label/direction/round indicator)
│       ├── ScoreDisplay.tsx         # REUSE (live/final score)
│       └── ResultCard.tsx           # REUSE; verify share/summary reflects new outcomes
├── lib/
│   ├── line-scale.ts                # NEW (pure): position↔value interpolation, order
│   │                                #      derivation, deterministic tie-break, proximity
│   ├── scoring.ts                   # MODIFY (pure): add proximity-aware per-stat score,
│   │                                #      bounded 0–33; keep total 0–100 + perfect bonus
│   ├── formatting.ts                # REUSE: formatStatValue for readout + endpoint labels
│   └── game-state.ts                # REUSE: persistence (may store positions in Guess)
└── types/
    └── index.ts                     # MODIFY: extend Guess to carry placements/positions
                                     #      (backwards-compatible), add line-scale types

tests/
├── unit/
│   ├── line-scale.test.ts           # NEW: interpolation/order/tie-break/proximity
│   ├── scoring.test.ts              # MODIFY: proximity-aware scoring cases
│   └── LineScaleBoard.test.tsx      # NEW: RTL — placement, readout, keyboard, a11y
├── integration/                     # UNCHANGED (no API changes)
└── e2e/
    └── game-flow.spec.ts            # MODIFY: drive line placement instead of slots;
                                     #      new data-testids; keep full-game + resume flows
```

**Structure Decision**: Single Next.js App Router project (Option 1). The feature is purely client-side interactivity plus pure game logic, so it slots into the existing `src/app` + `src/components/game` + `src/lib` layout. A new leaf client component isolates the interactive line; all non-UI logic lives in pure `src/lib` modules to satisfy Game Logic Purity and enable unit-test-first development. No backend, no new routes, no dataset/generator changes.

## Complexity Tracking

> No Constitution Check violations — this section intentionally left empty.
