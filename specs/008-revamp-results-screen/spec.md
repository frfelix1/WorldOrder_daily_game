# Feature Specification: Revamp Results Screen

**Feature Branch**: `feature/summary`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "For my current game, I want the score bar that has some sort of animation to NOT have the animation. I also want the summary screen to be completely revamped. It should be better divided into the groups and stats that were played. It should be displayed (per group) what stat it was, the users guesses, and the right value for each stat, similar to how the value is displayed during the rounds. The share button in the summary screen should also only copy the result to the clipboard like there is an option to do now, and it should not be able to do other things than that."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Revamped Summary Screen (Priority: P1)

After completing all three rounds of the daily puzzle, the player reaches the summary screen. The screen is clearly structured with one section per group (stat) they played. Each section displays the stat name, all of the player's guesses for that stat with correct/wrong feedback, and the correct value (e.g., GDP per capita, population) for each of the five countries — formatted the same way values appear when revealed inline during gameplay.

**Why this priority**: This is the core of the revamp. The current results screen does not clearly separate groups or show the correct answer values alongside guesses. This change gives players a clear post-game review of their performance per stat, making the results screen genuinely informative.

**Independent Test**: Can be tested in isolation by completing a puzzle and reviewing the summary screen — verifying that each of the three stat sections is visible, contains the correct stat name, all guesses with feedback, and the resolved correct values for all five countries.

**Acceptance Scenarios**:

1. **Given** a player has completed all three rounds, **When** the summary screen appears, **Then** three distinct sections are shown — one per stat — each visually separated from the others.
2. **Given** a stat section is displayed, **When** the player views it, **Then** the stat's label is shown at the top of the section.
3. **Given** a stat section is displayed, **When** the player views it, **Then** all guesses the player made for that stat are shown in order, with correct/wrong per-country feedback identical to the in-game feedback rows.
4. **Given** a stat section is displayed, **When** the player views it, **Then** the correct value for each of the five countries is shown, formatted the same way values are shown inline during gameplay (e.g., "1.2M", "$42,000").
5. **Given** a player scored a perfect round on one stat, **When** the player views that stat's section, **Then** only one guess row is shown, with all five positions marked correct.

---

### User Story 2 - Static Score Bar (Priority: P2)

The score bar (both the in-game running score bar and the one on the summary screen) displays the player's current score without any visual animation effects — no shimmer sweep, no glow pulse, and no animated width transition.

**Why this priority**: The player explicitly wants a distraction-free score display. Removing animations keeps the interface focused and removes visual noise during both gameplay and the final results review.

**Independent Test**: Can be tested by playing through a round and observing the score bar does not animate when score updates, and the summary screen score bar renders statically without any motion effect.

**Acceptance Scenarios**:

1. **Given** a player submits a guess and earns points, **When** the score bar updates, **Then** the bar fills to the new width instantly with no animated transition.
2. **Given** the score bar has a non-zero value, **When** the bar is visible, **Then** no repeating shimmer or glow animation plays on the bar.
3. **Given** the summary screen is shown, **When** the score bar renders, **Then** it appears at full score width immediately, with no animated entrance transition.

---

### User Story 3 - Clipboard-Only Share Button (Priority: P3)

The share button in the summary screen copies the result text to the player's clipboard. It does not invoke the device's native share sheet or any other sharing mechanism under any circumstances.

**Why this priority**: The current behavior is inconsistent — on mobile it opens a native share dialog, on desktop it copies to clipboard. The player wants predictable, consistent behavior: always clipboard copy.

**Independent Test**: Can be tested by clicking the share button on both a mobile device (or emulated) and a desktop browser, confirming the native share dialog never appears and the result text is always written to the clipboard.

**Acceptance Scenarios**:

1. **Given** the player is on the summary screen, **When** they press the share button, **Then** the result text is copied to the clipboard.
2. **Given** the player is on any device type (mobile or desktop), **When** they press the share button, **Then** no native share sheet or OS-level dialog appears.
3. **Given** the share copy succeeds, **When** the clipboard write completes, **Then** the button shows a brief "Copied!" confirmation state and then returns to its normal label.
4. **Given** the clipboard API is unavailable, **When** the player presses the share button, **Then** a user-friendly error message is shown indicating the copy failed.

---

### Edge Cases

- What happens if the correct stat values are missing or not defined for a puzzle? The stat section should still display the stat name and guesses, showing a graceful fallback (e.g., no value column) rather than crashing or showing undefined.
- What if a player made only one guess on a stat (first-try correct)? Only one guess row should appear in that stat section.
- What if the player has not completed the game (navigates to results prematurely via a URL)? The summary screen should only render for completed game states.
- What if the clipboard write API throws an error? The share button should catch the error and display a visible failure message instead of silently failing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The score bar MUST NOT play any repeating shimmer, glow, or pulse animation at any time.
- **FR-002**: The score bar MUST NOT animate its width when transitioning between score values; it must render at the target width immediately.
- **FR-003**: The summary screen MUST display one clearly bounded section per stat (group) played, in the order the stats were played.
- **FR-004**: Each stat section MUST display the stat's label as a heading for that section.
- **FR-005**: Each stat section MUST display all of the player's guess rows for that stat in chronological order, with correct/wrong per-country feedback consistent with the in-game feedback style.
- **FR-006**: Each stat section MUST display the correct value for each of the five countries, formatted identically to the inline value reveal used during gameplay (e.g., using the same unit formatting and precision).
- **FR-007**: The share button MUST always write the result text to the clipboard, regardless of device type or operating system.
- **FR-008**: The share button MUST NOT invoke any native OS sharing mechanism (e.g., device share sheets or OS-level share dialogs) under any circumstances.
- **FR-009**: The share button MUST show a visible confirmation state (e.g., "Copied!") for a brief period after a successful clipboard write.
- **FR-010**: If the clipboard write fails, the share button MUST display a visible error indication rather than silently failing.

### Key Entities

- **Stat Section**: A visual grouping in the summary screen representing one played stat, containing the stat label, all guess rows, and the correct values per country.
- **Score Bar**: The horizontal progress indicator showing the player's current or final score as a fraction of the maximum.
- **Guess Row**: A row in the summary showing one guess attempt, with per-country correct/wrong indicators and country names.
- **Correct Value**: The authoritative numerical stat value for a given country in a given round, formatted for display (e.g., "42,000" or "1.2B").

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All three stat sections are visible and uniquely labeled on the summary screen for every completed game.
- **SC-002**: Every guess a player made for each stat is visible in the summary, with no guesses missing or reordered.
- **SC-003**: Correct country values are shown for all five countries in each stat section for any puzzle that includes stat values.
- **SC-004**: The score bar shows no animation in any browser or device when observed during gameplay or on the summary screen.
- **SC-005**: The share button copies to clipboard on 100% of invocations across mobile and desktop browsers that support the clipboard API.
- **SC-006**: The native OS share dialog never appears when the share button is pressed, on any device.

## Assumptions

- The correct stat values are already available in the puzzle data (introduced in feature 007), and the same formatting logic used during gameplay can be reused for display in the summary.
- The summary screen currently shows the result for a completed game only; this behavior is preserved.
- The share text format (emoji grid, score, puzzle number) is unchanged — only the trigger mechanism is simplified to clipboard-only.
- The in-game score bar (visible during rounds) and the summary screen score bar are both in scope for animation removal.
- The stat section order in the summary matches the order the player encountered them during the game (stat 1 first, stat 3 last).
- Accessibility considerations for the revamped summary (e.g., screen reader labels per section) follow the existing patterns already used in feedback rows and stat panels.
