# Tasks: Rankle — Daily Geography Ranking Game

**Input**: Design documents from `specs/001-rankle-daily-game/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | research.md ✅ | quickstart.md ✅ | contracts/puzzle-api.md ✅

**Tests**: Constitution Gate II (Test-First, NON-NEGOTIABLE) is active. Tests MUST be written and confirmed failing before implementation. `vitest --coverage` ≥ 80% globally blocks merge. Tests are included for every user story and every foundational lib module.

**Scoring note**: Implementation follows the linear scoring formula from spec.md FR-011 — max score 150 (50 per stat, 10 per position). Share text format: `Rankle #N — X pts`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project bootstrap, dependency installation, and configuration. No game logic yet.

- [ ] T001 Initialize Next.js 14+ project at repo root: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias`; verify `tsconfig.json` has `"strict": true` (Constitution Gate I)
- [ ] T002 [P] Install game runtime dependencies: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities flag-icons`
- [ ] T003 [P] Install testing dependencies: `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @playwright/test`; run `npx playwright install chromium`
- [ ] T004 Add `postinstall` script to `package.json` to copy flag SVGs: `"postinstall": "cp -r node_modules/flag-icons/flags/4x3 public/flags"`; add `@import 'flag-icons/css/flag-icons.min.css';` to `src/app/globals.css`
- [ ] T005 Create `vitest.config.ts` with `jsdom` environment, `setupFiles: ['./tests/setup.ts']`, and 80% global coverage threshold for `src/` (lines, functions, branches, statements); create `tests/setup.ts` importing `@testing-library/jest-dom` (Constitution Gate II)
- [ ] T006 [P] Create `playwright.config.ts` with `baseURL: 'http://localhost:3000'` and Chromium project; add scripts to `package.json`: `"test": "vitest run --coverage"`, `"test:watch": "vitest"`, `"test:e2e": "playwright test"`
- [ ] T007 [P] Create directory structure: `src/components/game/`, `src/components/ui/`, `src/lib/`, `src/types/`, `tests/unit/`, `tests/integration/api/`, `tests/e2e/`, `data/puzzles/`
- [ ] T008 Create shared TypeScript interfaces in `src/types/index.ts`: `Country`, `StatDef`, `PuzzleFile`, `GameState`, `StatSession`, `Guess`, `PlayerStats`, `ResultCard`, `EmojiRow` — matching the exact shapes in `data-model.md`
- [ ] T009 Run `npm install` to trigger `postinstall`; verify flags installed: `ls public/flags/ | head -5` should list SVG files (e.g. `ad.svg`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core pure-function lib modules and the puzzle API route. All user stories depend on this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. Constitution Gate II — write each test block first and confirm it fails before proceeding to the matching implementation task.

- [ ] T010 [P] Write failing unit tests for puzzle number utility in `tests/unit/puzzle.test.ts`: test `getPuzzleNumber()` returns a consistent non-negative integer from UTC epoch; test `getUTCDateString()` returns today's date in `YYYY-MM-DD` format; test that different UTC dates produce different puzzle numbers
- [ ] T011 [P] Write failing unit tests for scoring engine in `tests/unit/scoring.test.ts`: test `scoreForStat()` returns 50 for a single all-bull guess (5 positions × 10 pts); test that one miss on a position reduces its contribution to 8 (`10 − 2×1`); test that 5 misses on a position drives its contribution to 0 (`max(10 − 2×5, 0) = 0`); test floor at 0 — 6+ misses on a position still scores 0 (no negative); test `totalScore()` sums three stat scores (max 150 = 3 × 50)
- [ ] T012 [P] Write failing unit tests for game state in `tests/unit/game-state.test.ts`: `loadGameState(n)` returns `null` on fresh localStorage; returns state when puzzle number matches; silently returns `null` (stale discard) when stored `puzzleNumber` differs from `n`; returns state with `status: "complete"` when game was finished; `saveGameState` roundtrips through JSON correctly; `loadPlayerStats` returns zero-initialised struct on first call; `savePlayerStats` persists and reloads correctly
- [ ] T013 Write failing API contract tests in `tests/integration/api/puzzle.test.ts`: GET `/api/puzzle?date=2026-05-22` returns 200 with `date`, `countries` (length 5), `stats` (length 3), `Cache-Control` header containing `s-maxage=86400`; GET with missing `date` returns 400 `{ error: "invalid_date" }`; GET with `date=9999-99-99` (no file) returns 404 `{ error: "not_found" }`
- [ ] T014 [P] Implement `src/lib/puzzle.ts`: export `getPuzzleNumber(): number` (integer UTC days since fixed EPOCH_MS constant); export `getUTCDateString(): string` (returns `new Date().toISOString().slice(0, 10)`); all parameters and return types explicitly annotated (Gate I)
- [ ] T015 [P] Implement `src/lib/scoring.ts`: export `scoreForStat(guesses: Guess[], solution: string[]): number` with linear formula — for each of the 5 positions, `n` = count of guesses where that position was wrong; position score = `Math.max(10 - 2 * n, 0)`; stat score = sum of 5 position scores (max 50); export `totalScore(statSessions: StatSession[], solutions: string[][]): number` (max 150); pure functions, no side effects (Gate IV)
- [ ] T016 Implement `src/lib/game-state.ts`: export `loadGameState(currentPuzzleNumber: number): GameState | null` (reads `rankle_state`, discards if `puzzleNumber` mismatches or JSON parse fails); export `saveGameState(state: GameState): void`; export `loadPlayerStats(): PlayerStats` (returns zero-initialised struct if missing); export `savePlayerStats(stats: PlayerStats): void`; all localStorage access isolated to this module (Gate IV)
- [ ] T017 Implement puzzle API route in `src/app/api/puzzle/route.ts`: `export async function GET(req: NextRequest)` — reads `date` query param, validates `YYYY-MM-DD` regex (400 on failure); reads `data/puzzles/${date}.json` from filesystem (404 on ENOENT); returns `NextResponse.json(puzzle, { headers: { 'Cache-Control': '...' } })`; GET-only route (Gate III)
- [ ] T018 [P] Create sample puzzle file `data/puzzles/2026-05-22.json` with the five-country, three-stat example from `contracts/puzzle-api.md`; create a second sample for tomorrow's date as a second test fixture
- [ ] T019 Configure `src/app/layout.tsx`: set `<title>Rankle</title>`, viewport meta, import `globals.css`, apply Tailwind base font class; no game logic here
- [ ] T020 Run `npm test` — confirm all foundational tests (T010–T013) pass and coverage for `src/lib/` is ≥ 80%; fix any failures before proceeding

**Checkpoint**: Foundation complete — lib functions tested and working, API route tested and working, user story implementation can now begin.

---

## Phase 3: User Story 1 — Play a Full Daily Game (Priority: P1) 🎯 MVP

**Goal**: Player visits the game, sees five country cards with flags, works through three sequential stats using drag-to-reorder, receives bull/miss positional feedback per guess, and sees a final score after solving all three stats.

**Independent Test**: Load `http://localhost:3000`, confirm five country cards appear with flags, submit a ranking for stat 1 and receive feedback, submit the correct ranking, confirm the stat advances; complete all three stats; verify the score screen appears with a score between 0 and 150.

### Tests for User Story 1 — Write First, Confirm Failing (Gate II)

- [ ] T021 [P] [US1] Write failing unit tests for `CountryCard` in `tests/unit/CountryCard.test.tsx`: renders country name; renders a `<span>` element with class `fi fi-{flagCode}`; applies `aria-roledescription="sortable item"` when draggable; accepts `isDragging` prop without error
- [ ] T022 [P] [US1] Write failing unit tests for `FeedbackRow` in `tests/unit/FeedbackRow.test.tsx`: renders exactly 5 emoji characters per guess; renders 🟩 at bull positions and 🟥 at miss positions; each position has an `aria-label` that communicates correct/incorrect
- [ ] T023 [P] [US1] Write failing unit tests for `ScoreDisplay` in `tests/unit/ScoreDisplay.test.tsx`: renders score value in the DOM; re-renders when `score` prop changes; includes accessible label `Running score: N / 150`; always visible (not conditionally hidden)
- [ ] T024 [P] [US1] Write failing E2E test in `tests/e2e/game-flow.spec.ts`: navigate to `/`; assert 5 country card elements are visible; assert first stat panel is visible with a direction label; drag a country card to a new position; click submit; assert feedback row appears with 5 emoji; keep submitting until stat 1 is solved; assert stat 2 appears; complete stats 2 and 3; assert result screen appears with score between 0 and 150

### Implementation for User Story 1

- [ ] T025 [P] [US1] Implement `src/components/game/CountryCard.tsx`: accepts `country: Country`, `isDragging?: boolean`; renders country name + `<span className="fi fi-{country.flagCode}">` flag chip; uses dnd-kit `useSortable` hook; applies CSS `transform` via `transform` style property only — no `top`/`left` changes during drag (Gate: Performance Budget)
- [ ] T026 [P] [US1] Implement `src/components/game/FeedbackRow.tsx`: accepts `guess: Guess`; maps `guess.bulls` to 🟩 (true) or 🟥 (false) for each of 5 positions; wraps each in a `<span>` with `aria-label="Position N: correct|incorrect"` (Gate V)
- [ ] T027 [P] [US1] Implement `src/components/game/ScoreDisplay.tsx`: accepts `score: number`; renders `<div aria-label="Running score: {score} / 150">{score} / 150</div>`; always mounted in layout (Gate: FR-022)
- [ ] T028 [P] [US1] Implement `src/components/ui/LiveRegion.tsx`: renders `<div aria-live="polite" aria-atomic="true" className="sr-only">{message}</div>`; accepts `message: string` prop; used to announce stat-solved and game-complete events (Gate V)
- [ ] T029 [US1] Implement `src/components/game/RankingList.tsx`: wraps `DndContext` and `SortableContext` (vertical list strategy); renders ordered list of `CountryCard`; on drag end calls `onReorder(newOrder: string[])` using `arrayMove`; configures `PointerSensor` with `activationConstraint: { distance: 8 }` and `KeyboardSensor` with `sortableKeyboardCoordinates` (Gate V — keyboard access); depends on T025
- [ ] T030 [US1] Implement `src/components/game/StatPanel.tsx`: accepts `stat: StatDef | null`, `isSolved: boolean`; renders stat label, direction label (e.g. "Rank from most to least" based on `stat.direction`), and a tooltip trigger placeholder (to be wired in US3); renders a "solved" badge when `isSolved`; renders nothing when `stat` is `null` (locked)
- [ ] T031 [US1] Implement game shell in `src/app/page.tsx` (`'use client'`): on mount compute UTC date string, load `GameState` from localStorage via `loadGameState(getPuzzleNumber())`; if no state or stale, fetch `/api/puzzle?date={date}` — show loading spinner during fetch, show error + retry button on failure (FR-020); derive `currentOrder` from last guess or default; render `<ScoreDisplay>`, active `<StatPanel>`, `<RankingList>` with submit button, historical `<FeedbackRow>`s for active stat, and `<LiveRegion>` for announcements; on submit: compute bulls by comparing `currentOrder` to `puzzle.stats[activeStatIndex].solution`, build new `Guess`, update and save `GameState`, advance `activeStatIndex` if all-bull, set `status: "complete"` after stat 2 solved, announce events via `LiveRegion`; render `<ResultCard>` when `status === "complete"`; depends on T025–T030
- [ ] T032 [US1] Run `npm test` and `npm run test:e2e` — confirm all US1 tests pass; confirm global coverage ≥ 80%; fix any failures

**Checkpoint**: US1 fully playable — load the game, drag-to-reorder, submit guesses, receive feedback, complete all three stats, view final score.

---

## Phase 4: User Story 2 — Share Result Card (Priority: P2)

**Goal**: After completing the puzzle the player sees an emoji grid of all their guesses and can copy the share text to clipboard with one click/tap.

**Independent Test**: Complete a game session; verify the result card displays `Rankle #N — X pts` header and an emoji grid with one line per stat (multiple guesses joined by ` / `); click the share button; confirm clipboard contains the correctly formatted plain text.

### Tests for User Story 2 — Write First, Confirm Failing (Gate II)

- [ ] T033 [P] [US2] Extend `tests/unit/scoring.test.ts` with failing tests for `buildShareText`: given a completed `GameState` and puzzle number, produces a string starting with `Rankle #N — X pts`; second line is blank; each stat produces one line `Stat N: 🟩🟥...` with multiple guesses joined by ` / `; no country names appear in the output (spoiler-free); single perfect guess produces `Stat 1: 🟩🟩🟩🟩🟩`
- [ ] T034 [P] [US2] Write failing unit tests for `ResultCard` in `tests/unit/ResultCard.test.tsx`: renders final score; renders one emoji row per guess per stat; renders a share button with accessible label; on share button click calls `navigator.clipboard.writeText` with the share text; shows "Copied!" confirmation text after click; mocks `navigator.clipboard.writeText` to resolve
### Implementation for User Story 2

- [ ] T035 [US2] Add `buildShareText(state: GameState, puzzleNumber: number): string` to `src/lib/scoring.ts`: header `Rankle #N — X pts`, blank line, then one line per stat `Stat N: [emojiRow] / [emojiRow] / ...` where each guess is 5 emojis (🟩 bull / 🟥 miss); stat labels are anonymous (`Stat 1`, `Stat 2`, `Stat 3`); no country names; pure function (Gate IV)
- [ ] T036 [US2] Implement `src/components/game/ResultCard.tsx`: accepts `state: GameState`, `puzzleNumber: number`; renders `<p>Rankle #{puzzleNumber} — {state.finalScore} pts</p>`; renders emoji grid — one row per guess per stat as `<FeedbackRow>`; renders share button; on click calls `navigator.clipboard.writeText(buildShareText(state, puzzleNumber))`, catches rejection, falls back to `navigator.share` if available, shows "Copied!" confirmation for 2 seconds; Tailwind-only styles (Gate: Styling)
- [ ] T037 [US2] Wire `ResultCard` into `src/app/page.tsx`: confirm `<ResultCard state={gameState} puzzleNumber={getPuzzleNumber()} />` is already rendered when `gameState.status === "complete"` (from T031); add `PlayerStats` update — on transition to complete call `savePlayerStats` with incremented `played`, `completed`, updated `totalScore`, `bestScore`, streak fields
- [ ] T038 [US2] Run `npm test` — confirm all US2 tests pass with ≥ 80% global coverage

**Checkpoint**: Completed game shows result card with emoji grid; share button copies formatted text to clipboard.

---

## Phase 5: User Story 3 — Stat Tooltip Inspection (Priority: P3)

**Goal**: A player can hover or tap the stat label to read a plain-language explanation of the metric; the tooltip dismisses on pointer-out or focus loss.

**Independent Test**: With a game running, hover (or tab to) the stat label; verify tooltip text matching `stat.tooltip` appears; move mouse away (or blur); verify tooltip disappears.

### Tests for User Story 3 — Write First, Confirm Failing (Gate II)

- [ ] T039 [P] [US3] Write failing unit tests for `Tooltip` in `tests/unit/Tooltip.test.tsx`: tooltip hidden on initial render; tooltip text appears after `mouseenter` event on trigger; tooltip hidden after `mouseleave`; tooltip appears after `focus` event on trigger; tooltip hidden after `blur`; tooltip element has `role="tooltip"`; trigger has `aria-describedby` pointing to tooltip `id` (Gate V)

### Implementation for User Story 3

- [ ] T040 [US3] Implement `src/components/ui/Tooltip.tsx`: accepts `content: string`, `children: ReactNode`; manages `visible` state; on `mouseenter`/`focus` set visible true, on `mouseleave`/`blur` set visible false; renders children wrapped in a container with `aria-describedby={tooltipId}`; renders `<div id={tooltipId} role="tooltip">` absolutely positioned above trigger; Tailwind classes only (Gate: Styling)
- [ ] T041 [US3] Wire `Tooltip` into `src/components/game/StatPanel.tsx`: wrap stat label with `<Tooltip content={stat.tooltip}>` so hover and tap (via focus) reveal `stat.tooltip` plain-language text; tooltip only rendered when stat is active (not null/locked)
- [ ] T042 [US3] Run `npm test` — confirm US3 tests pass with ≥ 80% global coverage

**Checkpoint**: Stat tooltips are functional and keyboard-accessible.

---

## Phase 6: User Story 4 — Daily Puzzle Rotation (Priority: P3)

**Goal**: Each calendar day shows a fresh puzzle; players who already completed today's puzzle see their completed result on revisit; stale state from a previous day is silently discarded.

**Independent Test**: Complete today's puzzle; reload the page; assert the result screen is shown immediately without re-playing. Then simulate a day change by writing a mismatched `puzzleNumber` into localStorage; reload; assert a fresh puzzle is fetched.

### Tests for User Story 4 — Write First, Confirm Failing (Gate II)

- [ ] T043 [P] [US4] Extend `tests/unit/game-state.test.ts` with failing tests for rotation scenarios: `loadGameState(n)` where stored `puzzleNumber` is `n - 1` returns `null` (midnight cutover discards stale state); `loadGameState(n)` where stored state has `puzzleNumber === n` and `status: "complete"` returns the completed state object; verify no mutation of the stored object occurs
- [ ] T044 [P] [US4] Extend `tests/e2e/game-flow.spec.ts` with rotation test: inject a completed `GameState` into localStorage (matching today's puzzle number) before navigating; load `/`; assert `RankingList` is NOT in the DOM; assert `ResultCard` IS in the DOM with the stored score

### Implementation for User Story 4

- [ ] T045 [US4] Verify stale-detection in `src/lib/game-state.ts` (implemented in T016): confirm `loadGameState` early-returns `null` when `parsed.puzzleNumber !== currentPuzzleNumber`; if not already covered, add the explicit midnight-cutover branch and the `try/catch` around `JSON.parse` so corrupt localStorage never throws
- [ ] T046 [US4] Verify completed-state short-circuit in `src/app/page.tsx` (wired in T031): confirm that when `loadGameState` returns a state with `status: "complete"` the page renders `<ResultCard>` immediately on mount without fetching the puzzle API or showing `<RankingList>`; add the conditional render if not already present
- [ ] T047 [US4] Run `npm test` and `npm run test:e2e` — confirm US4 tests pass with ≥ 80% global coverage

**Checkpoint**: Daily rotation fully functional — fresh puzzle each day, completed state persists and is shown on revisit.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility audit, performance validation, and final suite verification.

- [ ] T048 [P] Write failing unit tests for `LiveRegion` in `tests/unit/LiveRegion.test.tsx`: element has `aria-live="polite"` and `aria-atomic="true"`; `message` prop content is rendered in the DOM; visually hidden via Tailwind `sr-only` class; run `npm test` to confirm pass
- [ ] T049 [P] Audit loading state and error/retry UI in `src/app/page.tsx`: confirm a visible loading indicator is shown while the puzzle API call is in-flight; confirm the error state renders a human-readable message and a retry button that re-triggers the fetch (FR-020); add if missing
- [ ] T050 [P] Verify drag performance in `src/components/game/RankingList.tsx`: confirm dnd-kit drag transform is applied via CSS `transform` only (not `top`/`left`/`width`/`height`) during drag; confirm `will-change: transform` or equivalent is applied to dragging items; no layout thrash during drag (Gate: Performance Budget)
- [ ] T051 WCAG 2.1 AA audit across all components: confirm all interactive elements are keyboard-focusable and have visible focus indicators; confirm bull/miss feedback uses 🟩/⬜ shape and aria-labels — not color alone (Gate V); confirm `KeyboardSensor` is active in `RankingList`; confirm `aria-live` region fires on stat-solved and game-complete; fix any violations found
- [ ] T052 Run full test suite: `npm test` + `npm run test:e2e` — confirm all 53 tasks' tests pass; confirm global Vitest coverage ≥ 80% for `src/`; confirm no TypeScript errors (`npx tsc --noEmit`); fix any failures
- [ ] T053 Run quickstart.md validation: `npm run dev`; verify game loads at `http://localhost:3000`; verify `curl "http://localhost:3000/api/puzzle?date=$(date -u +%Y-%m-%d)"` returns puzzle JSON with `Cache-Control` header; verify `ls public/flags/ | head -5` lists SVG files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — no cross-story dependencies
- **US2 (Phase 4)**: Depends on Phase 2; integrates with US1 (`ResultCard` wired into `page.tsx`) — independently testable
- **US3 (Phase 5)**: Depends on Phase 2; `Tooltip` component wired into `StatPanel` from US1 — independently testable
- **US4 (Phase 6)**: Depends on Phase 2; rotation logic lives in `game-state.ts` and `page.tsx` from US1 — independently testable
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Unblocked after Phase 2 — no story dependencies
- **US2 (P2)**: Unblocked after Phase 2; shares `page.tsx` with US1 (T037 extends T031)
- **US3 (P3)**: Unblocked after Phase 2; `Tooltip` is a new component, wires into `StatPanel` from US1
- **US4 (P3)**: Unblocked after Phase 2; rotation logic is in `game-state.ts` from Phase 2

### Within Each User Story

1. Write tests → confirm they **fail** (Gate II)
2. Implement (models → utilities → components → page wiring)
3. Run tests → confirm they **pass**
4. Verify coverage ≥ 80% before moving to next story

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Write all lib tests in parallel (different files):
Task: "Write failing tests for puzzle.ts"      → tests/unit/puzzle.test.ts
Task: "Write failing tests for scoring.ts"     → tests/unit/scoring.test.ts
Task: "Write failing tests for game-state.ts"  → tests/unit/game-state.test.ts

# Then implement in parallel (different files):
Task: "Implement src/lib/puzzle.ts"            → src/lib/puzzle.ts
Task: "Implement src/lib/scoring.ts"           → src/lib/scoring.ts
```

## Parallel Example: User Story 1

```bash
# Write all tests in parallel:
Task T021: tests/unit/CountryCard.test.tsx
Task T022: tests/unit/FeedbackRow.test.tsx
Task T023: tests/unit/ScoreDisplay.test.tsx
Task T024: tests/e2e/game-flow.spec.ts

# Implement leaf components in parallel (no inter-dependencies):
Task T025: src/components/game/CountryCard.tsx
Task T026: src/components/game/FeedbackRow.tsx
Task T027: src/components/game/ScoreDisplay.tsx
Task T028: src/components/ui/LiveRegion.tsx
Task T030: src/components/game/StatPanel.tsx

# Then sequential (depends on leaf components):
Task T029: src/components/game/RankingList.tsx   (depends on T025)
Task T031: src/app/page.tsx                       (depends on T025–T030)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run `npm test` + `npm run test:e2e`; play through a full game manually
5. Deploy to Vercel if validated

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3 (US1) → Full playable game → Deploy (MVP!)
3. Phase 4 (US2) → Share feature → Deploy
4. Phase 5 (US3) → Tooltip polish → Deploy
5. Phase 6 (US4) → Rotation lockout verified → Deploy
6. Phase 7 → Accessibility + performance audit → Production-ready

---

## Notes

- `[P]` tasks touch different files and have no dependency on incomplete sibling tasks
- `[USN]` label maps each task to its user story for traceability
- Constitution Gate II is NON-NEGOTIABLE: confirm tests fail before writing implementation
- Constitution Gate I: no `any`, strict TypeScript throughout
- Constitution Gate IV: all localStorage access only via `game-state.ts`; all UTC logic only via `puzzle.ts`; all scoring only via `scoring.ts`
- Constitution Gate: Tailwind utility classes only — no `style={}` props, no CSS-in-JS
- Scoring: max 150 total (50 per stat, 10 per position), linear formula `max(10 - 2n, 0)` per position from spec.md FR-011
- Commit after each phase or logical group
