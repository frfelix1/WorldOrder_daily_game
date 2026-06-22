# Tasks: Mobile-Friendly & Accessible Responsive Layout

**Input**: Design documents from `specs/009-mobile-responsive-accessible/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Constitution mandates Test-First Development (NON-NEGOTIABLE) and ≥ 80% global coverage. Behavioural tests (no-horizontal-scroll, touch-drag, reduced-motion, tooltip-on-tap, ≥44px targets) MUST be written and confirmed RED before the corresponding implementation task begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and verification. `[P]` marks tasks on different files with no dependency that may run in parallel.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (phone layout), US2 (touch reorder), US3 (results legibility), US4 (a11y/motion), or FND (foundation/cross-cutting)
- Exact file paths included in every task

## Path Conventions

Single Next.js project — source under `src/`, tests under `tests/`, Playwright config at repo root.

---

## Phase 1: Setup

**Purpose**: Confirm a green baseline and prepare the mobile test runner before any change.

- [X] T001 Confirm baseline is green from repo root: `npm run build`, `npm test` (Vitest, ≥80% coverage), and `npm run test:e2e` (Playwright) — all must pass before starting.
- [X] T002 Ensure Playwright browsers are installed for the mobile project: `npx playwright install`.

**Checkpoint**: Baseline confirmed — implementation can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Global tokens, motion, focus, and viewport metadata that every later phase depends on. These are infrastructure — most subsequent component edits consume the tokens defined here.

> The reduced-motion and viewport-meta tasks are observable behaviour; where a deterministic assertion is feasible it is written first (T003). Token definitions themselves are exercised indirectly by the component phases' tests.

- [X] T003 [FND] Add failing reduced-motion + viewport-meta e2e assertions in `tests/e2e/game-flow.spec.ts`: (a) with `prefers-reduced-motion: reduce` emulated, assert no element on the playing screen has a continuously-running CSS animation (e.g., none of the known animation classes report a non-`none` running animation); (b) assert the document exposes a `theme-color` meta and dark `color-scheme`. Confirm RED (`npm run test:e2e`).
- [X] T004 [FND] In `src/app/globals.css`, add the responsive design tokens to `:root` per `data-model.md` (`--bp-sm`, `--bp-lg`, `--space-page`, `--space-page-top`, `--gap-section`, `--fs-brand`, `--fs-score`, `--fs-score-final`, `--fs-stat-title`, `--fs-body`, `--fs-label`, `--fs-micro`, `--board-max`, `--chip-pad-y/x`, `--slot-pad-y/x`, `--rank-col-w`, `--touch-min`, `--blob-size`, `--overlay-ring`, `--solved-fs`), each via `clamp(MIN, vw, MAX)` with `MAX` = current desktop pixel value. Add `@media (min-width:640px)`/`(min-width:1024px)` overrides only where a step change is desired.
- [X] T005 [FND] In `src/app/globals.css`, add `@media (prefers-reduced-motion: reduce)` neutralizing `.aurora-1`, `.aurora-2`, `confettiDrop`, `.text-shimmer-gold` (static gold color), `radialPulse`, `solvedBurst`, `orbitSpin`, `orbitSpinReverse`, `pulseBeat`, and the `.animate-*` utilities (set `animation: none` / single static frame). Essential solved/complete state must remain visible by non-motion means.
- [X] T006 [FND] In `src/app/globals.css`, add a `:focus-visible` outline safety-net rule that is clearly visible on the dark theme at all sizes (FR-015).
- [X] T007 [FND] In `src/app/layout.tsx`, add `export const viewport: Viewport = { themeColor: '#020408', colorScheme: 'dark' }` (import `type { Viewport } from 'next'`). Keep `layout.tsx` a Server Component (no `'use client'`). Run `npm run test:e2e` — T003 assertions now GREEN.

**Checkpoint**: Tokens available to all components; reduced-motion + focus + theme-color in place.

---

## Phase 3: User Story 2 — Reorder Countries by Touch (Priority: P1) 🎯 MVP-critical

**Goal**: Finger-drag a country into/between slots without the page scrolling; keep tap-to-place and keyboard reordering intact; ensure board controls meet 44×44px.

**Independent Test**: On the mobile Playwright project, drag a pool chip into a slot without changing scroll position; tap a chip to fill the next open slot; confirm keyboard reorder still works on desktop.

### Tests for User Story 2 (Test-First — MUST fail before implementation)

- [X] T008 [US2] Add the mobile Playwright project in `playwright.config.ts` (`{ name: 'mobile-chrome', use: { ...devices['Pixel 5'] } }`) alongside the existing `chromium` project. (Enables the mobile assertions to run; no app behaviour yet.)
- [X] T009 [US2] Add failing touch-drag scenario in `tests/e2e/game-flow.spec.ts` (mobile project): perform a touch drag of a `[data-testid="pool-chip"]` onto a `[data-testid="ranking-slot"]`; assert the chip is placed and `window.scrollY` is unchanged during/after the gesture. Confirm RED.
- [X] T010 [US2] Add failing full-game-by-touch scenario in `tests/e2e/game-flow.spec.ts` (mobile project): complete all three stats using touch interactions (tap-to-place acceptable) and reach `[data-testid="result-card"]`. Confirm RED on the mobile project.

### Implementation for User Story 2

- [X] T011 [US2] In `src/components/game/RankingBoard.tsx`, import `TouchSensor` from `@dnd-kit/core` and add `useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })` to `useSensors`, keeping the existing `PointerSensor` and `KeyboardSensor`.
- [X] T012 [US2] In `src/components/game/RankingBoard.tsx`, add `touchAction: 'none'` to the draggable nodes only: the `PoolChipItem` `<li>` style and the `SlotDraggableContent` wrapper `<div>` style. Do NOT add it to the board/page container.
- [X] T013 [US2] In `src/components/game/RankingBoard.tsx`, replace fixed sizing with tokens: pool-chip padding → `--chip-pad-*`; slot padding → `--slot-pad-*`; rank-number `width: 20px` → `--rank-col-w`; ensure chip and slot min-height ≥ `--touch-min` (44px). Keep all `data-testid`s and tap-to-place handlers unchanged. Run `npm run test:e2e` — T009/T010 GREEN; existing chip ≥44px test still GREEN.

**Checkpoint**: Touch dragging works without page scroll; tap-to-place + keyboard intact; board controls ≥44px.

---

## Phase 4: User Story 1 — Play Comfortably on a Phone (Priority: P1)

**Goal**: Playing screen fits 320–414px with no horizontal scroll, fluid sizing, safe-area insets, and viewport-sized decorative effects.

**Independent Test**: At 320/360/390/414px the playing screen has no horizontal scrollbar, all primary elements are visible, and blobs/overlay never overflow.

### Tests for User Story 1 (Test-First — MUST fail before implementation)

- [X] T014 [US1] Add failing no-horizontal-scroll assertions for the PLAYING screen in `tests/e2e/game-flow.spec.ts` (mobile project): for widths 320, 360, 390, 414, assert `document.documentElement.scrollWidth <= window.innerWidth`. Confirm RED where currently overflowing.
- [X] T015 [US1] Add failing ≥44px touch-target assertion in `tests/e2e/game-flow.spec.ts` (mobile project) for `[data-testid="submit-btn"]` and `[data-testid="ranking-slot"]` bounding boxes. Confirm RED if any are under 44px.

### Implementation for User Story 1

- [X] T016 [US1] In `src/app/page.tsx`, update the content column (`:557`): horizontal padding → `max(var(--space-page), env(safe-area-inset-left/right))`, top → `--space-page-top`, bottom → `max(var(--space-page), env(safe-area-inset-bottom))`, `max-w-md` → `maxWidth: 'var(--board-max)'`, vertical rhythm → `--gap-section`.
- [X] T017 [P] [US1] In `src/app/page.tsx`, size the aurora blobs (`:485,501`) `width`/`height` → `var(--blob-size)`; the round-complete rings (`:524`) → `var(--overlay-ring)`; the "SOLVED" text (`:542`) → `var(--solved-fs)`; the header wordmark → `var(--fs-brand)`.
- [X] T018 [P] [US1] In `src/components/game/StatPanel.tsx`, set the stat title (`:127`) → `var(--fs-stat-title)` and paddings → spacing tokens.
- [X] T019 [P] [US1] In `src/components/game/ScoreDisplay.tsx`, set the score value (`:31`) → `var(--fs-score)`. Run mobile e2e — T014/T015 GREEN.

**Checkpoint**: Playing screen is fully usable and overflow-free on phones; desktop unchanged.

---

## Phase 5: User Story 3 — Read Results and Feedback Clearly on Mobile (Priority: P2)

**Goal**: Results screen fits phones; large score number scales; five-column feedback and correct-value grids fit and are legible; share button comfortable.

**Independent Test**: On phone viewports, the completed-game results screen has no horizontal scroll, both 5-cell grids fit, all text ≥ floor, share ≥44px.

### Tests for User Story 3 (Test-First — MUST fail before implementation)

- [X] T020 [US3] Add failing no-horizontal-scroll assertions for the RESULTS screen in `tests/e2e/game-flow.spec.ts` (mobile project) using a pre-completed game state (reuse the existing `localStorage` injection pattern): for widths 320/360/390/414 assert `scrollWidth <= innerWidth`. Confirm RED if overflowing.
- [X] T021 [US3] Add failing ≥44px assertion for `[data-testid="share-btn"]` bounding box on the mobile project. Confirm RED if under 44px.

### Implementation for User Story 3

- [X] T022 [US3] In `src/components/game/ResultCard.tsx`, set the score number (`:244`) → `var(--fs-score-final)`, card `maxWidth` (`:190`) → `var(--board-max)`, section paddings/gaps → spacing tokens, and ensure the share button has a comfortable width and min-height ≥ `--touch-min`. Keep all `data-testid`s.
- [X] T023 [P] [US3] In `src/components/game/FeedbackRow.tsx`, raise the 9–11px text (icon/name/value, `:62,74,83,101`) to `var(--fs-micro)`/`var(--fs-label)`; reduce inter-cell `gap` on narrow widths; keep `minWidth: 0` so five cells never overflow.
- [X] T024 [P] [US3] In `src/components/game/CorrectValuesRow.tsx`, raise the 8–9px text (`:43,52,57,58`) to a legible floor (`var(--fs-micro)`); keep the 5-cell flex layout overflow-free. Run mobile e2e — T020/T021 GREEN.

**Checkpoint**: Results screen is legible and overflow-free on phones; desktop appearance preserved.

---

## Phase 6: User Story 4 — Accessibility & Motion Preferences (Priority: P2)

**Goal**: Tooltip openable/dismissible on touch and viewport-clamped; focus visible everywhere; reduced-motion honored (foundation T005); aria-live + icon-feedback preserved.

**Independent Test**: On touch, open and dismiss the stat tooltip; it never clips off-screen at 320–414px; keyboard focus always visible; reduced-motion suppresses animations.

### Tests for User Story 4 (Test-First — MUST fail before implementation)

- [X] T025 [US4] Add failing unit tests in `tests/unit/Tooltip.test.tsx`: tapping/clicking the trigger shows the tooltip content; a subsequent outside tap (or Escape) hides it. Confirm RED (`npm test -- Tooltip`).
- [X] T026 [US4] Add failing e2e assertion in `tests/e2e/game-flow.spec.ts` (mobile project): tapping the stat label affordance shows the tooltip and its bounding box stays within the viewport at a 320–414px width. Confirm RED.

### Implementation for User Story 4

- [X] T027 [US4] In `src/components/ui/Tooltip.tsx`, add a tap/click toggle to open (in addition to hover/focus), plus dismissal via outside-tap and Escape; make the trigger an accessible interactive control with a ≥`--touch-min` tappable area. Run `npm test -- Tooltip` — GREEN.
- [X] T028 [US4] In `src/components/ui/Tooltip.tsx`, change the panel width to `min(240px, calc(100vw - <gutter>))` and clamp horizontal positioning so it never clips off-screen at narrow widths (FR-017). Run mobile e2e — T026 GREEN.

**Checkpoint**: Tooltip usable on touch and on-screen; focus visible; reduced-motion honored.

---

## Phase 7: Polish & Cross-Cutting — Full Quality Gate

**Purpose**: Verify all success criteria and the constitution gates together.

- [X] T029 Re-run the full Vitest suite (`npm test`) and fix any assertion that legitimately changed due to fluid sizing — update only intentionally, preserving every `data-testid` and the known checks (existing chip ≥44px e2e; summary score-bar inline `transition === ''`). Confirm ≥ 80% global coverage.
- [X] T030 Run the complete quality gate from repo root: `npm run build` (strict compile + Next.js build, zero errors), `npm test` (all pass, ≥80% coverage), `npm run test:e2e` (both `chromium` and `mobile-chrome` projects green). All three must pass before merge.
- [X] T031 Manual verification matrix (per quickstart): 320/360/390/414/768/1280px no-overflow; reduce-motion on/off; keyboard-only focus + reorder + tooltip; notched-device safe-area. Record any deviations as follow-up tasks.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start here.
- **Foundational (Phase 2)**: depends on Phase 1. BLOCKS all user-story phases (they consume the tokens and rely on reduced-motion/focus/viewport).
- **User Story phases (3–6)**: all depend on Phase 2.
  - **US2 (Phase 3)** is sequenced first among stories (highest user value: the core mechanic must work on touch).
  - **US1 (Phase 4)** and **US3 (Phase 5)** touch different primary files and can proceed in parallel after Phase 2; both also rely on the mobile Playwright project added in T008 (Phase 3).
  - **US4 (Phase 6)** is independent of US1/US3 except for shared reliance on Phase 2.
- **Polish (Phase 7)**: depends on Phases 3–6 complete.

### Within Each User Story

1. Write failing test(s) → confirm RED.
2. Implement to GREEN.
3. Validate at the checkpoint.

### Parallel Opportunities

- **T017 + T018 + T019** (US1 component sizing): different files — parallel.
- **T023 + T024** (US3 grid legibility): different files — parallel.
- **US1 (Phase 4) and US3 (Phase 5)**: different primary files — can run concurrently after Phase 2 and after T008 lands the mobile project.
- **US4 (Phase 6)**: can run concurrently with US1/US3 (Tooltip is an isolated file).

### Sequential Constraints

- T008 (mobile Playwright project) must land before any mobile-project assertion (T009, T010, T014, T015, T020, T021, T026) can run.
- Phase 2 (T004 tokens) must land before component sizing tasks (T013, T016–T019, T022–T024) consume `var(--token)`.
- `RankingBoard.tsx` tasks (T011–T013) are sequential (same file).
- `Tooltip.tsx` tasks (T027–T028) are sequential (same file).
- `page.tsx` tasks (T016, T017) are sequential (same file).

---

## Parallel Example: User Story 1 component sizing

```bash
# After Phase 2 tokens and T016 column update, these touch different files:
Task: "page.tsx blobs/overlay/wordmark → tokens"        # T017
Task: "StatPanel.tsx title/paddings → tokens"           # T018
Task: "ScoreDisplay.tsx score value → token"            # T019
```

## Parallel Example: User Story 3 grids

```bash
Task: "FeedbackRow.tsx raise tiny text to legible floor"        # T023
Task: "CorrectValuesRow.tsx raise tiny text to legible floor"   # T024
```

---

## Implementation Strategy

### MVP First

1. Phase 1 (baseline) → Phase 2 (foundation) → **Phase 3 (US2 touch reorder)**.
2. **STOP and VALIDATE**: a full game is playable by touch on a phone. This is the minimum bar for "mobile friendly".
3. Then Phase 4 (US1 comfort) for a polished playing screen.

### Incremental Delivery

1. Foundation in place (tokens, motion, focus, meta).
2. US2 → game playable on touch (MVP-critical).
3. US1 → playing screen fully comfortable/overflow-free on phones.
4. US3 → results screen legible on phones.
5. US4 → tooltip-on-touch, focus, reduced-motion polish.
6. Full gate → desktop + mobile e2e green, coverage ≥80%.

---

## Notes

- `[P]` tasks operate on different files with no unresolved dependency — safe to run concurrently.
- **Do NOT migrate to Tailwind classes** — keep inline styles; add responsiveness via `var(--token)` + `clamp()` (user decision).
- **Preserve every `data-testid`** (FR-021) — no element identifiers change.
- **Keep `@dnd-kit` `KeyboardSensor`** (constitution NON-NEGOTIABLE + FR-012) and the **tap-to-place** handlers (FR-011) — do not remove either when adding `TouchSensor`.
- **Token ceilings = current desktop pixel values** so desktop does not regress (FR-022).
- `RankingList.tsx`, `CountryCard.tsx` (dead code) and `DevPanel.tsx` (dev-only) are out of scope and not modified.
- No new types in `src/types/index.ts`; the tooltip tap-open boolean is local component state.
- The viewport meta tag itself is auto-injected by Next.js 16 — only `themeColor`/`colorScheme` are added (see research.md Decision 6).
