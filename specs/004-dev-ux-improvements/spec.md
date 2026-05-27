# Feature Specification: Dev Testing & UX Improvements

**Feature Branch**: `004-dev-ux-improvements`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "Dev testing is broken, I cant select other days to test different seeds of the implementation. Make all the hardcoded tests go away, and make the dev testing be a randomize seed one instead, so essentially it just generates another day. The second thing is that I want the guesses that have been made to be visible. If I fail on the first guess, I want to see what I input in it in some way. Third thing is more frontend related, the country selection box at the bottom is so small. I would like to make it bigger."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Randomized Dev Test Mode (Priority: P1)

A developer wants to quickly test a fresh puzzle session without being tied to a specific calendar date. They should be able to trigger a "play random puzzle" action that generates a new game session from a randomly chosen available puzzle — behaving just like any real game day, but with an unpredictable puzzle so they can verify different data scenarios. There are no hardcoded test dates or date-picker UI; just a single "Randomize" action in the dev toolbar.

**Why this priority**: Dev workflow is broken. Without an easy way to load a fresh puzzle in local development, iterating on the game is slow and error-prone. This unblocks all other development work.

**Independent Test**: Can be fully tested by opening the game in development mode, pressing "Randomize", and verifying a new puzzle loads with its countries and stats. Delivers a working dev workflow independently of any other changes.

**Acceptance Scenarios**:

1. **Given** the game is running in development mode, **When** the developer activates the "Randomize" action, **Then** the game loads a puzzle chosen at random from all available puzzle files, starting from a fresh state (no previous guesses).
2. **Given** a random puzzle has been loaded via dev mode, **When** the developer activates "Randomize" again, **Then** a different puzzle (or the same, by chance) loads fresh — behaving identically to a new daily game session.
3. **Given** the game is running in production mode, **When** the page loads, **Then** no dev randomize control is visible or accessible.
4. **Given** the dev mode toolbar previously had a date-picker or hardcoded test dates, **When** the feature is deployed, **Then** those controls are gone and only the randomize action remains.

---

### User Story 2 - Guess History Visibility (Priority: P2)

A player who submits an incorrect guess wants to see — immediately, while still playing that round — the exact order of countries they just submitted, so they can use that information to adjust their next attempt without relying on memory. The guess history appears between the stat description and the ranking board, stays visible for every subsequent attempt on the same stat, and disappears when moving to the next stat.

**Why this priority**: Without being able to see past guesses during a round, players must hold their previous ordering in memory. This is the primary frustration the user reported — the history must be visible **while the round is still active**, not just as a retrospective.

**Independent Test**: Can be fully tested by submitting an incorrect guess and verifying the submitted country names appear in the feedback area above the ranking board while the round is still in progress. Delivers improved in-round strategy independently.

**Acceptance Scenarios**:

1. **Given** a player is mid-round and has just submitted an incorrect guess, **When** the feedback area updates, **Then** each past guess is shown immediately in the active game view — with country names (and flags) in the order submitted — so the player can see it before making their next attempt.
2. **Given** a player has submitted multiple incorrect guesses on the same stat, **When** they look at the feedback area above the ranking board, **Then** all previous guesses for that stat are shown in chronological order, oldest first, all remaining visible simultaneously.
3. **Given** a player solves a stat on their first guess, **When** they advance to the next stat, **Then** no guess history is shown for the new stat (there is nothing to review yet).
4. **Given** a player reloads the page mid-game, **When** the game restores from saved state, **Then** the guess history for the active stat is shown exactly as it was before the reload.

---

### User Story 3 - Enlarged Country Selection Area (Priority: P3)

A player wants to comfortably interact with the country chips in the "Available" pool at the bottom of the board. Currently the chips are too small to read or tap easily, which makes the game feel cramped. The redesigned chips should be larger, clearly readable, and visually appealing — whether that means larger text, bigger flag representations, or a redesigned layout — without sacrificing usability on typical screen sizes.

**Why this priority**: Usability polish. The game is functional without this change, but small interactive targets lead to mis-taps and a poor first impression. This is lower priority than fixing broken dev workflow and guess visibility.

**Independent Test**: Can be fully tested by comparing the "Available" country chip pool before and after. Delivers a noticeably more comfortable interaction target independently.

**Acceptance Scenarios**:

1. **Given** a puzzle is in progress, **When** a player looks at the "Available" country pool, **Then** each country chip is large enough to clearly display the country name and a flag representation without truncation.
2. **Given** a player is on a typical desktop browser, **When** they interact with the enlarged chips (drag or click), **Then** the interaction behaves the same as before — drag-and-drop and click-to-place still work correctly.
3. **Given** the flag display is a critical part of the chip identity, **When** the chips are enlarged, **Then** the flag is rendered at an appropriately scaled size that looks sharp and recognizable (not pixelated or stretched).
4. **Given** there are 5 country chips in the pool, **When** displayed at the new larger size, **Then** all chips are visible without horizontal overflow or layout breaking on a standard desktop viewport (1280px wide or more).

---

### Edge Cases

- What happens when there is only one available puzzle file? The randomize action should still work, loading that single puzzle each time.
- What happens when guess history grows long (e.g., 5 wrong guesses)? The history display must not overflow or obscure the active board.
- What happens when a country name is very long? Chips must handle long names gracefully (text wrapping or truncation with full name accessible).
- What happens if flag rendering fails? The chip must still display the country name clearly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: In development mode, the dev toolbar MUST provide a single "Randomize" action that loads a randomly selected puzzle from all available puzzle files.
- **FR-002**: The randomize action MUST reset all game state (guesses, scores, locks, active stat) to a fresh start before loading the new puzzle.
- **FR-003**: The date-picker control and any hardcoded test dates in the dev toolbar MUST be removed; the only dev-mode puzzle-switching mechanism is randomize.
- **FR-004**: The dev toolbar MUST remain invisible and inaccessible in production/non-development builds.
- **FR-005**: After each submitted guess, the game MUST immediately display the full submitted ordering (country identity — name and flag — in each position) in the active game view, above the ranking board and below the stat description, so the player can reference it before their next attempt.
- **FR-006**: All past guesses for the currently active stat MUST be shown in chronological order and MUST remain visible throughout the entire duration of that stat (until it is solved or the player advances), never hidden or collapsed.
- **FR-007**: Guess history MUST persist across page refreshes for games loaded from saved state (same as existing game state persistence behavior).
- **FR-008**: Each country chip in the "Available" pool MUST be rendered at a size that is comfortably tappable and readable on desktop — with the country name and flag clearly visible.
- **FR-009**: Flag representations MUST scale appropriately with the chip size and remain visually recognizable; if emoji or CSS-based flags appear degraded at larger sizes, an alternative rendering approach MUST be used.
- **FR-010**: The enlarged chip layout MUST not cause horizontal overflow or breaking on viewports 1280px wide and above with 5 chips displayed simultaneously.

### Key Entities

- **Dev Toolbar**: The development-only floating control panel; previously a date-picker, now a single randomize action button.
- **Guess Record**: A single submitted ordering for one stat round — contains the country identities placed in positions 1–5 and the correctness markers for each position.
- **Country Chip**: The interactive UI element representing a country in the available pool; has a name, flag representation, and drag/click interaction.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can load a new random puzzle in under 2 seconds after triggering the randomize action.
- **SC-002**: The dev toolbar date-picker and all hardcoded test date references are fully removed; zero references to specific test dates exist in development-mode UI.
- **SC-003**: After an incorrect guess, a player can identify which country they placed in each position without relying on memory — confirmed by 100% of previous guesses displaying country identity information.
- **SC-004**: Country chips in the available pool have an interactive target height of at least 48px, meeting standard touch-target guidelines.
- **SC-005**: All 5 country chips fit within the visible pool area on a 1280px viewport without horizontal scrolling.

## Assumptions

- All three improvements target the existing single-page WorldOrder game. No new pages, routes, or backend services are introduced.
- The randomize action pulls from puzzle files that already exist on disk; it does not generate new puzzle data dynamically.
- Guess history display reuses the country identity data already present in the saved `GameState` — no new data needs to be stored.
- The country chip redesign targets desktop-first (1280px+); mobile layout is a secondary concern and not required for this feature.
- "Flag representation" may use the existing CSS-class-based flag icons, emoji, or a different approach — the choice is deferred to the implementation as long as flags are clearly identifiable at the new chip size.
- Dev mode is determined entirely by the existing `NODE_ENV === 'development'` check; no new environment variables or feature flags are needed.
