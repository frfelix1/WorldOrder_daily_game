# Research: Daily Game Stats

## Existing Storage Boundary

- **Decision**: Extend `src/lib/game-state.ts` with history read/write operations.
- **Rationale**: The constitution requires all `localStorage` access to stay in this gateway, which already catches storage and JSON failures.
- **Alternatives considered**: A new storage module duplicates the established boundary; direct component access violates the constitution.

## Daily Identity

- **Decision**: Use the existing UTC puzzle date and puzzle number as the history identity.
- **Rationale**: `src/app/page.tsx` already owns the active puzzle identity and `src/lib/puzzle.ts` owns UTC date calculations. Date-only labels must not be converted through the browser timezone.
- **Alternatives considered**: Browser-local dates can disagree with the active puzzle and shift labels across timezones.

## Persistence Shape and Concurrency

- **Decision**: Store one versioned JSON result per puzzle number under a dedicated key prefix and derive the list by scanning that prefix.
- **Rationale**: `localStorage.setItem` replaces one key atomically, so a write cannot erase an unrelated day from another tab. Same-day concurrent writes are explicitly last-write-wins and still produce one UI row.
- **Alternatives considered**: A single history blob was rejected because read-modify-write can lose unrelated records across tabs. A locking protocol is unnecessary for this local single-player feature.

## History Semantics

- **Decision**: Persist immediately when the final successful stage is accepted, before the recap is opened. Replace an existing record for the same puzzle only when a later valid result is available.
- **Rationale**: Closing after solving must not lose the day. In-progress sessions are not daily results. Repairing a missing result must not increment lifetime aggregate counters.
- **Alternatives considered**: Recording on recap display loses results when the player closes first; recording every in-progress state creates stale entries.

## Validation and Recovery

- **Decision**: Validate each entry independently. Discard invalid identity, retain valid identity with `finalScore: null`, report unsupported versions separately, and return storage status to the UI.
- **Rationale**: A corrupt score must not erase evidence that a day was completed, and unavailable/unsupported data must not appear as genuinely empty.
- **Alternatives considered**: Treating every malformed payload as empty hides data loss and risks destructive overwrite.

- **Decision**: Reconcile a missing daily record from an existing valid completed game state without changing lifetime aggregates.
- **Rationale**: The history write can fail independently, and existing users may have completed state from before the feature. The state contains the day and score; aggregate totals do not contain per-day history.
- **Alternatives considered**: Reconstructing old days from aggregate totals is impossible without inventing dates or scores.

- **Decision**: Repair only the current valid completed state and never infer older daily results from `PlayerStats`.
- **Rationale**: Aggregate counters do not retain per-day identity, so a broader migration would fabricate history. Repair must not increment lifetime counters.
- **Alternatives considered**: A migration from aggregate totals was rejected because it cannot recover trustworthy dates or scores.

## Browser Rendering

- **Decision**: Load history after mount or explicit stats interaction and begin with deterministic loading/empty markup.
- **Rationale**: Next.js Client Components can still be prerendered. Reading storage during render or in a state initializer can produce server/client markup differences. Post-mount loading also exposes storage failure to the UI.
- **Alternatives considered**: Render-time storage reads are browser-only and hydration-risky; a server route cannot read browser localStorage.

## UI Integration

- **Decision**: Add one focused stats component to the existing client page, without a route or new dependency.
- **Rationale**: The application has one page, completion state already lives there, and a route adds navigation/loading complexity without user value.
- **Alternatives considered**: A server route cannot access local history; calendar/chart packages are unnecessary for an ordered glanceable list.

## Testing Strategy

- **Decision**: Use Vitest for gateway behavior, Testing Library for rendering, and Playwright for final-solve/reload/browser behavior.
- **Rationale**: These are the repository's existing layers and match the constitution's test-first and E2E requirements.
- **Alternatives considered**: Browser-only tests are slower and isolate malformed storage less effectively.
