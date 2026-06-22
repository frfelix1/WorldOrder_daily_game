# Research: Mobile-Friendly & Accessible Responsive Layout

**Feature**: 009 — Mobile-Friendly & Accessible Responsive Layout
**Date**: 2026-06-22

---

## Context Snapshot (verified against current code)

- **Stack**: Next.js 16.2.6 (App Router), React 19, Tailwind v4 (used only for `@import "tailwindcss"`, a handful of utility classes, and `sr-only`/`flex` helpers). Components are styled almost entirely with **inline `style={{}}` objects** bound to CSS custom properties (`var(--gold)`, etc.) defined in `src/app/globals.css`.
- **Layout**: a single centered column — `src/app/page.tsx:557` uses `className="w-full max-w-md px-4 pt-6 pb-12 flex flex-col gap-5"`. Effectively a mobile-width column even on desktop, but every internal size is a **hard-coded pixel literal**.
- **Drag-and-drop (active)**: `src/components/game/RankingBoard.tsx` uses `@dnd-kit/core` `useDraggable`/`useDroppable` with `useSensors(PointerSensor{distance:8}, KeyboardSensor)` (`RankingBoard.tsx:383-386`). There is a working **tap-to-place** fallback (`handlePoolChipClick`, `handleEmptySlotClick`, `handleRemoveFromSlot`). No `TouchSensor`, no `touch-action` declarations.
- **Dead code**: `src/components/game/RankingList.tsx` + `CountryCard.tsx` (sortable variant) are imported only by each other and their own unit tests; not used by the app. Out of scope.
- **Viewport meta**: Next.js 16 **auto-injects** `<meta name="viewport" content="width=device-width, initial-scale=1">` (confirmed in `node_modules/next/dist/docs/.../generate-viewport.md`). `src/app/layout.tsx` has **no** `viewport` export, so `themeColor`/`colorScheme` are unset.
- **Constitution constraints** (`.specify/memory/constitution.md`): Test-First (NON-NEGOTIABLE) + ≥80% coverage; keyboard DnD must stay; color+icon feedback; aria-live announcements; drag animations must use `transform` only. Styling rule says "Tailwind only / no inline styles" — already pervasively violated and explicitly documented as pre-existing in feature 008.

---

## Decision 1 — Responsiveness mechanism: fluid tokens + `clamp()`, NOT a Tailwind migration

**Decision**: Introduce a small set of **responsive CSS custom properties** in `:root` within `globals.css`, defined with `clamp()` (and adjusted at a couple of `@media` breakpoints where a step change is wanted). Components keep their inline `style={{}}` objects but reference these tokens via `var(--token)` for the properties that must scale (page padding, font sizes, gaps, chip/slot padding, the big score number, overlay/blob sizes, content max-width).

**Rationale**:
- The user explicitly chose stability over a utility-class rewrite. Migrating ~1,500 lines of state-driven inline styles to Tailwind responsive prefixes would be high-risk and would churn every component plus every style-dependent test.
- `clamp(min, vw-preferred, max)` gives smooth fluid scaling across the full 320px→desktop range with **no per-component media queries**, which is current best practice for fluid typography/spacing.
- Centralizing tokens in `:root` means responsiveness is controlled in one file; inline styles consuming `var(--token)` inherit responsiveness for free.
- Inline `style` can reference CSS variables directly (`style={{ fontSize: 'var(--fs-score)' }}`), so no architecture change is needed.

**Alternatives considered**:
- **Migrate to Tailwind responsive classes** (rejected by user: high risk, large diff, breaks style-asserting tests; much styling is dynamic/state-derived and bound to CSS vars that don't map to default utilities).
- **Map CSS vars into Tailwind `@theme` and use utilities** (rejected: same churn/risk as above; bigger blast radius).
- **Per-component `@media` queries** (rejected: scatters breakpoint logic across many files; `clamp()` covers most cases with less code).

---

## Decision 2 — Token set and breakpoint strategy

**Decision**: Define a focused token set (names indicative; final names finalized in `data-model.md`) and two breakpoints.

- Breakpoints (min-width): `--bp-sm: 640px` (tablet), `--bp-lg: 1024px` (desktop) — used sparingly via `@media`. Primary scaling is fluid via `clamp()`.
- Tokens (examples):
  - Spacing: `--space-page` (column horizontal padding), `--gap-section` (vertical rhythm between blocks).
  - Type: `--fs-brand` (header wordmark), `--fs-score` (running score), `--fs-score-final` (results score number), `--fs-body`, `--fs-label`, `--fs-micro` (raised floor for the tiny grid text).
  - Components: `--chip-pad-y`, `--chip-pad-x`, `--slot-pad-y`, `--slot-pad-x`, `--rank-col-w`, `--board-gap`.
  - Effects: `--board-max` (content max-width), `--blob-size`, `--overlay-ring`, `--solved-fs`.
- Floors enforce a minimum readable/tappable size; ceilings preserve current desktop appearance.

**Rationale**: A minimal, well-named token set keeps the change auditable and lets US1/US3 reuse the same values. Two breakpoints + fluid `clamp()` covers phones, tablets, and desktop without over-engineering. Ceilings set to current desktop pixel values give FR-022 (no desktop regression) almost for free.

**Alternatives considered**:
- A large design-system token taxonomy (rejected: over-scoped for one feature).
- Pure `vw` units without `clamp()` (rejected: no floor/ceiling → unreadable on tiny screens, oversized on large ones).

---

## Decision 3 — Touch drag-and-drop: add `TouchSensor` + `touch-action: none`

**Decision**: In `RankingBoard.tsx`, extend `useSensors` to include `@dnd-kit/core`'s `TouchSensor` with an activation constraint of `{ delay: ~180ms, tolerance: ~8px }`, alongside the existing `PointerSensor` and `KeyboardSensor`. Apply `touchAction: 'none'` (inline style) to the draggable nodes (`PoolChipItem` `<li>` and the `SlotDraggableContent` wrapper) so the browser does not claim the gesture for scrolling. Keep the `PointerSensor` for mouse/stylus and as the desktop path. Tap-to-place and keyboard paths are unchanged.

**Rationale**:
- A short **delay+tolerance** activation is the dnd-kit-recommended pattern to disambiguate "tap/scroll" from "drag" on touch, so a quick flick still scrolls the page while a deliberate press-hold starts a drag. This directly satisfies FR-010/FR-013 and SC-005.
- `touch-action: none` on the **draggable element only** (not the whole page) prevents the browser's native scroll from hijacking an in-progress drag while preserving page scroll elsewhere.
- Keeping `KeyboardSensor` satisfies the constitution's non-negotiable keyboard-DnD rule and FR-012.
- dnd-kit moves items via `transform`, satisfying the constitution's "transform-only during drag" performance rule.

**Open tuning note**: `PointerSensor` already covers touch in some browsers, but relying on it alone caused scroll/drag conflicts in practice; the explicit `TouchSensor` + `touch-action` is the robust path. Final delay/tolerance values validated during implementation against the e2e touch test.

**Alternatives considered**:
- **Tap-to-place only on mobile, leave drag as-is** (rejected by user: dragging should work properly on touch).
- **`PointerSensor` with only `touch-action` fixes** (rejected: less reliable disambiguation than a dedicated `TouchSensor` with delay/tolerance; risk of accidental drags when the user intends to scroll).
- **Global `touch-action: none` on the board container** (rejected: would block legitimate page scrolling when the board is taller than the viewport).

---

## Decision 4 — Reduced-motion handling

**Decision**: Add a single `@media (prefers-reduced-motion: reduce)` block in `globals.css` that neutralizes non-essential/repeating animations: aurora float (`.aurora-1/.aurora-2`), confetti (`confettiDrop`), shimmer (`.text-shimmer-gold` → static color), radial pulse / solved burst, and the orbital/pulse loaders. Essential state (stat solved, game complete) continues to be conveyed by the persistent solved styling, the ✓ icon, and the aria-live announcement.

**Rationale**: FR-014 + SC-006. A global media block is the least-invasive, most maintainable way to honor the OS setting without touching each component's animation logic. Keeping the solved/“SOLVED” *state* (just not its motion) preserves feedback for reduced-motion users (edge case).

**Alternatives considered**:
- Gate each animation in component JS via a `useReducedMotion` hook (rejected: more code, more client logic, easy to miss cases; CSS media query is global and declarative).
- Remove animations entirely (rejected: degrades the experience for users who have not requested reduced motion; out of scope).

---

## Decision 5 — Tooltip: touch-openable + viewport-clamped width

**Decision**: Update `src/components/ui/Tooltip.tsx` so it (a) opens on tap/click (toggle) in addition to hover/focus, (b) can be dismissed (tap elsewhere / re-tap / Escape), and (c) uses a responsive width `min(240px, calc(100vw - 2 * safe-gutter))` with horizontal positioning clamped so it never clips off-screen at 320–414px. The affordance (the dotted-underline stat label) is given an accessible, ≥44px-tappable interactive role.

**Rationale**: FR-016/FR-017 + SC-008. The current tooltip is hover/focus-only (`onMouseEnter`/`onFocus`) with a fixed `width: 240px` centered via `translateX(-50%)`, which is unreachable by touch and can overflow narrow screens. Making it tap-toggleable and width-aware fixes both without changing its visual language.

**Alternatives considered**:
- Convert the tooltip to a tap-to-open popover/dialog component (rejected: larger change than needed; the existing pattern can be extended).
- Leave hover-only and rely on the direction text already shown in the panel (rejected: the tooltip carries the plain-language stat explanation, which is the accessible help text — it must be reachable on touch).

---

## Decision 6 — Viewport metadata (theme color & color scheme)

**Decision**: Add a `viewport` export to `src/app/layout.tsx` (a Server Component, which is required for `viewport`) declaring `themeColor: '#020408'` (the `--bg` value) and `colorScheme: 'dark'`. Do not redefine `width`/`initialScale` (Next.js already injects sensible defaults).

**Rationale**: FR-020. In Next.js 16 the viewport meta is auto-injected, but `themeColor`/`colorScheme` are not. Declaring them makes mobile browser chrome and native form controls match the dark UI. The `viewport` export is only valid in Server Components — `layout.tsx` qualifies (it has no `'use client'`).

**Important correction**: An earlier exploration claimed the app is "missing the viewport meta tag." That is **incorrect** for this Next.js version — the tag is auto-injected. The real gap is the missing `themeColor`/`colorScheme`, addressed here.

**Alternatives considered**:
- Hand-write a `<meta>` in the layout `<head>` (rejected: not idiomatic for App Router; the `viewport` export is the supported mechanism).
- Override `userScalable`/`maximumScale` to lock zoom (rejected: disabling pinch-zoom harms accessibility; keep zoom enabled).

---

## Decision 7 — Test strategy under Test-First + style-asserting suite

**Decision**:
- Preserve every `data-testid` (FR-021). No element identifiers change.
- Add a **mobile Playwright project** (`playwright.config.ts`) using a device preset (e.g., `devices['Pixel 5']` / iPhone) that runs responsiveness + touch assertions: no horizontal scroll at 320–414px, full game completes via touch, touch-drag lands a chip without page scroll, primary targets ≥44px.
- Add/extend **unit tests** for the tooltip touch-open behaviour and for raised-minimum font sizing where it is deterministically assertable.
- Re-run the existing suite and update only assertions that legitimately change. Notably preserve: the existing e2e checks that pool chips render ≥44px tall and that the summary score-bar inline `transition` is the empty string.
- Because the suite asserts some computed/inline styles, prefer expressing responsive sizes as `var(--token)` / `clamp()` so existing exact-value assertions either remain valid or are updated intentionally with a documented reason.

**Rationale**: SC-009 + constitution Test-First and ≥80% coverage gate. Writing the mobile e2e expectations first (RED) before implementing the touch/responsive changes keeps the workflow compliant and gives objective pass/fail signals for the headline success criteria.

**Alternatives considered**:
- Skip new mobile tests (rejected by user and by constitution).
- Snapshot-test rendered styles (rejected: brittle against fluid `clamp()` output across environments; targeted behavioural assertions are more durable).

---

## Decision 8 — Scope boundaries

**Decision**: In scope: `globals.css`, `layout.tsx`, `page.tsx`, `RankingBoard.tsx`, `ResultCard.tsx`, `StatPanel.tsx`, `ScoreDisplay.tsx`, `FeedbackRow.tsx`, `CorrectValuesRow.tsx`, `Tooltip.tsx`, plus tests and `playwright.config.ts`. Out of scope: `RankingList.tsx` + `CountryCard.tsx` (dead code), `DevPanel.tsx` (dev-only), puzzle data, scoring, API, and localStorage schema.

**Rationale**: Matches the user's confirmed scope (responsiveness + accessibility only, no redesign, no logic changes) and avoids touching unused or non-production code.

---

## Resolved Unknowns

| Unknown | Resolution |
|---------|------------|
| How to add responsiveness without Tailwind migration | Fluid `clamp()` values + centralized responsive CSS custom properties in `globals.css`; inline styles consume `var(--token)` |
| Make touch dragging reliable | Add `TouchSensor` (delay ~180ms, tolerance ~8px) + `touch-action: none` on draggable nodes; keep tap-to-place + keyboard |
| Desktop layout target | Keep single centered column; tokens have ceilings = current desktop pixel values |
| Honor reduced motion | Single `@media (prefers-reduced-motion: reduce)` block in `globals.css` |
| Tooltip on touch | Tap-to-toggle + dismiss + viewport-clamped responsive width |
| Viewport meta "missing"? | Not missing — Next 16 auto-injects it; add `themeColor`/`colorScheme` via `viewport` export only |
| Tiny 8–11px grid text | Raise to an accessible floor via `--fs-micro`/`clamp()` in `FeedbackRow` and `CorrectValuesRow` |
| Test-first compliance with style-asserting suite | Write mobile e2e expectations RED first; preserve all `data-testid`s; update style assertions only intentionally |
| Safe-area on notched devices | Apply `env(safe-area-inset-*)` to the column/edge content padding |
