# Feature Specification: Refine Results Actions

**Feature Branch**: `015-refine-results-actions`
**Created**: 2026-09-18
**Status**: Draft
**Input**: User description: "I just implemented a \"view daily stats\" button. I want to refine it. I would like to refine the look of the button. I want to cut the share result button in half, and have that button only take up half the space to the left. The other half to the right should make space for daily stats button. The title for the button should be \"Daily Stats\". It should be in the same style and colour scheme of the share result button.

The shader on share result right now is that the button is more dark to the left, and more bright to the right. I want to keep this gradient as it is, just over two buttons now. So the left button should be a bit darker than the right one, in the same gradient that we have now. Gradual like it is now just over two buttons.

Also, there should be a small gap between the buttons, not super big, and I cant give an exact number either. But if the button now is 20 units wide, I would like the resulting buttons to be maybe 8.5 units wide and have a 3 unit space between them? Something like that."

## Clarifications

### Session 2026-09-18

- Q: Should the two results actions remain side-by-side at all supported widths? → A: Keep the buttons side-by-side on all supported widths.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use the split results actions (Priority: P1)

As a player viewing results, I want separate Share Result and Daily Stats actions so that I can choose either outcome without the actions competing for the same space.

**Why this priority**: The two actions are the core user-facing behavior and must remain discoverable and independently usable.

**Independent Test**: Open the results view and activate each action separately; verify that sharing still starts the share flow and Daily Stats opens the daily statistics view.

**Acceptance Scenarios**:

1. **Given** the player is viewing completed game results, **When** the results actions are displayed, **Then** Share Result and Daily Stats appear as two adjacent, separately targetable buttons in one horizontal action group.
2. **Given** the player selects Share Result, **When** the action is activated, **Then** the existing share-result behavior starts without changing the daily statistics action.
3. **Given** the player selects Daily Stats, **When** the action is activated, **Then** the existing daily statistics view opens without changing the share-result action.

---

### User Story 2 - Recognize the actions as one visual group (Priority: P1)

As a player, I want the two actions to share the existing button style while retaining a left-to-right color gradient so that the group feels consistent with the results screen and the visual order is clear.

**Why this priority**: The requested refinement is primarily visual; preserving the established visual language prevents the new action from feeling disconnected.

**Independent Test**: Inspect the results action group at its normal display size and compare both buttons with the existing Share Result styling.

**Acceptance Scenarios**:

1. **Given** the results actions are visible, **When** the player compares them, **Then** both buttons use the same overall visual treatment, typography, color family, and interaction states as the existing Share Result button.
2. **Given** the action group is visible, **When** the player scans it from left to right, **Then** the Share Result button is the darker stop and the Daily Stats button is the brighter stop of one continuous gradual gradient.
3. **Given** the two buttons are displayed, **When** the player views the boundary between them, **Then** a small, deliberate gap separates them without making the group feel disconnected or creating a large empty region.

---

### User Story 3 - Use the actions on narrow screens (Priority: P2)

As a player on a narrow screen, I want both results actions to remain readable and targetable so that the visual refinement does not make either action difficult to use.

**Why this priority**: The action group must preserve the existing results experience across supported screen sizes.

**Independent Test**: View the results screen at the narrowest supported width and verify that both labels remain visible, distinct, and usable without unintended overlap or clipping.

**Acceptance Scenarios**:

1. **Given** the results screen is shown at a supported narrow width, **When** the action group is rendered, **Then** both buttons remain visible with readable labels and a visible separation.
2. **Given** the results screen is shown at any currently supported width, **When** the action group is rendered, **Then** both buttons remain side-by-side without overlapping or hiding either action.

### Edge Cases

- If the results action group is viewed at an intermediate width, both buttons remain distinct and neither button expands so much that the other appears secondary or hidden.
- If a button label receives focus or hover styling, the state remains readable and does not obscure the shared gradient or gap.
- If the Daily Stats destination is unavailable or still loading, the Daily Stats action remains visually consistent and does not alter the Share Result action.
- If sharing is unavailable, the Share Result action communicates its existing unavailable state without changing the Daily Stats action.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The results view MUST present Share Result and Daily Stats as two separate actions in a single grouped control area.
- **FR-002**: The Daily Stats action MUST use the exact visible title "Daily Stats".
- **FR-003**: The existing Share Result behavior MUST remain available through the left action without changing its user-facing outcome.
- **FR-004**: The existing Daily Stats behavior MUST remain available through the right action without changing its user-facing destination.
- **FR-005**: The two actions MUST occupy approximately equal portions of the available action-group width, with a small gap between them rather than a large separation.
- **FR-006**: The action group MUST preserve the existing Share Result visual style and color family for both actions, including readable text and consistent interaction states.
- **FR-007**: The color treatment across the action group MUST transition gradually from darker on the left Share Result action to brighter on the right Daily Stats action, without an abrupt unrelated color change at the button boundary.
- **FR-008**: The action group MUST remain side-by-side and usable at all currently supported screen widths, including readable labels, distinct targets, and no clipping or overlap.
- **FR-009**: The gap between the actions MUST remain visually smaller than the width of either action and MUST not dominate the available action-group space.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In usability checks, 100% of test participants can identify both Share Result and Daily Stats as separate actions from the results view without instruction.
- **SC-002**: In functional checks, 100% of attempted Share Result activations preserve the existing share flow and 100% of attempted Daily Stats activations open the existing daily statistics view.
- **SC-003**: At the default results-screen width, the two action targets each occupy between 40% and 50% of the grouped action area, excluding the inter-button gap.
- **SC-004**: At the default results-screen width, the inter-button gap is visibly small, is less than either button's width, and does not exceed 20% of the grouped action area's total width.
- **SC-005**: At every currently supported screen width, both labels remain fully readable and neither action is clipped, overlapped, or hidden.
- **SC-006**: In visual review, the left-to-right action group is consistently perceived as one gradual gradient, with Share Result darker than Daily Stats and no abrupt color discontinuity.

## Assumptions

- The existing Share Result action and Daily Stats destination already work and only their presentation and grouping are changing.
- The current results screen defines the supported screen widths; the action group remains side-by-side at each supported width and does not introduce a new layout mode or navigation model.
- Approximate equal widths and a small gap are preferred over exact unit values so the group can adapt to available space.
- Existing accessible names, keyboard behavior, focus treatment, and touch target expectations remain in effect for both actions.
- No new sharing, statistics, persistence, or analytics behavior is required by this refinement.
