# Feature Specification: Tooltip Layering and Viewport Fit

**Feature Branch**: `012-tooltip-layering`

**Created**: 2026-09-18

**Status**: Draft

**Input**: User description: "Fix the UI layering bug where the title hover text appears behind the background. The element should remain visibly above the other element at desktop and mobile view. The hover text needs to fit on the screen, there should not be any scrolling or panning to see the entire text. It can cover other elements since it only appears on hovering the title of the round. Preserve existing responsive behavior and add or update regression coverage where appropriate."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read the Round Explanation Above the Game (Priority: P1)

As a player, I want to hover, focus, or activate the round title and read its explanation without it disappearing behind the game background or nearby content.

**Why this priority**: The explanation is unavailable or difficult to read when its visual layer is obscured, directly reducing the clarity of the round.

**Independent Test**: Open an active round on desktop and mobile-sized viewports, reveal the explanation, and verify that the complete visible overlay is above surrounding content and readable.

**Acceptance Scenarios**:

1. **Given** an active round on a desktop viewport, **When** the player hovers the round title, **Then** the explanation appears visibly above the background and neighbouring interface elements.
2. **Given** an active round on a narrow mobile viewport, **When** the player activates the round title, **Then** the explanation remains visible above neighbouring elements and is not clipped by the round panel.
3. **Given** the explanation is visible, **When** it overlaps another interface element, **Then** the explanation remains readable and is allowed to cover that element.

### User Story 2 - Read the Full Explanation Without Moving the Page (Priority: P1)

As a player on any supported viewport, I want the round explanation to fit within the visible screen so I do not need to scroll or pan to read it.

**Why this priority**: A tooltip that requires page movement is difficult to use and can disrupt the game.

**Independent Test**: Reveal the explanation near the left, center, and right portions of the layout at desktop and mobile widths, then verify that its visible bounds stay within the viewport and the page has no new horizontal overflow.

**Acceptance Scenarios**:

1. **Given** the round title is near either horizontal edge, **When** its explanation is revealed, **Then** the complete explanation remains within the screen with a small readable margin.
2. **Given** the explanation is visible on a supported mobile width, **When** the player reads it, **Then** no horizontal or vertical scrolling or panning is required to see the full text.
3. **Given** the existing responsive layout at desktop and mobile widths, **When** the explanation is hidden, **Then** the layout retains its current dimensions and responsive behaviour.

### User Story 3 - Keep Existing Access Paths Working (Priority: P2)

As a keyboard or touch user, I want the round explanation to remain available through the existing focus and activation interactions.

**Why this priority**: Fixing visual layering must not make the explanation inaccessible to users who do not use a mouse.

**Independent Test**: Open and dismiss the explanation with keyboard focus and touch-style activation at desktop and mobile viewport sizes.

**Acceptance Scenarios**:

1. **Given** the round-title control receives keyboard focus, **When** it is focused, **Then** the explanation is visible above surrounding content and remains within the viewport.
2. **Given** the round-title control is activated on a touch-capable viewport, **When** the player opens the explanation, **Then** it is visible and can be dismissed using the existing dismissal behaviour.

## Edge Cases

- The title is close to the left or right viewport edge.
- The title is near the top of the viewport and the explanation has limited space above it.
- The explanation text is long enough to wrap on a 320px-wide viewport.
- The explanation overlaps the score, progress indicator, board, or other game content.
- The user has reduced-motion enabled; visibility and readability must not depend on animation.
- The explanation is hidden; no additional page overflow may remain.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The round-title explanation MUST render visibly above the background and neighbouring game content whenever it is shown.
- **FR-002**: The explanation MUST be allowed to cover neighbouring game elements while it is shown.
- **FR-003**: The explanation MUST remain fully within the horizontal viewport at supported desktop and mobile widths.
- **FR-004**: The explanation text MUST wrap or size itself so the complete text is readable without horizontal scrolling or panning.
- **FR-005**: Showing the explanation MUST NOT introduce horizontal page overflow or require vertical scrolling or panning to read the complete text.
- **FR-006**: The explanation MUST remain available through mouse hover, keyboard focus, and the existing touch activation path.
- **FR-007**: Hiding the explanation MUST preserve the existing responsive layout and must not leave visible empty space or overflow.
- **FR-008**: The explanation MUST remain readable when displayed near any supported viewport edge, including the narrowest supported mobile width of 320px.
- **FR-009**: Existing accessibility semantics and dismissal behaviour for the round-title explanation MUST continue to work.
- **FR-010**: Regression coverage MUST verify layering and viewport fit at both desktop and mobile viewport sizes.

### Scope

In scope: the round-title explanation's visual stacking, viewport positioning, text fitting, and regression coverage.

Out of scope: redesigning the round panel, changing explanation content, changing the broader responsive layout, or changing game rules and persistence.

## Key Entities

- **Round-title explanation**: A temporary text overlay associated with the current round title and shown through hover, focus, or activation.
- **Supported viewport**: A desktop viewport or a mobile viewport at or above 320px wide using the existing responsive layout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In automated checks at desktop width and at 320px mobile width, 100% of the visible explanation's bounds remain within the viewport with at least 8px horizontal clearance.
- **SC-002**: In automated checks at desktop width and at 320px mobile width, the explanation has a higher visual stacking order than the round panel and neighbouring game content while visible.
- **SC-003**: At 320px, 360px, 390px, and 414px viewport widths, revealing the explanation does not make document width exceed viewport width.
- **SC-004**: Players can read the complete explanation without scrolling or panning in all supported viewport checks.
- **SC-005**: Existing tooltip unit coverage and the full relevant game-flow regression suite pass without changes to hover, focus, activation, or dismissal behaviour.
- **SC-006**: When the explanation is hidden, the playing screen retains its current responsive layout at desktop and mobile widths.

## Assumptions

- The phrase “title hover text” refers to the existing explanatory text associated with the current round's stat title.
- The minimum supported mobile width remains 320px, consistent with the existing responsive behaviour.
- A small viewport margin is preferable to edge-to-edge text and is set to 8px unless existing design constraints require a larger margin.
- Existing hover, focus, touch activation, and dismissal interactions are functionally correct; this feature fixes their visual presentation rather than replacing them.
- Automated regression coverage may inspect rendered geometry and visual stacking properties rather than relying on screenshots alone.
