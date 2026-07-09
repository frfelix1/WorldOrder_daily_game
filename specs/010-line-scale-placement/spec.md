# Feature Specification: Line-Scale Placement Mechanic

**Feature Branch**: `010-line-scale-placement`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "I want to change the answer input. Today it's drag and drop, and make sure the countries are in the correct order on a list. I would instead like for it to be a line, where you can place the countries on that line. So like all the way to the left is the least, and all the way to the right is the most, per stat. But the scale shouldn't be 'locked' to 5 places. It should be possible to place the countries wherever on the line. The scale should show like a number on it when you move stuff, so if I drag a country ball/icon on the line for a stat like gdp total, it should highlight what value I am hovering when I am moving it across the line. On the leftmost end should be the value of the smallest country of the stat pool chosen for the day, and on the right should be the highest value of that stat. You keep guessing until they are in the correct order. This brings an update to the scoring model too, you get a penalty for each wrong guess, and more points the closer your guesses are to the exact correct location on the line."

## Clarifications

### Session 2026-07-09

- Q: What defines the endpoints (min/max) of the line? → A: The minimum and maximum values **of the five countries in today's puzzle**. The far-left label shows the smallest of the five's value; the far-right label shows the largest's value. No country is auto-pinned to an end — the player places all five, and the extreme labels serve only as the value scale.
- Q: What counts as a solved/correct placement? → A: A stat is solved when the countries' **left-to-right sequence** on the line matches their true ranking for that stat. Exact value position is not required to win, but proximity to each country's true value position affects the score.
- Q: How should the new scoring combine per-wrong-guess penalty with the "closer = more points" proximity bonus? → A: Preserve the existing **0–100 total** and **per-stat cap of 33 points**. Within a stat, apply a penalty per wrong guess and a proximity component for how close final placements are to true positions, always operating within the per-stat cap.
- Q: How are the two extreme countries (smallest & largest of the five) handled? → A: The player places all five countries themselves; the endpoints are value **labels only**, with no country pre-pinned.
- Q: Should each stat remain capped at the current per-stat max (33)? → A: Yes — each stat stays capped at 33, with penalty and proximity operating within that cap; the total game maximum stays at 100 (including the existing perfect-game bonus).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Place countries on a value line (Priority: P1)

As a daily player, I want to position all five country tokens anywhere along a single horizontal line, where the far left represents the smallest value and the far right the largest value for the current stat, so that I can express my estimate of each country's magnitude rather than only its rank order.

**Why this priority**: This is the core interaction change that replaces the drag-and-drop list. Without it there is no game; every other story builds on it. It independently delivers a playable, novel input even before scoring or live readouts are refined.

**Independent Test**: Load a puzzle, and for the active stat drag each of the five country tokens to a distinct spot along the line. Verify tokens can be placed at any horizontal position (not snapped to five fixed slots), the left end is labeled with the smallest of the five countries' value and the right end with the largest, and the placement persists visually until changed.

**Acceptance Scenarios**:

1. **Given** the active stat is displayed with a horizontal line, **When** the round begins, **Then** the far-left endpoint is labeled with the smallest value among the five puzzle countries and the far-right endpoint with the largest, each shown with the stat's unit, and no country is pre-placed on the line.
2. **Given** a country token is available, **When** the player drags it onto the line and releases, **Then** the token stays at the released horizontal position (any position along the line, not one of five fixed slots).
3. **Given** a token is already placed on the line, **When** the player drags it to a new position, **Then** the token moves to the new position and its previous position is vacated.
4. **Given** the player attempts to drag a token beyond either end of the line, **When** released, **Then** the token is clamped to the nearest endpoint (min or max) rather than leaving the scale.
5. **Given** all five tokens are placed, **When** the player has not yet submitted, **Then** the player can freely re-position any token before submitting.

---

### User Story 2 - See the value at the token's position while moving it (Priority: P1)

As a player positioning a token, I want a live readout that shows the stat value corresponding to the token's current position on the line, so that I can aim for a specific value (e.g., a GDP figure) instead of guessing blindly.

**Why this priority**: The value readout is what makes the line meaningful and differentiates this from a plain ordering interaction; it is essential to the "place at a value" experience the feature is built around. It is testable independently of scoring.

**Independent Test**: Drag a token slowly from the left end to the right end and confirm a value indicator updates continuously, reading the smallest-of-five value at the far left, the largest-of-five value at the far right, and interpolated values in between, formatted with the stat's unit.

**Acceptance Scenarios**:

1. **Given** a token is being dragged along the line, **When** its position changes, **Then** a value readout updates to reflect the value at the token's current position, formatted with the stat's unit.
2. **Given** a token is at the extreme left, **When** the readout is shown, **Then** it displays the smallest value among the five puzzle countries; at the extreme right it displays the largest.
3. **Given** a token is between the two ends, **When** the readout is shown, **Then** it displays a value between the minimum and maximum consistent with the token's horizontal position.
4. **Given** the player releases a token, **When** the drag ends, **Then** the value associated with that placement remains discoverable (e.g., the last readout value for that token is retained for display) so the player can review their placements before submitting.

---

### User Story 3 - Guess until the order is correct, with feedback (Priority: P1)

As a player, I want to submit my placements and, if the left-to-right order does not match the true ranking, receive feedback and re-place tokens, repeating until the order is correct and then advancing through all three stats, so that the guess-until-solved loop of the game is preserved.

**Why this priority**: The submit/feedback/advance loop is the backbone of the daily game and must work for the feature to be shippable. It depends on placement (Story 1) but not on the value readout (Story 2), so it can be validated on its own.

**Independent Test**: Place five tokens in a deliberately wrong order, submit, and confirm the game reports the order is not yet correct and indicates which placements are in the correct relative position; then correct the order, submit, and confirm the stat is marked solved and the game advances to the next stat (and completes after the third).

**Acceptance Scenarios**:

1. **Given** all five tokens are placed, **When** the player submits and the left-to-right order does not match the true ranking, **Then** the guess is recorded as incorrect, the player is allowed to re-position tokens, and per-token feedback indicates which tokens are in their correct relative position.
2. **Given** a submitted guess has some tokens in the correct relative position, **When** the player continues, **Then** those correctly positioned tokens are indicated as correct while the player re-positions the remaining tokens (consistent with today's "lock correct, retry the rest" behavior).
3. **Given** the player submits placements whose left-to-right order matches the true ranking, **When** the guess is evaluated, **Then** the stat is marked solved and the player may advance to the next stat.
4. **Given** the third stat is solved, **When** the player advances, **Then** the game is marked complete and the results are shown.
5. **Given** not all five tokens are placed, **When** the player attempts to submit, **Then** submission is prevented until every country is placed on the line.
6. **Given** two or more tokens are placed at the same or nearly the same position, **When** the order is evaluated, **Then** their relative order is resolved deterministically so the result is unambiguous and reproducible.

---

### User Story 4 - Updated scoring: penalty per wrong guess plus proximity bonus (Priority: P2)

As a player, I want to lose points for each wrong guess and earn more points the closer my final placements are to the countries' true value positions, so that precise, efficient play is rewarded, while the overall game score still ranges from 0 to 100.

**Why this priority**: Scoring shapes motivation and the share/result experience, but the game is playable and testable with a placeholder score first; hence P2. It depends on the placement and solve loop.

**Independent Test**: Solve a stat on the first attempt with placements very close to the true positions and confirm a near-maximum per-stat score (up to 33); repeat with several wrong guesses and/or far-off placements and confirm the per-stat score is strictly lower, never negative, and never above the cap; confirm the game total stays within 0–100.

**Acceptance Scenarios**:

1. **Given** a stat is solved with zero wrong guesses and placements essentially at the true positions, **When** the score is computed, **Then** the stat earns the full per-stat maximum (33).
2. **Given** a stat is solved, **When** the player made one or more wrong guesses before solving, **Then** each wrong guess reduces the stat's score relative to solving with fewer wrong guesses.
3. **Given** two solves with the same number of wrong guesses, **When** their final placements differ in accuracy, **Then** the solve whose final placements are closer to the true positions scores at least as high as the less accurate one (closer is never worse).
4. **Given** any combination of wrong guesses and placement accuracy, **When** the stat score is computed, **Then** it is an integer within 0–33 inclusive.
5. **Given** all three stats are completed, **When** the total is computed, **Then** it is within 0–100 inclusive, and the existing perfect-game bonus still applies when every stat earns the maximum.
6. **Given** the game is complete, **When** the result/share summary is generated, **Then** it reflects the new mechanic's per-stat outcomes (guesses and accuracy) in a shareable form.

---

### User Story 5 - Accessible and mobile-friendly placement (Priority: P3)

As a player on a small touchscreen or using assistive technology, I want to place tokens on the line via touch and keyboard without page scrolling interfering, so that the new mechanic is usable to the same standard as the current board (consistent with the mobile/accessibility work in feature 009).

**Why this priority**: Broad usability matters but can follow the core mechanic and scoring; it refines rather than enables the experience.

**Independent Test**: On a 320–414px wide viewport, place all five tokens by touch without triggering page scroll and complete a stat; then, using only the keyboard, move a token along the line and submit.

**Acceptance Scenarios**:

1. **Given** a viewport width of 320–414px, **When** the player interacts with the line, **Then** the line and all tokens are usable without horizontal page scrolling and touch-dragging a token does not scroll the page.
2. **Given** a keyboard-only user, **When** they focus a token, **Then** they can move it along the line in discrete steps and submit their placements.
3. **Given** the player prefers reduced motion, **When** tokens move or feedback is shown, **Then** non-essential animation is minimized.
4. **Given** assistive technology is in use, **When** a token's position or the value readout changes, **Then** the current value/position is available as an accessible announcement or label.

---

### Edge Cases

- **Tied or near-equal true values among the five**: When two of the five countries share (or nearly share) a true value, the ordering evaluation must resolve their required relative order deterministically, and proximity scoring must handle the small or zero gap without producing undefined or out-of-range results.
- **Overlapping tokens**: When multiple tokens are dropped at the same horizontal position, they must remain individually distinguishable and movable, and their relative order must still be determinable.
- **Clamping at ends**: Tokens dragged past either endpoint are clamped to the min/max position and value rather than leaving the scale or reading values outside the min–max range.
- **Degenerate range**: If all five countries had identical values for a stat (min equals max), the line would have zero width of value; the experience must not divide by zero or misbehave (informed by generator constraints that avoid ties, but the display logic must still be safe).
- **Incomplete submission**: Attempting to submit before all five tokens are placed is blocked with clear indication of what remains.
- **Resume in progress**: Reloading mid-game restores the active stat, already-solved stats, and any placements/locked-correct tokens from the last guess, consistent with current save/restore behavior.
- **Midnight rollover / stale puzzle**: If the daily puzzle changes while a game is open, existing stale-state handling applies and the new mechanic starts fresh for the new day.
- **Zero-valued stats**: Some stats can legitimately include very small or zero values at the low end; the min endpoint and readouts must display these correctly with the stat's unit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The answer input for each stat MUST be a single continuous horizontal line on which country tokens can be placed at any position, replacing the fixed five-slot drag-and-drop list.
- **FR-002**: The line's far-left endpoint MUST represent the smallest value among the five puzzle countries for the active stat, and the far-right endpoint MUST represent the largest value among those five; both endpoints MUST be labeled with the value and the stat's unit.
- **FR-003**: The system MUST NOT constrain tokens to a fixed number of discrete slots; a token may be positioned anywhere along the line between the two endpoints.
- **FR-004**: The player MUST place all five country tokens themselves; no country is auto-pinned to an endpoint. The endpoint labels serve only as the value scale.
- **FR-005**: While a token is being moved, the system MUST display a live value readout corresponding to the token's current position, interpolated between the minimum (far left) and maximum (far right) values and formatted with the stat's unit.
- **FR-006**: When a token is dragged beyond either endpoint, the system MUST clamp its position (and readout value) to the nearest endpoint.
- **FR-007**: The system MUST allow the player to reposition any not-yet-locked token freely before submitting a guess.
- **FR-008**: The system MUST prevent submission until all five countries are placed on the line.
- **FR-009**: On submission, the system MUST determine correctness by comparing the tokens' left-to-right order against the true ranking for the active stat; a stat is solved when the left-to-right order matches the true ranking exactly.
- **FR-010**: When a submitted guess is not fully correct, the system MUST record it as a wrong guess, indicate which tokens are in the correct relative position, keep those correct tokens fixed, and allow the player to re-position the remaining tokens, repeating until solved.
- **FR-011**: The system MUST resolve the relative order of tokens placed at identical or nearly identical positions deterministically, so evaluation is unambiguous and reproducible.
- **FR-012**: Upon solving a stat, the system MUST allow the player to advance to the next stat, and MUST mark the game complete after the third stat is solved, showing results.
- **FR-013**: The scoring model MUST apply a penalty for each wrong guess within a stat, such that solving with fewer wrong guesses yields a higher stat score, all else equal.
- **FR-014**: The scoring model MUST include a proximity component so that, for a given number of wrong guesses, final placements closer to the countries' true value positions yield a stat score at least as high as less accurate placements (closer is never penalized).
- **FR-015**: Each stat's score MUST be an integer bounded within 0–33 inclusive (the existing per-stat cap), with the penalty and proximity components operating within that cap.
- **FR-016**: The total game score MUST remain within 0–100 inclusive, retaining the existing perfect-game bonus when every stat earns the per-stat maximum.
- **FR-017**: The system MUST persist in-progress placements, solved stats, and locked-correct tokens so a reloaded game resumes at the correct state.
- **FR-018**: The result/share summary MUST reflect the new mechanic's outcomes per stat (e.g., number of guesses and placement accuracy) in a shareable form.
- **FR-019**: The placement interaction MUST support touch input on small viewports (approximately 320–414px wide) without causing page scrolling during a drag, and without horizontal page scroll, consistent with the mobile responsiveness standard already established.
- **FR-020**: The placement interaction MUST support keyboard-based movement of tokens along the line and submission, and MUST expose the current value/position to assistive technology; non-essential motion MUST be reduced when the player prefers reduced motion.
- **FR-021**: The system MUST continue to present three stats per day in reveal order and to rotate daily, unchanged by this feature.

### Key Entities *(include if feature involves data)*

- **Value Line (Scale)**: The horizontal axis for a stat, defined by a minimum value (smallest of the five puzzle countries), a maximum value (largest of the five), and the stat's unit. Maps horizontal positions to interpolated values and vice versa.
- **Token Placement**: A country's position on the line for the active stat, expressed as a position along the scale and its corresponding value; used both for display and for deriving left-to-right order.
- **Guess**: A submitted set of placements for a stat, from which the left-to-right order and per-token correctness (correct relative position or not) are derived, along with the placement accuracy relative to true positions.
- **Stat Round**: The player's progress on one stat: whether it is solved, the sequence of guesses, which tokens are locked as correct, and the resulting score components.
- **Score**: The per-stat value (0–33) derived from wrong-guess penalty and proximity accuracy, and the aggregated game total (0–100) including the perfect-game bonus.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can place all five country tokens at arbitrary positions along the line for a stat and submit, with no requirement to use fixed slots — verified across all three stats of a daily puzzle.
- **SC-002**: While moving a token, the displayed value updates to reflect its position, reading the smallest-of-five value at the far left and the largest-of-five value at the far right, updating promptly as the token moves (target: within ~100 ms of movement).
- **SC-003**: A stat is judged solved if and only if the tokens' left-to-right order equals the true ranking; placements that are close but out of order are not accepted as solved.
- **SC-004**: For a fixed number of wrong guesses, solving with final placements closer to true positions never produces a lower stat score than a less accurate solve.
- **SC-005**: Each additional wrong guess within a stat strictly reduces that stat's achievable score relative to solving with one fewer wrong guess.
- **SC-006**: Every stat score falls within 0–33 and every completed game total falls within 0–100, in all tested play patterns.
- **SC-007**: A first-attempt solve with essentially exact placements yields the full per-stat maximum (33), and three such solves yield the maximum total (100) including the perfect-game bonus.
- **SC-008**: The line and tokens are fully usable at a 320px viewport width with no horizontal page scroll, and touch-dragging a token does not scroll the page.
- **SC-009**: A keyboard-only player can move a token along the line and submit a guess without using a pointer.
- **SC-010**: Reloading a game in progress restores the active stat, solved stats, and last-guess placements/locked tokens without loss.

## Assumptions

- The line's endpoints and each country's true position are derived from the per-country stat values already carried in the daily puzzle for the five selected countries; no change to the dataset, puzzle generation, or puzzle delivery is required.
- "Correct order" means the left-to-right sequence of placed tokens matches the true ranking direction already defined for the stat; proximity accuracy influences score only and is not required to win, per clarification.
- The existing "lock correct positions, re-guess the rest" behavior carries over conceptually to tokens: tokens in their correct relative position are treated as locked while the player re-positions the rest.
- Deterministic tie-breaking for equal/near-equal positions preserves the game's reproducibility guarantees; puzzle generation already avoids tied true values among selected countries, so exact ties in the answer key are not expected, but display and evaluation logic must remain safe if positions coincide.
- The 0–100 total, the per-stat cap of 33, and the perfect-game bonus are retained to preserve comparability with historical scores, streaks, and score-distribution buckets; the internal composition of a stat's score changes (penalty + proximity) but its range does not.
- Mobile and accessibility expectations follow the standard established by feature 009 (responsive layout, touch drag without page scroll, keyboard support, reduced motion, assistive announcements).
- Exactly five countries and three stats per day, revealed in order with daily rotation, remain unchanged.
