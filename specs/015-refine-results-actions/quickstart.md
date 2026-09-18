# Quickstart: Refine Results Actions

## Automated checks

Run the focused component tests while implementing:

```bash
npx vitest run tests/unit/ResultCard.test.tsx
```

Run the full required checks before handoff:

```bash
npm test
npm run build
```

## Manual verification

1. Open a completed-game results screen.
2. Confirm the action group shows `Share Result` on the left and `Daily Stats` on the right.
3. Confirm both buttons have approximately equal widths and a small visible gap.
4. Confirm the left button is darker and the right button is brighter within one gradual gold gradient.
5. Activate Share Result and confirm the existing copied/error feedback still appears.
6. Return to the results screen, activate Daily Stats, and confirm the existing stats view opens.
7. Repeat at the narrowest supported width and confirm both buttons remain side-by-side, readable, and fully targetable.
