# Data Model: Dev Testing & UX Improvements

**Feature**: `004-dev-ux-improvements`
**Phase**: 1 — Design
**Date**: 2026-05-27

---

## Overview

This feature makes no changes to data storage schemas. All three improvements operate at the UI/component level using data already present in the existing `GameState`, `Guess`, and `Country` types.

The data model document focuses on:
1. Which existing entities are read (not mutated) by the new/changed components
2. Validation rules that the new rendering code must respect
3. State transitions for the new `DevPanel` randomize flow

---

## Entities Consumed (No Changes to Types)

### `Country` (`src/types/index.ts`)

```
Country {
  id:       string   // ISO alpha-3 (e.g. "NGA", "BRA")
  name:     string   // Display name (e.g. "Nigeria")
  flagCode: string   // ISO alpha-2 lowercase (e.g. "ng", "br") — used in fi fi-{code}
}
```

**Used by**: `FeedbackRow` (new — country name + flag lookup per position), `RankingBoard` (existing `PoolChipItem` — size increased only), `page.tsx` (passed down to `FeedbackRow`).

**Validation rules for rendering**:
- `flagCode` is always 2 lowercase letters; safe to concatenate directly into CSS class `fi fi-{flagCode}`.
- `name` may be up to ~25 characters (longest in current dataset: "United Arab Emirates" — 20 chars); chips must handle truncation gracefully via `text-overflow: ellipsis` or wrapping.

### `Guess` (`src/types/index.ts`)

```
Guess {
  order: string[]    // Length 5; each element is a Country.id
  bulls: boolean[]   // Length 5; bulls[i] === true iff order[i] is correct
}
```

**Used by**: `FeedbackRow` (reads both `order` and `bulls` to render per-position mini-chips).

**Validation rules**:
- `order.length === 5` and `bulls.length === 5` — guaranteed by `handleSubmit` in `page.tsx`.
- `order[i]` must resolve to a `Country` in the puzzle's `countries` array — guaranteed by puzzle loading (only pool countries can be placed).
- If `order[i]` does not resolve (defensive): render a placeholder "?" cell rather than crashing.

### `StatSession` (`src/types/index.ts`)

```
StatSession {
  statId:  string
  solved:  boolean
  guesses: Guess[]   // Chronological; last element is the solving guess when solved === true
}
```

**Used by**: `page.tsx` — iterates `activeSession.guesses` to render `<FeedbackRow>` instances. No change to how sessions are read or written.

### `GameState` (`src/types/index.ts`)

No changes. The `activeStatIndex`, `stats[n].guesses`, and `status` fields are read identically to the current code.

---

## State Transitions: Randomize Flow

The `DevPanel` randomize action triggers an existing state-reset flow in `page.tsx`. The sequence is:

```
[User clicks Randomize in DevPanel]
        │
        ▼
DevPanel: picks random date from dates[]
        │
        ▼
onDateChange(randomDate) → handleDevDateChange(randomDate) in page.tsx
        │
        ▼
page.tsx resets: puzzle=null, gameState=null, slotAssignments=EMPTY,
                 lockedSlots=EMPTY, announcement='', roundCompleteEffect=false
        │
        ▼
setDevDate(randomDate)  [triggers effectiveDate change]
        │
        ▼
useEffect([effectiveDate]) fires → loadGameState(puzzleNumber) → fetchPuzzle(randomDate)
        │
        ▼
New puzzle loaded → useEffect([puzzle]) fires → new GameState initialized
        │
        ▼
pageStatus = 'playing' with fresh state
```

**Key constraint**: If `randomDate === TODAY`, the behavior is identical to "reset to today" — `handleDevDateChange` already handles this: `setDevDate(date === TODAY ? null : date)`.

**Edge case**: If `/api/puzzles` returns an empty list (no puzzle files exist), the randomize button should be disabled and labeled "No puzzles available". This is a defensive UI state, not expected in normal usage.

---

## Rendering Model: `FeedbackRow` (New)

### Rendering Context

`FeedbackRow` is rendered **exclusively during active play** (`pageStatus === 'playing'`), in the section between the `StatPanel` and the `RankingBoard`. It is rendered for the **currently active stat only** — it shows the history of guesses the player made for the round they are currently playing, so they can reference previous attempts before submitting the next one.

The complete (`pageStatus === 'complete'`) state renders only the `ResultCard` — `FeedbackRow` is not shown there. This is intentional: the country-identity display is a strategic aid during play, not a retrospective.

The relevant section in `page.tsx` (already in place):

```tsx
{/* ── Historical feedback rows ── */}
{activeSession && activeSession.guesses.length > 0 && (
  <div className="flex flex-col gap-2.5">
    {activeSession.guesses.map((guess, i) => (
      <FeedbackRow
        key={i}
        guess={guess}
        countries={puzzle.countries}   // ← NEW prop thread-through
        statIndex={activeStatIndex + 1}
        guessIndex={i + 1}
      />
    ))}
  </div>
)}
```

### Cell Data Model

Each `FeedbackRow` renders a horizontal row of 5 position cells. Each cell represents one ranked position in that guess.

```
PositionCell {
  position:  number        // 1–5 (display rank)
  countryId: string        // from Guess.order[i]
  country:   Country|null  // looked up from countries prop; null = defensive fallback
  isCorrect: boolean       // from Guess.bulls[i]
}
```

**Visual states**:

| State | Border | Background | Icon |
|-------|--------|-----------|------|
| Correct | `rgba(0,232,150,0.35)` (success) | `rgba(0,232,150,0.07)` | ✓ checkmark (green) |
| Incorrect | `rgba(255,48,98,0.3)` (wrong) | `rgba(255,48,98,0.08)` | ✗ cross (red) |

**Layout**: `display: flex; flex-wrap: nowrap` with 5 flex children (`flex: 1`). Minimum cell width ~72 px; on max-width 448 px (the game column width), each cell is 448/5 - gap = ~81 px before gap subtraction. With `gap: 6px` and 4 gaps: (448 - 24) / 5 ≈ 84.8 px per cell.

**Accessibility**:
- Each cell: `role="listitem"` (parent is `role="list"`)
- `aria-label="Position {N}: {country name} — {correct/incorrect}"`
- Icon (✓/✗) is `aria-hidden="true"` (information conveyed by `aria-label`)

---

## Rendering Model: Enlarged `PoolChipItem` (Changed)

No new data; only sizing tokens change.

| Property | Before | After |
|----------|--------|-------|
| `padding` | `8px 14px` | `12px 20px` |
| Flag `font-size` | `14px` | `22px` |
| Name `font-size` | `13px` | `15px` |
| `gap` (flag–name) | `8px` | `10px` |
| `borderRadius` | `24px` | `24px` (unchanged) |

Resulting chip height: `22px` flag height (≈ 22px) + `12px * 2` vertical padding + any text-height difference ≈ 15px text → total ≈ 15 + 24 = 39 px content + padding → **~47–50 px**, meeting the 48 px target.

The drag overlay in `RankingBoard` uses the same flag/text sizes and should be updated proportionally to match the new chip proportions for visual consistency.

---

## No Schema Changes

The following are explicitly **not changed**:

- `localStorage` keys `worldorder_state` / `worldorder_stats`
- The `GameState`, `Guess`, `StatSession`, `Country`, `StatDef`, `PuzzleFile`, `PlayerStats` TypeScript interfaces in `src/types/index.ts`
- API routes `/api/puzzle` and `/api/puzzles`
- Scoring logic in `src/lib/scoring.ts`
- Puzzle utilities in `src/lib/puzzle.ts`
- Game state persistence in `src/lib/game-state.ts`
