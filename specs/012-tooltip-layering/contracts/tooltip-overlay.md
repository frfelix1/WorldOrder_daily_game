# Tooltip Overlay Contract

## Purpose

Define the observable UI and accessibility contract for the round-title explanation.

## Trigger

- Remains a keyboard-focusable button inside the existing tooltip trigger wrapper.
- Retains `data-testid="tooltip-trigger"`.
- Retains `aria-describedby` pointing to the tooltip id.
- Hover, keyboard focus, and touch/click activation continue to reveal the explanation.

## Visible Overlay

- Retains `role="tooltip"` and the existing tooltip id.
- Is rendered at body level while visible so ancestor clipping cannot hide it.
- Uses viewport-relative positioning and remains at least 8px from each horizontal viewport edge.
- Has a maximum content width of 240px, reduced on narrow viewports so text wraps within the viewport.
- Appears above the trigger when there is room; otherwise appears below while remaining within the viewport.
- Has a stacking level above the game panel and neighbouring content.
- Does not intercept pointer events; outside pointer dismissal remains handled by the existing document listener.

## Dismissal

- Mouse leave, blur, outside pointer/touch, Escape, and click-toggle behavior remain unchanged.
- Unmounting or hiding removes resize/scroll listeners and leaves no visible portal content.

## Regression Observables

- Desktop hover: visible, above the stat panel, fully inside viewport.
- 320px mobile activation: visible, wrapped, fully inside viewport, and no document horizontal overflow.
- Existing focus, click, outside dismissal, Escape, ARIA, and hidden-state tests continue to pass.
