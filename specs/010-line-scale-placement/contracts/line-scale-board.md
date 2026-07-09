# UI Contract: LineScaleBoard component

**Feature**: 010-line-scale-placement
**Date**: 2026-07-09
**Type**: Client React component contract (this app's external "interface" is its interactive UI, not a network API — the game exposes no write endpoints per Constitution III).

This contract defines the **stable surface** of the new `LineScaleBoard` component and the `page.tsx` integration so implementation and tests can be written independently (test-first, Constitution II). It replaces the `RankingBoard` contract.

---

## Component: `LineScaleBoard`

**File**: `src/components/game/LineScaleBoard.tsx` · leaf `'use client'`

### Props

```ts
export interface LineScaleBoardProps {
  /** The five countries in play (identity + flag). */
  countries: Country[];

  /** Scale endpoints for the active stat, derived from StatDef.values. */
  min: number;
  max: number;
  /** Unit for readout/endpoint labels (e.g. "km²", "million USD"). '' when none. */
  unit: string;

  /**
   * Current placement per country as a fraction t ∈ [0,1] (0 = far left/min,
   * 1 = far right/max). Absent key = not yet placed.
   */
  positions: Record<string, number>;

  /** Countries locked as correct on a prior guess (not repositionable). */
  locked: Record<string, boolean>;

  /** Emitted when the player moves/places a token (pointer, touch, or keyboard). */
  onPositionsChange: (positions: Record<string, number>) => void;

  /** When true, disables all interaction (stat solved / game over animation window). */
  disabled?: boolean;
}
```

### Behavioral contract

| ID | Behavior | Spec ref |
|----|----------|----------|
| B1 | Renders a single horizontal track spanning available width; left end labeled with `formatStatValue(min, unit)`, right end with `formatStatValue(max, unit)`. | FR-002 |
| B2 | Renders one draggable token per country. Tokens with a `positions[id]` are placed at `left: t×100%`; unplaced tokens appear in a staging area/tray to be dragged onto the track. | FR-001, FR-004 |
| B3 | A token can be dropped at **any** horizontal position on the track (not snapped to fixed slots). On release, its fraction = `clamp01((x − trackLeft) / trackWidth)`. | FR-003, FR-006 |
| B4 | Dragging a token past either end clamps it to `0` or `1`. | FR-006 |
| B5 | While a token is actively dragged, a value readout shows `formatStatValue(valueAtFraction(t,min,max), unit)` for the token's current fraction, updated at most once per animation frame. | FR-005, SC-002 |
| B6 | Emits `onPositionsChange` with the updated map on each successful move/placement; does not mutate the incoming `positions` object. | FR-007 |
| B7 | `locked[id] === true` tokens are not draggable and are visually marked correct (icon/shape + color, not color alone). | Constitution V, FR-010 |
| B8 | Keyboard: a focused token moves in discrete steps (Arrow Left/Right; Home/End to min/max) and emits `onPositionsChange`; current value announced via a live region. | FR-020, SC-009 |
| B9 | `disabled === true` blocks all pointer/touch/keyboard interaction. | (solved state) |
| B10 | Drag uses CSS `transform` only during motion; static placement uses `left: %` applied after release (no layout-triggering props mid-drag). | Constitution Performance Budget |
| B11 | Touch-dragging a token does not scroll the page; the component is usable with no horizontal page scroll at ≥320px width. | FR-019, SC-008 |

### Required `data-testid` hooks (for RTL + Playwright)

| testid | Element |
|--------|---------|
| `line-scale-board` | Root container |
| `line-scale-track` | The horizontal line/track (droppable) |
| `line-token` | Each country token (repeated; include an identifying attribute such as `data-country={id}`) |
| `line-value-readout` | The live value indicator shown while moving a token |
| `line-endpoint-min` / `line-endpoint-max` | Endpoint value labels |

### Accessibility contract

- Each token is keyboard-focusable, has an accessible name (country name) and communicates its current value/position (e.g., `aria-valuetext` or an associated live region).
- The value readout is announced politely (`aria-live="polite"`) on move/drop.
- Correct/locked state is conveyed by an **icon or shape in addition to color** (reuse existing checkmark for correct).
- Respects `prefers-reduced-motion`: non-essential token/readout animation is minimized.

---

## Integration contract: `src/app/page.tsx`

The page keeps its existing status flow (`loading | error | playing | complete`), submit/advance handlers, persistence, live/final score, and results screen. Only the input wiring changes.

| ID | Requirement | Spec ref |
|----|-------------|----------|
| P1 | Replace `slotAssignments`/`lockedSlots` state with `positions: Record<string, number>` and `locked: Record<string, boolean>` for the active stat. | research D9 |
| P2 | Compute `min`/`max`/`unit` for the active stat from `stat.values` (guard missing values). | FR-002 |
| P3 | Render `LineScaleBoard` in place of `RankingBoard`, passing the props above. | FR-001 |
| P4 | Disable the submit control until all five countries have a `positions` entry. | FR-008 |
| P5 | On submit: derive `order = deriveOrder(positions)`; `bulls[i] = order[i] === stat.solution[i]`; `solved = bulls.every(Boolean)`; push `Guess { order, bulls, positions }`. | FR-009, FR-011 |
| P6 | On a wrong guess: mark correct tokens `locked`, keep them fixed, allow repositioning the rest; on solve, allow advance; after stat 3, complete the game. | FR-010, FR-012 |
| P7 | `runningScore`/`finalScore` recomputed via `totalScore(stats)` using each stat's final-placement accuracy; never mutate score in place. | FR-013–FR-016, Constitution IV |
| P8 | Persist `positions` within each `Guess` and restore board state on reload (active stat + solved stats). | FR-017, SC-010 |
| P9 | Results/share (`ResultCard`, `buildShareText`) reflect per-stat outcomes; grid still driven by `bulls`. | FR-018 |

---

## Non-goals (explicitly out of contract)

- No changes to `data/dataset.json`, `puzzle-generator.ts`, `puzzle.ts`, or `src/app/api/**`.
- No new dependencies.
- No log/non-linear scale (v1 is linear per research D2).
- No change to daily rotation, 3-stats-per-day, or 5-countries-per-day structure (FR-021).
