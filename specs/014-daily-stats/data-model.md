# Data Model: Daily Game Stats

## DailyResult

One completed daily game stored under a versioned key for its UTC puzzle number. The initial supported schema version is `1`.

| Field | Type | Rules |
|---|---|---|
| `version` | number | Required supported schema version; version `1` is initially supported. Unsupported versions are preserved and not overwritten. |
| `puzzleNumber` | number | Required non-negative finite integer and storage-key identity. |
| `dateUTC` | string | Required exact `YYYY-MM-DD` UTC value copied from completed `GameState`; must match the puzzle identity. |
| `completed` | boolean | Required `true`; incomplete sessions are not persisted as daily results. |
| `finalScore` | number or null | Finite score in `0..1000`, or `null` when identity is valid but score is unavailable. |

## StatsHistory

The derived collection of valid daily entries discovered under the dedicated per-day key prefix. It is not persisted as one blob.

| Field | Type | Rules |
|---|---|---|
| `records` | `DailyResult[]` | Valid entries are returned newest first; duplicate puzzle identities collapse to one row. |
| `storageStatus` | status | Distinguishes `ready`, `empty`, `unavailable`, `corrupt`, and `unsupported`. |

## Relationships

- `DailyResult.puzzleNumber` matches `GameState.puzzleNumber`.
- `DailyResult.dateUTC` matches `GameState.dateUTC`.
- `DailyResult.finalScore` is copied from the completed state and is not recomputed by the history view.
- `StatsHistory` is independent from `PlayerStats`; aggregate totals remain maintained by the existing flow.

## State Transitions

1. **No record**: The player has not completed the day; stats shows today as incomplete when current-day context is available.
2. **Solved**: The final successful stage creates one `DailyResult` before recap display.
3. **Recompleted**: A later valid completion replaces the same puzzle value; the derived list still has one row.
4. **Repairable**: A valid completed current `GameState` recreates a missing daily entry without changing aggregate counters.
5. **Unavailable**: Storage failure leaves the in-memory game usable and exposes a warning; persistence is not claimed.

## Validation and Recovery

- Parse each stored value as `unknown`; validate identity, supported version, exact date format, completion flag, and score independently.
- Discard entries with invalid identity or unsupported versions while retaining a status that explains why history is incomplete/unavailable.
- Retain an identifiable completed entry with `finalScore: null` when only its score is invalid or missing.
- Sort by `puzzleNumber` descending so the newest UTC puzzle day appears first.
- Do not persist incomplete sessions in history; current incomplete status is derived from active game state.
- Do not overwrite unsupported or unreadable entries with an empty default.
- A missing history key is a first-install empty state, not a migration failure; only the current valid completed game state may repair a missing entry.
