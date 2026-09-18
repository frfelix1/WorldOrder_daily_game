# Quickstart: Expand Screen Space Usage

## Implement

1. Add Playwright assertions for desktop viewport occupancy and primary control visibility before changing layout tokens; confirm the new occupancy assertions fail against the current compact layout.
2. Update the existing responsive values in `src/app/globals.css` for bounded desktop width, board/content sizing, and vertical spacing.
3. Preserve base mobile values and add or retain a short-height fallback so constrained viewports do not gain overflow.
4. Do not change game logic, persistence, API routes, component interaction semantics, or game content.

## Verify

```bash
npm test
npm run lint
npm run build
npm run test:e2e -- tests/e2e/game-flow.spec.ts
```

## Manual Smoke Check

- Open the playing screen at 1440x900 and 1920x1080 and confirm the board and surrounding content use substantially more of the screen.
- Confirm all primary controls are visible without scrolling or panning.
- Set browser zoom to 150% and confirm no horizontal page overflow.
- Resize to a short desktop viewport and confirm the existing fallback remains usable.
- Open at 320px wide and confirm the current mobile arrangement and no-horizontal-scroll behavior remain intact.
