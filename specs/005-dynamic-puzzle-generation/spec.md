# Feature Specification: Dynamic Puzzle Generation

**Feature Branch**: `005-dynamic-puzzle-generation`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "I need daily puzzles to be automatically generated every day from a function instead of being hardcoded as json files. I want to push this to vercel and I need the function to generate a new days worth of puzzle to work from the code without being hardcoded as json files."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Always-Available Daily Puzzle (Priority: P1)

As a player visiting the site today (or any day in the future), I receive a valid puzzle for today's date without the game operator having to manually generate and commit puzzle files.

**Why this priority**: This is the core motivation for the feature. Without it, the game will stop working once the pre-generated puzzle files run out. Every other story builds on the puzzle being available automatically.

**Independent Test**: Open the game on any date for which no pre-generated JSON file exists. The game should load a valid, playable puzzle. This delivers full user-facing value independently.

**Acceptance Scenarios**:

1. **Given** today's date has no pre-generated puzzle file, **When** a player opens the game, **Then** a valid puzzle is served and the game is fully playable
2. **Given** a date far in the future, **When** the game's API is queried for that date, **Then** a well-formed puzzle is returned
3. **Given** the puzzle for a date has already been requested once, **When** a second player requests the same date, **Then** both players receive the identical puzzle (same countries, same stats, same solutions)

---

### User Story 2 - Consistent Puzzles Across the Same Day (Priority: P2)

As a player, I want the puzzle I play today to be the same one everyone else plays today, so I can share results and compare scores.

**Why this priority**: Shared daily puzzles are fundamental to the social/competitive experience. A player sharing "Puzzle #47" must know their friend sees the same puzzle.

**Independent Test**: Request the same date's puzzle from two different sessions at different times of day. Both must return byte-identical puzzle data. This can be verified without any other user-facing functionality.

**Acceptance Scenarios**:

1. **Given** two players request the puzzle for the same date, **When** both responses arrive, **Then** the countries, stats, and solutions are identical
2. **Given** a player refreshes the game mid-session, **When** the puzzle is re-fetched, **Then** the puzzle is unchanged for that calendar day
3. **Given** the generation function runs twice for the same date, **When** results are compared, **Then** both results are identical

---

### User Story 3 - Zero-Maintenance Deployment (Priority: P3)

As the game operator, I can push the application to Vercel and new daily puzzles appear automatically without any manual intervention (no committing new JSON files, no running scripts).

**Why this priority**: Eliminates the ongoing operational burden of generating and deploying puzzle files. Enables the game to scale indefinitely without manual upkeep.

**Independent Test**: Deploy the application to Vercel. Wait until a date with no pre-generated file. Verify the game is playable without any code changes or file commits. This can be tested independently of all game UI.

**Acceptance Scenarios**:

1. **Given** the application is deployed to Vercel once, **When** days pass beyond the last pre-generated puzzle, **Then** the game continues working without operator intervention
2. **Given** no puzzle files exist in the repository at all, **When** the application is deployed and queried, **Then** puzzles are still generated and served correctly
3. **Given** the operator makes no changes to the codebase for 30 days, **When** players visit on any of those days, **Then** all 30 puzzles are distinct and valid

---

### Edge Cases

- What happens when the underlying country/stat dataset cannot be found or is malformed?
- What happens when no valid puzzle can be constructed for a given date (due to data constraints — not enough countries, tied ranks across all possible combinations)?
- How does the system handle dates before the game's epoch (before the first valid puzzle number)?
- What happens if the puzzle is requested multiple times concurrently for the same date (e.g., race condition on first generation)?
- How does timezone affect "today's date" — does the puzzle change at UTC midnight or a local timezone?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a valid puzzle for any given date using only the bundled country/stat dataset, without reading from a pre-generated puzzle JSON file
- **FR-002**: System MUST produce a deterministic puzzle for each date — the same date always yields the same puzzle, regardless of when or how many times generation is invoked
- **FR-003**: System MUST apply all existing puzzle validity constraints: exactly 5 countries (one per quintile band of the primary stat), exactly 3 stats spanning at least 2 distinct categories, no tied ranks among selected countries for any stat, and all countries having data for all selected stats
- **FR-004**: System MUST serve a well-formed puzzle response (date, countries, stats, solutions) through the existing puzzle API endpoint, maintaining backward compatibility with the current response shape
- **FR-005**: System MUST handle generation failures gracefully — returning a clear error response when no valid puzzle can be constructed for a date, rather than crashing or returning malformed data
- **FR-006**: System MUST ensure puzzles for consecutive days do not repeat the same set of countries
- **FR-007**: System MUST respect UTC-based date boundaries so all users worldwide share the same puzzle within the same UTC calendar day
- **FR-008**: The country/stat dataset MUST be bundled with or accessible to the deployed server function without requiring a separate database or external API
- **FR-009**: System SHOULD cache generated puzzles so repeated requests for the same date do not incur full generation cost on every call
- **FR-010**: System MUST continue to return a valid puzzle number (days since epoch) alongside the puzzle data

### Key Entities

- **Dataset**: The complete collection of country/stat data used as the source of truth for generation. Contains all eligible countries and their ranked values for each stat. Treated as read-only by the generation function.
- **Puzzle**: A dated set of 5 countries and 3 stats with a deterministic solution, generated on demand from the dataset. Identified by its UTC date string.
- **Generation Function**: The server-side logic that accepts a date, applies selection and validation constraints, and produces a Puzzle. Must be deterministic (same date → same output).
- **Puzzle Cache**: Optional ephemeral store that retains a generated Puzzle for the remainder of a UTC calendar day to avoid redundant generation on repeated requests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players on any date receive a valid, playable puzzle — the game does not show an error or empty state due to a missing puzzle for that day
- **SC-002**: Any two players requesting the same date's puzzle (at any time during that day) receive identical puzzle content
- **SC-003**: The application can be deployed once and operate without manual puzzle file updates for at least 365 consecutive days
- **SC-004**: Puzzle load time for a player is not noticeably longer than the current file-based approach — first-time generation for a date completes within a time that allows the game to load without a perceptible delay
- **SC-005**: Zero puzzle-related deployment steps are required — no scripts to run, no files to commit, no manual intervention needed after initial deployment

## Assumptions

- The existing `data/dataset.json` (the processed country/stat dataset) continues to be the authoritative data source and will be bundled with the deployed application
- The puzzle validity constraints (5 countries, 3 stats, 2+ categories, no ties, quintile banding, consecutive-day uniqueness) remain unchanged from the current Python generation logic
- UTC midnight is the canonical day boundary — the puzzle for a given UTC date is fixed for the entire UTC calendar day
- The existing puzzle API response shape (`{ date, countries, stats }`) is not changing — clients (the game UI) will not require updates to consume the new generated puzzles
- Pre-generated JSON files in `data/puzzles/` may be removed entirely; there is no requirement to maintain a fallback to them
- The generation logic will be ported or reimplemented in a language/runtime compatible with the Vercel serverless environment (the Python generation scripts are not directly deployable to Vercel)
- No persistent database or external storage is required for puzzle persistence — ephemeral or edge caching is sufficient
- The game epoch (`2026-01-01`) and puzzle numbering scheme remain unchanged
