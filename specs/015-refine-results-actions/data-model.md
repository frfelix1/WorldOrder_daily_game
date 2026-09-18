# Data Model: Refine Results Actions

This feature introduces no entities, fields, persistence changes, or state transitions.

Existing state reused by the action group:

- `showStats`: existing page UI state that switches from the game/results view to `StatsView`.
- `shareState`: existing `ResultCard` UI state for idle, copied, and error feedback.

The implementation must not change the shape or lifecycle of game state, daily results, or stats history.
