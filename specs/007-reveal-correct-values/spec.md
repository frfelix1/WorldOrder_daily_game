# Feature Specification: Reveal Correct Values

**Feature Branch**: `007-reveal-correct-values`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "for my game, when you make a guess for the rankings and it is correct, I want it to say the right answer. For example, if the question is on country size and I manage to lock sweden in the correct space and it sticks there in green, I want it to also display the actual size of sweden (like what 450k square km). This way you can learn stuff when playing. It should take the value from the dataset, but also add the unit that is being measured."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Actual Value on Correct Lock (Priority: P1)

A player is guessing the ranking for a stat (e.g., Land Area). After submitting their ranking, one or more slots lock in green because those countries are in the correct position. The player can immediately see the actual measured value — including its unit — displayed on each locked-in slot. For example, a locked Sweden slot would show "449,964 km²" alongside the Swedish flag and country name.

**Why this priority**: This is the core of the feature. Without it, no value is revealed at all. It also delivers the primary learning benefit the user described: players understand the real-world scale of what they're ranking.

**Independent Test**: Can be fully tested by submitting a guess with at least one correct position and verifying that the actual numeric value (formatted with its unit) appears on the locked slot.

**Acceptance Scenarios**:

1. **Given** a player has placed countries into ranking slots and submitted their guess, **When** one or more slots are confirmed correct (locked green), **Then** each locked slot displays the country's actual measured value followed by its unit (e.g., "449,964 km²") in addition to the flag and country name.
2. **Given** a locked slot is already showing the value, **When** the player views subsequent rounds of the same stat, **Then** previously locked slots continue displaying their values throughout the remainder of the game.
3. **Given** a player has not yet submitted any guess, **When** they view the ranking board, **Then** no values are shown on any slot (values are revealed only upon correct lock, not before).

---

### User Story 2 - Values Persist on Solved Stat (Priority: P2)

A player fully solves a stat (all 5 slots locked green). The entire solved ranking remains visible with all five actual values displayed, so the player can read and absorb the full ranked list at a glance before moving on to the next stat.

**Why this priority**: A fully solved stat is the natural moment for the most learning. Showing all values together lets the player compare magnitudes across the full ranking — the educational payoff the feature is built around.

**Independent Test**: Can be tested by solving all five positions of a stat and verifying that each slot shows the correct numeric value with unit, and that the values remain visible until the stat is dismissed or the game ends.

**Acceptance Scenarios**:

1. **Given** a player has solved all five positions of a stat, **When** the solved state is displayed, **Then** all five slots show their respective values with units in the correct ranked order.
2. **Given** a fully solved stat is displayed, **When** the player has not yet navigated away, **Then** the values remain visible throughout the display period.

---

### User Story 3 - Correct Value Display in Guess History (Priority: P3)

The guess history (feedback rows shown below the board after each submission) shows which positions were correct. When a position was correct in a past guess, the historical row for that guess also shows the actual value for that country at that position.

**Why this priority**: The history rows reinforce learning by connecting the "correct" tick mark with the actual number, giving more context for rows that are already marked correct.

**Independent Test**: Can be tested independently by checking that feedback rows with a correct (✓) mark for a position also display the country's numeric value and unit.

**Acceptance Scenarios**:

1. **Given** a player has submitted a guess where at least one position was correct, **When** viewing the feedback history row for that guess, **Then** each position marked as correct shows the country's actual value and unit alongside the flag and name.

---

### Edge Cases

- What happens when a country's value is zero (`zeroValue: true` in the dataset)? The value should still be displayed as "0 <unit>" rather than being hidden or omitted.
- What happens when a value is very large (e.g., population in billions or GDP in millions of USD)? Values should be formatted for readability (e.g., thousands separators) using the same unit string from the dataset without truncation that removes meaning.
- What happens when the unit string contains special characters (e.g., "km²", "Mbit/s", "litres/person/year")? The unit must render correctly in the UI, including superscripts and slashes.
- What happens if a dataset entry is missing a value? The locked slot should gracefully omit the value display rather than showing undefined/null.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a ranking slot is confirmed correct and locks in (turns green), the system MUST display the country's actual measured value alongside its unit on that slot.
- **FR-002**: The displayed value MUST be sourced directly from the dataset entry for that country and stat — no hardcoded or approximated values.
- **FR-003**: The displayed unit MUST be sourced from the stat definition's unit field in the dataset (e.g., "km²", "USD", "mm/year").
- **FR-004**: The value and unit MUST remain visible on the locked slot for all subsequent rounds of the same stat and after the stat is solved.
- **FR-005**: Large numeric values MUST be formatted with thousands separators for readability (e.g., "449,964" not "449964").
- **FR-006**: Values for countries where `zeroValue` is true MUST still display as "0 <unit>".
- **FR-007**: Slots that are not yet locked MUST NOT reveal any value — values are only shown on correct (green locked) positions.
- **FR-008**: The value display MUST NOT interfere with the existing locked-slot layout (flag, country name, checkmark icon).

### Key Entities

- **Locked Slot**: A ranking slot that has been confirmed correct. Identified by position index being `true` in the `lockedSlots` boolean array. Now additionally carries the revealed value.
- **Stat Value**: The numeric measurement (`DatasetEntry.value`) for a specific country within a specific stat, formatted with thousands separators.
- **Stat Unit**: The unit string (`DatasetStat.unit`) associated with the active stat being played (e.g., `"km²"`, `"million USD"`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every correctly locked slot displays a non-empty value + unit string immediately after the guess submission confirms it correct — verified across all 17 stat types.
- **SC-002**: The displayed value on each locked slot exactly matches the corresponding entry's value in the dataset — no rounding or approximation errors.
- **SC-003**: Values remain visible and unchanged on locked slots through all subsequent guess rounds and after full stat solve, without requiring any player action.
- **SC-004**: The value display does not cause existing slot content (flag, name, checkmark) to be hidden, clipped, or illegible on standard screen sizes.
- **SC-005**: Zero-value entries display as "0 <unit>" and are not omitted or blank.

## Assumptions

- The dataset already contains both `value` (numeric) and `unit` (string) fields for every stat — no new data sourcing is required.
- The unit string from the dataset is the canonical display unit (e.g., "km²" for Land Area) and does not need to be converted or localized.
- Thousands separators will use the locale-standard format (comma-separated groups of three, e.g., "1,234,567") — localization to other number formats is out of scope.
- Value display applies to all stat types uniformly; no stat requires a different display format.
- The feature applies to the active game board (locked slots on `RankingBoard`) and optionally to feedback history rows; it does not affect the end-of-game summary unless that summary reuses the same locked-slot component.
- Mobile/responsive layout adjustments needed to fit the value text are considered in scope but no specific breakpoint behavior is prescribed beyond "must not hide existing content".
