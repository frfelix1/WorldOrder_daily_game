# Quickstart: Tooltip Layering and Viewport Fit

## Implement

1. Add placement/portal assertions to `tests/unit/Tooltip.test.tsx` first and confirm they fail against the current inline tooltip.
2. Update `src/components/ui/Tooltip.tsx` to portal the visible overlay to `document.body`, use fixed viewport coordinates, and clamp measured bounds.
3. Keep `src/components/game/StatPanel.tsx` unchanged unless a narrowly scoped active-layer hook is required by browser evidence. Do not redesign the panel or responsive layout.
4. Add a focused Playwright block to `tests/e2e/game-flow.spec.ts` for desktop and 320px mobile tooltip bounds, stacking, and overflow.

## Verify

```bash
npm test -- tests/unit/Tooltip.test.tsx
npm test
npm run lint
npm run build
npm run test:e2e -- tests/e2e/game-flow.spec.ts
```

## Manual Smoke Check

- Open the playing screen at desktop width and hover the stat title. Confirm the explanation covers nearby content instead of appearing behind it.
- Set the viewport to 320px wide and tap the stat title. Confirm the complete wrapped explanation is visible with no horizontal page overflow.
- Focus the title with the keyboard, press Escape, and click outside. Confirm visibility and dismissal remain accessible.
- Resize or scroll while the explanation is open. Confirm it remains aligned to the trigger and inside the viewport.
