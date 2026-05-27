<!--
SYNC IMPACT REPORT
==================
Version change: blank template → 1.0.0 (initial ratification)

Principles added (all new):
  I.   TypeScript Strict Mode (NON-NEGOTIABLE)
  II.  Test-First Development (NON-NEGOTIABLE)
  III. Next.js App Router Discipline
  IV.  Game Logic Purity
  V.   Accessibility Baseline (WCAG 2.1 AA)

Sections added:
  - Technical Constraints (Performance Budget, Puzzle Data Integrity, Styling)
  - Quality Gates

Templates reviewed:
  ✅ .specify/templates/plan-template.md      — no changes required
  ✅ .specify/templates/spec-template.md      — no changes required
  ⚠  .specify/templates/tasks-template.md    — "Tests are OPTIONAL" note conflicts
                                                with Principle II; updated with
                                                constitution-aware clarification
  ✅ .specify/templates/constitution-template.md — source template; not modified
  ✅ specs/001-rankle-daily-game/plan.md      — Constitution Check section updated
                                                to reflect ratified gates

Deferred TODOs: None — all fields resolved.
-->

# WorldOrder Constitution

## Core Principles

### I. TypeScript Strict Mode (NON-NEGOTIABLE)

`"strict": true` in `tsconfig.json` at all times — never downgraded. No `any`
type; use `unknown` + type narrowing or explicit generics. All function
parameters and return types MUST be explicitly annotated. `@ts-ignore` is
forbidden without an inline comment explaining the exceptional case.

### II. Test-First Development (NON-NEGOTIABLE)

Red-Green-Refactor cycle is mandatory: tests MUST be written and confirmed
failing before implementation begins.

- `src/lib/` pure logic: unit tests written before each function is implemented
- Components: RTL component test written before each component is implemented
- API routes: contract test in `tests/integration/` written before route
  implementation
- E2E: `tests/e2e/game-flow.spec.ts` MUST cover each user story before it ships

**Coverage gate**: `vitest --coverage` MUST report ≥ 80% coverage globally
across all `src/` files. A failing threshold blocks merge.

### III. Next.js App Router Discipline

Server Components are the default; `'use client'` MUST only be added at the
**lowest tree boundary** that genuinely requires interactivity or browser APIs.
Page- and layout-level `'use client'` is forbidden unless every child of that
boundary requires client-side rendering — push the boundary down. `useEffect`
MUST NOT be used for data fetching where a server-side or async component
approach exists. API routes are GET-only; any write endpoint requires a
documented security justification before creation.

### IV. Game Logic Purity

All code in `src/lib/` MUST be pure functions: deterministic output, no side
effects. `localStorage` MUST only be accessed via `src/lib/game-state.ts` —
direct calls in components are forbidden. UTC date and puzzle number
calculations MUST be exclusively handled by `src/lib/puzzle.ts`. Scoring MUST
always be recomputed from the `guesses[]` source of truth; never mutated
in-place.

### V. Accessibility Baseline (WCAG 2.1 AA)

dnd-kit keyboard support MUST remain active — never disabled or patched out.
State (bull / miss) MUST be conveyed by shape or icon in addition to color —
color alone is not sufficient. All interactive elements MUST be reachable and
operable via keyboard Tab order. `aria-live` regions MUST announce stat-solved
and game-complete events to screen readers.

## Technical Constraints

**Performance Budget**: Puzzle API p95 ≤ 200ms; `Cache-Control` headers MUST
be set on every API response. Page TTI ≤ 1.5s on a 4G connection. Drag
animations MUST use CSS `transform` only — layout-triggering properties
(`top`, `left`, `width`) during drag are forbidden.

**Puzzle Data Integrity**: Puzzles are generated at runtime by `src/lib/puzzle-generator.ts`
using a seeded Mulberry32 PRNG (seed = `BASE_SEED(42) + puzzleNumber + attemptIndex`).
No `data/puzzles/*.json` files exist or should be committed — the generator is
the sole authoritative source. The generator enforces: solution arrays are valid
permutations of the selected `countries[*].id`; no ties in stat values within a
puzzle; stats span ≥ 2 distinct quintile bands; consecutive-day country sets are
distinct (up to `MAX_ATTEMPTS=20` retries). The authoritative dataset is
`data/dataset.json` (202 countries, 17 stats) and MUST remain committed.

**Styling**: Tailwind utility classes only; no CSS-in-JS, no inline `style={}`
props. Custom CSS is confined to `globals.css` (third-party imports such as
`flag-icons`).

## Quality Gates

Every PR MUST pass all of the following before merge:

1. `npm run build` — TypeScript compilation + Next.js build
2. `npm test` — Vitest run with 0 failures **and** ≥ 80% global coverage
3. `npm run test:e2e` — Playwright game-flow spec passes on any PR touching
   game logic or the API route

## Governance

This constitution supersedes all other project guidelines. Amendments require
updating this file, updating `plan.md`, and a brief justification in the commit
message. The coverage threshold and the two NON-NEGOTIABLE principles (I and
II) require explicit rationale to amend.

**Version**: 1.1.0 | **Ratified**: 2026-05-22 | **Last Amended**: 2026-05-27
