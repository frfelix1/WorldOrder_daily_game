# Full-Sweep Requirements Quality Checklist: Rankle — Daily Geography Ranking Game

**Purpose**: Author self-review across all requirement domains before starting implementation — identify gaps, ambiguities, and missing acceptance criteria
**Created**: 2026-05-22
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [contracts/puzzle-api.md](../contracts/puzzle-api.md)
**Depth**: Standard (30–45 items) | **Audience**: Author (pre-implementation)

---

## Requirement Completeness

- [ ] CHK001 — Is the initial display order of the five countries specified (random, alphabetical, fixed)? [Gap]
- [ ] CHK002 — Is the visual representation of the "solved" state defined beyond "confirmed correct ordering displayed"? [Gap, Spec §FR-009]
- [x] CHK003 — Is the exact data schema for localStorage persistence documented (which fields must be saved and in what format)? [Gap, Spec §FR-017] ✓ Resolved: key `rankle_state_v1`; fields: `puzzleDate`, `stats[]{solved, guesses}`, `score`, `completed`; no solution/feedback stored.
- [ ] CHK004 — Are requirements defined for when localStorage is unavailable or full (e.g., private browsing, storage quota exceeded)? [Gap, Spec §FR-017]
- [ ] CHK005 — Are requirements defined for the loading state visual design (spinner, skeleton, placeholder text)? [Gap, Spec §FR-020]
- [ ] CHK006 — Are transition and animation requirements specified for the stat-reveal sequence and solved-state advancement? [Gap]
- [ ] CHK007 — Are screen reader announcement requirements defined for guess submission feedback and stat-solved/game-complete events? [Gap, plan.md §Gate V]
- [ ] CHK008 — Are keyboard navigation requirements for drag-to-reorder specified beyond "KeyboardSensor active" (key bindings, focus behavior, announced state)? [Gap, plan.md §Gate V]

---

## Requirement Clarity

- [ ] CHK009 — Is "brief moment" (the pause between a stat being solved and the next stat being revealed) quantified with a specific duration? [Ambiguity, Spec §FR-009, Scenario 4]
- [ ] CHK010 — Is the score display format defined (integer vs decimal, max possible value, initial value before any guesses)? [Ambiguity, Spec §FR-022]
- [ ] CHK011 — Is "user-friendly error message" specified with required content (message copy, retry button label, any fallback behavior)? [Ambiguity, Spec §FR-020]
- [x] CHK012 — Is the exponential penalty formula documented with sufficient precision (base, exponent, per-guess vs per-misplaced-country) to unblock implementation? [Ambiguity, Spec §FR-011] ✓ Resolved: linear MVP formula `max(10 − 2n, 0)` per position; max 150 pts.
- [ ] CHK013 — Is "usable without requiring instructions" (SC-002) defined with measurable acceptance criteria beyond subjective assessment? [Measurability, Spec §SC-002]
- [ ] CHK014 — Is "comprehensible to a general audience" (SC-007) defined with a testable method (e.g., reading level target, user test threshold)? [Measurability, Spec §SC-007]
- [x] CHK015 — Is the share text format fully specified (line structure, exact emoji choices for bull/miss, score line formatting, header/footer)? [Clarity, Spec §FR-013] ✓ Resolved: header `Rankle #N — X pts`, one line per stat, guesses separated by ` / `, 🟩 = correct, 🟥 = wrong; anonymous stat labels; no country names.

---

## Requirement Consistency

- [ ] CHK016 — Does the player-facing stat direction label requirement in FR-004 ("Rank from most to least") map unambiguously to the API contract `direction` field (`"asc"`/`"desc"`)? [Consistency, Spec §FR-004, contracts/puzzle-api.md §direction]
- [ ] CHK017 — Is the "no directional hint for incorrect positions" rule (FR-008) consistent with the information visible in the shared emoji grid (FR-013) — does the grid inadvertently reveal ordering information? [Consistency, Spec §FR-008, FR-013]
- [ ] CHK018 — Does FR-021 (no past puzzles accessible) align with FR-017 (local state persists across reloads) — is it specified that only today's state is surfaced to the player? [Consistency, Spec §FR-017, FR-021]
- [ ] CHK019 — Do the User Story 4 acceptance scenarios (daily rotation) align with the server-side date handling defined in the API contract (UTC date parameter, 404 for future dates)? [Consistency, Spec §US-4, contracts/puzzle-api.md]

---

## Acceptance Criteria Quality

- [ ] CHK020 — Are explicit acceptance scenarios defined for FR-020 (loading state display and error-with-retry behavior)? [Completeness, Spec §FR-020]
- [ ] CHK021 — Is there a worked scoring example or formula reference that makes SC-005 ("feedback unambiguously communicates correct positions") objectively verifiable? [Measurability, Spec §SC-005, FR-011]
- [ ] CHK022 — Is SC-004 ("90% of players complete all three stats") tied to a measurement mechanism, baseline, and time window? [Measurability, Spec §SC-004]
- [ ] CHK023 — Is SC-006 ("no puzzle repeats within 30 days") enforced by a documented authoring constraint or tooling check rather than relying on editorial memory? [Measurability, Spec §SC-006]

---

## Scenario Coverage

- [ ] CHK024 — Are requirements defined for a player solving a stat on the very first guess (zero-penalty path and immediate stat advancement)? [Coverage]
- [ ] CHK025 — Are requirements defined for keyboard-only navigation through the complete game flow (ranking, submitting, advancing stats, accessing result card)? [Coverage, Gap]
- [ ] CHK026 — Are share requirements differentiated between iOS/Android native share sheet and desktop clipboard fallback, including failure handling for each? [Coverage, Spec §FR-014]
- [ ] CHK027 — Are requirements defined for a player who opens the game simultaneously in multiple browser tabs (state conflict, duplicate session)? [Coverage, Gap]

---

## Edge Case Coverage

- [ ] CHK028 — Is behavior defined when the API response `date` field does not match the `date` parameter the client sent (e.g., stale CDN response)? [Edge Case, Gap, contracts/puzzle-api.md]
- [ ] CHK029 — Is behavior specified when a national flag SVG asset fails to load (broken image fallback, impact on drag interaction)? [Edge Case, Gap, Spec §FR-002]
- [ ] CHK030 — Is behavior defined when the puzzle API returns a structurally valid HTTP 200 but a malformed or schema-invalid JSON body? [Edge Case, Gap, contracts/puzzle-api.md]
- [ ] CHK031 — Is behavior specified for a player whose local device clock is set to a different calendar day than UTC (early or late by one day)? [Edge Case, Spec §FR-001, Assumptions]

---

## Non-Functional Requirements

- [ ] CHK032 — Is the TTI ≤ 1.5s performance budget tied to specific measurement conditions (device class, network profile, measurement tool)? [Clarity, plan.md §Performance Goals]
- [ ] CHK033 — Is the 60fps drag animation requirement tied to a measurable method and minimum target device class? [Measurability, plan.md §Performance Goals]
- [ ] CHK034 — Are WCAG 2.1 AA color contrast requirements specified for all UI states: bull/miss indicators, score display, solved state, error state? [Completeness, plan.md §Gate V]
- [ ] CHK035 — Are requirements defined for gameplay behavior on a degraded or intermittent connection beyond "progress preserved locally" (e.g., can the player still submit guesses offline)? [Completeness, Spec §Edge Cases]

---

## Dependencies & Assumptions

- [ ] CHK036 — Is the client-side answer validation security tradeoff (solution array exposed in API response) acknowledged and accepted at the product/stakeholder level, not only in the API contract? [Assumption, contracts/puzzle-api.md §Answer Validation]
- [ ] CHK037 — Is the dependency on dnd-kit's touch support validated against the minimum target mobile browser/device range (iOS Safari, Android Chrome versions)? [Dependency, plan.md]
- [ ] CHK038 — Is the "exponential penalty placeholder" assumption documented with enough specificity (even as a stub formula) to allow scoring implementation and tests to proceed without blocking? [Assumption, Spec §Assumptions]

---

## Ambiguities & Conflicts

- [x] CHK039 — Is "today's puzzle" defined for players who straddle UTC midnight — is there a hard cutover, a grace period, or is mid-session puzzle switching explicitly addressed? [Ambiguity, Spec §FR-001, Assumptions] ✓ Resolved: hard cutover; stale `puzzleDate` on next interaction discards state and loads new puzzle.
- [x] CHK040 — Is the initial unified score value defined (zero before any guesses, or another baseline), and is the scoring direction defined (lower is better, higher is better)? [Ambiguity, Spec §FR-022] ✓ Resolved: starts at 0, higher is better, max 150.
