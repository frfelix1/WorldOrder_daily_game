# Feature Specification: WorldOrder — Daily Geography Ranking Game

**Feature Branch**: `001-worldorder-daily-game`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "WorldOrder is a daily geography game. 5 countries are presented upfront. 3 stats are revealed one at a time. For each stat the player submits a ranking of the 5 countries and receives positional feedback (bulls only) until solved. Final unified score is shared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Play a Full Daily Game (Priority: P1)

A player visits the game, sees five countries for today's puzzle, and works through three stats one at a time. For each stat they rearrange the countries into their best guess order and submit. They receive feedback showing which countries are in the correct position, then refine and resubmit until all five are correct. After solving all three stats they see their final score.

**Why this priority**: This is the core game loop. Every other feature exists in service of this experience.

**Independent Test**: Can be fully tested by loading the game, playing through all three stats to completion, and verifying the final score screen appears with a correct score.

**Acceptance Scenarios**:

1. **Given** a player loads the game on any day, **When** the page loads, **Then** five countries (each showing name and flag) are displayed and the first stat is revealed with its description, ranking direction (e.g., "Rank from most to least"), and tooltip.
2. **Given** a stat is active, **When** the player arranges the five countries and submits, **Then** they receive bulls-only feedback: each country is marked either "correct position" or "incorrect position," and the running unified score updates to reflect any penalties from that guess.
3. **Given** the player submits a guess with at least one country in the wrong position, **When** feedback is shown, **Then** no directional hint is given for incorrectly placed countries — only a "wrong position" indicator.
4. **Given** all five countries are in the correct position for a stat, **When** the player submits, **Then** the stat is marked solved, the confirmed correct ordering is displayed in a "solved" state, and after a brief moment the next stat is revealed (or the game ends if it was the third stat).
5. **Given** all three stats are solved, **When** the final state is reached, **Then** a unified score is displayed to the player.

---

### User Story 2 — Share Result Card (Priority: P2)

After completing the puzzle, the player shares their result as copyable text — an emoji grid showing bull/miss for each guess across each stat, plus their final score.

**Why this priority**: Sharing drives daily re-engagement and word-of-mouth discovery; it is a core feature, not an afterthought.

**Independent Test**: Can be tested independently by completing a game session and verifying the share text is generated, displays the correct emoji grid, and copies to clipboard successfully.

**Acceptance Scenarios**:

1. **Given** the player has completed all three stats, **When** they view the result card, **Then** it displays an emoji grid representing bull/miss for every guess in every stat, plus the final score.
2. **Given** the result card is displayed, **When** the player taps/clicks the share action, **Then** the result card text is copied to clipboard (or a native share sheet is invoked on mobile), and the player receives confirmation.
3. **Given** the shared text is pasted elsewhere, **When** read by someone else, **Then** it is legible as plain text with no formatting dependencies.

---

### User Story 3 — Stat Tooltip Inspection (Priority: P3)

A player encounters a stat they are unfamiliar with and taps/hovers the stat label to read an explanation before guessing.

**Why this priority**: Tooltips reduce friction and make the game accessible to players unfamiliar with a given metric; they support but do not block the core loop.

**Independent Test**: Can be tested by hovering/tapping the stat label on any active stat and verifying the tooltip text appears and correctly describes the metric.

**Acceptance Scenarios**:

1. **Given** a stat is active, **When** the player hovers or taps the stat label, **Then** a tooltip appears explaining what the stat measures in plain language.
2. **Given** a tooltip is visible, **When** the player moves focus away (mouse out / tap elsewhere), **Then** the tooltip dismisses cleanly.

---

### User Story 4 — Daily Puzzle Rotation (Priority: P3)

Each calendar day a new puzzle is available. Returning players cannot replay yesterday's puzzle to improve their score.

**Why this priority**: Daily cadence creates habitual return; lockout after completion preserves score integrity.

**Independent Test**: Can be tested by completing today's puzzle, refreshing the page, and verifying the game shows the already-completed state rather than allowing a fresh attempt.

**Acceptance Scenarios**:

1. **Given** a player has not yet played today's puzzle, **When** they visit the game, **Then** today's puzzle is presented fresh.
2. **Given** the calendar day changes, **When** a player visits the game, **Then** a new puzzle (different countries and stats) is presented.
3. **Given** a player has already completed today's puzzle, **When** they revisit the game on the same day, **Then** their completed result is shown rather than allowing a new attempt.
4. **Given** a player attempts to access a past day's puzzle, **When** no archive is available, **Then** the game shows only today's puzzle with no navigation to previous dates.

---

### Edge Cases

- What happens when a player's network connection drops mid-game? Progress MUST be preserved locally on the player's device so they can resume on reload.
- What happens if the puzzle cannot be fetched from the server on first load? The system MUST display a user-friendly error message with a retry option rather than a blank or broken state.
- What happens if the player tries to submit without rearranging any countries? The system MUST allow submission from any ordering (including the default order) — there is no "unchanged" guard.
- How does the system handle the same country being tied on a stat (two countries with identical values)? The puzzle MUST only include stats where all five countries have distinct values, preventing ambiguous correct orderings.
- What if the player views the game on a very small screen? The drag-to-reorder interface MUST remain functional on mobile touch screens.
- What if a stat category is not available in sufficient variety for a given puzzle? The puzzle generator MUST ensure stats span at least two distinct categories.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the same puzzle (same five countries and three stats) to all players on a given calendar day.
- **FR-002**: System MUST display all five countries with their name and national flag before any stat is revealed.
- **FR-003**: System MUST reveal stats sequentially — the second stat is only shown after the first is solved, and the third only after the second is solved.
- **FR-004**: Each stat MUST have an accompanying tooltip that explains in plain language what the stat measures (e.g., "Urbanization rate: the percentage of the population living in urban areas") and MUST specify the ranking direction for that stat (e.g., "Rank from most urbanized to least urbanized").
- **FR-005**: Tooltips MUST be accessible via hover on pointer devices and via tap on touch devices.
- **FR-006**: System MUST allow players to reorder the five countries using drag-to-reorder interaction.
- **FR-007**: System MUST accept a ranking submission at any time once a stat is active.
- **FR-008**: After each submission, system MUST display bulls-only positional feedback: each country position is marked correct or incorrect, with no directional hint for incorrect positions.
- **FR-009**: A stat is solved when all five countries are in the correct position; the system MUST display the confirmed correct ordering in a "solved" state before advancing to the next stat.
- **FR-010**: System MUST allow unlimited guesses per stat until it is solved.
- **FR-011**: System MUST calculate a unified score across all three stats using a linear points model. Each of the five country positions in each of the three stats is worth a maximum of 10 points (maximum total: 150 pts). A position scores `max(10 − 2 × n, 0)` points, where `n` is the number of guesses on which that country was in the wrong position before being placed correctly. Higher score is better; a perfect game (every position correct on the first guess) scores 150.
- **FR-012**: System MUST display a final result screen after all three stats are solved, showing the unified score.
- **FR-013**: The result screen MUST include a shareable emoji grid showing bull/miss per guess per stat, formatted as plain text.
- **FR-014**: System MUST provide a one-tap/one-click action to copy the result card text to the clipboard (or invoke a native share sheet).
- **FR-015**: No daily puzzle MUST contain three stats from the same category; stats MUST span at least two distinct categories per puzzle.
- **FR-016**: Each puzzle MUST only use stats for which all five selected countries have distinct values, ensuring a single unambiguous correct ordering.
- **FR-017**: System MUST persist a player's game state locally on their device so an in-progress or completed game is recoverable after a page reload or accidental close.
- **FR-018**: Once a player has completed today's puzzle, system MUST show their completed result on revisit rather than allowing a fresh attempt.
- **FR-019**: System MUST retrieve today's puzzle from a server when the player loads the game.
- **FR-020**: System MUST display a loading state while the puzzle is being retrieved, and MUST display a user-friendly error message with a retry option if retrieval fails.
- **FR-021**: System MUST only make today's puzzle available; past puzzles are not accessible to players. A puzzle archive is out of scope for this feature.
- **FR-022**: System MUST display a running unified score, visible at all times during gameplay, that updates after each guess. The score starts at 0 and increases as positions are solved; higher is better. The maximum achievable score is 150.

### Key Entities

- **Puzzle**: The daily challenge. Contains exactly five countries and exactly three stats with their correct orderings. Identified by calendar date.
- **Country**: A nation represented by its name and national flag. The subject of ranking.
- **Stat**: A measurable geographic or demographic metric. Has a label, a human-readable tooltip description, a sort direction (highest-to-lowest or lowest-to-highest), a numeric value per country, and a category (e.g., economy, demographics, geography).
- **Category**: A grouping of related stats (e.g., demographics, geography, economy). Used to enforce puzzle variety.
- **Guess**: A single submitted ordering of five countries for an active stat. Contains the ordered list of countries and the resulting bull feedback.
- **Game Session**: A player's progress through today's puzzle. Tracks which stats are solved, all guesses per stat, the running unified score (updated after every guess), and the final score once complete.
- **Result Card**: A textual summary of a completed game session, consisting of an emoji grid (bull/miss per guess per stat) and the final score.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can complete a full game session (all three stats solved) in under 10 minutes on a first-time attempt.
- **SC-002**: The drag-to-reorder interaction is usable on both desktop (mouse) and mobile (touch) without requiring instructions.
- **SC-003**: The result card copies to clipboard (or triggers share sheet) in under one second of the player tapping the share action.
- **SC-004**: 90% of players who start a game complete all three stats on their first daily visit.
- **SC-005**: The correct-position feedback unambiguously communicates to players which countries are in the right place, measurable by players reliably narrowing down to the correct answer within a reasonable number of guesses.
- **SC-006**: Each day presents a distinct puzzle from the previous day; no puzzle repeats within any rolling 30-day window.
- **SC-007**: Stat tooltips are comprehensible to a general audience — a player with no specialist knowledge can understand what is being measured.

## Assumptions

- Players access the game via a modern web browser on desktop or mobile; no native app is required for this feature.
- Player identity is not required; the game is anonymous and game state is stored locally on the player's device (no account or login needed).
- Puzzle content (country selection, stat selection, correct orderings) is curated editorially or by an automated pipeline and delivered to players via a server API; content curation and the server itself are outside the scope of this feature, which covers only the player-facing game experience.
- The scoring formula is linear for MVP: each country position earns `max(10 − 2n, 0)` points where `n` is the number of wrong guesses before that position is solved. Maximum score is 150 (all 15 positions correct on first guess). The curve may be revisited post-MVP based on playtesting.
- National flag images are available as a reliable asset (e.g., via a standard flag emoji or image set).
- A "day" is defined in UTC to ensure all players worldwide see the same puzzle switch at the same time.
- Stats used in puzzles are sourced from a curated dataset where all values are up-to-date and verified; data accuracy is out of scope for this feature.
- Mobile support includes the drag-to-reorder mechanic functioning via touch interaction; a tap-based fallback (e.g., tap-to-select, tap-to-place) is out of scope for MVP but may be considered post-launch.
- A puzzle archive (access to past days' puzzles) is out of scope for this feature; only today's puzzle is available at any given time.

## Clarifications

### Session 2026-05-22 (continued)

- Q: What is the scoring formula? → A: Linear MVP model. Each of the 5 positions across each of the 3 stats is worth up to 10 points. Score per position = `max(10 − 2n, 0)` where `n` = number of wrong guesses before that position was correct. Score starts at 0; higher is better; perfect game = 150 pts.
- Q: What is the localStorage persistence schema? → A: Single key `worldorder_state_v1`. Fields: `puzzleDate` (YYYY-MM-DD), `stats` (array of `{ solved: boolean, guesses: string[][] }`), `score` (number), `completed` (boolean). No solution or feedback stored — solution is re-fetched on reload and feedback is recomputed client-side.
- Q: What happens when UTC midnight passes mid-session? → A: Hard cutover. On next interaction (submit, reload), if `puzzleDate` in localStorage differs from current UTC date, state is discarded and the new puzzle loads fresh. No grace period.
- Q: What is the share text format? → A: Header line (`WorldOrder #N — X pts`), then one line per stat showing guesses separated by ` / `, each guess as 5 emojis: 🟩 = correct position, 🟥 = wrong position. Stat labels are anonymous (`Stat 1` etc.) to avoid spoilers. No country names included.
- Q: What is the score direction and initial value? → A: Score starts at 0; higher is better. Scoring is additive — points are earned as positions are solved.

- Q: When ranking countries by a stat, is there a fixed direction (always highest-to-lowest or always lowest-to-highest), or does each stat specify its own direction? → A: Direction is specified per stat in the puzzle data; each stat includes its own sort direction (e.g., "highest-to-lowest" or "lowest-to-highest"), which is surfaced to the player alongside the stat label and tooltip.
- Q: How is the daily puzzle delivered to the player's device? → A: The puzzle is fetched from a server/API when the player loads the game; a loading state is shown during retrieval and an error with retry is shown if retrieval fails.
- Q: After a player solves a stat, is the confirmed correct ordering displayed before the next stat is revealed, or does the game advance immediately? → A: The confirmed correct ordering is shown in a "solved" state after each stat is completed, before the next stat is revealed.
- Q: Should past days' puzzles be accessible to players who missed them? → A: No — only today's puzzle is accessible; a puzzle archive is out of scope for this feature.
- Q: Should players see a running score during gameplay or only at the end? → A: A live running score is displayed at all times and updates after each guess.
