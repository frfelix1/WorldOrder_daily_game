# Component Interface Contracts

**Feature**: `004-dev-ux-improvements`
**Phase**: 1 — Design
**Date**: 2026-05-27

This document defines the TypeScript prop interfaces for the three components being changed. These contracts are the ground truth for both the implementation and the tests. Any deviation in either the source or test files is a contract violation.

---

## 1. `FeedbackRow` — Changed Interface

**File**: `src/components/game/FeedbackRow.tsx`

### Current Interface

```ts
interface FeedbackRowProps {
  guess:       Guess;
  statIndex?:  number;  // 1-based stat number (display only)
  guessIndex?: number;  // 1-based guess number (display only)
}
```

### New Interface

```ts
interface FeedbackRowProps {
  guess:       Guess;
  countries:   Country[];  // NEW — full list of 5 countries for this puzzle
  statIndex?:  number;     // kept for aria/test context
  guessIndex?: number;     // kept for aria/test context
}
```

**Breaking change**: `countries` is required (no default). All existing call sites must be updated.

**Call site changes required**:

| File | Line (approx) | Change |
|------|---------------|--------|
| `src/app/page.tsx` | ~558 | Add `countries={puzzle.countries}` to each `<FeedbackRow>` |
| `tests/unit/FeedbackRow.test.tsx` | All render calls | Add `countries={testCountries}` |
| `tests/unit/GamePage.test.tsx` | Implicit via GamePage render | No direct change — `GamePage` threads it through |

**Rendering context** (critical):
`FeedbackRow` is rendered **only in the `playing` state** of `page.tsx`, in the section between `StatPanel` and `RankingBoard`. It shows the history for the **currently active stat**, so the player can see what they previously submitted before making their next guess. It is not rendered on the complete screen or for previous stats. This is the primary use case for the feature.

**Rendering contract**:

- For each `i` in `0..4`:
  - Look up `country = countries.find(c => c.id === guess.order[i]) ?? null`
  - Render a position cell with `data-testid="feedback-cell"` and `aria-label="Position {i+1}: {country?.name ?? 'Unknown'} — {guess.bulls[i] ? 'correct' : 'incorrect'}"`
  - If `guess.bulls[i] === true`: apply success styling (`--success` border/bg) and render a ✓ icon
  - If `guess.bulls[i] === false`: apply wrong styling (`--wrong` border/bg) and render a ✗ icon
  - The ✓/✗ icon has `aria-hidden="true"`
  - Flag rendered as `<span className={`fi fi-${country.flagCode}`} aria-hidden="true" />` at `font-size: 16px`; if `country === null`, render a `?` placeholder

**Removed from interface**:
- The existing `data-testid="feedback-row"` on the container is kept unchanged to avoid breaking existing test selectors.
- The emoji (`🟩`/`🟥`) is removed from the DOM — replaced by colored cell background + icon. Existing tests that assert on `screen.getAllByText('🟩')` must be updated.

---

## 2. `DevPanel` — Changed Interface

**File**: `src/components/dev/DevPanel.tsx`

### Current Interface

```ts
interface DevPanelProps {
  currentDate: string;  // YYYY-MM-DD — the puzzle date currently loaded
  todayDate:   string;  // YYYY-MM-DD — real UTC today (never changes)
  onDateChange: (date: string) => void;  // called with the new date to load
}
```

### New Interface (Unchanged — same props, different behavior)

```ts
interface DevPanelProps {
  currentDate: string;
  todayDate:   string;
  onDateChange: (date: string) => void;
}
```

**No prop signature change.** The props remain identical; only the internal behavior and rendered UI change.

**Behavioral contract (changed)**:

| Behavior | Before | After |
|----------|--------|-------|
| Panel content | Scrollable list of all available puzzle dates | Single "Randomize" button |
| Date selection | Click a specific date from the list | Click "Randomize" → random date from available list |
| "Reset to today" button | Shown when `currentDate !== todayDate` | Unchanged — still shown when overriding |
| Override indicator pill | Shows date suffix (e.g. `05-22`) when overriding | Unchanged |
| `/api/puzzles` fetch | On mount, to populate date list | On mount, to populate internal `dates[]` for random selection |
| Disabled state | Not handled | Randomize button disabled + labeled "No puzzles" if `dates.length === 0` |

**Internal state** (implementation guidance):

```ts
// DevPanel internal state
const [open, setOpen] = useState(false);
const [dates, setDates] = useState<string[]>([]);

function handleRandomize(): void {
  if (dates.length === 0) return;
  const picked = dates[Math.floor(Math.random() * dates.length)];
  onDateChange(picked);
  setOpen(false);
}
```

**Test-visible attributes**:

| Element | `data-testid` |
|---------|--------------|
| Toggle button | `dev-toggle` |
| Panel container (when open) | `dev-panel` |
| Randomize button | `dev-randomize` |
| Reset to today button | `dev-reset` |

---

## 3. `RankingBoard` / `PoolChipItem` — Interface Unchanged

**File**: `src/components/game/RankingBoard.tsx`

The `RankingBoard` exported props are **unchanged**:

```ts
interface RankingBoardProps {
  countries:       Country[];
  slotAssignments: (string | null)[];
  lockedSlots:     boolean[];
  onSlotsChange:   (assignments: (string | null)[]) => void;
  disabled?:       boolean;
}
```

Only the internal `PoolChipItem` sub-component styling changes (padding, font sizes — see `data-model.md`). No prop signature changes, no new `data-testid` attributes.

**Test contract for chip sizing**: Since unit tests cannot assert on CSS pixel values directly, the pool chip size change is validated in the E2E test (`tests/e2e/game-flow.spec.ts`) by checking that the chip's bounding box height is ≥ 44 px (Playwright's `boundingBox()`). Unit tests verify the chip's rendered content (flag class, country name) — unchanged from current tests.

---

## 4. `page.tsx` — `handleDevDateChange` Fix

**File**: `src/app/page.tsx`

**Current (broken)**:
```ts
const handleDevDateChange = useCallback((date: string) => {
  setPuzzle(null);
  setGameState(null);
  setSlotAssignments([...EMPTY_SLOTS]);
  setLockedSlots([...EMPTY_LOCKS]);
  setAnnouncement('');
  setRoundCompleteEffect(false);
  setWrongGuessEffect(false);        // ← BUG: undeclared setter
  setDevDate(date === TODAY ? null : date);
}, []);
```

**Fixed**:
```ts
const handleDevDateChange = useCallback((date: string) => {
  setPuzzle(null);
  setGameState(null);
  setSlotAssignments([...EMPTY_SLOTS]);
  setLockedSlots([...EMPTY_LOCKS]);
  setAnnouncement('');
  setRoundCompleteEffect(false);     // ← correct: resets round-complete animation
  setDevDate(date === TODAY ? null : date);
}, []);
```

**TypeScript impact**: Removing the undeclared call will fix a TypeScript strict-mode error ("`setWrongGuessEffect` is not defined"). No other changes to `page.tsx` logic are needed for the bug fix — only the `countries` prop thread-through for `FeedbackRow`.

---

## Acceptance Test Matrix

The following table maps spec acceptance scenarios to the test files that cover them:

| Scenario | Test File | Test Description |
|----------|-----------|-----------------|
| Randomize loads a random puzzle (FR-001) | `DevPanel.test.tsx` | "clicking Randomize calls onDateChange with a date from the list" |
| Randomize resets game state (FR-002) | `GamePage.test.tsx` | "switching dev date resets all transient state" |
| Date picker removed (FR-003) | `DevPanel.test.tsx` | "panel renders no date list items" |
| Dev toolbar hidden in production (FR-004) | `GamePage.test.tsx` | Existing test + NODE_ENV mock |
| Past guesses show country order **during active play** (FR-005) | `FeedbackRow.test.tsx` + `GamePage.test.tsx` | "renders country name for each position"; "feedback rows appear above ranking board after incorrect guess" |
| All past guesses remain visible **while round is in progress** (FR-006) | `GamePage.test.tsx` | "shows all previous guesses stacked after second incorrect guess" |
| Guess history persists across page reload (FR-007) | `GamePage.test.tsx` | Existing localStorage round-trip test — verify country names appear on restore |
| Chips ≥ 48 px (FR-008) | `game-flow.spec.ts` (E2E) | `boundingBox().height >= 44` |
| Flags scale proportionally (FR-009) | `RankingBoard.test.tsx` | "pool chip flag span has correct class" (visual validated E2E) |
| No overflow at 1280px (FR-010) | `game-flow.spec.ts` (E2E) | Screenshot / no horizontal scrollbar assertion |
