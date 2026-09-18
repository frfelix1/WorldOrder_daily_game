# UI Contract: Stats View

## Purpose

Give the player a single glanceable view of daily completion status and score without replaying a day.

## Inputs

- Valid saved `DailyResult` records and storage status from the gateway.
- The active puzzle's UTC identity for today's derived incomplete state.
- The current in-memory completed result immediately after a final solve.
- A non-blocking storage warning when browser storage cannot be read or written.

## Required Content

- A clear heading identifying the view as daily stats/history.
- A row or list item for each valid saved completed day.
- Each row includes a UTC-safe date label, a text completion status, and the score.
- Today is completed from the current in-memory result immediately after solving, completed from storage after reload, or incomplete only when neither exists.
- Saved days are ordered newest first.
- An empty state is shown only when no valid saved/current result exists and storage is ready or genuinely empty.
- Unavailable, corrupt, and unsupported states are explained separately from genuinely empty history.
- A valid day with no valid score displays `Score unavailable` while retaining completed status.
- A completion whose write failed displays `Completed, not saved` while the in-memory result is present.
- Stats remain viewable when puzzle loading fails.

## Interaction and Accessibility

- Stats entry and return-to-game controls are native keyboard-operable controls.
- Completion status is communicated with text or an accessible label, not color alone.
- The list uses semantic heading/list structure and preserves readable contrast and existing touch-target minimums.
- Storage warnings are announced through the existing live-region pattern without blocking gameplay.
- Initial server/client markup is deterministic; browser storage is loaded after mount or stats interaction.

## Non-Goals

- No account, cross-device sync, export, charting, filtering, or server endpoint.
- No editing or deleting individual history records.
- No redesign of legacy lifetime aggregate counters.
