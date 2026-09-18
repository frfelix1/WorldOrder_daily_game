# Data Model: Tooltip Layering and Viewport Fit

This feature has no persisted or domain-data changes. It adds only ephemeral UI placement state.

## Tooltip Overlay

Represents the visible explanation rendered for the current round-title trigger.

| Field | Type | Rules |
|---|---|---|
| `visible` | boolean | Existing state. Hidden by default; true from hover, focus, or activation. |
| `content` | string | Existing stat explanation. Rendered as text and allowed to wrap. |
| `tooltipId` | string | Existing stable-per-instance identifier used by `aria-describedby`. |
| `left` | number | Ephemeral viewport x-coordinate. Clamped to `8px` through `viewportWidth - tooltipWidth - 8px`. |
| `top` | number | Ephemeral viewport y-coordinate. Clamped so the full overlay remains visible; prefers above-trigger placement and falls back below. |
| `width` | number | Measured rendered width, capped at `min(240px, viewportWidth - 16px)`. |
| `placement` | `above` or `below` | Derived from available viewport space around the trigger. |

## Relationships

- One `Tooltip Overlay` belongs to one round-title trigger instance.
- The overlay references no game-state, puzzle, score, or persistence entity.
- The trigger retains the `aria-describedby` relationship regardless of whether the overlay is rendered inline or through a portal.

## State Transitions

| Current state | Event | Next state | Placement action |
|---|---|---|---|
| Hidden | Mouse enters, keyboard focus, or touch/click activation | Visible | Mount overlay, measure, clamp, and position. |
| Visible | Resize or scroll | Visible | Re-measure and reposition within viewport gutters. |
| Visible | Mouse leaves, outside pointer, blur, or Escape | Hidden | Remove overlay and viewport listeners. |
| Visible | Trigger click toggle | Hidden or visible | Preserve existing toggle behavior; if visible, recompute placement. |

## Validation Rules

- The overlay must not be positioned using document coordinates when rendered fixed to the viewport.
- The overlay must never intentionally exceed the horizontal viewport.
- Hidden state must not leave a body-level overlay or viewport listeners behind.
- Placement calculations must not mutate game state or storage.
