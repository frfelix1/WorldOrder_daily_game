# Feature Specification: Daily Game Stats

**Feature Branch**: `014-daily-stats`
**Created**: 2026-09-18
**Status**: Draft
**Input**: User description: "For my current game, I would like to use localstorage in the browser to track stats. Stats should be viewable and saved after every day. It should offer at a glance which days you completed, and your score for the day."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save a completed daily game (Priority: P1)

As a player, I want my completed daily game and score to be saved automatically so that I can return later without losing my result.

**Why this priority**: Preserving the result is the foundation for any useful history and prevents manual recording.

**Independent Test**: Solve the final stage, close or reload before opening the recap, return in the same browser, and verify that the day is marked complete with the recorded score.

**Acceptance Scenarios**:

1. **Given** the player has solved the final stage with a score, **When** the final solution is accepted, **Then** the current UTC puzzle day is saved with completion status and score before the recap is opened.
2. **Given** the player has already completed the current day, **When** the game is revisited, **Then** the saved result remains available and the day is not treated as incomplete.
3. **Given** the browser cannot save local game data, **When** the player completes a game, **Then** the game remains usable, the in-memory result remains visibly complete, and the player is told that the result could not be saved.

---

### User Story 2 - Review daily history at a glance (Priority: P1)

As a player, I want to see which days I completed and each day's score in one view so that I can quickly understand my progress.

**Why this priority**: The requested value is a glanceable history, not only an invisible save operation.

**Independent Test**: Seed saved results for multiple completed days and open the stats view; verify each day and score are distinguishable and the current unsolved day is visibly incomplete.

**Acceptance Scenarios**:

1. **Given** saved results exist for several days, **When** the player opens the stats view, **Then** each saved day is shown as completed and the current day is shown as incomplete only when it has not been solved.
2. **Given** a day was completed and has a score, **When** the player views that day, **Then** the score is displayed alongside the day.
3. **Given** no daily results exist and the current day is unsolved, **When** the player opens the stats view, **Then** an empty state explains that completed games will appear there and identifies today as incomplete.

---

### User Story 3 - Keep history across browser sessions (Priority: P2)

As a returning player, I want my daily history to remain after closing and reopening the browser so that my progress is persistent on this device.

**Why this priority**: Persistence makes the history useful over time while remaining local to the current browser and device.

**Independent Test**: Solve a game, close or reload the page, and confirm that the same result is still displayed without replaying the game.

**Acceptance Scenarios**:

1. **Given** a daily result was saved in a previous session, **When** the player opens the game again in the same browser, **Then** the result is restored in the stats view.
2. **Given** saved history contains more than one day, **When** the player opens the stats view, **Then** history is ordered newest first using UTC puzzle-day identity.

### Edge Cases

- If a player refreshes or revisits before completing the current day, the day remains incomplete and no score is shown.
- If completion is recorded more than once for the same day, history keeps one result; a valid later result may replace an earlier result.
- If a saved result has an invalid or missing score but a valid day identity, the day remains identifiable and the score is shown as unavailable.
- If saved data uses an unsupported history version, it is ignored without being overwritten and the stats view explains that history is unavailable.
- If history storage fails after the game completes, the completed result remains visible in memory and a later reload may show it as unsaved rather than claiming persistence.
- If the player clears browser data, local history is unavailable and the game starts with an empty stats view.
- If the device timezone changes, results remain associated with their UTC puzzle day and date labels do not shift to an adjacent day.
- If the puzzle request fails, saved stats remain viewable and are not replaced by empty history.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST record a daily result when the player successfully solves the final stage, before the recap is opened.
- **FR-002**: Each daily result MUST include the UTC puzzle day, puzzle identity, completed status, and the final score when a valid score is available.
- **FR-003**: The game MUST show at most one result for each UTC puzzle day, and repeated writes MUST NOT create duplicate day entries.
- **FR-004**: The game MUST save daily results in the player's current browser so they remain available across reloads and browser sessions on that browser and device.
- **FR-005**: The game MUST provide a view where players can see daily results without replaying each day.
- **FR-006**: The stats view MUST show each saved day as completed and MUST show the current day as incomplete only when no completed in-memory or persisted result exists for it.
- **FR-007**: The stats view MUST show the score next to each completed day when a valid score exists and MUST show "Score unavailable" when the day identity is valid but the score is not.
- **FR-008**: The stats view MUST present multiple days in reverse chronological order using UTC puzzle-day identity without timezone-shifting date labels.
- **FR-009**: The game MUST distinguish genuinely empty history from unavailable, corrupt, or unsupported history data.
- **FR-010**: The game MUST continue operating if browser storage is unavailable, MUST keep a completed in-memory result visible, and MUST tell the player that results may not persist.
- **FR-011**: The game MUST handle malformed, partially invalid, and unsupported-version history data without preventing the stats view or game from loading.
- **FR-012**: The history format MUST include an explicit supported version and MUST NOT overwrite data from an unsupported version.
- **FR-013**: Saving one day MUST NOT remove or replace unrelated daily results, including results written by another tab.

### Key Entities

- **Daily Result**: One UTC puzzle day's game outcome, including puzzle identity, completion status, and optional score.
- **Stats History**: The derived collection of valid versioned daily results for the current browser and device, ordered newest first.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After solving a daily game, 100% of subsequent reloads in the same browser during testing show the saved day and score when browser storage is available, even if the recap was never opened.
- **SC-002**: A player can identify whether a day was completed and find its score within 5 seconds of opening the stats view.
- **SC-003**: In usability testing, at least 90% of players correctly identify completed days and scores without opening an individual day.
- **SC-004**: The stats view remains usable and displays the correct empty, unavailable, unsupported-version, or partially-recovered state in 100% of tested storage failure and corruption cases.

## Assumptions

- The feature is for one player using one browser and device; accounts, synchronization, export, and cross-device history are out of scope.
- A day is identified by the existing UTC puzzle date and puzzle number; date-only labels are formatted without local timezone conversion.
- The existing game determines when a daily game is complete and provides the score.
- The existing lifetime `PlayerStats` aggregate is not redesigned by this feature; daily history correctness must not depend on aggregate counters.
- Existing game styling and navigation patterns will be reused for the stats view.
- Players may clear browser data, so local history is not treated as a guaranteed backup.
