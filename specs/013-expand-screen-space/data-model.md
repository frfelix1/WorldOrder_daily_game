# Data Model: Expand Screen Space Usage

This feature has no persisted or domain-data changes. It changes only derived presentation values for the primary game view.

## Responsive Layout State

| Value | Type | Rules |
|---|---|---|
| `contentWidth` | CSS length | Bounded by viewport-safe padding and a desktop maximum. |
| `contentHeightUsage` | CSS layout result | Must reach the specified desktop occupancy without hiding primary content. |
| `verticalSpacing` | CSS length | Expands on sufficiently tall desktop viewports and falls back on short viewports. |
| `contentScale` | CSS length | Enlarges meaningful game content within readable and accessible bounds. |
| `responsiveMode` | Media-query state | Existing narrow/short fallback remains unchanged; expanded mode applies only to sufficiently large desktop space. |

## Relationships

- One responsive layout state applies to the primary game view.
- Layout state references no puzzle, score, player-progress, API, or persistence entity.
- Existing game components consume the layout through their current parent sizing and CSS tokens.

## Validation Rules

- At 1440x900 and 1920x1080, the primary view reaches the specified width and height usage targets.
- At default desktop zoom, primary content does not require vertical scrolling or horizontal panning.
- At 150% zoom, document width does not exceed viewport width.
- At short desktop and narrow mobile sizes, the existing responsive fallback keeps primary content accessible.
