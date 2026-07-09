# Quickstart: Line-Scale Placement Mechanic

**Feature**: 010-line-scale-placement
**Date**: 2026-07-09
**Audience**: Developer implementing / reviewing this feature.

This is the build-and-verify guide. It assumes the stack stays the same (Next.js 16 App Router, React 19, TypeScript strict, `@dnd-kit/core`, Tailwind v4, Vitest + Playwright) and follows test-first development (Constitution II).

---

## Prerequisites

```bash
npm install          # if not already
```

- Branch: `010-line-scale-placement`
- Read first: [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/line-scale-board.md](./contracts/line-scale-board.md)

---

## Build order (test-first)

Implement in this sequence so each unit is red → green before the next. (Exact task list is produced by `/speckit.tasks`; this is the intended flow.)

1. **Types** — extend `src/types/index.ts`:
   - Add optional `positions?: Record<string, number>` to `Guess` (backwards compatible).
   - Add any line-scale helper types.

2. **Pure logic `src/lib/line-scale.ts`** (write `tests/unit/line-scale.test.ts` first):
   - `valueAtFraction`, `fractionForValue`, `deriveOrder` (with ID tie-break), `trueFractions`, `placementAccuracy`, `clamp01`.
   - Cover: endpoints, midpoint, clamp past ends, tie-break determinism, `max===min` guard.

3. **Scoring `src/lib/scoring.ts`** (extend `tests/unit/scoring.test.ts` first):
   - Add `ACCURACY_FLOOR = 0.8`, `accuracyFactor(A)`, and proximity-aware `scoreForStat(session, accuracy)`.
   - Cover: perfect vs. mediocre placement, wrong-guess decay, monotonicity, `[0,33]` bounds, total `[0,100]`, perfect bonus only when all three = 33, legacy `Guess` (no `positions`) falls back to `A=1`.

4. **Component `src/components/game/LineScaleBoard.tsx`** (write `tests/unit/LineScaleBoard.test.tsx` first):
   - Implement the contract in [contracts/line-scale-board.md](./contracts/line-scale-board.md): track + tokens + endpoint labels + live readout, dnd-kit pointer/touch/keyboard sensors, clamp at ends, `transform`-only drag, icon+color feedback, required `data-testid`s.

5. **Integrate `src/app/page.tsx`**:
   - Swap `RankingBoard` → `LineScaleBoard`; replace slot state with `positions`/`locked`; wire submit/lock/advance/persist/score per the integration contract (P1–P9).
   - Compute `min`/`max`/`unit` from the active `stat.values`.

6. **E2E `tests/e2e/game-flow.spec.ts`** (update before shipping):
   - Drive line placement via new `data-testid`s; keep full 3-stat game, resume, and results flows; run desktop + mobile-chrome.

7. **Remove/retire `RankingBoard.tsx`** and its tests once `page.tsx` no longer imports it and e2e is green.

---

## Verify (Quality Gates — all must pass)

```bash
npm run build      # TS strict compile + Next build (Constitution Gate 1)
npm test           # Vitest, 0 failures AND ≥80% global coverage (Gate 2)
npm run test:e2e   # Playwright game-flow, desktop + mobile-chrome (Gate 3)
```

Local manual check:

```bash
npm run dev        # http://localhost:3000
```

Manual acceptance walkthrough (maps to spec Success Criteria):

- [ ] Line shows min value at far left and max at far right for the active stat, with unit. (SC-002, FR-002)
- [ ] Drag each of the five tokens to arbitrary spots; they are not snapped to five slots. (SC-001, FR-003)
- [ ] While dragging, the value readout updates promptly to the hovered position's value. (SC-002, FR-005)
- [ ] Dragging past an end clamps to min/max. (FR-006)
- [ ] Submit is blocked until all five are placed. (FR-008)
- [ ] Wrong order → not solved, correct tokens lock, reposition the rest; correct order → solved and advance. (SC-003, FR-009/FR-010/FR-012)
- [ ] First-try, near-exact placement on all three stats → 100 (with perfect bonus); wrong guesses / poor placement score strictly lower, never <0 or >per-stat cap. (SC-004–SC-007)
- [ ] At 320px width: no horizontal page scroll; touch-drag does not scroll the page. (SC-008, FR-019)
- [ ] Keyboard-only: focus a token, move it along the line, submit. (SC-009, FR-020)
- [ ] Reload mid-game restores active stat, solved stats, last placements/locks. (SC-010, FR-017)
- [ ] Reduced-motion honored; correct state shown by icon+color (not color alone). (Constitution V)

---

## Guardrails / gotchas

- **Purity**: keep all math in `src/lib/*` (deterministic, no side effects). `localStorage` only via `game-state.ts`. Recompute score from `guesses[]` — never mutate it. (Constitution IV)
- **Performance**: only CSS `transform` during drag; apply static `left:%` after release. Coalesce readout updates to `requestAnimationFrame`. (Performance Budget, SC-002)
- **Accessibility**: never disable dnd-kit `KeyboardSensor`; announce value via `aria-live`; convey correctness with shape/icon + color. (Constitution V)
- **Styling**: Tailwind utilities; the only permitted dynamic inline style is the per-token position/drag `transform`/`left` (inherently dynamic). Custom CSS only in `globals.css`. (Constitution Styling)
- **No data/API changes**: do not add `data/puzzles/*`, do not modify the generator or the puzzle route. Everything derives from the existing `StatDef.values`.
- **Next.js version**: this repo runs Next 16 with breaking changes vs. older docs — consult `node_modules/next/dist/docs/` if any App Router API behaves unexpectedly. This feature stays within the existing `'use client'` boundary, so no server/routing changes are needed.
