# Quickstart: Daily Game Stats

## Test-First Sequence

1. Add failing unit tests for per-day keys, empty/ready status, valid round-trip, malformed JSON, invalid identity, invalid-score retention, unsupported versions, duplicate replacement, ordering, read failures, write failures, and unrelated-key preservation.
2. Add failing component tests for deterministic initial render, post-mount loading, completed/incomplete status, unavailable scores, empty/unavailable/unsupported states, unsaved completion, puzzle-fetch failure, and keyboard controls.
3. Extend page tests to prove final solve writes before recap, close/reload without recap restores history, repeated completion does not duplicate history or recount via repair, and an existing completed state repairs missing history.
4. Extend Playwright with real final-solve/reload coverage, malformed/blocked storage, UTC-safe date labels, history during puzzle failure, and two-tab unrelated-day preservation. Keep injected completed-state tests as restore-only coverage.
5. Implement the gateway and UI only after the tests fail.

## Verification Commands

```sh
npm test -- tests/unit/game-state.test.ts tests/unit/StatsView.test.tsx tests/unit/GamePage.test.tsx
npm test
npm run lint
npm run build
npm run test:e2e
```

The persistence checks MUST also run against a production build/server in addition to the existing development-server suite so hydration behavior is exercised.

## Manual Checks

- Solve the final stage, close before opening the recap, and confirm one versioned per-day history record exists.
- Reload and confirm the same UTC date and score remain visible.
- Seed two per-day records and confirm newest-first order, UTC-safe labels, and readable completion/score labels.
- Seed malformed JSON, a missing score, and an unsupported version; confirm identifiable days remain and unavailable data is explained.
- Simulate read and write exceptions; confirm gameplay remains available, current completion remains visible, and persistence is not claimed.
- Verify a completed state without history repairs history without incrementing lifetime aggregate counters.
- Open two tabs and verify saving one day does not erase another day.
- Clear browser storage and confirm the empty state returns.
