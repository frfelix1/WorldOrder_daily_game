# Research: Revamp Results Screen

**Feature**: 008 — Revamp Results Screen
**Date**: 2026-05-27

---

## Decision 1 — Correct-Values Display: New Component vs Inline JSX

**Decision**: Extract a new `CorrectValuesRow` component in `src/components/game/CorrectValuesRow.tsx`.

**Rationale**: The constitution requires component tests written before implementation (Principle II). A dedicated component is independently testable in `tests/unit/CorrectValuesRow.test.tsx`. Keeps `ResultCard` focused on layout; delegates cell-rendering concerns to a purpose-built component, mirroring the existing `FeedbackRow` pattern.

**Alternatives considered**:
- Inline JSX inside `ResultCard` (rejected: untestable in isolation; violates Test-First discipline for UI logic)
- Extend `FeedbackRow` with an `allValues` mode (rejected: `FeedbackRow` is guess-row semantics; "correct answer" is a distinct display concept; extending it conflates two different things)

---

## Decision 2 — Correct-Values Row: Column Order

**Decision**: Display the five countries in `StatDef.solution` order (rank 1 → rank 5 per the stat's direction).

**Rationale**: The "correct answer" row should convey ranking, not just value. `solution[0]` is rank 1 (highest value for `asc` stats, lowest for `desc`). Showing in solution order makes the row immediately readable as "the correct ranking from best to worst". This matches how the game presents the authoritative ordering throughout.

**Alternatives considered**:
- `puzzle.countries` order (arbitrary insertion order; does not communicate ranking — rejected)
- Value-descending sort (rejected: duplicates the `solution` array and could desync from it if generation ever changes)

---

## Decision 3 — Correct-Values Fallback (pre-007 Puzzles)

**Decision**: When `StatDef.values` or `StatDef.unit` is `undefined`, the `CorrectValuesRow` renders `null` (nothing). The stat section still shows the stat label and all guess rows.

**Rationale**: `values` and `unit` are optional in `StatDef` for backwards-compat. The spec explicitly requires a graceful fallback: "The stat section should still display the stat name and guesses, showing a graceful fallback (e.g., no value column) rather than crashing or showing undefined." Rendering `null` is the simplest valid fallback.

**Alternatives considered**:
- Show a "—" placeholder row (rejected: adds visual noise and implies data is expected but missing)
- Show an error state (rejected: old puzzles are expected to lack values; this is not an error condition)

---

## Decision 4 — Share Button: Clipboard-Only, Tri-State

**Decision**: Remove `navigator.share` entirely from `handleShare`. Always call `navigator.clipboard.writeText`. Introduce a tri-state `shareState: 'idle' | 'copied' | 'error'` (replacing the boolean `copied` state).

**Rationale**: FR-007 and FR-008 are unambiguous — clipboard always, no OS share dialog ever. FR-009 requires visible "Copied!" confirmation. FR-010 requires a visible error indicator if clipboard fails. The current implementation silently swallows clipboard errors (`catch { // Clipboard write failed }`). A tri-state replaces the boolean `copied` and the silent-catch anti-pattern.

**Alternatives considered**:
- Keep `navigator.share` as a fallback (rejected: FR-008 explicitly forbids any OS share mechanism)
- Separate `copied` + `error` booleans (rejected: mutually exclusive states are better modelled as a union type; avoids impossible `copied && error` state)

---

## Decision 5 — Score Bar Animation Removal

**Decision**:
- `ScoreDisplay.tsx`: Remove `animation: 'shimmerGold 2.5s linear infinite'`, remove `transition: 'width 0.8s ...'`, remove `backgroundSize: '200% auto'` (no longer needed). Keep static `backgroundImage` gradient and `boxShadow` (both are static, non-animated).
- `ResultCard.tsx` score bar: Remove `transition: 'width 1.2s ...'`. The bar renders at `pct` width immediately (already computed from `finalScore`, not `displayScore`). The score count-up number animation is NOT in scope — FR-001/FR-002 address the bar only.

**Rationale**: FR-001 forbids repeating shimmer/glow/pulse animations. FR-002 forbids width transitions. The `shimmerGold` keyframe scrolls `background-position` — this is the shimmer. The `transition: width` causes the bar to animate from 0 to full width on mount. Static `boxShadow` and a fixed gradient are not animations and are allowed.

**Alternatives considered**:
- `animation-play-state: paused` (rejected: animation still defined and could be accidentally re-enabled; cleaner to remove the property)
- Remove `boxShadow` too (rejected: spec does not forbid static glow; FR-001 says "repeating" animations; static shadow is decoration not animation)

---

## Decision 6 — Stat Section: Label + Guesses + Correct Answer Row Layout

**Decision**: Each stat section in `ResultCard` is wrapped in a `<section>` element with `aria-label={stat.label}`. Children:
1. Stat label heading (existing `<p>` with uppercase text)
2. One `<FeedbackRow>` per guess (existing, no `valueMap` — correct-position values are not needed in the summary since the full `CorrectValuesRow` is shown below)
3. One `<CorrectValuesRow>` at the bottom (new)

**Rationale**: FR-003 (distinct sections), FR-004 (stat label), FR-005 (all guess rows), FR-006 (correct values). The `<section>` + `aria-label` satisfies Principle V accessibility. `FeedbackRow` retains its standard guess-row semantics. `CorrectValuesRow` is added below the guesses as the "answer reveal".

**Alternatives considered**:
- Use `valueMap` on the last `FeedbackRow` instead of a separate row (rejected: `valueMap` only shows values for correct positions in a guess row — FR-006 requires values for ALL five countries regardless of correctness)
- Show correct values inline within each guess row cell (rejected: visually confusing — blends user guess feedback with the answer; separate row is clearer UX)

---

## Resolved Unknowns

All NEEDS CLARIFICATION items resolved:

| Unknown | Resolution |
|---------|------------|
| Order of correct values | `StatDef.solution` order (rank 1 → 5) |
| Fallback for missing `values`/`unit` | `CorrectValuesRow` renders `null`; guess rows still shown |
| Share button error state | Tri-state `'idle' \| 'copied' \| 'error'`; error message visible in button |
| Clipboard error UX | Button text changes to "Copy failed" for 2 seconds; same timeout pattern as "Copied!" |
| `shimmerGold` keyframe in globals.css | Keep the keyframe definition — it is referenced by `.text-shimmer-gold` class used on the "WorldOrder" title. Only the inline `animation` prop referencing it in `ScoreDisplay` and `ResultCard` is removed. |
| Score count-up number animation | Not in scope — spec does not mention it; FR-001/FR-002 address the bar only. |
