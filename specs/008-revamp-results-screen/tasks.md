# Tasks: Revamp Results Screen

**Input**: Design documents from `specs/008-revamp-results-screen/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Constitution mandates Test-First Development (NON-NEGOTIABLE). Failing tests MUST be written and confirmed RED before any implementation task begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in every task description

## Path Conventions

Single Next.js project — source under `src/`, tests under `tests/`.

---

## Phase 1: Setup

**Purpose**: Verify baseline before beginning. All types, APIs, and utility functions required by this feature are already present from features 006/007. No new infrastructure required.

- [X] T001 Confirm baseline is green: run `npm run build` (TypeScript compile + Next.js build) and `npm test` (Vitest) from repo root — both must pass before starting

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

No foundational tasks required for this feature. All TypeScript types (`StatDef`, `Country`, `GameState`), puzzle API fields (`StatDef.values`, `StatDef.unit`, `StatDef.solution`), and utility functions (`formatStatValue` in `src/lib/formatting.ts`) are already present. User story phases begin immediately after T001 is confirmed green.

**Checkpoint**: Baseline confirmed — user story implementation can begin

---

## Phase 3: User Story 1 - View Revamped Summary Screen (Priority: P1) 🎯 MVP

**Goal**: Display one clearly-bounded `<section>` per stat on the summary screen, each containing the stat label, all guess rows with correct/wrong feedback, and a `CorrectValuesRow` showing all five countries' correct values in `solution` order formatted via `formatStatValue`.

**Independent Test**: Complete a puzzle and open the summary screen — verify three distinct sections each show the stat label, all player guess rows with per-country feedback, and formatted correct values for all five countries (or no values row if `StatDef.values`/`StatDef.unit` is absent — no crash).

### Tests for User Story 1 (Test-First — MUST fail before implementation)

> **Write these tests FIRST. Run `npm test -- ResultCard` and `npm test -- CorrectValuesRow` — confirm both are RED before touching any implementation file.**

- [X] T002 [P] [US1] Add failing tests for revamped stat sections in `ResultCard`: assert three `<section>` elements rendered with `aria-label` matching each stat's label, correct `FeedbackRow` count per stat matching guess count, `CorrectValuesRow` rendered when `stat.values` and `stat.unit` are present, sections appear in `state.stats` order in `tests/unit/ResultCard.test.tsx`
- [X] T003 [P] [US1] Create failing tests for `CorrectValuesRow` component: assert five cells rendered in `stat.solution` order each showing flag + country name + `formatStatValue`-formatted value, renders `null` (nothing) when `stat.values` is `undefined`, renders `null` when `stat.unit` is `undefined`, each cell has `aria-label` including country name and value, shows graceful `?` when a country ID in `solution` is not found in `countries` array in `tests/unit/CorrectValuesRow.test.tsx` (new file — `npm test -- CorrectValuesRow` will error with "file not found"; that is the expected RED state)

### Implementation for User Story 1

- [X] T004 [US1] Create `CorrectValuesRow` component in `src/components/game/CorrectValuesRow.tsx`: define `CorrectValuesRowProps` interface with `stat: StatDef` and `countries: Country[]`; return `null` when `!stat.values || !stat.unit`; map `stat.solution` to five cells in rank order each showing flag, country name (or `?` if not found via `countries.find(c => c.id === countryId)`), and `formatStatValue(stat.values[countryId], stat.unit)` formatted value with `aria-label` containing country name and value; run `npm test -- CorrectValuesRow` — must be GREEN
- [X] T005 [US1] Revamp stat sections in `src/components/game/ResultCard.tsx`: import `CorrectValuesRow` from `./CorrectValuesRow`; wrap each stat group in `<section aria-label={puzzle.stats[i].label}>`; render stat label heading (existing `<p>` style); render one `<FeedbackRow>` per guess entry in `state.stats[i].guesses` (existing, no `valueMap`); append `<CorrectValuesRow stat={puzzle.stats[i]} countries={puzzle.countries} />` after guess rows; run `npm test -- ResultCard` — must be GREEN

**Checkpoint**: Summary screen shows three clearly-bounded stat sections with labels, all guess rows, and correct values — verify independently by completing a puzzle

---

## Phase 4: User Story 2 - Static Score Bar (Priority: P2)

**Goal**: Both the in-game `ScoreDisplay` score bar and the `ResultCard` summary score bar render at their target width immediately with no shimmer sweep, glow pulse, or width-transition animation of any kind.

**Independent Test**: Play through a round — the score bar jumps to the new width instantly with no animated transition. Open the summary screen — the score bar renders at full final-score width with no entrance animation, shimmer, or glow pulse.

### Tests for User Story 2 (Test-First — MUST fail before implementation)

> **Write these tests FIRST. Run `npm test -- ScoreDisplay` and `npm test -- ResultCard` — confirm both are RED before touching implementation files.**

- [X] T006 [P] [US2] Add failing assertions in `tests/unit/ScoreDisplay.test.tsx`: assert the inner bar element's inline style has no `animation` property (or its value is `'none'`/absent) and no `transition` property (or value is `'none'`/absent); assert bar renders at correct `width` percentage immediately
- [X] T007 [P] [US2] Add failing assertion in `tests/unit/ResultCard.test.tsx`: assert the score bar `<div>` inside `ResultCard` has no `transition` property in its inline `style` object (or value is `'none'`/absent)

### Implementation for User Story 2

- [X] T008 [P] [US2] Remove animation inline styles from score bar in `src/components/game/ScoreDisplay.tsx`: delete `animation: pct > 0 ? 'shimmerGold 2.5s linear infinite' : 'none'`; delete `backgroundSize: '200% auto'`; delete `transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)'`; keep static `backgroundImage` gradient and `boxShadow` (not animations); do NOT touch `src/app/globals.css` (the `shimmerGold` keyframe must remain — it is used by `.text-shimmer-gold` on the game title); run `npm test -- ScoreDisplay` — must be GREEN
- [X] T009 [P] [US2] Remove bar transition from `src/components/game/ResultCard.tsx`: locate the score bar `<div>` (approx. line 293) and delete `transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)'` from its inline `style` prop; bar width uses `pct` (computed from `finalScore`) so renders at correct width immediately; run `npm test -- ResultCard` — must be GREEN

**Checkpoint**: Score bar renders statically in both components — confirm with `npm test -- ScoreDisplay` and `npm test -- ResultCard` both GREEN

---

## Phase 5: User Story 3 - Clipboard-Only Share Button (Priority: P3)

**Goal**: The share button always writes result text to `navigator.clipboard.writeText`, never invokes `navigator.share`, shows `'Copied!'` on success, shows `'Copy failed'` on error, and reverts to `'Share Result'` after 2 s in both cases.

**Independent Test**: Click the share button on desktop and on mobile (or emulated mobile) — confirm clipboard is written, `'Copied!'` appears briefly, no OS share dialog appears. Simulate clipboard API failure — confirm `'Copy failed'` appears and reverts to `'Share Result'` after 2 s.

### Tests for User Story 3 (Test-First — MUST fail before implementation)

> **Write these tests FIRST. Run `npm test -- ResultCard` — must be RED before touching implementation.**

- [X] T010 [US3] Add failing tests in `tests/unit/ResultCard.test.tsx` for the clipboard-only share button: mock `navigator.clipboard.writeText` as a resolved promise and assert it is called when share button is clicked; assert `navigator.share` is never called (mock it and assert not called); assert button text becomes `'Copied!'` after successful write; assert button text reverts to `'Share Result'` after 2 s (use fake timers); mock `navigator.clipboard.writeText` as a rejected promise and assert button text becomes `'Copy failed'`; assert button text reverts to `'Share Result'` after 2 s following error

### Implementation for User Story 3

- [X] T011 [US3] In `src/components/game/ResultCard.tsx`: replace `const [copied, setCopied] = useState(false)` with `const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle')`; rewrite `handleShare` to `async function handleShare() { const text = buildShareText(state, puzzleNumber); try { await navigator.clipboard.writeText(text); setShareState('copied'); setTimeout(() => setShareState('idle'), 2000); } catch { setShareState('error'); setTimeout(() => setShareState('idle'), 2000); } }` — no `navigator.share` call anywhere; update button label expression to `shareState === 'copied' ? 'Copied!' : shareState === 'error' ? 'Copy failed' : 'Share Result'`; update button `disabled` or appearance to reflect non-idle states; remove all remaining `copied` / `navigator.share` references; run `npm test -- ResultCard` — must be GREEN

**Checkpoint**: Share button always copies to clipboard, shows tri-state feedback, never opens OS share dialog — verify by running `npm test -- ResultCard`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: E2E coverage for all three user stories and final quality gate.

- [X] T012 Update `tests/e2e/game-flow.spec.ts` to cover all three stories: add assertion that summary screen renders three stat sections each with an accessible label (US1); add assertion that each stat section contains a correct-values row with five cells when stat values are present (US1); add assertion that score bar element has no CSS `transition` on `width` in inline styles in both in-game and summary contexts (US2); add assertion that clicking share button writes to clipboard mock and native share dialog never appears (US3); run `npm run test:e2e` — must be GREEN
- [X] T013 Run full quality gate from repo root: `npm run build` (TypeScript strict compile + Next.js build — zero errors), `npm test` (Vitest — all tests pass, ≥ 80% coverage), `npm run test:e2e` (Playwright game-flow spec — all scenarios pass) — all three must be green before merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start here
- **Foundational (Phase 2)**: N/A — no prerequisites; proceeds immediately after T001
- **User Story phases (3–5)**: All depend only on T001 being green
  - US1 (Phase 3) and US2 (Phase 4) modify different primary files and can proceed in parallel
  - US3 (Phase 5) shares `ResultCard.tsx` with US1 — implement US3 after US1 is complete to avoid merge conflicts
- **Polish (Phase 6)**: Depends on Phases 3, 4, and 5 all complete

### User Story Dependencies

- **User Story 1 (P1)**: T004 (create `CorrectValuesRow`) must complete before T005 (import it in `ResultCard`). T002 and T003 can be written in parallel.
- **User Story 2 (P2)**: Fully independent of US1 and US3. T008 and T009 modify different files and can run in parallel. Can be worked concurrently with US1.
- **User Story 3 (P3)**: Shares `ResultCard.tsx` with US1 — begin after T005 is merged.

### Within Each User Story

1. Write failing tests → confirm RED
2. Implement to turn tests GREEN
3. Validate at checkpoint before moving on

### Parallel Opportunities

- **T002 + T003** (US1 tests): different files — write simultaneously
- **T006 + T007** (US2 tests): different files — write simultaneously
- **T008 + T009** (US2 implementations): different files — implement simultaneously
- **Phase 3 (US1) + Phase 4 (US2)**: entirely different primary files — can be worked concurrently by two developers

---

## Parallel Example: User Story 1

```bash
# Write both US1 test files simultaneously (different files, no conflict):
Task: "Add failing ResultCard stat section tests in tests/unit/ResultCard.test.tsx"
Task: "Create failing CorrectValuesRow tests in tests/unit/CorrectValuesRow.test.tsx"

# Confirm both RED, then implement in order:
Task: "Create CorrectValuesRow component in src/components/game/CorrectValuesRow.tsx"  # T004
Task: "Revamp stat sections in src/components/game/ResultCard.tsx"                     # T005 (after T004)
```

## Parallel Example: User Story 2

```bash
# Write both US2 test files simultaneously (different files, no conflict):
Task: "Add failing ScoreDisplay animation assertions in tests/unit/ScoreDisplay.test.tsx"
Task: "Add failing ResultCard bar-transition assertion in tests/unit/ResultCard.test.tsx"

# Confirm both RED, then implement simultaneously (different files, no conflict):
Task: "Remove animations from src/components/game/ScoreDisplay.tsx"
Task: "Remove bar transition from src/components/game/ResultCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Baseline confirmation (T001)
2. Complete Phase 3: User Story 1 — revamped summary screen (T002–T005)
3. **STOP and VALIDATE**: Complete a puzzle — verify three stat sections with labels, guess rows, and correct values rendered correctly
4. Deploy/demo the revamped summary screen

### Incremental Delivery

1. Baseline confirmed → T001
2. US1 complete → summary screen fully revamped (MVP)
3. US2 complete → score bar static everywhere (additive, no regression)
4. US3 complete → share button clipboard-only with error state (polish)
5. E2E + quality gate → T012, T013

### Parallel Team Strategy

With two developers:

1. Both confirm baseline (T001) together
2. Once green:
   - Developer A: Phase 3 — US1 (CorrectValuesRow + stat sections in ResultCard)
   - Developer B: Phase 4 — US2 (ScoreDisplay + ResultCard bar animation removal)
3. Both merge their branches, then:
   - Either developer: Phase 5 — US3 (share button in ResultCard)
4. Together: Phase 6 — E2E + quality gate

---

## Notes

- `[P]` tasks operate on different files with no unresolved dependencies — safe to execute concurrently
- `[Story]` label maps each task to its user story for full traceability
- **Do NOT remove `shimmerGold` from `src/app/globals.css`** — the keyframe is referenced by `.text-shimmer-gold` on the game title; only the inline `animation` prop in `ScoreDisplay.tsx` is removed
- `StatDef.values` and `StatDef.unit` are optional (feature 007 backwards-compat) — `CorrectValuesRow` MUST return `null`, not crash, when either is absent
- Both `'copied'` and `'error'` share states revert to `'idle'` after exactly 2 000 ms via `setTimeout(() => setShareState('idle'), 2000)` — same pattern for both branches
- `'idle' | 'copied' | 'error'` is a local union in `ResultCard.tsx` — no new exported types in `src/types/index.ts`
- Score count-up number animation on the summary screen is **out of scope** — FR-001/FR-002 address the bar only
