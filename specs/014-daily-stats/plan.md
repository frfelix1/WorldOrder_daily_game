# Implementation Plan: Daily Game Stats

**Branch**: `014-daily-stats` | **Date**: 2026-09-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-daily-stats/spec.md`

## Summary

Add a glanceable daily-history view backed by the existing browser storage gateway. Record the result at the final successful solve, before the recap action, using versioned per-day localStorage entries keyed by UTC puzzle identity. Validate records without discarding identifiable days with unavailable scores, load history after mount without changing initial markup, and expose it from the current client page without adding a route or dependency.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.4, Next.js 16.2.6

**Primary Dependencies**: Next.js App Router, React DOM, Tailwind CSS 4, Vitest, Testing Library, Playwright

**Storage**: Browser localStorage through `src/lib/game-state.ts`; versioned per-day JSON entries keyed by puzzle number so one write cannot replace unrelated day records

**Testing**: Vitest with jsdom and global 80% coverage gate; Testing Library component tests; Playwright end-to-end game-flow coverage

**Target Platform**: Modern desktop, tablet, and mobile browsers with client-side storage enabled or unavailable

**Project Type**: Next.js App Router web application

**Performance Goals**: History load and render should be synchronous and negligible for the expected hundreds of daily records; no additional network request

**Constraints**: `src/lib/` remains pure except for the existing storage gateway rule; localStorage failures and malformed JSON must not break play; browser-only reads happen after mount or user interaction and must not change server/client initial markup; unsupported versions must not be overwritten; Tailwind utilities and existing global styling conventions remain in use; no direct component localStorage access

**Scale/Scope**: One player's history on one browser/device, expected to remain below a few thousand daily records; current game completion flow, result view, history view, and focused tests only. Legacy lifetime `PlayerStats` fields are not redesigned; repair must not increment them.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / constraint | Status | Plan |
|---|---|---|
| TypeScript strict mode | PASS | Add explicit interfaces and return types; use `unknown` narrowing for parsed storage data and no `any`. |
| Test-first development | PASS | Add failing storage, record, component, and end-to-end assertions before implementation; preserve the 80% global coverage gate. |
| Next.js App Router discipline | PASS | Keep browser interaction in the existing client page and the lowest new interactive component boundary; no new API or route. |
| Game logic purity | PASS | Extend only `game-state.ts` for localStorage access; record from the final-solve transition without changing score calculation or mutating guesses. |
| Accessibility baseline | PASS | Use semantic headings/list structure, text plus icon/status labels, keyboard-operable controls, and `aria-live` only for relevant save/storage notices. |
| Performance and styling constraints | PASS | Read one small local record set, avoid network work, and use existing Tailwind/global styling without a new dependency. |

**Gate result**: PASS. No constitution violations require a complexity exception.

## Project Structure

### Documentation (this feature)

```text
specs/014-daily-stats/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── stats-view.md
└── tasks.md             # Created by /speckit.tasks, not this command
```

### Source Code (repository root)

```text
src/
├── app/
│   └── page.tsx                 # Existing completion flow and stats entry point
├── components/
│   ├── game/
│   │   └── StatsView.tsx        # Glanceable daily history presentation
│   ├── ui/                      # Existing live-region primitives
│   └── dev/                     # Existing development controls
├── lib/
│   └── game-state.ts            # Existing localStorage gateway, extended for history
└── types/
    └── index.ts                 # Daily result/history types

tests/
├── e2e/
│   └── game-flow.spec.ts        # Completion persistence and stats journey
└── unit/
    ├── game-state.test.ts       # History storage/validation tests
    ├── GamePage.test.tsx        # Completion integration tests
    └── StatsView.test.tsx       # History rendering and accessibility tests
```

**Structure Decision**: Keep the existing single Next.js project. Add the smallest reusable stats presentation component, extend the existing type and storage modules, and keep the page as the integration point because completion state and the current puzzle date already live there. No API contract or server data model is needed.

## Phase 0 Research Decisions

- **Decision**: Use the existing UTC puzzle date (`GameState.dateUTC`) and puzzle number as the history identity; do not calculate a browser-local day in the stats feature.
  **Rationale**: The game already defines a stable daily identity and uses UTC consistently for puzzle rollover; reusing it avoids a second date interpretation.
  **Alternatives considered**: Browser-local calendar date was rejected because it can disagree with the active puzzle and shift date labels across timezones.

- **Decision**: Store one versioned result per puzzle number under a dedicated key prefix accessed only by `game-state.ts`; derive the history list by scanning that prefix.
  **Rationale**: Each `setItem` replaces only one day, so a save cannot erase unrelated daily results from another tab. The existing `worldorder_state` and aggregate `worldorder_stats` formats remain unchanged.
  **Alternatives considered**: A single JSON collection was rejected because read-modify-write can lose unrelated records across tabs. Reconstructing history from aggregate stats was rejected because aggregates do not retain per-day scores.

- **Decision**: Validate each entry independently; discard entries with invalid identity, retain valid identity with `finalScore: null`, report unsupported versions separately, and return storage status to the UI.
  **Rationale**: A corrupt score must not erase evidence that a day was completed, and an unavailable/unsupported store must not be presented as genuinely empty.
  **Alternatives considered**: Treating every malformed payload as empty was rejected because it hides data loss and can overwrite or mislabel existing history.

- **Decision**: Record at the final successful solve; show the current day as completed from in-memory state immediately and from persisted history after reload, otherwise show it as incomplete.
  **Rationale**: The player gets immediate status for today without persisting abandoned sessions, while saved history remains compact and focused on completed games.
  **Alternatives considered**: Recording on recap display was rejected because closing after the final solve would lose the result. Persisting every in-progress day was rejected because it adds stale records.

- **Decision**: Use a simple payload version per daily entry and ignore unsupported versions without overwriting them.
  **Rationale**: This is enough migration safety for a small local feature without a migration framework.
  **Alternatives considered**: A generic versioned repository or automatic destructive migration was rejected as unnecessary and unsafe.

- **Decision**: Treat only the current day as repairable from `worldorder_state`; do not infer older daily results or rewrite legacy `worldorder_stats`.
  **Rationale**: The current completed state contains a trustworthy day and score, while lifetime aggregates contain no per-day identity. Repairing older history would invent data.
  **Alternatives considered**: A migration from aggregate counters was rejected because it cannot recover dates or scores safely.

## Phase 1 Design

### Data Model

See [data-model.md](./data-model.md) for the stored entities, validation, duplicate handling, and display derivation.

### UI Contract

See [contracts/stats-view.md](./contracts/stats-view.md) for the user-facing stats view contract and accessibility expectations.

### Quickstart

See [quickstart.md](./quickstart.md) for test-first implementation and verification commands.

### Post-Design Constitution Recheck

| Principle / constraint | Status | Verification |
|---|---|---|
| TypeScript strict mode | PASS | New history records are explicitly typed and parsed storage is narrowed before use; existing persisted aggregate input used by completion is validated enough to avoid valid-JSON crashes. |
| Test-first development | PASS | Unit/component tests cover storage, malformed/partial data, unsupported versions, duplicate days, sorting, empty/unavailable states, storage failure, and hydration-safe loading before implementation; E2E covers completion and reload. |
| Next.js App Router discipline | PASS | No new route or fetch; storage is loaded after mount or interaction inside the existing client boundary, with deterministic initial markup. |
| Game logic purity | PASS | Persistence is confined to `game-state.ts`; final score remains derived from guesses and the history writer receives the completed state. |
| Accessibility baseline | PASS | Stats uses semantic list content and text status labels; controls remain keyboard accessible and notices use the existing live-region pattern. |
| Performance and styling constraints | PASS | One local read and bounded list rendering; no new dependency or network work. |

**Post-design gate result**: PASS. No constitution exception is required.

## Implementation Sequence

1. Add red unit tests for empty history, per-day key discovery, valid round-trip, invalid JSON, wrong types, invalid identity, invalid score retention, duplicate resolution, unsupported versions, read failures, write failures, and preservation of unrelated day keys.
2. Add red component tests for deterministic initial render, post-mount loading, completed/incomplete status, score and unavailable-score display, empty/unavailable/unsupported states, storage warning, puzzle-fetch failure, and keyboard controls.
3. Add red game-page tests before implementation proving the final solve records history before recap, closing/reloading without recap restores it, repeated completion does not create duplicate history, and an existing completed state can repair missing history without incrementing lifetime stats.
4. Add red Playwright tests for a real final-solve journey, reload persistence, browser timezone/date-label behavior, malformed storage, blocked storage, and history visibility when the puzzle request fails. Keep injected completed-state tests as restore-only coverage.
5. Add versioned `DailyResult` and derived `StatsHistory` types, then implement the minimal validated per-day gateway in `src/lib/game-state.ts`. Return explicit read/write status; never treat unsupported data as empty-and-writable.
6. Move the completion transition to the final successful solve, persist the daily result before recap display, and make history writes idempotent by puzzle number. Do not redesign legacy `PlayerStats`; history repair MUST NOT increment its counters, and the plan must explicitly preserve the existing aggregate semantics rather than imply daily-history correctness for those counters.
7. Add the stats view and entry point using existing styling. Load persisted history only after mount or user interaction; overlay the current in-memory completion and show "Completed, not saved" when persistence fails.
8. Run focused Vitest tests, full `npm test`, lint, production `npm run build` plus a production-server hydration check, and the relevant Playwright flow. Manually verify clear data, malformed/unsupported data, blocked storage, close-before-recap, repeated completion, and two-tab unrelated-day writes.

## Risks and Mitigations

- **Duplicate completion writes**: Key records by puzzle number and replace the existing day rather than append; do not recount legacy aggregates during repair.
- **Malformed persisted data**: Validate identity and score independently; discard unidentifiable entries, retain identifiable entries with unavailable scores, and preserve unsupported versions.
- **Storage unavailable or quota exceeded**: Catch reads/writes in the gateway, keep the in-memory game usable, return status, and surface a non-blocking warning without claiming persistence.
- **UTC/local date confusion**: Use the existing `dateUTC` field and puzzle-number identity; format date-only labels without local timezone conversion.
- **Hydration mismatch**: Render deterministic initial stats state and load browser data after mount or interaction; never write an empty default during initialization.
- **Concurrent tabs**: Use one versioned localStorage key per puzzle day so writes cannot replace unrelated days; same-day last-write-wins is explicit and does not duplicate the UI row.
- **Legacy aggregate stats**: Do not infer daily history from aggregates; repair a missing daily record without incrementing aggregate counters.
- **Large history rendering**: Keep the MVP as a simple bounded list; add pagination/pruning only if real usage demonstrates a need.
- **Accessibility regression**: Test status text independently of color and preserve keyboard focus order and minimum touch targets.

## Complexity Tracking

No violations.
