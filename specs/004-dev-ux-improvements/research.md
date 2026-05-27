# Research: Dev Testing & UX Improvements

**Feature**: `004-dev-ux-improvements`
**Phase**: 0 — Research & Decision Log
**Date**: 2026-05-27

---

## Topic 1: Flag Rendering at Larger Chip Sizes

**Question**: The pool chips use `<span class="fi fi-{flagCode}">` (CSS-based flags from `flag-icons` v7.5.0). At the current `font-size: 14px` the flags are 14 px tall — too small. At the target ≥ 48 px chip height, what is the right way to scale them?

**Investigation**:
- `flag-icons` SVG sprites are served as CSS background-images; the span's rendered height equals its `font-size` (the library defines `height: 1em`).
- The `postinstall` script copies `node_modules/flag-icons/flags/4x3/*.svg` to `public/flags/`, making each flag available as `/flags/{code}.svg`. These are crisp SVGs at any size.
- Two options: (A) increase `font-size` on the `<span>`; (B) switch to `<img src="/flags/{code}.svg">` with explicit `width`/`height`.

**Decision**: **Option A — increase `font-size` on the CSS flag `<span>`.**

**Rationale**: The SVG sprite approach scales perfectly with font-size (no pixelation). Switching to `<img>` would require changes across all locations where flags are rendered (`PoolChipItem`, `SlotDraggableContent`, locked slot display, `DragOverlay`, and the new `FeedbackRow`), introducing risk without benefit. Keeping the `fi fi-*` pattern preserves code consistency and the `aria-hidden="true"` / screen-reader pattern already in place.

**Target sizes**: Pool chip flag: `font-size: 22px` (up from 14px). This yields ≈22 px flag height; combined with `padding: 12px 20px` and `font-size: 15px` text, the chip li element reaches ≈ 48 px height.

**Alternatives considered**:
- `<img>` tags: More bytes, more markup changes, same visual result.
- CSS `transform: scale()` on the span: Scales visually but does not increase the layout size, so touch target would stay the same.

---

## Topic 2: FeedbackRow — Country Identity Display Approach

**Question**: How should past guesses show country identity? Three sub-options: (A) add country names below the existing emoji squares; (B) replace the emoji squares with full country chips (flag + name + border color); (C) show a compact "mini-chip" per position (flag + name, no remove button, colored border).

**Investigation**:
- Option A (labels below squares): Requires the least change to `FeedbackRow` but produces a cramped two-row layout; names would need to be very small (~10px) to fit 5 per row at max-width 448px.
- Option B (full chips): Matches the pool/slot chip aesthetics exactly. Each cell would be ~80-100 px wide, and 5 cells at max-width 448px fits with 6-8 px gap (448 / 5 = 89.6 px per cell).
- Option C (mini-chips): Same as B but with reduced padding. Most visually lightweight and still clearly readable.

**Decision**: **Option C — compact mini-chip per position, colored by correctness.**

Each of the 5 positions in a `FeedbackRow` renders a rounded cell containing:
- Flag `<span>` at `font-size: 16px`
- Country name at `font-size: 11px` (truncated if long)
- Green border + subtle green background if correct (`bulls[i] === true`)
- Red border + subtle red background if incorrect
- A small ✓ or ✗ icon in the top-right corner (satisfies Constitution V: shape, not color alone)
- `aria-label="Position N: {country name} — correct/incorrect"`

The existing emoji (`🟩`/`🟥`) is removed from the display (the colored border + icon replaces it visually). The `aria-label` on each cell retains the accessibility information.

**Rationale**: The mini-chip approach gives maximum information per row without overwhelming the layout. It reuses the same design vocabulary as the pool chips (rounded corners, `--surface-2` background, `--border-hover` or colored border). Five 89-px-wide cells fit within 448 px with 7 px gaps (5×89 + 4×7 = 473 — slightly over). Therefore, the cells must use `flex: 1` with a wrapping flex parent, allowing them to compress slightly on narrow viewports. On 1280 px viewports this is not an issue.

**Alternatives considered**:
- Option A (labels below): Too cramped, hard to read at small font sizes.
- Option B (full-size chips): Excessive vertical height per row when multiple guesses stack.
- Keeping emoji + adding country name text: Results in inconsistent visual rhythm.

---

## Topic 3: DevPanel Randomize Implementation

**Question**: How should the randomize action be implemented? The current `DevPanel` fetches `/api/puzzles` on mount and shows a date list. Options: (A) keep the list but add a "Random" button at the top; (B) replace the list entirely with a single randomize button; (C) show only the randomize button with a small indicator of the currently loaded puzzle.

**Investigation**:
- The spec says: "Make all the hardcoded tests go away, and make the dev testing be a randomize seed one instead."
- The current date-picker list is broken because `handleDevDateChange` in `page.tsx` calls `setWrongGuessEffect(false)`, a state setter that was never declared. Clicking any date causes a runtime crash.
- The `/api/puzzles` endpoint is only used by `DevPanel`; it can stay as-is.

**Decision**: **Option B — replace the date-list entirely with a single "Randomize" button.**

**Rationale**: The user explicitly asked to remove date-picker controls. A single button is simpler, harder to misuse, and matches the spirit of "generates another day." The `todayDate` and `currentDate` props can be repurposed to show a "current override" indicator in the button pill. The `onDateChange` callback stays the same.

**Implementation**:
1. `DevPanel` fetches `/api/puzzles` on mount (same as before) and stores `dates: string[]` in state.
2. The expanded panel now shows just one button: "⚡ Randomize". Clicking it picks `dates[Math.floor(Math.random() * dates.length)]` and calls `onDateChange(picked)`.
3. A "Reset to today" button appears when overriding (same as before).
4. The toggle button pill still shows the current override date suffix when active.

**`page.tsx` fix**: Remove `setWrongGuessEffect(false)` from `handleDevDateChange`. There is no `wrongGuessEffect` state — `roundCompleteEffect` is the only visual-effect state. The correct cleanup is `setRoundCompleteEffect(false)`, which is already called via the existing `setRoundCompleteEffect(false)` path — but review confirms the reset already sets it to false via the destructured `setRoundCompleteEffect` at line 236. To be safe: replace `setWrongGuessEffect(false)` with nothing (the `roundCompleteEffect` reset is not needed on a fresh puzzle load).

**Alternatives considered**:
- Option A (keep list + add random button): Adds more UI complexity than needed; the date list is the thing that's broken.
- Option C (no list, just button + indicator): Same as B; the "indicator" is the existing toggle button pill, which already shows the override date.

---

## Topic 4: Bug Fix — `setWrongGuessEffect` Undeclared

**Question**: Line 163 of `page.tsx` calls `setWrongGuessEffect(false)` inside `handleDevDateChange`. This setter does not exist. What is the correct fix?

**Investigation**:
- The `useState` declarations in `page.tsx` (lines 61-62) show `roundCompleteEffect` / `setRoundCompleteEffect` as the only visual-effect state.
- There is no `wrongGuessEffect` state. This appears to be a leftover reference from an earlier design that was partially removed.
- `handleDevDateChange` resets all transient state when switching puzzles. Resetting `roundCompleteEffect` to `false` is correct cleanup; there is no separate "wrong guess" visual effect state.

**Decision**: Remove the `setWrongGuessEffect(false)` call. Replace with `setRoundCompleteEffect(false)` to be explicit.

**Rationale**: Removing an undefined reference fixes the runtime crash. Adding `setRoundCompleteEffect(false)` is defensive cleanup — ensures any in-progress round-complete animation is halted when switching puzzles.

---

## Topic 5: `FeedbackRow` — Server vs Client Component

**Question**: `FeedbackRow` is currently a Server Component (no `'use client'`). Adding `countries: Country[]` prop does not require any client hooks. Should it gain `'use client'`?

**Decision**: **No — keep `FeedbackRow` as a Server Component.**

**Rationale**: The component only renders static markup from props. Adding country lookup from an array is pure rendering logic. No `useState`, `useEffect`, or browser APIs are needed. This satisfies Constitution III (push `'use client'` boundary to lowest necessary level).

---

## Topic 6: Guess Order Persistence

**Question**: The `Guess.order: string[]` field already stores the full submitted country ID ordering. Does anything need to change in `loadGameState` / `saveGameState` to support history display?

**Decision**: **No changes needed.** The `order` field has been stored in `GameState` since the initial implementation. `FeedbackRow` simply needs the `countries` array passed to it so it can look up names from IDs.

---

## Summary Table

| Decision | Choice | Key Reason |
|----------|--------|-----------|
| Flag scaling | Increase CSS `font-size` on `fi fi-*` span | SVGs scale perfectly; no structural change |
| Pool chip target height | `padding: 12px 20px`, `font-size: 15px`, flag `22px` | Reaches ≥ 48 px height |
| FeedbackRow country display | Compact mini-chip per position (flag + name + icon + color border) | Max info, consistent design vocabulary |
| DevPanel redesign | Single "Randomize" button, remove date list | Matches spec intent, fixes broken UX |
| `setWrongGuessEffect` bug | Replace with `setRoundCompleteEffect(false)` | Fixes crash, defensive cleanup |
| FeedbackRow client boundary | Stay Server Component | No client hooks needed |
| Guess data for history | Use existing `Guess.order` + pass `countries` prop | Already stored; no schema change |
