# Feature Specification: Puzzle Data Generation from Processed Stats

**Feature Branch**: `003-puzzle-data-generation`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "I have created puzzle data files under data/stats/processed. Now I need to implement the game itself to use data from these and not take data from the hardcoded puzzles earlier. Look through the documentation in the repository to get a grasp of the rules that need to be adhered to with logic on country selection for stats etc."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Game Serves Real-Data Puzzles for Every Date (Priority: P1)

A player loads the game on any given day and receives a puzzle whose five countries and three stats are derived entirely from the processed statistics dataset — not from a hand-written file. The correct ordering (solution) is computed directly from the real numeric values stored in the dataset. The player experiences no visible change from the current game; the rules, scoring, and interactions are identical.

**Why this priority**: This is the core deliverable. Everything else — the dataset builder, the validator, the generator — exists to make this work. Without it, the game is still running on hand-curated stubs.

**Independent Test**: Delete all files in `data/puzzles/`, point the puzzle API at the generated output, load the game for today's date, verify that five countries and three stats appear and that the solution arrays are consistent with the dataset's ranked values.

**Acceptance Scenarios**:

1. **Given** the processed stat CSVs exist in `data/stats/processed/`, **When** the puzzle generator is run for a target date, **Then** a valid `data/puzzles/YYYY-MM-DD.json` file is produced whose schema matches the existing `PuzzleFile` type.
2. **Given** a generated puzzle file for a date, **When** a player loads the game for that date, **Then** the game renders without error, all five countries appear, and all three stats are present with correct solution orderings derived from real data.
3. **Given** a generated puzzle's solution array for any stat, **When** the values are looked up in the dataset for each country in that array, **Then** they are in strictly decreasing order (for `desc` direction) or strictly increasing order (for `asc` direction) — confirming no ties and correct derivation.

---

### User Story 2 — Puzzle Generator Enforces Country-Selection and Category Rules (Priority: P1)

When a puzzle is generated, the tool automatically ensures that (a) all five chosen countries have distinct values for every stat in the puzzle, and (b) the three stats span at least two different categories. If these constraints cannot be satisfied by the proposed selection, the tool reports a clear error instead of writing an invalid puzzle file.

**Why this priority**: These constraints are fundamental game rules documented in the existing spec (FR-015, FR-016 of spec 001 and FR-006, FR-010 of spec 002). Violating them would produce unsolvable or ambiguous puzzles.

**Independent Test**: Attempt to generate a puzzle with two countries whose GDP values are identical; verify the tool rejects the selection with a message identifying the conflicting country/stat pair. Separately, attempt a selection with all three stats from the "economy" category; verify rejection with a category-variety error.

**Acceptance Scenarios**:

1. **Given** a puzzle candidate with five countries where two share the same value for one stat, **When** the generator validates the candidate, **Then** generation is aborted and an error identifies the conflicting stat and the two countries with tied values.
2. **Given** a puzzle candidate where all three stats belong to the same category, **When** the generator validates the candidate, **Then** generation is aborted and an error states the category constraint was violated.
3. **Given** a puzzle candidate that passes all constraints, **When** the generator writes the output file, **Then** the file is written successfully and the solution arrays are fully derived from the dataset's pre-computed rankings.
4. **Given** a country/stat combination where the processed dataset has no value (missing data), **When** that combination is evaluated for puzzle use, **Then** it is automatically excluded from consideration rather than causing a generation error.

---

### User Story 3 — Dataset Builder Ingests Processed CSVs into a Structured Local Store (Priority: P1)

An operator (or CI script) runs a single command that reads the 17 processed CSV files from `data/stats/processed/`, resolves the ISO alpha-2 codes to ISO alpha-3 codes used by the game schema, parses all numeric values, computes pre-ranked orderings for each stat, and writes the result to a structured local dataset. This dataset is the single authoritative source for all subsequent puzzle generation.

**Why this priority**: Without the structured dataset, country selection and validation are impossible. The processed CSVs exist but require interpretation (numeric parsing, code mapping, ranking computation) before they can drive puzzle generation.

**Independent Test**: Run the dataset builder command, then inspect the output for a known country (e.g., Japan / `JPN`) and confirm it contains a numeric value, a pre-computed rank, and an ISO alpha-3 code for at least 10 stats. Verify that comma-formatted numbers (e.g., `"32,383,920"`) are stored as plain integers.

**Acceptance Scenarios**:

1. **Given** the processed CSVs exist, **When** the dataset builder runs, **Then** all 17 stat files are read and a structured local dataset is produced with at least 30 countries having data for at least 10 stats.
2. **Given** a processed CSV with comma-formatted numeric values (e.g., `"32,383,920"`), **When** the builder ingests it, **Then** the stored value is the plain numeric equivalent (`32383920`).
3. **Given** a row in a processed CSV with a missing or `—N/a` value, **When** the builder ingests it, **Then** that country/stat entry is marked as unavailable and excluded from puzzle generation for that stat.
4. **Given** a processed CSV using ISO alpha-2 codes (e.g., `JP`), **When** the builder ingests it, **Then** the stored entry uses the corresponding ISO alpha-3 code (`JPN`) as required by the puzzle schema.
5. **Given** the dataset builder has run, **When** the same command is run again without any CSV changes, **Then** the output is identical (idempotent).

---

### User Story 4 — Operator Can Generate a Full Sequence of Puzzle Files (Priority: P2)

A game operator runs a single command specifying a date range (e.g., the next 30 days) and receives one puzzle file per day in `data/puzzles/`. Each puzzle in the sequence uses a different combination of countries or stats from the dataset, avoiding exact repeats of the same five-country set within the sequence. The operator can inspect which country/stat combinations have been used to plan variety.

**Why this priority**: The game needs a buffer of pre-generated puzzles. Manual generation of 30 individual files is impractical; batch generation is the operational workflow.

**Independent Test**: Run the batch generator for a 30-day window. Verify that 30 valid puzzle files are produced. Verify no two consecutive files share an identical five-country set.

**Acceptance Scenarios**:

1. **Given** a date range of 30 days with sufficient data in the dataset, **When** the batch generator runs, **Then** 30 valid puzzle files are written to `data/puzzles/` in `YYYY-MM-DD.json` format.
2. **Given** a batch of 30 generated puzzles, **When** the country sets for each puzzle are compared, **Then** no two consecutive puzzles share the exact same set of five countries.
3. **Given** a puzzle file already exists for a date in the requested range, **When** the batch generator runs, **Then** the existing file is not overwritten (skip-existing behavior) unless a force flag is passed.
4. **Given** the dataset does not contain enough valid combinations to fill the requested range, **When** the batch generator runs, **Then** it generates as many valid puzzles as possible and reports how many could not be produced and why.

---

### Edge Cases

- What if the dataset builder encounters a CSV column with a non-breaking space or quoting anomaly (as seen in `modify_corruption_index.csv` and `modify_temperature.csv`)? The builder MUST log a clear warning per-file and continue processing the remaining files rather than halting entirely.
- What if no valid five-country set with distinct values exists for the requested stats? The generator MUST report this and either try alternative stats or halt with a descriptive error.
- What if two countries tie for a stat value after numeric parsing (e.g., both have `3.5` for HDI)? That country pair MUST be treated as tied and ineligible for the same puzzle for that stat — even if the raw source data shows small decimal differences that round to the same value.
- What if the alpha-2 to alpha-3 mapping cannot find a match for a code in the processed CSV? That row MUST be skipped with a warning, and the country does not appear in the dataset.
- What if a generated puzzle's solution array is empty or shorter than five entries? The generator MUST reject the output and raise an error before writing the file.
- What if there are not enough countries in one of the five quintile bands to satisfy the ranking-spread constraint? The generator MUST try alternative stats before falling back to a relaxed spread (at most one empty band allowed), and MUST log a warning if the full quintile constraint cannot be satisfied.
- What if a batch generation run is interrupted partway through? Partially written puzzle files MUST be either complete and valid or not written at all (atomic write).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dataset builder MUST read all valid processed CSV files from `data/stats/processed/` and produce a structured local dataset containing, for each country/stat combination: ISO alpha-3 country ID, stat identifier, numeric value, pre-computed rank (integer, 1 = best), unit of measure, sort direction, and an availability flag.
- **FR-002**: The dataset builder MUST map ISO alpha-2 codes from processed CSVs to ISO alpha-3 codes. Any alpha-2 code without a corresponding alpha-3 mapping MUST be skipped with a logged warning.
- **FR-003**: The dataset builder MUST parse comma-formatted numeric strings (e.g., `"32,383,920"`) into plain numeric values. Rows with unparseable or `—N/a` values MUST be flagged as unavailable and excluded from puzzle generation.
- **FR-004**: The dataset builder MUST compute a pre-ranked ordering for each stat across all countries with available values. Countries with tied numeric values MUST receive the same rank; such ties MUST be flagged so that puzzle generation excludes any country pair with a tied rank for a given stat.
- **FR-005**: The dataset builder MUST be idempotent: running it multiple times on unchanged CSV inputs MUST produce the same structured dataset.
- **FR-006**: The puzzle generator MUST only select five countries where all five have distinct pre-computed ranks for each stat used in the puzzle (no ties allowed).
- **FR-007**: The puzzle generator MUST enforce the category-variety constraint: the three stats chosen for a puzzle MUST span at least two distinct categories. No puzzle may contain three stats from the same single category.
- **FR-008**: The solution array in each generated puzzle file MUST be derived from the pre-computed rankings in the dataset, ordered by rank ascending (rank 1 first = best value first for `desc` direction, rank 1 first = lowest value first for `asc` direction).
- **FR-009**: Generated puzzle files MUST conform to the existing `PuzzleFile` schema: a `date` string, a `countries` array (5 entries, each with `id` as ISO alpha-3, `name`, and `flagCode` as ISO alpha-2), and a `stats` array (3 entries, each with `id`, `label`, `category`, `tooltip`, `direction`, and `solution`).
- **FR-010**: Stat tooltips in generated puzzle files MUST include a plain-language description of the stat, the source name, and the data year (matching the format already established in existing hand-curated puzzles).
- **FR-011**: The puzzle generator MUST reject any candidate selection that violates game constraints (ties, category uniformity, missing data) and report which constraint was violated before writing any output file.
- **FR-012**: The batch generator MUST support generating puzzle files for a specified date range. Existing puzzle files for dates in the range MUST NOT be overwritten unless an explicit override option is passed.
- **FR-013**: The batch generator MUST avoid using the exact same five-country set in consecutive puzzle files within a single generation run.
- **FR-016**: The puzzle generator MUST enforce a ranking-spread constraint when selecting the five countries for a puzzle: the five selected countries MUST be drawn from distinct quintile bands of the full ranked list for the primary stat. Specifically, for a stat with N eligible countries, one country MUST come from each of the five bands: ranks 1–20%, 21–40%, 41–60%, 61–80%, and 81–100% of N. When a stat has countries with a value of zero (e.g., landlocked countries for coastline), the zero-value country fills the bottom band and the remaining four countries are drawn from quartile bands (0–25%, 25–50%, 50–75%, 75–100%) of the non-zero ranked countries. This constraint ensures puzzles span the full range of the stat, making the ranking challenge meaningful rather than guessable by clustering.
- **FR-014**: The dataset builder MUST log per-file warnings for any CSV that cannot be fully parsed (e.g., column-name anomalies, quoting issues) and continue processing remaining files rather than aborting.
- **FR-015**: Country metadata (display name, ISO alpha-3 ID, ISO alpha-2 flag code) required by the puzzle schema MUST be maintained in a single reference table and reused consistently across both the dataset and generated puzzle files.

### Key Entities

- **ProcessedStatFile**: One of the 17 CSV files under `data/stats/processed/`. Contains rows of `countryLabel`, `isoCode` (alpha-2), and a stat-specific value column. Input to the dataset builder.
- **CountryDefinition**: A country eligible for use in puzzles. Contains: ISO alpha-3 ID (game schema key), display name, ISO alpha-2 flag code. Bridges the alpha-2 codes in processed files to the alpha-3 codes required by the puzzle schema.
- **StatDefinition**: Metadata for one measurable stat. Contains: stat ID, human-readable label, category (e.g., `economy`, `health`, `geography`, `environment`), sort direction (`asc` or `desc`), tooltip description template, source name, and data year.
- **CountryStat**: A single resolved data point for one country and one stat. Contains: ISO alpha-3 country ID, stat ID, numeric value, pre-computed rank, availability flag, and a tied-rank flag.
- **LocalDataset**: The complete structured collection of `CountryStat` entries produced by the dataset builder and stored locally. The authoritative source of truth for puzzle generation.
- **PuzzleCandidate**: An in-progress selection of five countries and three stats being validated before a puzzle file is written. Passes through constraint checks (distinct ranks, category variety, no missing data) before being committed to a file.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The dataset builder successfully ingests at least 15 of the 17 processed CSV files and produces a dataset covering at least 30 countries with data across at least 10 distinct stats.
- **SC-002**: 100% of generated puzzle files pass schema validation against the existing `PuzzleFile` type — zero invalid files reach `data/puzzles/`.
- **SC-003**: 100% of solution arrays in generated puzzles are in correct ranked order with no ties among the five chosen countries — zero ambiguous orderings.
- **SC-004**: The puzzle generator rejects all constraint-violating candidate selections before writing any file, with a descriptive error message in every case.
- **SC-005**: A single puzzle file can be generated from the dataset in under 10 seconds on a standard developer machine.
- **SC-006**: A batch of 30 puzzle files can be generated without any two consecutive puzzles sharing an identical five-country set, given a dataset of at least 30 countries.
- **SC-008**: 100% of generated puzzles satisfy the ranking-spread constraint — every puzzle's five countries are drawn from five distinct quintile bands of the primary stat's ranked list, or from four quartile bands plus a zero-value band when applicable.
- **SC-007**: The game loads and plays correctly when `data/puzzles/` contains only generated files (no hand-curated stubs remain) — the player experience is unchanged.

## Assumptions

- The 17 processed CSV files in `data/stats/processed/` represent the complete input; no additional scraping or external network calls are required for this feature. The dataset builder works exclusively from local files.
- The existing `PuzzleFile` JSON schema is not modified by this feature; the generator outputs conform to it exactly as-is.
- The game's API route (`src/app/api/puzzle/route.ts`) remains unchanged; it continues to read from `data/puzzles/YYYY-MM-DD.json` files. No runtime code changes to the game client or server are needed beyond having valid puzzle files present.
- An ISO alpha-2 to alpha-3 mapping table will be constructed or sourced as part of this feature to bridge the code mismatch between processed CSVs (alpha-2) and the puzzle schema (alpha-3).
- `modify_population_density.csv` (0 rows matched), `modify_temperature.csv` (parse error), and `modify_corruption_index.csv` (column name anomaly) are expected to fail or be skipped during dataset building; the remaining 14+ files provide sufficient stat variety.
- The initial country pool targets the 30–60 most recognizable and well-documented countries (matching the assumption from spec 002); highly obscure or disputed territories are out of scope.
- The puzzle generator is a developer/operator tool (a script); a web-based puzzle editor UI is out of scope.
- Previously hand-curated puzzle files in `data/puzzles/` are not deleted or overwritten by this feature unless the operator explicitly chooses to regenerate them. They remain as a fallback until the generated pipeline is verified.
- Stat definitions (label, category, tooltip template, direction, source, data year) will be maintained as a static configuration alongside the dataset builder, not derived dynamically from the CSV filenames.
