# Implementation Plan: Mobile-Friendly & Accessible Responsive Layout

**Branch**: `feature/mobile-responsive` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-mobile-responsive-accessible/spec.md`

## Summary

Make WorldOrder fully responsive and accessible across phones, tablets, and desktop while preserving the existing single centered-column design and the existing inline-style architecture. Responsiveness is delivered through **fluid `clamp()` sizing driven by a small set of centralized responsive CSS custom properties** in `globals.css` — not a Tailwind migration — so the change stays low-risk and auditable. Touch drag-and-drop is hardened by adding a dnd-kit `TouchSensor` (delay + tolerance) and `touch-action: none` on draggable nodes, with the existing tap-to-place and keyboard paths kept intact. Accessibility gaps introduced by mobile are closed: a reduced-motion media block, guaranteed visible focus, a touch-openable and viewport-clamped stat tooltip, safe-area insets, raised-minimum font sizes for the dense five-column grids, and `themeColor`/`colorScheme` viewport metadata.

No changes to puzzle data, scoring, the API contract, the localStorage schema, or `src/types/index.ts`. All existing `data-testid` hooks are preserved; the existing unit/integration/e2e suite must stay green and global coverage at/above the constitution's ≥80% threshold, with a new mobile-viewport Playwright project added.

## Technical Context

**Language/Version**: TypeScript 5.x, `"strict": true` in `tsconfig.json`

**Primary Dependencies**: Next.js 16 App Router, React 19, `@dnd-kit/core` 6.3.1 (`TouchSensor` is part of this package — no new dependency), Tailwind v4 (import + utilities only), Vitest + @testing-library/react (unit/component), Playwright (e2e)

**Storage**: N/A — no localStorage schema or puzzle API response changes

**Testing**: Vitest + RTL (`tests/unit/`), integration (`tests/integration/`), Playwright e2e (`tests/e2e/game-flow.spec.ts`) + a new mobile device project in `playwright.config.ts`

**Target Platform**: Web — phones (≥320px), tablets, desktop; modern evergreen browsers; touch + mouse + keyboard input

**Project Type**: Next.js single-page web application

**Performance Goals**: No new network requests or API routes. Fluid sizing adds no runtime JS cost (CSS-only). Drag continues to use `transform` only. Reduced-motion lowers paint/composite work for users who opt in.

**Constraints**:
- No Tailwind migration — keep inline `style={}` and introduce responsiveness via `var(--token)` + `clamp()` (user decision; stability).
- Single centered column retained; token ceilings = current desktop pixel values to avoid desktop regression.
- `@dnd-kit` keyboard support MUST remain (constitution NON-NEGOTIABLE + FR-012).
- Drag movement MUST remain `transform`-based (constitution performance rule).
- All `data-testid`s preserved (FR-021); existing style-asserting tests (chip ≥44px; summary score-bar `transition === ''`) must keep passing or change only intentionally.
- Test-First: failing mobile/behaviour tests written and confirmed RED before implementation.

**Scale/Scope**: ~9 source files modified (1 CSS, 1 layout, 1 page, 6 components), 1 Playwright config modified, ~2–3 test files added/extended. No new components, no new types.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ PASS | New code is limited to typed additions: a `Viewport`-typed export in `layout.tsx`, a `TouchSensor` sensor entry, and local tooltip boolean state. No `any`; explicit types/return types preserved. |
| II. Test-First Development | ✅ PASS | Failing tests written first: mobile e2e (no h-scroll at 320–414px; full game via touch; touch-drag without page scroll; ≥44px targets; reduced-motion), tooltip touch-open unit test, raised-font assertions where deterministic. RED confirmed before implementation. Coverage gate (≥80%) re-verified at the end. |
| III. App Router Discipline | ✅ PASS | `viewport` export is added to `layout.tsx`, which is a Server Component (required for `viewport`). No new `'use client'` boundaries; touch/tooltip logic lives in already-client components (`RankingBoard`, `Tooltip`). No `useEffect` data fetching introduced. |
| IV. Game Logic Purity | ✅ PASS | No changes to `src/lib/`. No new `localStorage` access (still via `game-state.ts`). Scoring, puzzle, and date logic untouched. Pure presentation/interaction. |
| V. Accessibility Baseline (WCAG 2.1 AA) | ✅ STRENGTHENED | dnd-kit keyboard support retained; icon+color feedback retained (FR-019); aria-live retained (FR-018). This feature *adds* WCAG-aligned improvements: 44×44 targets (FR-007), legible minimum text (FR-008), visible focus at all sizes (FR-015), touch-reachable help tooltip (FR-016/017), and reduced-motion support (FR-014). |
| Performance Budget | ✅ PASS | No new API calls/routes; `Cache-Control` unaffected. Drag stays `transform`-only. CSS `clamp()` adds no JS. Reduced-motion reduces animation cost. |
| Styling | ⚠️ PRE-EXISTING VIOLATION (documented) | The constitution mandates "Tailwind utility classes only; no inline `style={}`". The codebase already violates this pervasively; feature 008 documented it as pre-existing. Per explicit user decision, this feature **keeps** inline styles for stability and adds responsive **CSS custom properties + `clamp()`** in `globals.css` (the permitted custom-CSS location). No new pattern of violation is introduced beyond the existing one; no full migration is performed. |

**Complexity Tracking**: No new constitution violations introduced. The pre-existing styling violation is neither amplified nor resolved here (a Tailwind migration is explicitly out of scope by user decision); responsiveness is layered on via centralized custom properties to minimize new inline-style surface area.

## Project Structure

### Documentation (this feature)

```text
specs/009-mobile-responsive-accessible/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — decisions & rationale
├── data-model.md        # Phase 1 output — tokens & component changes
├── quickstart.md        # Phase 1 output — test-first dev walkthrough
├── tasks.md             # Phase 2 output — task breakdown
└── checklists/
    └── requirements.md  # Spec quality checklist
```

*(No `contracts/` directory — this feature changes no API endpoints or response shapes. It consumes the existing puzzle API unchanged.)*

### Source Code (repository root)

```text
src/
├── app/
│   ├── globals.css                        # [MODIFY] add responsive token vars (:root + @media breakpoints);
│   │                                       #          add @media (prefers-reduced-motion: reduce) block;
│   │                                       #          add :focus-visible safety net; size blobs off viewport
│   ├── layout.tsx                          # [MODIFY] add `export const viewport: Viewport` (themeColor + colorScheme)
│   └── page.tsx                            # [MODIFY] column padding/max-width → tokens + safe-area;
│                                           #          aurora blobs, solved overlay rings, "SOLVED" text, wordmark → tokens
├── components/
│   ├── game/
│   │   ├── RankingBoard.tsx                # [MODIFY] add TouchSensor; touch-action:none on draggables;
│   │   │                                   #          chip/slot/rank sizes → tokens; ≥44px targets
│   │   ├── ResultCard.tsx                  # [MODIFY] score number + card max-width → tokens; share btn ≥44px
│   │   ├── StatPanel.tsx                   # [MODIFY] title + paddings → tokens
│   │   ├── ScoreDisplay.tsx                # [MODIFY] score value font → token
│   │   ├── FeedbackRow.tsx                 # [MODIFY] raise 9–11px text to --fs-micro/--fs-label floor
│   │   └── CorrectValuesRow.tsx            # [MODIFY] raise 8–9px text to legible floor
│   └── ui/
│       └── Tooltip.tsx                     # [MODIFY] tap-to-open + dismiss; responsive clamped width/position
│
│   # OUT OF SCOPE (not touched):
│   #   components/game/RankingList.tsx, components/game/CountryCard.tsx  (dead code)
│   #   components/dev/DevPanel.tsx                                       (dev-only)

playwright.config.ts                        # [MODIFY] add a mobile device project (e.g. Pixel 5 / iPhone)

tests/
├── e2e/
│   └── game-flow.spec.ts                  # [MODIFY] add mobile responsiveness + touch-drag + reduced-motion + a11y scenarios
└── unit/
    └── Tooltip.test.tsx                   # [CREATE or MODIFY] assert tap-to-open / dismiss behaviour
```

**Structure Decision**: Single Next.js project; no directory or structural changes. This is a cross-cutting presentation/interaction feature touching the global stylesheet, the root layout, the page, and the active game components. Dead-code and dev-only components are explicitly excluded.

## Phasing Overview

| Phase | Theme | Primary files | Maps to |
|-------|-------|---------------|---------|
| 1 — Foundation | Tokens, reduced-motion, focus, viewport meta | `globals.css`, `layout.tsx` | US1, US4, FR-003/005/006/014/015/020 |
| 2 — Touch DnD | TouchSensor + `touch-action`, board sizing | `RankingBoard.tsx` | US2, FR-007/010/011/012/013 |
| 3 — Playing screen | Column, effects, panels fluid | `page.tsx`, `StatPanel.tsx`, `ScoreDisplay.tsx` | US1, FR-001/003/004 |
| 4 — Results & legibility | Score number, grids, tooltip | `ResultCard.tsx`, `FeedbackRow.tsx`, `CorrectValuesRow.tsx`, `Tooltip.tsx` | US3, US4, FR-002/008/009/016/017 |
| 5 — Tests & gate | Mobile Playwright project + assertions; full gate | `playwright.config.ts`, `tests/**` | all SCs, FR-021/022 |

Recommended order prioritizes user value: Foundation → Touch DnD (highest-impact) → Playing screen → Results → Tests. Each phase is independently verifiable; tests for each are written RED first per the constitution.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Style-asserting tests break under fluid sizing | Preserve all `data-testid`s; express sizes as `var(--token)`/`clamp()`; update exact-value assertions only intentionally with documented reason; keep the two known checks (chip ≥44px, summary `transition === ''`) valid. |
| Touch `TouchSensor` delay feels laggy or triggers accidental drags | Tune `delay`/`tolerance` against the e2e touch test; tap-to-place remains a guaranteed alternative (FR-011). |
| `touch-action: none` accidentally blocks page scroll | Apply only to draggable nodes, never the page/board container. |
| `clamp()` edge values look wrong at 320px or ultra-wide | Explicitly verify at 320/360/390/414/768/1280; floors/ceilings tuned per token. |
| Reduced-motion hides solved feedback | Keep persistent solved styling + ✓ icon + aria-live; only motion is suppressed. |

## Out of Scope

- Tailwind/utility-class migration (explicit user decision).
- New multi-column desktop layout (single centered column retained).
- `RankingList.tsx` / `CountryCard.tsx` (dead code) and `DevPanel.tsx` (dev-only).
- Any change to puzzle data, scoring, API, or localStorage schema.
- Visual redesign beyond responsiveness/accessibility.
