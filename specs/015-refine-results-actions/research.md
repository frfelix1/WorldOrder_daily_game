# Research: Refine Results Actions

## Decision: Reuse the existing results and stats flow

- **Decision**: Keep Share Result behavior in `ResultCard`, expose Daily Stats through the existing parent-controlled callback, and change only the results action presentation.
- **Rationale**: The repository already has working share logic, a working `StatsView`, and `showStats` state in the page. Reusing them avoids new state, persistence, routing, or API work.
- **Alternatives considered**: A new action component or a new navigation route was rejected because each would add abstraction without changing the required behavior.

## Decision: Test the component contract before implementation

- **Decision**: Extend the existing `ResultCard` unit test with assertions for both buttons, exact Daily Stats text, independent activation, equal-width grouping, and a small gap.
- **Rationale**: The constitution requires Red-Green-Refactor, and the existing test file already owns the Share Result behavior.
- **Alternatives considered**: Relying only on visual inspection was rejected because it would not protect the existing clipboard behavior or the new Daily Stats activation.

## Decision: Use the existing visual tokens and gradient

- **Decision**: Preserve the existing gold gradient values and interaction treatment while applying them across the two adjacent action targets, with responsive utility layout and the existing touch minimum.
- **Rationale**: This directly matches the requested visual continuity and avoids introducing new colors or styling systems.
- **Alternatives considered**: A new gradient palette or separate visual design was rejected because it conflicts with the requirement that Daily Stats match Share Result.

## Unknowns resolved

- The user clarified that the actions remain side-by-side at all supported widths.
- No data model, external interface, storage change, or operational instrumentation is introduced by this feature.
