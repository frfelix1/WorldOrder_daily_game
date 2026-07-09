# Phase 0 Research: Line-Scale Placement Mechanic

**Feature**: 010-line-scale-placement
**Date**: 2026-07-09
**Input**: [plan.md](./plan.md) Technical Context + [spec.md](./spec.md)

This document resolves the open design decisions and technology questions surfaced by the Technical Context. The single explicit `NEEDS CLARIFICATION` carried from the spec — the exact per-stat scoring formula — is resolved in Decision 5. All other items confirm the "keep the same stack" direction the user requested.

---

## Decision 1 — Stack: keep existing tools, add a leaf client component

**Decision**: Implement the mechanic with the existing stack — Next.js 16 App Router, React 19, TypeScript strict, `@dnd-kit/core`, Tailwind v4, Vitest + Playwright. Add a new leaf `'use client'` component `LineScaleBoard` mounted inside the already-client `src/app/page.tsx`. Do not introduce any new runtime dependency.

**Rationale**:
- The user explicitly asked to keep the same stack.
- `src/app/page.tsx` is already `'use client'`; a new interactive leaf component fits App Router discipline (Constitution III) without escalating any server/client boundary. Bundled Next docs (`01-app/.../use-client.md`) confirm `'use client'` marks an entry point for interactive UI — exactly this case.
- `@dnd-kit/core` already provides pointer, touch, and keyboard sensors used by the current `RankingBoard`; reusing it preserves the mandated keyboard support (Constitution V) with zero new dependencies.

**Alternatives considered**:
- *New drag library (e.g., a slider/range lib)*: Rejected — adds a dependency, violates "keep the stack," and would need its own keyboard/accessibility story.
- *Native `<input type="range">` per country*: Rejected — five overlapping range inputs on one axis is awkward, hard to show a shared value readout and per-token feedback, and diverges from the "drag a ball/icon" interaction the user described. dnd-kit gives finer control over token visuals and a shared readout.
- *Build bespoke pointer-event handling*: Rejected — reinvents drag/keyboard/touch handling dnd-kit already solves and the codebase already depends on.

---

## Decision 2 — Position representation: normalized 0–1 per country

**Decision**: Represent each token's placement as a normalized fraction `t ∈ [0, 1]` along the line, where `0` = far left (min value of the five) and `1` = far right (max value of the five). Store placements as `Record<countryId, number>` (the fraction). Derive on demand:
- **Displayed value** at fraction `t`: `value(t) = min + t × (max − min)` (linear interpolation), formatted via existing `formatStatValue(value, unit)`.
- **Left-to-right order**: sort country IDs ascending by their fraction `t`.

**Rationale**:
- Normalized fractions are resolution-independent (unaffected by pixel width / viewport / device pixel ratio), which keeps logic pure and deterministic (Constitution IV) and makes unit testing trivial.
- Linear interpolation matches the user's stated model ("leftmost = smallest value, rightmost = highest value"), and reuses `formatStatValue` so units/formatting stay consistent with feature 007.
- Keeping order derivation as "sort by fraction" cleanly decouples *where* a token sits from *what value* it reads, and makes the win check (order vs. true ranking) a pure comparison.

**Alternatives considered**:
- *Store raw values instead of fractions*: Rejected — couples stored state to the stat's value scale and complicates clamping/interpolation; fraction is the natural UI-space unit.
- *Store pixel offsets*: Rejected — non-deterministic across viewports, hard to test, and would break the pure-logic guarantee.
- *Log scale for wide-range stats (e.g., GDP)*: Rejected for v1 — the user described a straightforward "least → most" line and endpoints as literal min/max of the five; a linear scale is simplest and matches the spec. (Noted as a possible future enhancement; out of scope here.)

---

## Decision 3 — Win condition & deterministic tie-break

**Decision**: A stat is **solved** when the tokens' left-to-right order (ascending by fraction `t`) exactly equals the stat's true ranking order (already available as `StatDef.solution`, respecting `direction`). Per-token "correct relative position" feedback is computed positionally against the solution order (mirroring today's `bulls[]`), and correct tokens lock (mirroring today's lock-correct-retry-the-rest behavior). If two tokens share an identical fraction, break the tie **deterministically by country ID** (stable, reproducible ordering) so evaluation never depends on drag/data ordering.

**Rationale**:
- The clarified win condition is "correct left-to-right order," independent of exact value position (proximity affects score only).
- The generator guarantees no tied *true* values among selected countries (Constitution Puzzle Data Integrity), so exact answer-key ties don't occur; but two *player* tokens can still coincide, so a deterministic tie-break is required for reproducibility (Constitution IV) and to keep the order unambiguous (spec FR-011, edge case).
- Reusing the positional-correctness pattern preserves the existing feedback/lock/advance loop and the `FeedbackRow` component with minimal change.

**Alternatives considered**:
- *Require each token inside a tolerance band of its true value to "win"*: Rejected by clarification (that was Option B; the user chose relative-order).
- *Tie-break by drag recency / array index*: Rejected — non-deterministic or state-dependent; violates reproducibility.

---

## Decision 4 — Proximity accuracy metric

**Decision**: Define each country's **true fraction** `tᵢ*` by mapping its true value onto the same linear min–max scale: `tᵢ* = (valueᵢ − min) / (max − min)`. Define per-country placement error `eᵢ = |tᵢ − tᵢ*| ∈ [0, 1]`. Define the round's **mean accuracy** `A = 1 − (Σ eᵢ / 5) ∈ [0, 1]` (1 = perfect placement, lower = further off). Guard the degenerate `max === min` case by treating accuracy as fully satisfied (all values identical ⇒ any placement is "on value"); this cannot arise from generated puzzles but keeps the function total and safe.

**Rationale**:
- Uses the same linear scale as display, so "closer on screen" ⇒ "higher accuracy," matching the user's mental model ("more points the closer your guesses are to the exact correct location").
- Mean absolute error is simple, bounded, monotonic, and easy to unit-test deterministically.
- Averaging over all five tokens gives a smooth 0–1 accuracy that the scoring function can scale within the cap.

**Alternatives considered**:
- *Squared error / RMSE*: Rejected for v1 — over-penalizes a single far-off token; mean absolute error is more forgiving and easier to reason about. (Can revisit later.)
- *Only score the final solving guess's accuracy vs. best-ever accuracy*: Deferred; v1 uses the accuracy of the **final (solving) placement**, which is well-defined and matches "how close your guesses are" at solve time.

---

## Decision 5 — Scoring formula (resolves the spec's NEEDS CLARIFICATION)

**Decision**: Keep `ROUND_MAX = 33`, `DECAY_BASE = 0.65`, `PERFECT_BONUS = 1`, `GAME_MAX = 100` unchanged. Replace the per-stat score with a **penalty × proximity** blend that stays within `[0, 33]`:

```
base(wrongGuesses)      = ROUND_MAX × DECAY_BASE ^ wrongGuesses      // existing penalty curve
accuracyFactor(A)       = ACCURACY_FLOOR + (1 − ACCURACY_FLOOR) × A  // A ∈ [0,1] from Decision 4
scoreForStat            = round( base(wrongGuesses) × accuracyFactor(A) )   // clamped to [0, 33]
```

with a new constant **`ACCURACY_FLOOR = 0.8`** (a solve always keeps at least 80% of the penalty-adjusted base, so being solved is never worthless, but perfect placement earns the full amount).

Total game score = sum of the three per-stat scores, plus `PERFECT_BONUS` when **all three** stats hit the full 33 (i.e., 0 wrong guesses **and** `A = 1`), preserving the 0–100 ceiling.

**Worked examples** (illustrative):
- First-try solve, perfect placement: `base=33`, `A=1` → `33 × 1 = 33`. Three such → `99 + 1 = 100`.
- First-try solve, mediocre placement `A=0.5`: `33 × (0.8 + 0.2×0.5) = 33 × 0.9 ≈ 30`.
- One wrong guess, good placement `A=0.9`: `base=33×0.65≈21.45`, factor `=0.8+0.2×0.9=0.98` → `≈ 21`.
- Two wrong guesses, poor placement `A=0.2`: `base≈13.94`, factor `=0.84` → `≈ 12`.

**Monotonicity guarantees** (satisfy FR-013/FR-014, SC-004/SC-005):
- Fewer wrong guesses ⇒ larger `base` ⇒ higher score (all else equal). ✔ (penalty)
- Higher accuracy `A` ⇒ larger `accuracyFactor` ⇒ score never lower for the same wrong-guess count ("closer is never penalized"). ✔ (proximity)
- Output is `round(...)` clamped to `[0, 33]` ⇒ integer within cap (FR-015). ✔
- Total stays within `[0, 100]` with the existing perfect bonus (FR-016). ✔

**Rationale**:
- Preserves the existing 0–100 range, per-stat cap, and perfect bonus so historical scores, streaks, and `scoreDistribution` buckets remain comparable (clarification: "keep 0–100, blend penalty + proximity").
- Reuses the well-understood exponential penalty from feature 006 as the "base," layering proximity as a multiplicative factor bounded by `ACCURACY_FLOOR` so the two concerns compose cleanly and remain monotonic.
- All constants are centralized in `scoring.ts` for easy tuning, and the function stays pure (Constitution IV).

**Alternatives considered**:
- *Additive proximity bonus on top of base*: Rejected — risks exceeding the 33 cap or requiring awkward re-clamping that breaks monotonicity at the boundary.
- *Proximity as the primary driver, redefine max*: Rejected by clarification (would break score comparability).
- *No accuracy floor (factor = A)*: Rejected — a correct-order solve with poor placement could score near 0, punishing the win itself; the floor keeps solving meaningful while still rewarding precision. `ACCURACY_FLOOR` is a tunable constant, defaulted at 0.8.

> Note: `ACCURACY_FLOOR = 0.8` is an informed default chosen to keep solves rewarding while giving proximity a meaningful 20% swing. It is a single named constant and can be tuned during implementation/playtesting without structural change.

---

## Decision 6 — Rendering a "drag along a line" with dnd-kit

**Decision**: Render a full-width horizontal **track** as a single droppable region. Each country token is a `useDraggable` element absolutely positioned by `left: t%` (static placement) and translated during an active drag via CSS `transform: translateX(...)` from dnd-kit's delta. On drag end, convert the token's final x within the track's bounding box into a clamped fraction `t = clamp((x − trackLeft) / trackWidth, 0, 1)` and update state. During drag, compute the hovered fraction from the live delta to drive the value readout on each animation frame.

**Rationale**:
- Satisfies the Performance Budget: only `transform` changes during drag (no `left/top/width` mutation mid-drag); static `left: t%` is applied only after release, matching the existing `RankingBoard` transform-based pattern.
- A single droppable track (rather than five slots) directly delivers "place anywhere on the line" (FR-003) and clamping at the ends (FR-006).
- dnd-kit's `TouchSensor` (with an activation delay/tolerance, as already configured) prevents page scroll during a drag (FR-019); `KeyboardSensor` provides discrete keyboard movement (FR-020).

**Alternatives considered**:
- *Five fixed droppable slots*: Rejected — that's the mechanic being replaced.
- *Continuous `pointermove` re-layout via `left`*: Rejected — layout-triggering during drag violates the Performance Budget.

---

## Decision 7 — Live value readout & performance

**Decision**: Show a value readout that (a) follows the actively dragged token (near the token or on a shared axis label) and (b) shows the interpolated value for the current fraction, formatted with `formatStatValue`. Update it from dnd-kit drag-move deltas, coalesced to at most one update per animation frame (`requestAnimationFrame`) to hit the ~100 ms responsiveness target without excess re-renders. Expose the current value to assistive tech via an `aria-live="polite"`/label on the readout (Constitution V).

**Rationale**: Meets SC-002 (readout updates within ~100 ms) and keeps re-render cost bounded; reuses existing formatting; preserves accessibility announcements.

**Alternatives considered**:
- *Update on every pointer event synchronously*: Rejected — can cause excessive re-renders / jank; rAF-coalescing is the standard mitigation.
- *Only show value on release*: Rejected — the user explicitly wants the value highlighted *while moving* across the line.

---

## Decision 8 — Keyboard & accessibility model

**Decision**: With `KeyboardSensor` active, a focused token moves along the line in **discrete steps** (e.g., Arrow Left/Right = small step; Home/End = jump to min/max). Announce the token's current value on move and on drop via the readout's live region. Convey per-token correctness with an **icon/shape plus color** (reuse the existing checkmark for correct; a distinct shape/icon for not-yet-correct), never color alone. All tokens are in Tab order.

**Rationale**: Directly satisfies Constitution V (keyboard support retained; state conveyed by shape/icon in addition to color; Tab-reachable; aria-live announcements) and spec FR-020 / SC-009.

**Alternatives considered**:
- *Continuous keyboard drag*: Rejected — discrete steps are more predictable for keyboard users and easier to test deterministically.

---

## Decision 9 — State shape & backwards-compatible persistence

**Decision**: In `page.tsx`, replace the slot-index arrays (`slotAssignments: (string|null)[]`, `lockedSlots: boolean[]`) with per-country placement state: `positions: Record<countryId, number>` (fraction) plus derived order. Extend the `Guess` type to carry the submitted placements (e.g., add an optional `positions?: Record<string, number>` alongside the existing `order`/`bulls`), keeping older fields for backwards compatibility with any saved games and the existing share-grid logic. Persist through `game-state.ts` only (Constitution IV).

**Rationale**:
- Per-country fractions are the natural state for a line; `order` and `bulls` are still derivable for feedback/share and for score recomputation from `guesses[]` (Constitution IV: scoring recomputed, never mutated).
- Additive/optional `Guess` fields avoid breaking existing persisted state and the `buildShareText`/`FeedbackRow` paths (spec FR-017/FR-018).

**Alternatives considered**:
- *Replace `Guess` shape entirely*: Rejected — would break saved games and the share/results pipeline; additive extension is safer.

---

## Decision 10 — Testing strategy (test-first, coverage gate)

**Decision**: Follow Red-Green-Refactor (Constitution II):
1. **`tests/unit/line-scale.test.ts`** (before `line-scale.ts`): interpolation (min/max/midpoint), clamping past ends, order derivation, deterministic ID tie-break, proximity `A` including `max===min` guard.
2. **`tests/unit/scoring.test.ts`** (extend): proximity-aware `scoreForStat` — perfect vs. mediocre placement, wrong-guess decay, monotonicity, `[0,33]` bounds, total `[0,100]`, perfect-bonus only when all three are full 33.
3. **`tests/unit/LineScaleBoard.test.tsx`** (before component): renders track + 5 tokens + endpoint labels; placement updates order; readout reflects position; keyboard move; a11y (roles/labels, icon+color feedback).
4. **`tests/e2e/game-flow.spec.ts`** (update before ship): drive placement instead of slots via new `data-testid`s; full 3-stat game + resume + results; run on Chromium and mobile-chrome.
Keep global coverage ≥ 80%; run `npm run build`, `npm test`, `npm run test:e2e` as merge gates (Constitution Quality Gates).

**Rationale**: Matches the constitution's non-negotiable test-first + coverage requirements and the existing test layout; pure-logic modules make the highest-value logic (scoring/interpolation) fully unit-testable.

**New/updated `data-testid`s (for e2e)**: `line-scale-board`, `line-scale-track`, `line-token` (one per country), `line-value-readout`, plus reuse of existing `stat-panel`, `submit-btn`, `feedback-row`, `next-stage-btn`, `result-card`. The old `pool-chip` / `ranking-slot` / `ranking-board` selectors are retired with the old component.

---

## Summary of Resolved Unknowns

| Item | Resolution |
|------|------------|
| Stack | Keep as-is; new leaf client component + pure lib modules; no new deps |
| Position model | Normalized fraction `t ∈ [0,1]`; linear value interpolation via `formatStatValue` |
| Win condition | Left-to-right order equals `StatDef.solution`; deterministic tie-break by country ID |
| Proximity metric | Mean absolute error → accuracy `A = 1 − mean|tᵢ − tᵢ*|`, with `max===min` guard |
| **Scoring formula** | `round(ROUND_MAX × 0.65^wrong × (0.8 + 0.2×A))`, clamped `[0,33]`; total `[0,100]` + perfect bonus (**NEEDS CLARIFICATION resolved**) |
| Drag rendering | Single droppable track; `transform` during drag, `left:%` on release; clamp at ends |
| Readout | Follows token; rAF-coalesced; `aria-live` for AT; ~100 ms target |
| Keyboard/a11y | Discrete keyboard steps; icon+shape+color feedback; Tab order; announcements |
| State/persistence | `positions: Record<id, number>`; additive optional `Guess.positions`; via `game-state.ts` |
| Testing | Test-first unit (line-scale, scoring) + component + updated e2e; ≥80% coverage |

**All NEEDS CLARIFICATION items are resolved. Ready for Phase 1 (data-model, contracts, quickstart).**
