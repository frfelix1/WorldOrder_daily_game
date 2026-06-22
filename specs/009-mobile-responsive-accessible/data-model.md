# Data Model: Mobile-Friendly & Accessible Responsive Layout

**Feature**: 009 — Mobile-Friendly & Accessible Responsive Layout
**Date**: 2026-06-22

---

## Overview

This feature is **presentation and interaction only**. It introduces:

- A set of **responsive design tokens** (CSS custom properties) in `src/app/globals.css`.
- A reduced-motion CSS block and minor base-style additions in `globals.css`.
- A `viewport` export in `src/app/layout.tsx`.
- One new sensor + `touch-action` styling in `RankingBoard.tsx`.
- Tooltip touch-open state.
- Fluid sizing substitutions across the game components.

It introduces **no** new API fields, **no** localStorage schema changes, and **no** new TypeScript interfaces in `src/types/index.ts`. The only new runtime state is local UI state in `Tooltip` (open/closed via tap).

---

## Responsive Design Tokens (`globals.css :root`)

Tokens are defined with `clamp(MIN, PREFERRED, MAX)`. `MIN` enforces an accessibility/legibility floor; `MAX` equals the current desktop pixel value to prevent desktop regression (FR-022). Names below are the canonical set; values are indicative and finalized during implementation.

### Breakpoints (used sparingly via `@media`)

| Token | Value | Purpose |
|-------|-------|---------|
| `--bp-sm` | `640px` | phone → tablet step |
| `--bp-lg` | `1024px` | tablet → desktop step |

### Spacing

| Token | Indicative definition | Consumed by |
|-------|----------------------|-------------|
| `--space-page` | `clamp(12px, 4vw, 24px)` | column horizontal padding (`page.tsx`) |
| `--space-page-top` | `clamp(16px, 4vw, 24px)` | column top padding |
| `--gap-section` | `clamp(16px, 4vw, 20px)` | vertical gap between page blocks |

### Typography

| Token | Indicative definition | Replaces (current fixed) |
|-------|----------------------|--------------------------|
| `--fs-brand` | `clamp(1.75rem, 7vw, 2.25rem)` | header `text-4xl` wordmark (`page.tsx`) |
| `--fs-score` | `clamp(13px, 3.5vw, 15px)` | running score value (`ScoreDisplay`) |
| `--fs-score-final` | `clamp(3rem, 14vw, 5rem)` | `5rem` results score (`ResultCard:244`) |
| `--fs-stat-title` | `clamp(16px, 4.5vw, 18px)` | `18px` stat label (`StatPanel:127`) |
| `--fs-body` | `clamp(13px, 3.5vw, 14px)` | 14px country names |
| `--fs-label` | `clamp(10px, 2.6vw, 11px)` | small labels |
| `--fs-micro` | `clamp(10px, 2.6vw, 12px)` | **raises** the 8–9px grid text (`FeedbackRow`, `CorrectValuesRow`) to a legible floor (FR-008) |

### Component dimensions

| Token | Indicative definition | Consumed by |
|-------|----------------------|-------------|
| `--board-max` | `min(100%, 28rem)` | content column max-width (`page.tsx`), result card max-width (`ResultCard:190`) |
| `--chip-pad-y` / `--chip-pad-x` | `clamp(10px,2.8vw,12px)` / `clamp(14px,4vw,20px)` | pool chip padding (`RankingBoard`) |
| `--slot-pad-y` / `--slot-pad-x` | similar | ranking slot padding (`RankingBoard`) |
| `--rank-col-w` | `clamp(20px, 6vw, 24px)` | rank-number column width |
| `--touch-min` | `44px` | minimum touch-target floor for controls (FR-007) |

### Effects (must not cause overflow — FR-006)

| Token | Indicative definition | Consumed by |
|-------|----------------------|-------------|
| `--blob-size` | `min(70vw, 520px)` | aurora blobs (`page.tsx:485,501`) |
| `--overlay-ring` | `min(120vw, 700px)` | round-complete radial rings (`page.tsx:524`) |
| `--solved-fs` | `clamp(1.75rem, 9vw, 2.8rem)` | "SOLVED" burst text (`page.tsx:542`) |

---

## Base-Style Additions (`globals.css`)

### Reduced-motion block

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable/neutralize: aurora float, confetti, shimmer sweep, radial pulse,
     solved burst, orbital spinners, pulse beat. Animations become 'none' or
     a single static frame. Essential solved/complete STATE remains (icon +
     persistent styling + aria-live). */
}
```

### Focus visibility

A baseline `:focus-visible` outline rule to guarantee FR-015 at all sizes (components already set some focus rings; this is the safety net).

### Safe-area support

The content column and any fixed edge content add `env(safe-area-inset-*)` to their padding (FR-005).

---

## `viewport` Export (`src/app/layout.tsx`)

```typescript
import type { Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#020408', // matches --bg
  colorScheme: 'dark',
};
```

| Field | Value | Requirement |
|-------|-------|-------------|
| `themeColor` | `#020408` | FR-020 (mobile browser chrome matches dark UI) |
| `colorScheme` | `dark` | FR-020 (native control theming) |

> `width`/`initialScale` are intentionally omitted — Next.js 16 auto-injects them. Pinch-zoom is left enabled (accessibility).

---

## Component Changes

### `RankingBoard.tsx` (touch DnD — US2)

| Element | Change | Requirement |
|---------|--------|-------------|
| `useSensors(...)` | Add `useSensor(TouchSensor, { activationConstraint: { delay: ~180, tolerance: ~8 } })` alongside existing Pointer + Keyboard | FR-010, FR-013 |
| `PoolChipItem` `<li>` | Add `touchAction: 'none'`; padding → `--chip-pad-*`; ensure min height ≥ `--touch-min` | FR-007, FR-010 |
| `SlotDraggableContent` wrapper | Add `touchAction: 'none'` | FR-010 |
| Slot `<li>` (`SlotDropZone`) | padding → `--slot-pad-*`; rank column width → `--rank-col-w`; ensure ≥44px height | FR-007 |
| Tap-to-place handlers | Unchanged (kept as equal path) | FR-011 |
| `KeyboardSensor` | Unchanged (kept) | FR-012 |

No prop/interface changes; `RankingBoardProps` is unchanged.

### `Tooltip.tsx` (touch + clamp — US4)

| Aspect | Old | New | Requirement |
|--------|-----|-----|-------------|
| Open trigger | hover + focus only | hover + focus + **tap toggle** | FR-016 |
| Dismiss | mouse-leave/blur | also tap-elsewhere / Escape | FR-016 |
| Width | `240px` fixed | `min(240px, calc(100vw - <gutter>))` | FR-017 |
| Horizontal position | `translateX(-50%)` (can clip) | clamped to stay on-screen | FR-017 |
| Affordance hit area | inline text | interactive, ≥`--touch-min` tappable | FR-007 |

New local state: tap-open boolean (in addition to the existing `visible`), or `visible` reused with a tap path. No exported types.

### `ResultCard.tsx` (results legibility — US3)

| Element | Change | Requirement |
|---------|--------|-------------|
| Score number (`:244`) | `fontSize` → `--fs-score-final` | FR-002 (no h-scroll), SC-001 |
| Card container (`:190`) | `maxWidth` → `--board-max` | FR-004 |
| Section paddings/gaps | → spacing tokens | FR-003 |
| Confetti | guard under reduced-motion (via CSS block) | FR-014 |
| Share button | ensure width + ≥`--touch-min` height | FR-007 |
| `data-testid`s | unchanged | FR-021 |

### `FeedbackRow.tsx` & `CorrectValuesRow.tsx` (tiny text — US3)

| Element | Old | New | Requirement |
|---------|-----|-----|-------------|
| Name / value / icon text | 8–11px fixed | → `--fs-micro` / `--fs-label` floors | FR-008 |
| 5-cell row | `flex` with `minWidth:0` (kept) + reduced gap on narrow | no overflow | FR-009, SC-002/3 |
| `data-testid`s | unchanged | FR-021 |

### `StatPanel.tsx` & `ScoreDisplay.tsx`

| Element | Change | Requirement |
|---------|--------|-------------|
| `StatPanel` title (`:127`) | `fontSize` → `--fs-stat-title`; paddings → tokens | FR-003 |
| `ScoreDisplay` value (`:31`) | `fontSize` → `--fs-score` | FR-003 |
| Score bar | already `%`-width (no change to logic) | — |

### `page.tsx` (column + effects — US1)

| Element | Change | Requirement |
|---------|--------|-------------|
| Column wrapper (`:557`) | padding → `--space-page*`; `max-w-md` → `--board-max`; add safe-area insets | FR-001, FR-004, FR-005 |
| Aurora blobs (`:485,501`) | `width/height` → `--blob-size` | FR-006 |
| Round-complete rings (`:524`) | `width/height` → `--overlay-ring` | FR-006 |
| "SOLVED" text (`:542`) | `fontSize` → `--solved-fs` | FR-006 |
| Header wordmark | `fontSize` → `--fs-brand` | FR-003 |

---

## Validation Rules

| Rule | Source | How enforced |
|------|--------|--------------|
| No horizontal scroll at 320–414px | FR-001/002, SC-001 | e2e: `documentElement.scrollWidth <= innerWidth` at each width |
| Primary controls ≥ 44×44px | FR-007, SC-002 | e2e bounding-box checks (extends existing chip ≥44px test) |
| No essential text < accessible floor | FR-008, SC-003 | tokens have px floors; unit/e2e assertions where deterministic |
| Touch drag lands without page scroll | FR-010, SC-005 | e2e touch-drag with scroll-position assertion |
| Reduced motion suppresses animation | FR-014, SC-006 | e2e with `prefers-reduced-motion` emulated; assert no running animations |
| Focus indicator visible | FR-015, SC-007 | e2e/keyboard focus check |
| Tooltip touch-openable & on-screen | FR-016/017, SC-008 | unit (tap opens) + e2e (within viewport at 320–414px) |
| All `data-testid`s preserved | FR-021 | existing suite continues to locate elements |
| No desktop regression | FR-022, SC-010 | existing desktop e2e/unit remain green |

---

## No New Types Required

All types already exist in `src/types/index.ts` (`Country`, `StatDef`, `GameState`, `StatSession`, `Guess`, `PuzzleFile`). The tooltip's tap-open boolean is local component state; no named export is added.
