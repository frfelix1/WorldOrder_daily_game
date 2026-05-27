# Quickstart: Revamp Results Screen (Feature 008)

**Branch**: `feature/summary`
**Spec**: `specs/008-revamp-results-screen/spec.md`
**Plan**: `specs/008-revamp-results-screen/plan.md`

---

## Prerequisites

```bash
git checkout feature/summary
npm install
npm run build        # Confirm green before you start
npm test             # Confirm all tests pass (≥ 80% coverage)
```

---

## Development Order (Test-First)

Follow Red → Green → Refactor strictly. **Do not touch implementation until the failing test exists.**

### Step 1 — Static Score Bar (`ScoreDisplay`)

**Test file**: `tests/unit/ScoreDisplay.test.tsx`

Add assertions:
- The inner bar element has no `animation` inline style property (or it is `'none'`)
- The inner bar element has no `transition` inline style property (or it is `'none'` / absent)
- The bar renders at the correct `width` percentage immediately

Run (expect red):
```bash
npm test -- ScoreDisplay
```

**Implementation**: `src/components/game/ScoreDisplay.tsx`
- Remove `animation: pct > 0 ? 'shimmerGold 2.5s linear infinite' : 'none'` → remove entirely
- Remove `backgroundSize: '200% auto'`
- Remove `transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)'`

Run (expect green):
```bash
npm test -- ScoreDisplay
```

---

### Step 2 — Static Score Bar in `ResultCard`

**Test file**: `tests/unit/ResultCard.test.tsx`

Add assertion:
- The score bar `<div>` inside `ResultCard` has no `transition` property in its inline styles

Run (expect red):
```bash
npm test -- ResultCard
```

**Implementation**: `src/components/game/ResultCard.tsx`
- Remove `transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)'` from the score bar `<div>` (line ~293)

Run (expect green):
```bash
npm test -- ResultCard
```

---

### Step 3 — `CorrectValuesRow` Component (new)

**Test file**: `tests/unit/CorrectValuesRow.test.tsx` (new file)

Write tests for:
- Renders five cells in `solution` order when `values` and `unit` are present
- Each cell shows the flag, country name, and `formatStatValue`-formatted value
- Renders `null` (nothing) when `stat.values` is `undefined`
- Renders `null` (nothing) when `stat.unit` is `undefined`
- Shows `?` gracefully if a country ID in `solution` is not found in `countries`
- Each cell has an `aria-label` that includes the country name and value

Run (expect red — file doesn't exist yet):
```bash
npm test -- CorrectValuesRow
```

**Implementation**: `src/components/game/CorrectValuesRow.tsx` (new file)

```typescript
import type { StatDef, Country } from '../../types';
import { formatStatValue } from '../../lib/formatting';

interface CorrectValuesRowProps {
  stat: StatDef;
  countries: Country[];
}

export function CorrectValuesRow({ stat, countries }: CorrectValuesRowProps) {
  if (!stat.values || !stat.unit) return null;
  // render five cells in stat.solution order
  // ...
}
```

Run (expect green):
```bash
npm test -- CorrectValuesRow
```

---

### Step 4 — Revamped Stat Sections in `ResultCard`

**Test file**: `tests/unit/ResultCard.test.tsx`

Add assertions:
- Three `<section>` elements are rendered, one per stat
- Each section has `aria-label` matching its stat's label
- Each section renders the correct number of `FeedbackRow` components (matching guess count)
- Each section renders a `CorrectValuesRow` when `stat.values` / `stat.unit` are present
- Stat sections appear in the order of `state.stats` (stat 1 first)

Run (expect red):
```bash
npm test -- ResultCard
```

**Implementation**: `src/components/game/ResultCard.tsx`
- Import `CorrectValuesRow`
- Wrap each stat group in `<section aria-label={puzzle.stats[statIdx]?.label}>`
- Add `<CorrectValuesRow stat={puzzle.stats[statIdx]} countries={puzzle.countries} />` after the guess rows

Run (expect green):
```bash
npm test -- ResultCard
```

---

### Step 5 — Clipboard-Only Share Button

**Test file**: `tests/unit/ResultCard.test.tsx`

Add assertions:
- Clicking share calls `navigator.clipboard.writeText` (mock)
- After a successful write, the button text becomes `'Copied!'`
- After 2 seconds, the button text returns to `'Share Result'`
- If clipboard write throws, the button text becomes `'Copy failed'`
- After 2 seconds following an error, the button text returns to `'Share Result'`
- `navigator.share` is never called (assert not called on the mock)

Run (expect red):
```bash
npm test -- ResultCard
```

**Implementation**: `src/components/game/ResultCard.tsx`
- Replace `const [copied, setCopied] = useState(false)` with `const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle')`
- Rewrite `handleShare`:

```typescript
async function handleShare() {
  const text = buildShareText(state, puzzleNumber);
  try {
    await navigator.clipboard.writeText(text);
    setShareState('copied');
    setTimeout(() => setShareState('idle'), 2000);
  } catch {
    setShareState('error');
    setTimeout(() => setShareState('idle'), 2000);
  }
}
```

- Update button rendering: replace `copied` references with `shareState` checks
- Button text: `shareState === 'copied' ? 'Copied!' : shareState === 'error' ? 'Copy failed' : 'Share Result'`

Run (expect green):
```bash
npm test -- ResultCard
```

---

### Step 6 — E2E Coverage

**Test file**: `tests/e2e/game-flow.spec.ts`

Add/update tests:
- Summary screen shows three stat sections
- Share button copies to clipboard (mock clipboard in Playwright)
- Native share dialog never appears
- Score bar has no CSS transition on `width`

Run:
```bash
npm run test:e2e
```

---

## Full Quality Gate Check

```bash
npm run build          # TypeScript + Next.js build
npm test               # Vitest — must pass with ≥ 80% coverage
npm run test:e2e       # Playwright game-flow spec
```

All three must be green before merge.

---

## File Reference

| File | Status | What Changes |
|------|--------|-------------|
| `src/components/game/ScoreDisplay.tsx` | MODIFY | Remove shimmer animation + width transition |
| `src/components/game/ResultCard.tsx` | MODIFY | Remove bar transition; revamp stat sections; clipboard-only share with tri-state |
| `src/components/game/CorrectValuesRow.tsx` | CREATE | New component: five-cell row showing correct values in solution order |
| `tests/unit/ScoreDisplay.test.tsx` | MODIFY | Assert no animation/transition styles |
| `tests/unit/ResultCard.test.tsx` | MODIFY | New section/share/clipboard tests |
| `tests/unit/CorrectValuesRow.test.tsx` | CREATE | Full unit coverage for new component |
| `tests/e2e/game-flow.spec.ts` | MODIFY | Summary screen + share button scenarios |
| `src/app/globals.css` | NO CHANGE | `shimmerGold` keyframe kept (used by `.text-shimmer-gold`) |
| `src/types/index.ts` | NO CHANGE | All needed types already present |
| `src/lib/formatting.ts` | NO CHANGE | `formatStatValue` reused as-is |

---

## Key Patterns

**Using `formatStatValue`** in `CorrectValuesRow`:
```typescript
import { formatStatValue } from '../../lib/formatting';

const display = formatStatValue(stat.values[countryId], stat.unit);
// e.g. "449,964 km²" or "0.930 index (0–1)"
```

**Accessing correct values in solution order**:
```typescript
stat.solution.map((countryId) => {
  const country = countries.find((c) => c.id === countryId);
  const rawValue = stat.values?.[countryId];
  // ...
})
```

**`shareState` type guard**:
```typescript
const isIdle = shareState === 'idle';
const buttonLabel = shareState === 'copied' ? 'Copied!' 
                  : shareState === 'error'  ? 'Copy failed'
                  : 'Share Result';
```
