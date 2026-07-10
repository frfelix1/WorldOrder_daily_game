# Feature Specification: Reward-Based Scoring Model

**Feature Branch**: `011-reward-scoring-model`

**Created**: 2026-07-10

**Status**: Draft

**Input**: User description: "Revamp the scoring model to build from 0 upward (reward-based) instead of decaying from max (punishment-based). Increase max score to 1000 for more nuance. Penalize incorrect ordering but also reward placement accuracy — being close to the correct position earns points, and being within a small tolerance earns full marks."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Earning Points Feels Rewarding (Priority: P1)

As a player, when I place countries on the line scale, I see my score build upward from 0 toward 1000. Each correct ordering and close placement earns me visible points, making the experience feel like a reward rather than a penalty.

**Why this priority**: The core psychological shift — from punishment to reward — is the primary motivation for this feature. Without this, the rest of the changes are cosmetic.

**Independent Test**: Can be fully tested by completing a game and verifying the score starts at 0, accumulates positively, and the UI displays progress toward 1000.

**Acceptance Scenarios**:

1. **Given** a new game round, **When** the player has not yet submitted a guess, **Then** the displayed score for that stat is 0.
2. **Given** the player submits a guess with correct ordering and close placement, **When** the round resolves, **Then** points are added to the score (not subtracted from a maximum).
3. **Given** the player completes all 3 stats perfectly on the first try with exact placement, **When** the final score is calculated, **Then** the total equals 1000.

---

### User Story 2 - Nuanced Scoring Differentiates Skill Levels (Priority: P1)

As a player, I want the 1000-point scale to meaningfully differentiate between "got the order right but positions were off" versus "nailed both order and positions." Two players with different placement accuracy should see noticeably different scores.

**Why this priority**: The expanded scale only matters if it actually produces meaningful differentiation. This validates the design delivers on its promise of nuance.

**Independent Test**: Can be tested by comparing scores across different accuracy levels and verifying meaningful spread.

**Acceptance Scenarios**:

1. **Given** a player gets all 5 countries in perfect order with exact positions, **When** scored, **Then** they earn the full stat score (~333 points).
2. **Given** a player gets all 5 countries in correct order but positions are 20% off on average, **When** scored, **Then** they earn noticeably less than a player who placed within 5%.
3. **Given** a player gets the ordering completely wrong but places nodes in roughly the right region, **When** scored, **Then** they still earn some points (not zero) from placement proximity.

---

### User Story 3 - Ordering Correctness is Rewarded (Priority: P2)

As a player, I want to be rewarded for getting the relative ordering of countries correct, independent of exact placement on the line.

**Why this priority**: Ordering is the original core mechanic — it must remain a significant scoring factor alongside the new placement accuracy component.

**Independent Test**: Can be tested by submitting guesses with varying ordering correctness and verifying the ordering component changes accordingly.

**Acceptance Scenarios**:

1. **Given** a player places all 5 countries in the correct left-to-right order, **When** the ordering component is calculated, **Then** they earn full ordering points regardless of exact positions.
2. **Given** a player swaps only 2 adjacent countries, **When** scored, **Then** they lose a small amount of ordering points (proportional to the error).
3. **Given** a player's ordering is completely reversed, **When** scored, **Then** they earn zero ordering points.

---

### User Story 4 - Fewer Attempts Still Matters (Priority: P3)

As a player, I want to be rewarded more for solving a stat in fewer guesses, preserving the incentive to think carefully before submitting.

**Why this priority**: Without an attempt-based incentive, players could just spam guesses. However, this is less critical than the core reward/accuracy model.

**Independent Test**: Can be tested by completing the same stat with 1, 2, and 3 guesses and verifying descending scores.

**Acceptance Scenarios**:

1. **Given** a player solves a stat on the first guess, **When** scored, **Then** they earn the maximum possible for their ordering and placement accuracy.
2. **Given** a player solves after 3 wrong guesses, **When** scored, **Then** they earn meaningfully less than a first-try solve with identical final placement.

---

### Edge Cases

- What happens when all 5 countries have very similar values (clustered on the line)? Placement accuracy becomes harder — the tolerance band should still apply per-node.
- What happens when a player places nodes exactly on top of each other? The ordering is derived from positions so ties must be broken deterministically.
- What happens when a player gets ordering perfect but placement is maximally wrong (e.g., correct order but all bunched to one end)? They should still earn full ordering points plus partial distance points.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate scores that build additively from 0 toward a maximum of 1000 points.
- **FR-002**: System MUST award up to 1000 total points across 3 stats (approximately 333 per stat, with a 1-point perfect bonus achieving exactly 1000).
- **FR-003**: Each stat's score MUST comprise two components: an ordering component and a placement distance component.
- **FR-004**: The ordering component MUST reward correct pairwise ordering of the 5 countries (10 possible pairs from 5 items). Full ordering points are earned when all pairs are in the correct relative order.
- **FR-005**: The placement distance component MUST reward proximity of each placed node to its true position on the scale. Closer placement earns more points.
- **FR-006**: System MUST apply a tolerance band such that placement within approximately 5% of the true position earns full distance points for that node.
- **FR-007**: System MUST apply a per-guess multiplier that reduces the earned score for additional wrong guesses (preserving incentive for fewer attempts).
- **FR-008**: The per-guess multiplier MUST reduce earned points progressively but never reduce the score below zero.
- **FR-009**: System MUST award a perfect bonus of 1 point when all three stats are solved perfectly on the first try with exact placement, making the max exactly 1000.
- **FR-010**: System MUST display scores as building upward (e.g., "742 / 1000") rather than showing deductions.
- **FR-011**: Performance tier labels (Perfect, Excellent, Great, Good, Keep Exploring) MUST be recalibrated to the 1000-point scale.
- **FR-012**: Share text MUST reflect the new score format (e.g., "WorldOrder #N — 742 pts").

### Scoring Model Detail

The recommended point allocation per stat (333 points):

| Component | Points | Rationale |
|-----------|--------|-----------|
| Ordering (correct pairs) | 133 | ~40% — rewards getting the relative order right |
| Placement distance | 200 | ~60% — rewards the novel line-scale mechanic |

**Ordering calculation**: 10 pairs from 5 countries. Each correctly ordered pair earns 13.3 points (rounded per-pair, totaling up to 133).

**Distance calculation**: For each of the 5 nodes, measure `|placed_fraction - true_fraction|`. If the error is within the tolerance band (≤0.05), the node earns full marks (40 points). Otherwise, points scale linearly from 40 down to 0 as error goes from 0.05 to 1.0. Total across 5 nodes: up to 200.

**Attempt multiplier**: First try = 100% of earned points. Each additional wrong guess multiplies earned points by 0.7 (geometric decay). After 1 wrong guess: 70%. After 2: 49%. After 3: 34%.

### Key Entities

- **StatScore**: Represents a single stat's score, comprising ordering points, distance points, and attempt multiplier applied.
- **GameScore**: Aggregate of 3 StatScores plus the perfect bonus. Range: [0, 1000].
- **PerformanceTier**: Label assigned based on total GameScore thresholds.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players completing a game always see a score between 0 and 1000 that accurately reflects their performance.
- **SC-002**: A perfect game (all correct ordering, exact placement, first try on all 3 stats) yields exactly 1000 points.
- **SC-003**: Score differentiation: a player with 90% placement accuracy scores at least 15% higher than a player with 70% placement accuracy (given same ordering and attempts).
- **SC-004**: The scoring feels rewarding: scores build visibly from 0 upward as the player provides input, never showing deductions or negative movement.
- **SC-005**: All existing game flows (share, results screen, score display) function correctly with the new 1000-point scale.

## Assumptions

- The game continues to have exactly 3 stats per day with 5 countries each — the scoring model is built around this structure.
- The existing line-scale placement mechanic (Feature 010) provides fractional positions [0,1] for each country, and this data is available for scoring.
- The tolerance band of 5% (0.05 in fractional terms) is a reasonable starting point; it may need tuning based on playtesting but is a sensible default for a scale with 5 nodes.
- The attempt multiplier of 0.7 per wrong guess preserves meaningful incentive without making retries feel hopeless (after 3 wrong guesses you still earn ~34% of your placement/ordering score).
- Performance tier thresholds will be recalibrated proportionally (e.g., Perfect=1000, Excellent≥800, Great≥600, Good≥400, Keep Exploring<400).
