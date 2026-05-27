# Implementation Plan: Dev Testing & UX Improvements

**Branch**: `004-dev-ux-improvements` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-dev-ux-improvements/spec.md`

## Summary

Three targeted improvements to the WorldOrder game:

1. **Dev randomize mode** — Replace the broken date-picker `DevPanel` (which calls the undeclared `setWrongGuessEffect` on date change) with a single "Randomize" button that picks a random available puzzle date and loads it fresh. Zero hardcoded test dates.

2. **Guess history visibility** — Extend `FeedbackRow` to display the country flag and name in each position slot alongside the existing bull/miss indicators, so players can review what they submitted on past guesses.

3. **Enlarged pool chips** — Increase the interactive target size of country chips in the "Available" pool (`PoolChipItem` in `RankingBoard`) to meet the 48 px minimum height guideline, with proportionally scaled flags and text.

All three changes are purely frontend. No new API routes, no schema migrations, no new `localStorage` keys.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), React 19.2.4

**Primary Dependencies**: Next.js 16.2.6 (App Router), `@dnd-kit/core` 6.3.1, `flag-icons` 7.5.0, Tailwind CSS 4 (CSS-first, no `tailwind.config.*`), Vitest 4 + React Testing Library 16

**Storage**: `localStorage` via `src/lib/game-state.ts` — no changes to storage schema required; guess `order` field already contains all the data needed for history display

**Testing**: Vitest 4 + jsdom + `@testing-library/react` (unit/integration); Playwright (E2E). Constitution mandates test-first: failing tests written before implementation. Coverage threshold: 80% global across `src/**`.

**Target Platform**: Desktop-first web (modern Chrome/Firefox/Safari); `min-width: 1280px` viewport for pool chip layout guarantee

**Project Type**: Single-page web application (Next.js)

**Performance Goals**: Puzzle API p95 ≤ 200ms (unchanged); CSS `transform`-only drag animations (unchanged); randomize action resolves in < 2s (API call to `/api/puzzles` + state reset + puzzle fetch).

**Constraints**: Tailwind utility classes only; no `style={{}}` props for layout (existing code uses inline styles extensively — new code follows the same pattern for consistency, custom CSS in `globals.css` only); `localStorage` accessed only via `src/lib/game-state.ts`

**Scale/Scope**: 5 files modified, 1 new file (research.md already shows no need for new modules)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **I. TypeScript Strict Mode** | ✅ PASS | All new/changed component props will have explicit types; no `any`; no `@ts-ignore` |
| **II. Test-First Development** | ✅ PASS (with action) | Tests must be written and confirmed failing before each implementation step. Failing tests for all three sub-features will be authored in Phase 2 tasks before code. |
| **III. Next.js App Router Discipline** | ✅ PASS | `DevPanel` stays `'use client'` (uses `useState`, `useEffect`, `fetch`). `FeedbackRow` has no client hooks — stays a Server Component (no `'use client'` directive). `RankingBoard` stays `'use client'` (DnD). No page-level `'use client'` added. |
| **IV. Game Logic Purity** | ⚠️ BUG FIX REQUIRED | `page.tsx:163` calls `setWrongGuessEffect(false)` — this state setter is never declared, causing a runtime crash in dev mode. Must be removed as part of this feature's `page.tsx` changes. No `localStorage` calls outside `src/lib/game-state.ts`. |
| **V. Accessibility (WCAG 2.1 AA)** | ✅ PASS (with action) | `FeedbackRow` currently conveys bull/miss by emoji + color. New design must also convey correctness via shape/icon (not color alone). `aria-label` on each position cell must include the country name. dnd-kit keyboard support unchanged. |
| **Performance Budget** | ✅ PASS | Enlarged chips: size increase via existing CSS properties, no layout-triggering changes during drag. Randomize: one extra `/api/puzzles` fetch (same endpoint DevPanel already calls). |
| **Puzzle Data Integrity** | N/A | No puzzle files modified. |

**Post-Design Re-check**: Will be performed after Phase 1 contracts are defined. No foreseeable violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-dev-ux-improvements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/
│   └── component-interfaces.md  # Phase 1 output
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (files touched by this feature)

```text
src/
├── app/
│   └── page.tsx                         # Fix setWrongGuessEffect bug; pass countries to FeedbackRow
├── components/
│   ├── dev/
│   │   └── DevPanel.tsx                 # Replace date-picker with randomize button
│   └── game/
│       ├── FeedbackRow.tsx              # Add country identity display per position
│       └── RankingBoard.tsx             # Enlarge PoolChipItem
tests/
├── unit/
│   ├── DevPanel.test.tsx                # New: randomize tests (test-first)
│   ├── FeedbackRow.test.tsx             # Updated: country display tests (test-first)
│   ├── RankingBoard.test.tsx            # Updated: chip size/target tests (test-first)
│   └── GamePage.test.tsx               # Updated: countries prop threaded through
└── e2e/
    └── game-flow.spec.ts               # Potentially updated if guess history
                                         # affects visible text assertions
```

**Structure Decision**: Single Next.js app (`src/`) — no new directories needed. All changes are within existing component, lib, and test layers.

## Complexity Tracking

No constitution violations introduced by this feature. The only complexity note is the **pre-existing bug** at `page.tsx:163` (`setWrongGuessEffect` undeclared) which must be fixed opportunistically since `handleDevDateChange` is being rewritten anyway.
