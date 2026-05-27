# Feature Specification: Real Data Sourcing for WorldOrder Puzzles

**Feature Branch**: `002-real-data-sourcing`

**Created**: 2026-05-23

**Status**: Draft

**Input**: User description: "I want to start implementing proper data into my game, with data fetched from proper sources and so on."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Players See Accurate, Verifiable Statistics (Priority: P1)

When a player ranks countries by a stat such as GDP or Life Expectancy, the correct ordering reflects real-world values sourced from an authoritative body (e.g., World Bank, UN). The tooltip for each stat cites where the data comes from and when it was last updated, so a curious player can verify the answer independently.

**Why this priority**: Credibility is fundamental. If the underlying data is made up or stale, the game loses trust. This is the primary motivation for the feature.

**Independent Test**: Load today's puzzle, open a stat tooltip, verify it cites an authoritative source and a year. Cross-check the correct ordering against the cited source to confirm accuracy.

**Acceptance Scenarios**:

1. **Given** a player views any stat in any puzzle, **When** they read the tooltip, **Then** the tooltip includes both a plain-language explanation of the stat and a source attribution (organization name and data year).
2. **Given** a player resolves a stat and sees the correct ordering, **When** they look up the same statistic from the cited source, **Then** the ordering matches the real-world values from that source.
3. **Given** a stat with a direction of "highest to lowest," **When** the correct ordering is derived from real data, **Then** the country ranked first genuinely has the highest real-world value for that metric.

---

### User Story 2 — Game Operators Can Browse and Select Stats for Puzzle Generation (Priority: P1)

A game operator (or automated puzzle tool) can access a curated dataset of country statistics covering multiple categories. From this dataset they can select a combination of countries and stats, verify that all five chosen countries have distinct values for each chosen stat, and produce a valid puzzle file ready to be served.

**Why this priority**: Without a well-structured dataset, puzzle creation remains error-prone and unscalable. This is the operational backbone of the feature.

**Independent Test**: Using only the dataset (no external lookups), generate a candidate puzzle for a date, verify each of the three stats contains distinct values across the five selected countries, and confirm the resulting puzzle file passes the existing game's schema validation.

**Acceptance Scenarios**:

1. **Given** the dataset exists, **When** an operator queries it for countries and a stat, **Then** actual numeric values are returned for each country, allowing the correct ordering to be derived.
2. **Given** an operator selects five countries and three stats, **When** all values are distinct within each stat, **Then** a valid puzzle file can be generated in the existing puzzle format with the solution arrays derived from real values.
3. **Given** an operator selects five countries and a stat where two countries share the same value, **When** the system evaluates the selection, **Then** it flags the stat/country combination as invalid for puzzle use (ambiguous ordering).
4. **Given** a stat is selected for a puzzle, **When** the operator views that stat's record, **Then** the record includes: the value per country, the unit of measure, the source, and the data year.

---

### User Story 3 — Dataset Is Refreshed Monthly and Reflects Ranking Changes (Priority: P2)

Once a month, the dataset is refreshed by fetching the latest figures from authoritative sources in bulk. The refresh process compares new rankings against the stored ones: if the relative ordering of countries for a stat is unchanged, the entry is left as-is. Only when a ranking actually shifts (a country moves up or down relative to another) is the dataset updated. Previously published puzzles are never touched.

**Why this priority**: Data ages, but tiny numerical fluctuations that leave rankings identical are not meaningful for a ranking game. What matters is whether the correct answer has changed — not whether a GDP figure moved by 0.1%. Monthly cadence balances freshness against operational cost.

**Independent Test**: Run a simulated refresh where one country's value changes but its rank position does not change; verify the dataset entry is not updated. Then run a refresh where a country's rank changes; verify the dataset entry is updated and future puzzle generation reflects the new ordering.

**Acceptance Scenarios**:

1. **Given** a monthly refresh is run, **When** new source figures are fetched, **Then** the system compares the new ranking for each stat against the stored ranking.
2. **Given** a refresh produces new values that result in the same country ordering as before, **When** the comparison is complete, **Then** the stored entry is not modified.
3. **Given** a refresh produces new values that change the ranking of one or more countries for a stat, **When** the comparison is complete, **Then** the dataset is updated with the new values and ordering, and the data year is updated.
4. **Given** a puzzle was already published before a refresh, **When** a player plays that puzzle, **Then** it still uses the values it was originally generated with (no retroactive changes to published puzzles).

---

### User Story 4 — Expanded Country Pool Enables Greater Puzzle Variety (Priority: P3)

The dataset covers enough countries (not just the handful currently appearing in puzzles) that future puzzles can draw from a diverse pool. Players do not see the same five countries repeated day after day.

**Why this priority**: Variety and replayability depend on having a wider dataset. This is a quality-of-life concern, not a correctness one.

**Independent Test**: Inspect the dataset and count the number of countries with complete data (values for all supported stats). Verify the count exceeds 30 countries across multiple geographic regions.

**Acceptance Scenarios**:

1. **Given** the dataset is populated, **When** an operator reviews the country list, **Then** at least 30 countries are represented, spanning multiple continents.
2. **Given** a puzzle is being generated, **When** five countries are selected from the dataset, **Then** any valid combination of five countries with distinct stat values can be used.

---

### Edge Cases

- What if a data source reports no value for a country on a given stat (missing data)? The dataset MUST record that the value is unavailable for that country/stat combination; such entries MUST be excluded from puzzle generation for that stat.
- What if two countries have the same value for a stat (a tie)? That stat/country-pair combination MUST be flagged as ineligible for puzzles (tied rankings are ambiguous); the system MUST prevent its use in puzzle generation for that stat.
- What if the primary data source for a stat changes its methodology between updates? The data year and source version MUST be recorded so any methodology change is traceable.
- What if a stat has values in different units across countries (e.g., some GDP figures in current USD vs. constant USD)? All values within a stat MUST use a consistent unit of measure, and that unit MUST be documented.
- What if a generated puzzle file fails schema validation? The generation process MUST reject the output and report which constraint was violated rather than writing an invalid file.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dataset MUST store a numeric value, a pre-computed ranking, a unit of measure, a data source name, and a data year for each country/stat combination.
- **FR-002**: The dataset MUST cover at least 30 countries and at least 10 distinct stats spanning at least 4 categories (e.g., economy, demographics, geography, health).
- **FR-003**: All stat values within a given stat MUST use a consistent unit of measure across all countries.
- **FR-004**: Each stat record MUST include a source attribution that identifies the organization providing the data and the year the data was collected or published.
- **FR-005**: The dataset MUST support flagging a country/stat combination as unavailable (missing data), and such entries MUST be automatically excluded from puzzle generation.
- **FR-006**: The puzzle generation process MUST only select country/stat combinations where all five chosen countries have distinct pre-computed rankings for each selected stat, preventing ambiguous orderings.
- **FR-007**: Puzzle files generated from the dataset MUST conform to the existing puzzle file schema (date, countries array with id/name/flagCode, stats array with id/label/category/tooltip/direction/solution).
- **FR-008**: The solution array in each generated puzzle file MUST be taken from the pre-computed rankings stored in the dataset, not derived on-the-fly or entered manually at generation time.
- **FR-009**: Stat tooltips in generated puzzle files MUST include the source attribution and data year alongside the plain-language explanation.
- **FR-010**: Puzzle generation MUST enforce the existing game constraint that no puzzle contains three stats from the same category; stats MUST span at least two distinct categories.
- **FR-011**: Previously published puzzle files MUST NOT be modified when the dataset is refreshed; refreshes only affect newly generated puzzles.
- **FR-012**: Data is fetched from external sources in a single bulk operation (not piecemeal or at runtime). The dataset is populated and stored locally from this bulk fetch; the game never queries external data sources directly.
- **FR-013**: The dataset MUST support a monthly refresh cycle. During a refresh, each stat's new ranking MUST be compared against the stored ranking; the entry is updated only when the ranking has changed. A ranking change that does not affect the relative ordering of countries MUST NOT trigger an update.
- **FR-014**: The system MUST report a clear error when a requested country/stat selection produces an invalid puzzle (e.g., tied rankings, missing data, insufficient category variety).

### Key Entities

- **CountryStat**: A single data point. Represents the real numeric value and pre-computed rank position of one stat for one country. Contains: country ID, stat ID, numeric value, pre-computed rank (integer, 1 = highest/lowest depending on direction), unit of measure, data source name, data year, and an availability flag.
- **StatDefinition**: Metadata about a measurable metric. Contains: stat ID, human-readable label, category, sort direction (ascending/lowest-to-highest or descending/highest-to-lowest), and a description template for tooltip generation.
- **CountryDefinition**: Metadata about a country used in the game. Contains: country ID (ISO alpha-3), display name, flag code (ISO alpha-2). Shared between the dataset and puzzle files.
- **DatasetSnapshot**: The full collection of CountryStat entries at a point in time, fetched in bulk from authoritative sources and stored locally. Represents the authoritative source of truth for puzzle generation and is refreshed on a monthly cadence.
- **RankingChange**: The result of comparing a refreshed stat's new ranking against the stored ranking. Only entries where the relative ordering has changed are written back to the dataset.
- **PuzzleCandidate**: An in-progress selection of five countries and three stats being validated before a puzzle file is written. Validated against distinct-rankings and category-variety constraints before being committed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of stat orderings in generated puzzle files match the ranking derivable from the cited source's published figures for the given data year.
- **SC-002**: Every stat tooltip in a generated puzzle includes a source attribution; a player can independently verify the correct answer using only publicly available data from that source.
- **SC-003**: The dataset covers at least 30 countries and at least 10 distinct stats, enabling at least 90 days of non-repeating puzzles using distinct country/stat combinations.
- **SC-004**: Puzzle generation rejects any selection with duplicate stat values across the five chosen countries 100% of the time — zero ambiguous puzzles reach published files.
- **SC-005**: A new puzzle file can be generated from the dataset in under 60 seconds by an operator without requiring manual stat-value lookup.
- **SC-006**: Monthly dataset refreshes do not alter any previously published puzzle files — historical accuracy is preserved.
- **SC-007**: A refresh that produces no ranking changes results in zero dataset writes — the system correctly identifies that no meaningful update is required.

## Assumptions

- Puzzle files remain static JSON served to players; this feature populates and validates those files from a real dataset but does not change the runtime game format.
- Data is sourced from publicly accessible, authoritative bodies (e.g., World Bank, UN, WHO, CIA World Factbook). License terms for each source are assumed to permit use in a non-commercial game; license verification is out of scope for this feature.
- Data is fetched from external sources in a single bulk operation and stored locally within the project. The game never queries external sources at runtime; all puzzle generation works from the locally stored dataset.
- The dataset is refreshed on a monthly cadence. Ranking stability is the primary criterion for whether a refresh produces meaningful changes — small value shifts that leave orderings identical require no update.
- The initial dataset targets a pool of the 30–60 most recognizable and well-documented countries; adding more obscure countries is out of scope for this feature.
- Numeric values in the dataset are point-in-time snapshots; the dataset does not need to store historical time series — only the most recently accepted value and pre-computed ranking per country/stat.
- The existing puzzle file schema (`PuzzleFile`) is not changed by this feature; the output of the data layer conforms to the existing schema.
- A puzzle generation tool or script is in scope; a web-based puzzle editor UI is out of scope.
