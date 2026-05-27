# Research: Reveal Correct Values

**Feature**: 007-reveal-correct-values
**Date**: 2026-05-27

---

## Decision 1: Data Propagation Strategy

**Decision**: Extend `StatDef` (the puzzle API response type) with two new fields — `unit: string` and `values: Record<string, number>` — populated at generation time by the puzzle generator.

**Rationale**: The puzzle generator (`src/lib/puzzle-generator.ts`) already has access to both `DatasetStat.unit` and `DatasetEntry.value` when constructing each `StatDef`. Adding these two fields requires only a 3-line change to the existing `statDefs` mapping. The client then receives everything it needs in the existing `/api/puzzle` response with no additional fetches.

**Alternatives considered**:
- *Load dataset on the client*: Rejected — `data/dataset.json` is ~XXX KB and loading it client-side defeats performance budget goals (TTI ≤ 1.5s) and violates App Router discipline (client data fetching where server-side is feasible).
- *Separate `/api/values` endpoint*: Rejected — adds an extra round-trip, adds a new API route, and increases surface area for no benefit given values are already known at puzzle-generation time.
- *Store only `unit` in `StatDef`, look up values at render from a Context*: Rejected — values are per-puzzle, not global, and passing them through API is cleaner than a runtime lookup context.

---

## Decision 2: Number Formatting

**Decision**: Add a pure function `formatStatValue(value: number, unit: string): string` in a new file `src/lib/formatting.ts`. Format rules:
- If value is a whole number (`Number.isInteger(value)`): format with thousands separators, 0 decimal places.
- If value is a fraction and `value < 10`: format with up to 3 decimal places (covers HDI range 0–1).
- Otherwise (float ≥ 10): format with 1 decimal place and thousands separators.
- Append a single space then the unit string.
- Use `Intl.NumberFormat('en-US')` for thousands-separator formatting.

**Examples**:
| Input | Output |
|---|---|
| `449964, "km²"` | `"449,964 km²"` |
| `0.930, "index (0–1)"` | `"0.930 index (0–1)"` |
| `25462.7, "million USD"` | `"25,462.7 million USD"` |
| `20.6, "%"` | `"20.6 %"` |
| `2347, "km"` | `"2,347 km"` |
| `0, "km²"` | `"0 km²"` |

**Rationale**: A pure formatting function belongs in `src/lib/` per Constitution Principle IV. `Intl.NumberFormat` is the standard, environment-aware way to produce thousands separators. New file `formatting.ts` keeps it separate from puzzle, scoring, and game-state concerns.

**Alternatives considered**:
- *Inline formatting in the component*: Rejected — violates Game Logic Purity (business logic in UI layer) and is harder to unit test.
- *`toLocaleString()`*: Rejected — `Intl.NumberFormat` gives more control and is equally portable.
- *Manual regex*: Rejected — unnecessary complexity given `Intl` is available everywhere this app runs.

---

## Decision 3: RankingBoard Prop Extension

**Decision**: Add an optional `slotValues?: (string | null)[]` prop to `RankingBoard`. Values are pre-formatted strings (from `formatStatValue`) or `null` for unlocked/empty slots. The value is rendered as a small badge between the country name and the checkmark icon in the locked-slot branch.

**Rationale**: Pre-formatted strings keep formatting logic out of the component. `(string | null)[]` mirrors the existing `slotAssignments: (string | null)[]` shape, making the prop easy to reason about and test. Optional (`?`) preserves backwards compatibility with any tests or usages that don't pass values yet.

**Alternatives considered**:
- *Pass `unit` + raw `values` map to `RankingBoard` and format inside*: Rejected — mixes formatting logic into a display component; harder to test in isolation.
- *Pass values as part of a richer country object*: Rejected — `Country` is a shared type used elsewhere (pool chips, feedback rows) and adding a stat-specific `value` field to it would leak puzzle-round context into a general type.

---

## Decision 4: FeedbackRow Enhancement (P3)

**Decision**: Add an optional `valueMap?: Record<string, string>` prop to `FeedbackRow`. When present and a cell is correct, display the pre-formatted value string beneath the country name in that cell.

**Rationale**: `FeedbackRow` is a pure display component; it only needs formatted strings. The `valueMap` is keyed by country ID (matching `Guess.order[i]`) which is already available. Optional prop keeps backwards compatibility.

**Alternatives considered**:
- *Pass `StatDef` directly to `FeedbackRow`*: Rejected — would couple a display component to the full stat domain type; prop should be minimal.

---

## Decision 5: Accessibility

**Decision**: No new `aria-live` region needed for value reveal. The existing `announcement` state in `page.tsx` (fed to `LiveRegion`) already announces stat-solved and guess-result events. The value text inside a locked slot will be read by screen readers as part of the natural DOM reading order. The slot `<li>` does not have an `aria-label` override, so the full subtree (name + value) will be announced.

**Rationale**: The value is static content within an already-announced context. Adding a redundant `aria-live` announcement for each locked value would create noise for screen reader users.

---

## Decision 6: Styling

**Decision**: The value text is rendered as a `<span>` with `font-size: 11px`, `color: rgba(0,232,150,0.7)` (a slightly muted teal, consistent with the slot's locked green aesthetic), positioned between the country name `<span>` and the checkmark `<div>`. No new Tailwind classes; uses inline `style={}` consistent with the rest of `RankingBoard.tsx`.

**Rationale**: Keeps the value visually subordinate to the country name (smaller, muted) while still readable. Teal color connects it to the "correct" green context. Follows the project's styling convention of inline style objects for component-specific styles.
