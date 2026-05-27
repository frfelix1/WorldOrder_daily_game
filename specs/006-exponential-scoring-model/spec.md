# Feature Specification: Exponential Scoring Model

**Feature Branch**: `006-exponential-scoring-model`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "I want to update the scoring model for my game, and I want there to be a max score of 100, with 33 being available in each round (and if you get 33 on all three rounds you get 100), then some smart scoring model for determining how to deduct points for wrong guesses. It should be a model that is exponential and steep. I dont want all final scores to be in the nineties or so. It should be balanced and make most scores possible as well."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Perfect Round Performance (Priority: P1)

A player correctly ranks all 5 countries on their first attempt for a stat (round). They should be rewarded the full 33 points for that round, reflecting mastery. When this happens across all three rounds, the total should reach 100 — the only way to achieve the maximum.

**Why this priority**: This defines the ceiling of the scoring system and the special perfect-game bonus. It is the most fundamental behavior the new model must support.

**Independent Test**: Simulate a game where every guess on every stat is correct on the first attempt; verify the total score is exactly 100.

**Acceptance Scenarios**:

1. **Given** a player has completed a stat with zero wrong guesses, **When** the round score is calculated, **Then** the player receives exactly 33 points for that round.
2. **Given** a player achieves 33 points on all three rounds, **When** the total score is calculated, **Then** the total score is exactly 100 (including a 1-point perfect-game bonus).

---

### User Story 2 - Score Reduction for Wrong Guesses (Priority: P1)

A player who makes wrong guesses on a stat should lose points according to an exponential penalty — meaning each additional wrong guess costs significantly more than the previous one. The model must be steep enough that a player who takes many attempts ends up with a notably low round score (not still in the high 20s or 30s).

**Why this priority**: This is the core behavioral change. The existing linear deduction produces scores clustered at the top; the exponential model must spread the distribution meaningfully.

**Independent Test**: Given a stat where the player makes 1, 2, 3, 4, and 5 wrong guesses respectively, verify that round scores drop steeply — each additional wrong guess removes substantially more points than the last.

**Acceptance Scenarios**:

1. **Given** a player makes 1 wrong guess on a stat, **When** the round score is calculated, **Then** the score is visibly below 33 but still in the upper tier (above 20).
2. **Given** a player makes 3 wrong guesses on a stat, **When** the round score is calculated, **Then** the score is in the mid-range (approximately 10–18), not clustered near 33.
3. **Given** a player makes 5 or more wrong guesses on a stat, **When** the round score is calculated, **Then** the score is low (below 10), reflecting poor performance on that round.
4. **Given** a player makes an extreme number of wrong guesses (e.g., 10+), **When** the round score is calculated, **Then** the score approaches but does not go below 0 — there is no negative scoring.

---

### User Story 3 - Balanced Score Distribution Across Full Games (Priority: P2)

Over a population of realistic game outcomes, final scores should be spread across a wide range of the 0–100 scale. Players of varying skill should receive meaningfully different scores — casual players might land in the 40s–60s, competent players in the 65–85 range, and only expert play yields scores in the 90s or 100.

**Why this priority**: The primary motivation for this change is that the old model produced scores almost exclusively in the high 90s. The new model must correct this and produce a distribution that feels fair and differentiated.

**Independent Test**: Simulate 100 varied game outcomes (random combinations of 0–6 wrong guesses per round) and verify that the resulting score distribution covers the full 0–100 range meaningfully, with no heavy clustering at the top end.

**Acceptance Scenarios**:

1. **Given** a player who makes 2–3 wrong guesses across all three rounds, **When** the final score is calculated, **Then** the total score falls meaningfully below 90.
2. **Given** a player who makes 0–1 wrong guesses per round, **When** the final score is calculated, **Then** the total score is in the 85–99 range (not necessarily 100 unless perfect).
3. **Given** a player who makes many wrong guesses on one round and performs well on the others, **When** the final score is calculated, **Then** the poor round is visibly punished and the total is substantially less than two perfect rounds alone would suggest.

---

### User Story 4 - Score Display Unchanged (Priority: P3)

The final score is displayed to the player at the end of the game and in the shareable result text. The display format and share card should continue to work correctly with the new scoring values (0–100 range instead of 0–150).

**Why this priority**: This is a compatibility concern, not a core scoring behavior. The model change must not break result sharing or display.

**Independent Test**: Complete a full game with the new model and verify the share text shows a score in the 0–100 range and renders correctly.

**Acceptance Scenarios**:

1. **Given** a completed game under the new scoring model, **When** the player views their score, **Then** the displayed score is a whole number between 0 and 100.
2. **Given** a completed game, **When** the player shares their result, **Then** the share text includes the correct new total score and the per-round emoji breakdown remains intact.

---

### Edge Cases

- What happens when a player makes 0 wrong guesses on all positions in a round? → Should yield exactly 33 points for that round.
- What happens when a player makes an extremely large number of wrong guesses (e.g., 20+)? → Score for that round should floor at 0 and not go negative.
- What score does a player receive if they get 33 on two rounds but 32 on the third? → Total should be less than 100 (no perfect-game bonus applies).
- How are fractional points handled? → Final scores per round and in total must be whole numbers (no decimals displayed).
- What is the minimum achievable score per round? → 0 (not negative).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The maximum achievable score for a single round MUST be 33 points.
- **FR-002**: The maximum total score for a complete game (3 rounds) MUST be 100 points.
- **FR-003**: A player who earns exactly 33 points on all three rounds MUST receive a total of 100 points (a 1-point perfect-game bonus is applied automatically).
- **FR-004**: Round scores MUST be calculated using an exponential deduction model: each additional wrong guess within a round removes more points than the previous wrong guess, with the penalty growing exponentially.
- **FR-005**: The scoring model MUST be steep enough that making 3 or more wrong guesses in a round results in a round score below half of the maximum (below ~16 points).
- **FR-006**: Round scores MUST floor at 0 — no round may contribute a negative value to the total.
- **FR-007**: The scoring model MUST produce a distribution of total game scores that spans the full 0–100 range, avoiding heavy clustering in the 90–99 band under typical play.
- **FR-008**: Total scores MUST be displayed and recorded as whole numbers (no decimal points).
- **FR-009**: The existing per-round emoji share format (bulls and misses) MUST continue to work correctly alongside the new scoring values.
- **FR-010**: The number of rounds (3) and positions per round (5) MUST remain unchanged by this feature.

### Key Entities

- **Round Score**: The points earned for a single stat/round, in the range 0–33. Calculated from the number of wrong guesses made during that round using the exponential model.
- **Wrong Guess Count**: The number of incorrect full-ranking attempts made before solving a round (or accumulated per-position, depending on existing model granularity — see Assumptions).
- **Perfect-Game Bonus**: A single additional point (bringing total from 99 to 100) awarded only when all three round scores equal 33.
- **Total Game Score**: The sum of all three round scores plus the perfect-game bonus if applicable, always in the range 0–100.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player who makes zero wrong guesses across all three rounds receives a total score of exactly 100.
- **SC-002**: A player who makes 3 or more wrong guesses in every round receives a total score below 50.
- **SC-003**: The spread between a "1 wrong guess per round" game and a "3 wrong guesses per round" game is at least 30 points, demonstrating meaningful differentiation.
- **SC-004**: No more than 15% of realistic game outcomes (0–6 wrong guesses per round, uniformly distributed) produce a total score above 90, preventing score clustering at the top.
- **SC-005**: Every integer value between 0 and 100 is achievable through some combination of per-round wrong guess counts.
- **SC-006**: The share result text produced after a game correctly reflects a score in the 0–100 range with no display errors.

---

## Assumptions

- The wrong-guess count used for scoring is tracked at the **stat (round) level** — i.e., the total number of full-ranking attempts before solving that stat — rather than independently per position. This is a confirmed design decision. The existing per-position tracking in the current model will be replaced with a single attempt counter per round.
- The perfect-game bonus (+1 point) resolves the 33×3=99 arithmetic so that a flawless game reaches exactly 100.
- "Most score values possible" means the model should be designed so that a wide range of integer totals (at minimum every value from 0–100) is theoretically reachable — not that every value is equally likely.
- Score display and the share card format remain unchanged in structure; only the numeric values change.
- The game continues to allow unlimited wrong guesses per round (no hard cap on attempts); the scoring model simply reduces the round score more severely the more attempts are made, approaching 0.
- Mobile and accessibility display of scores are out of scope for this feature; only the scoring logic and its integration with existing display are in scope.
