# Quickstart: Mobile-Friendly & Accessible Responsive Layout (Feature 009)

**Branch**: `feature/mobile-responsive`
**Spec**: `specs/009-mobile-responsive-accessible/spec.md`
**Plan**: `specs/009-mobile-responsive-accessible/plan.md`

---

## Prerequisites

```bash
git checkout -b feature/mobile-responsive   # branch from main
npm install
npx playwright install                       # ensure browsers for mobile e2e
npm run build                                # confirm green before you start
npm test                                     # confirm all tests pass (≥ 80% coverage)
npm run test:e2e                             # confirm existing e2e is green
```

---

## Guiding Principles

- **Keep inline styles.** Do NOT migrate to Tailwind classes. Add responsiveness by referencing CSS custom properties (`var(--token)`) defined in `globals.css` and using `clamp()` for fluid scaling.
- **Token ceilings = current desktop pixel values** so desktop does not visually regress.
- **Preserve every `data-testid`.** The suite locates elements by them.
- **Test-First.** For each behavioural change (touch drag, no-horizontal-scroll, reduced motion, tooltip-on-tap), write the failing test FIRST and confirm RED before implementing.
- **Keyboard DnD and tap-to-place stay intact** — they are equal, non-negotiable interaction paths.

---

## Development Order

### Phase 1 — Foundation: tokens, reduced motion, focus, viewport meta

**Files**: `src/app/globals.css`, `src/app/layout.tsx`

1. In `globals.css :root`, add the responsive design tokens from `data-model.md` (spacing, typography, component dimensions, effects), each defined with `clamp(MIN, vw, MAX)`. Add `@media (min-width: 640px)` / `(min-width: 1024px)` overrides only where a step change is wanted.
2. Add `@media (prefers-reduced-motion: reduce)` that neutralizes: `.aurora-1`/`.aurora-2`, `confettiDrop`, `.text-shimmer-gold` (→ static gold color), `radialPulse`, `solvedBurst`, `orbitSpin`/`orbitSpinReverse`, `pulseBeat`. Set their `animation` to `none` (or a single static frame).
3. Add a `:focus-visible` outline safety-net rule (visible at all sizes).
4. Add `viewport` export in `layout.tsx`:

```typescript
import type { Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#020408',
  colorScheme: 'dark',
};
```

> `layout.tsx` must remain a Server Component (no `'use client'`) for `viewport` to work.

**Verify**: `npm run build` green; manually toggle OS reduce-motion and confirm ambient/celebration motion stops.

---

### Phase 2 — Touch drag-and-drop (write tests RED first)

**Test file**: `tests/e2e/game-flow.spec.ts` (mobile project — see Phase 5 for config)

Write failing scenarios (RED):
- On a mobile viewport, a full game completes using touch (tap-to-place and/or drag) and reaches the result card.
- Dragging a pool chip into a slot does **not** change `window.scrollY` during the gesture and the chip lands in the slot.

**Implementation**: `src/components/game/RankingBoard.tsx`
- Import `TouchSensor` from `@dnd-kit/core` and add to `useSensors`:

```typescript
import { TouchSensor /* + existing PointerSensor, KeyboardSensor */ } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  useSensor(KeyboardSensor),
);
```

- Add `touchAction: 'none'` to the draggable nodes: the `PoolChipItem` `<li>` style and the `SlotDraggableContent` wrapper `<div>` style. Do NOT put it on the page/board container.
- Replace chip/slot padding and the rank-number `width: 20px` with the tokens (`--chip-pad-*`, `--slot-pad-*`, `--rank-col-w`); ensure chip and slot heights are ≥ 44px (`--touch-min`).
- Leave `handlePoolChipClick`, `handleEmptySlotClick`, `handleRemoveFromSlot`, and the `KeyboardSensor` untouched.

**Verify**: mobile e2e scenarios GREEN; existing chip ≥44px e2e still GREEN.

---

### Phase 3 — Playing screen fluidity

**Files**: `src/app/page.tsx`, `src/components/game/StatPanel.tsx`, `src/components/game/ScoreDisplay.tsx`

1. Column wrapper (`page.tsx:557`): replace fixed `px-4 pt-6 pb-12` / `max-w-md` with token-based padding and `maxWidth: 'var(--board-max)'`; add safe-area insets, e.g. `paddingLeft: 'max(var(--space-page), env(safe-area-inset-left))'` (and right/bottom).
2. Aurora blobs (`page.tsx:485,501`): `width`/`height` → `var(--blob-size)`.
3. Round-complete rings (`page.tsx:524`): `width`/`height` → `var(--overlay-ring)`; "SOLVED" text (`page.tsx:542`) → `var(--solved-fs)`.
4. Header wordmark → `var(--fs-brand)`.
5. `StatPanel` title (`:127`) → `var(--fs-stat-title)`; paddings → spacing tokens.
6. `ScoreDisplay` value (`:31`) → `var(--fs-score)`.

**Verify**: at 320/360/390/414px the playing screen has no horizontal scroll; blobs/overlay never create overflow.

---

### Phase 4 — Results legibility + tooltip

**Files**: `src/components/game/ResultCard.tsx`, `FeedbackRow.tsx`, `CorrectValuesRow.tsx`, `src/components/ui/Tooltip.tsx`

**Tooltip (write unit test RED first)** — `tests/unit/Tooltip.test.tsx`:
- Tapping/clicking the trigger makes the tooltip content visible.
- Tapping elsewhere (or Escape) hides it.

Then implement in `Tooltip.tsx`:
- Add a tap/click toggle in addition to hover/focus; add outside-tap / Escape dismissal.
- Width → `min(240px, calc(100vw - <gutter>))`; clamp horizontal position so it never clips at narrow widths.
- Ensure the trigger affordance is an interactive, ≥44px-tappable target.

**ResultCard**:
- Score number (`:244`) → `var(--fs-score-final)`; card `maxWidth` (`:190`) → `var(--board-max)`; section paddings/gaps → tokens; share button width + ≥44px height.

**FeedbackRow / CorrectValuesRow**:
- Raise the 8–11px text to `var(--fs-micro)` / `var(--fs-label)`; reduce inter-cell gap on narrow widths; keep `minWidth: 0` so 5 cells never overflow.

**Verify**: results screen at 360px has no horizontal scroll; five-cell rows fit; all text ≥ floor; tooltip opens on tap and stays on-screen.

---

### Phase 5 — Mobile test project + full gate

**File**: `playwright.config.ts`

Add a mobile project so the e2e flow runs on a touch device preset:

```typescript
import { devices } from '@playwright/test';

projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
],
```

Add/confirm mobile e2e assertions in `tests/e2e/game-flow.spec.ts`:
- No horizontal scroll at 320/360/390/414px on both playing and results screens.
- Full game completes via touch on the mobile project.
- Touch-drag lands a chip without changing scroll position.
- Primary controls (submit, share, chips, slots) bounding box ≥ 44×44px on mobile.
- With `prefers-reduced-motion` emulated, no continuously-running animation is present.
- Tooltip opens on tap and renders within the viewport at narrow widths.

**Full quality gate**:

```bash
npm run build          # TypeScript strict + Next.js build
npm test               # Vitest — all pass, ≥ 80% coverage
npm run test:e2e       # Playwright — desktop + mobile projects
```

All three must be green before merge.

---

## Manual Verification Matrix

| Width | Check |
|-------|-------|
| 320px | No h-scroll; all 5 slots + pool visible; text readable |
| 360 / 390 / 414px | Playing + results no h-scroll; tap targets comfortable |
| 768px (tablet) | Column centered, comfortable |
| 1280px (desktop) | No regression vs. current appearance |
| Reduce-motion ON | Ambient/celebration/confetti/shimmer/spinners suppressed; solved state still shown |
| Keyboard-only | Focus always visible; reorder works; tooltip reachable |
| Notched device | Nothing under notch/home indicator (safe-area) |

---

## File Reference

| File | Status | What changes |
|------|--------|-------------|
| `src/app/globals.css` | MODIFY | Responsive tokens; reduced-motion block; focus-visible; viewport-relative blob sizing |
| `src/app/layout.tsx` | MODIFY | `viewport` export (themeColor + colorScheme) |
| `src/app/page.tsx` | MODIFY | Column padding/max-width + safe-area; blobs/overlay/wordmark → tokens |
| `src/components/game/RankingBoard.tsx` | MODIFY | `TouchSensor` + `touch-action:none`; chip/slot/rank sizing → tokens; ≥44px |
| `src/components/game/ResultCard.tsx` | MODIFY | Score number + card width → tokens; share btn ≥44px |
| `src/components/game/StatPanel.tsx` | MODIFY | Title + paddings → tokens |
| `src/components/game/ScoreDisplay.tsx` | MODIFY | Score value font → token |
| `src/components/game/FeedbackRow.tsx` | MODIFY | Raise tiny text to legible floor |
| `src/components/game/CorrectValuesRow.tsx` | MODIFY | Raise tiny text to legible floor |
| `src/components/ui/Tooltip.tsx` | MODIFY | Tap-open + dismiss; responsive clamped width/position |
| `playwright.config.ts` | MODIFY | Add mobile device project |
| `tests/e2e/game-flow.spec.ts` | MODIFY | Mobile responsiveness + touch + reduced-motion + a11y scenarios |
| `tests/unit/Tooltip.test.tsx` | CREATE/MODIFY | Tap-to-open / dismiss behaviour |
| `src/components/game/RankingList.tsx` | NO CHANGE | Dead code — out of scope |
| `src/components/game/CountryCard.tsx` | NO CHANGE | Dead code — out of scope |
| `src/components/dev/DevPanel.tsx` | NO CHANGE | Dev-only — out of scope |
| `src/types/index.ts` | NO CHANGE | No new types |

---

## Key Patterns

**Consuming a responsive token in an inline style**:
```typescript
<p style={{ fontSize: 'var(--fs-score-final)' }}>{displayScore}</p>
```

**Safe-area-aware padding**:
```typescript
style={{ paddingBottom: 'max(var(--space-page), env(safe-area-inset-bottom))' }}
```

**TouchSensor activation (disambiguate scroll vs drag)**:
```typescript
useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
```

**touch-action on a draggable node only**:
```typescript
<li style={{ /* ...chip styles... */ touchAction: 'none' }} {...attributes} {...listeners} />
```
