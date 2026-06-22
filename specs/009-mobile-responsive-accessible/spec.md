# Feature Specification: Mobile-Friendly & Accessible Responsive Layout

**Feature Branch**: `feature/mobile-responsive`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "I want to make it mobile friendly. It needs to be responsive design that changes based on screen size, and use all current best practises. Make the application fully mobile friendly in an accessible manner."

## Clarifications

### Session 2026-06-22

- Q: How should responsive behaviour be introduced given the codebase styles components with inline style objects? → A: Keep the inline-style approach for stability; introduce responsiveness through fluid sizing and a small set of breakpoint-aware design tokens. Do not migrate to utility classes in this feature.
- Q: What is the goal for larger (tablet/desktop) screens? → A: Keep the single centered column; make it scale down gracefully on phones and stay comfortable on desktop. No new multi-column desktop layout.
- Q: How far should touch drag-and-drop support go? → A: Make finger-dragging work reliably on touch devices without the page scrolling, while keeping the existing tap-to-place interaction as an equal first-class path.
- Q: How should the existing test suite be treated? → A: Preserve all existing test hooks and keep the suite green; update only assertions that legitimately change; add new mobile-viewport coverage.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play Comfortably on a Phone (Priority: P1)

A player opens the daily puzzle on a phone in portrait orientation. The entire game — header, score, stat panel, ranking slots, available-countries pool, and the submit/advance button — fits within the screen width with no horizontal scrolling and no content clipped at the edges. Text is legible without zooming, interactive elements are large enough to tap accurately, and the layout makes full use of the available width.

**Why this priority**: The application is currently a fixed narrow column with hard-coded pixel sizes designed for a desktop window. On small phones the content can overflow, text can be too small to read, and tap targets can be too small to hit reliably. A daily game is a mobile-first habit; if it is unusable on a phone, the core product fails for the majority of likely sessions.

**Independent Test**: Open the game at common phone widths (320px, 360px, 390px, 414px) and confirm there is no horizontal scrollbar, every primary element is visible within the viewport, body text is rendered at an accessible size, and primary controls meet the minimum touch-target size.

**Acceptance Scenarios**:

1. **Given** the game is loaded on a 360px-wide viewport, **When** the player views the playing screen, **Then** no horizontal scrolling is possible and no element extends beyond the viewport edges.
2. **Given** the game is loaded on a 320px-wide viewport (smallest common phone), **When** the player views the ranking slots and the available pool, **Then** all five slots and all available country chips are fully visible and readable.
3. **Given** the game is on a phone viewport, **When** the player taps the submit button, a ranking slot, or an available country chip, **Then** each of those targets occupies at least the minimum recommended touch-target size.
4. **Given** the game is on a phone viewport, **When** body and label text is displayed, **Then** no interface text is smaller than the accessible minimum readable size.
5. **Given** the device has a display notch or rounded corners (safe-area insets), **When** the game is displayed, **Then** no interactive content is obscured by the notch, home indicator, or screen corners.

---

### User Story 2 - Reorder Countries by Touch (Priority: P1)

A player on a touch device arranges the five countries into the ranking slots. They can drag a country with their finger from the pool into a slot, or between slots, and the page does not scroll while they are dragging. Alternatively, they can tap a country to place it into the next open slot and tap a placed country's controls to remove it. Both interaction styles work reliably and feel responsive.

**Why this priority**: Reordering is the single core mechanic of the game. On touch devices, naive drag-and-drop competes with native page scrolling, which makes dragging feel broken. Without a dependable touch interaction, the game cannot be played on phones at all. A tap-to-place path must remain available as an equally reliable alternative for players who find dragging awkward on small screens.

**Independent Test**: On an emulated touch device, drag a country chip from the pool into a ranking slot and confirm it lands in the slot without the page scrolling; separately, tap a chip and confirm it fills the next open slot; confirm keyboard reordering still works on desktop.

**Acceptance Scenarios**:

1. **Given** a touch device, **When** the player presses and drags a country chip onto a ranking slot, **Then** the chip is placed in that slot and the page does not scroll during the drag gesture.
2. **Given** a touch device, **When** the player drags a placed country from one slot onto another slot, **Then** the two positions update correctly without page scrolling.
3. **Given** any device, **When** the player taps an available country chip, **Then** it is placed into the first empty unlocked slot.
4. **Given** any device, **When** the player taps the remove control on a placed (unlocked) country, **Then** it returns to the available pool.
5. **Given** a keyboard-only user on desktop, **When** they operate the ranking controls, **Then** reordering remains fully operable via the keyboard (no regression to existing keyboard support).
6. **Given** a player begins a drag but releases outside any valid slot, **When** the gesture ends, **Then** the country returns to its origin and no unintended scroll or selection occurs.

---

### User Story 3 - Read Results and Feedback Clearly on Mobile (Priority: P2)

After finishing the daily puzzle, the player reviews the results screen on their phone. The large score number, performance badge, per-stat sections, guess-feedback rows, and the correct-values rows are all sized to fit the screen and remain legible. The five-across feedback and correct-value grids do not overflow the screen edges, and the share button is easy to tap.

**Why this priority**: The results screen contains the densest information in the app — a very large score number, plus two five-column grids (guess feedback and correct values) whose cells already use very small text. On a phone these can overflow horizontally or become unreadable. This is the payoff moment of the game and the most likely thing a player shares, so it must look right on mobile, but it is secondary to being able to play the game at all (US1/US2).

**Independent Test**: On phone viewports, open a completed-game results screen and confirm the score number and all per-stat sections fit within the viewport, the five-column feedback and correct-value grids do not overflow, all text meets the accessible minimum size, and the share control meets the minimum touch-target size.

**Acceptance Scenarios**:

1. **Given** the results screen on a 360px viewport, **When** the final score is displayed, **Then** the score number and its "/ 100" suffix fit on screen without overflow or clipping.
2. **Given** the results screen on a phone viewport, **When** a per-stat feedback row (five cells) is displayed, **Then** all five cells fit within the viewport width with no horizontal scrolling.
3. **Given** the results screen on a phone viewport, **When** a correct-values row (five cells) is displayed, **Then** all five cells fit within the viewport width and their text is at least the accessible minimum readable size.
4. **Given** the results screen on a phone viewport, **When** the share button is displayed, **Then** it spans a comfortable width and meets the minimum touch-target size.
5. **Given** the results screen on a desktop viewport, **When** displayed, **Then** the result card remains centered and comfortably sized (no regression from current appearance).

---

### User Story 4 - Respect Accessibility & Motion Preferences (Priority: P2)

A player who relies on assistive technology, keyboard navigation, or who has enabled "reduce motion" can use the game comfortably. Keyboard focus is always visible, every control is reachable and operable by keyboard, screen-reader announcements continue to convey progress, the explanatory stat tooltip can be opened on a touch device (not only on hover), and large or repeating animations are minimized or disabled when the player has requested reduced motion.

**Why this priority**: "Accessible manner" was an explicit requirement. The app already has good accessibility foundations (aria-live regions, keyboard drag support, icon+color feedback), but mobile introduces new gaps: a hover-only tooltip is unreachable by touch, focus styles must remain visible at all sizes, and the heavy ambient/celebration animations should honor the OS reduced-motion setting. These are correctness issues for a meaningful set of users.

**Independent Test**: With "reduce motion" enabled, confirm ambient and celebration animations are suppressed or substantially reduced; navigate the entire game by keyboard and confirm focus is always visible; on a touch device, open the stat explanation tooltip; confirm screen-reader live announcements still fire on stat-solved and game-complete.

**Acceptance Scenarios**:

1. **Given** the OS "reduce motion" preference is enabled, **When** any screen is displayed, **Then** non-essential and repeating animations (ambient background motion, celebration bursts, confetti, shimmer, spinners) are disabled or reduced to a minimal, non-distracting form.
2. **Given** a keyboard-only user, **When** they tab through any screen at any viewport size, **Then** the currently focused control always shows a clearly visible focus indicator.
3. **Given** a touch-device user, **When** they activate the stat label's explanation affordance, **Then** the explanatory tooltip becomes visible (it is not gated behind mouse hover only).
4. **Given** a screen-reader user, **When** a stat is solved or the game is completed, **Then** the corresponding status is announced via the live region (no regression).
5. **Given** the stat tooltip is shown near a screen edge on a narrow viewport, **When** it is displayed, **Then** its content stays within the viewport and is fully readable (not clipped off-screen).

---

### Edge Cases

- **Very small viewports (≤320px)**: All content must remain usable; sizes scale down to a sensible floor rather than overflowing.
- **Large phones / small tablets in landscape**: The single centered column must remain centered and comfortably sized, not stretched edge-to-edge or awkwardly narrow.
- **Long country names**: Names must wrap or truncate gracefully inside slots, chips, and the five-column grids without forcing horizontal overflow.
- **Notched / rounded-corner devices**: Fixed/edge content must respect safe-area insets so nothing important sits under a notch or home indicator.
- **Reduced-motion with celebration moment**: When a stat is solved, the "solved" celebration must still communicate success (e.g., via the persistent solved state and live-region announcement) even when its animation is suppressed.
- **Touch drag released over the pool or empty space**: Must behave predictably (return-to-origin or move-to-pool) without scrolling the page or selecting text.
- **Existing in-progress saved games**: A player mid-game when the update ships must see the responsive layout applied to their restored state with no data loss.
- **Tooltip on touch dismissal**: After opening the tooltip by tap, the player must be able to dismiss it (e.g., by tapping elsewhere) without it becoming stuck open.

## Requirements *(mandatory)*

### Functional Requirements

#### Responsive Layout

- **FR-001**: The playing screen MUST display without horizontal scrolling at all viewport widths from 320px up through desktop.
- **FR-002**: The results screen MUST display without horizontal scrolling at all viewport widths from 320px up through desktop.
- **FR-003**: Interface sizing (text, spacing, and primary element dimensions) MUST adapt fluidly to the viewport so the layout is comfortable on small phones and on desktop, retaining a single centered column.
- **FR-004**: On large screens the primary content column MUST remain horizontally centered and constrained to a comfortable maximum width (no full-bleed stretching).
- **FR-005**: Fixed or screen-edge content MUST respect device safe-area insets so it is not obscured by notches, rounded corners, or home indicators.
- **FR-006**: Decorative full-screen effects (ambient background blobs, celebration rings, confetti) MUST be sized relative to the viewport so they never introduce overflow or a horizontal scrollbar on small screens.

#### Touch Targets & Legibility

- **FR-007**: All primary interactive controls (submit/advance button, share button, ranking slots, available country chips, the placed-country remove control, and the tooltip affordance) MUST present a touch target of at least 44×44 CSS pixels on touch viewports.
- **FR-008**: No interface text essential to gameplay or results MUST render below an accessible minimum size on mobile (the existing 8–11px values in the feedback and correct-value grids MUST be increased to meet this minimum).
- **FR-009**: Long country names MUST wrap or truncate gracefully within slots, chips, and the five-column grids without causing horizontal overflow.

#### Touch Drag-and-Drop

- **FR-010**: On touch devices, dragging a country (from the pool into a slot, or between slots) MUST place the country correctly without scrolling the page during the drag gesture.
- **FR-011**: The tap-to-place interaction (tap a chip to fill the next open slot; tap the remove control to return a placed country to the pool) MUST remain fully functional on all devices as an equal alternative to dragging.
- **FR-012**: Keyboard-based reordering MUST remain fully operable and MUST NOT be regressed by any touch-interaction changes.
- **FR-013**: A drag gesture that ends outside a valid drop target MUST resolve predictably (return-to-origin or move-to-pool) without scrolling the page or leaving the UI in an inconsistent state.

#### Accessibility & Motion

- **FR-014**: When the user's "reduce motion" preference is enabled, non-essential and repeating animations MUST be disabled or reduced to a minimal, non-distracting form; essential state changes MUST still be communicated by non-motion means.
- **FR-015**: A clearly visible keyboard focus indicator MUST be present on all interactive controls at every viewport size.
- **FR-016**: The stat explanation tooltip MUST be openable on touch devices (not gated behind mouse hover only) and MUST be dismissible after being opened.
- **FR-017**: The stat tooltip MUST remain fully within the viewport (no off-screen clipping) at narrow widths.
- **FR-018**: Screen-reader live-region announcements for stat-solved and game-complete events MUST continue to fire (no regression).
- **FR-019**: Per-position correct/incorrect feedback MUST continue to be conveyed by icon/shape in addition to color (no regression to the existing accessibility baseline).
- **FR-020**: The document MUST declare an appropriate theme color and color scheme so the browser chrome and form controls match the dark interface on mobile.

#### Compatibility & Non-Regression

- **FR-021**: All existing automated test hooks (element identifiers used by the test suite) MUST be preserved so the existing suite continues to locate elements.
- **FR-022**: The visual appearance and behaviour on desktop MUST NOT regress from the current experience beyond the intended fluid-sizing adjustments.
- **FR-023**: A player with an in-progress saved game MUST have their restored state rendered in the responsive layout with no loss of progress.

### Key Entities

- **Responsive Design Token**: A named sizing value (for spacing, font size, or element dimension) that adapts to the viewport, consumed across components so responsiveness is centrally controlled and consistent.
- **Touch Target**: Any interactive control whose hit area must meet the minimum recommended size on touch devices.
- **Breakpoint**: A viewport-width threshold at which sizing or layout behaviour adjusts (e.g., phone vs. tablet vs. desktop).
- **Motion Preference**: The user's OS-level "reduce motion" setting that governs whether non-essential animations play.
- **Safe-Area Inset**: Device-reported padding regions (notch, home indicator, rounded corners) that edge content must avoid.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At viewport widths of 320px, 360px, 390px, and 414px, the playing screen and the results screen each present with zero horizontal scrolling.
- **SC-002**: Every primary interactive control measures at least 44×44 CSS pixels on a representative phone viewport.
- **SC-003**: No gameplay- or results-essential text renders below the accessible minimum size on phone viewports.
- **SC-004**: A full game can be completed end-to-end on an emulated phone using only touch interactions (drag and/or tap), reaching the results screen with a valid score.
- **SC-005**: On a touch device, dragging a country into a slot succeeds without the page scrolling during the gesture.
- **SC-006**: With "reduce motion" enabled, no continuously repeating or large-sweep animation plays on any screen.
- **SC-007**: Every interactive control shows a visible focus indicator when reached by keyboard, at both phone and desktop widths.
- **SC-008**: The stat explanation tooltip can be opened and dismissed on a touch device and never renders off-screen at 320–414px widths.
- **SC-009**: The existing automated test suite passes (unit, integration, and e2e), and global coverage remains at or above the project's required threshold.
- **SC-010**: The desktop experience shows no visual or behavioural regression beyond intended fluid-sizing changes.

## Assumptions

- The single centered-column layout is the intended design for all screen sizes; this feature makes it responsive rather than introducing a distinct multi-column desktop layout.
- The existing inline-style architecture is retained for stability; responsiveness is delivered via fluid sizing and centrally-defined responsive tokens, not a migration to utility classes.
- The existing tap-to-place interaction and keyboard drag support are correct and remain the baseline; this feature hardens touch dragging and legibility around them.
- The unused legacy ranking components (the alternate sortable list and its card) are out of scope and are not modified.
- The development-only puzzle-switch panel is not part of the production mobile experience and is out of scope for responsive polish.
- The minimum supported viewport width for "fully usable" is 320px; below that, graceful degradation (not pixel-perfect layout) is acceptable.
- "Accessible minimum readable size" and "44×44 touch target" follow widely-accepted mobile accessibility guidance (WCAG 2.1 AA target size and legibility expectations).
- No changes to puzzle data, scoring, the API contract, or the localStorage schema are required; this is a presentation-and-interaction feature only.
