# Data Model: Rankle — Daily Geography Ranking Game

**Date**: 2026-05-22 | **Branch**: `001-rankle-daily-game`

## Overview

There are two runtime data domains:
1. **Puzzle data** — static, server-authoritative, delivered via API; contains the question and the answer key
2. **Game session state** — dynamic, client-authoritative, persisted in `localStorage`

---

## Puzzle Domain (Server / API)

### `PuzzleFile` (server-side JSON, `data/puzzles/YYYY-MM-DD.json`)

The canonical source of truth for a daily puzzle. Read by the API route and returned as `PuzzleResponse`.

```typescript
interface PuzzleFile {
  date: string;          // ISO 8601 date string, e.g. "2026-05-22"
  countries: Country[];  // Exactly 5 entries
  stats: StatDef[];      // Exactly 3 entries, in reveal order
}
```

### `Country`

```typescript
interface Country {
  id: string;       // ISO 3166-1 alpha-3, e.g. "BRA"
  name: string;     // Display name, e.g. "Brazil"
  flagCode: string; // ISO 3166-1 alpha-2 lowercase for flag-icons, e.g. "br"
}
```

**Validation rules**:
- `id` must be unique within a `PuzzleFile`
- `flagCode` must map to a flag asset in `public/flags/`
- Exactly 5 `Country` entries per puzzle

### `StatDef`

```typescript
interface StatDef {
  id: string;        // Unique within puzzle, e.g. "stat_1"
  label: string;     // Short display name, e.g. "Population"
  category: string;  // Category slug, e.g. "demographics" | "geography" | "economy"
  tooltip: string;   // Plain-language explanation of the metric
  direction: "asc" | "desc";
                     // "desc" = rank 1 is highest value; "asc" = rank 1 is lowest value
  solution: string[];// Ordered array of Country IDs, position 0 = rank 1
                     // Length must equal countries.length (5)
}
```

**Validation rules**:
- `solution` must contain exactly the same set of country IDs as `PuzzleFile.countries[*].id`
- All values for a given stat across the 5 countries must be distinct (no ties)
- No two stats in a puzzle may share the same `category` if there are already two stats with that category (at most 2 of 3 stats from the same category)
- Stats are ordered in the array as they are revealed in-game (index 0 first, index 2 last)

### State Transitions — Stat Reveal

```
Stat 0: LOCKED → ACTIVE (on game load)
Stat 1: LOCKED → ACTIVE (when stat 0 is SOLVED)
Stat 2: LOCKED → ACTIVE (when stat 1 is SOLVED)
ACTIVE → SOLVED (when player submits a guess with all 5 bulls)
```

---

## Game Session Domain (Client / localStorage)

### `GameState` (key: `rankle_state`)

The full persisted session for the current (or most recently played) puzzle.

```typescript
interface GameState {
  puzzleNumber: number;      // Integer offset from epoch; used for stale detection
  dateUTC: string;           // "YYYY-MM-DD" UTC, stored for human readability
  status: "in_progress" | "complete";
  activeStatIndex: number;   // 0 | 1 | 2 — which stat is currently active
  stats: StatSession[];      // Length 3, one per stat in reveal order
  runningScore: number;      // Live score, updated after each guess (0–150)
  finalScore: number | null; // Set when status becomes "complete" (0–150)
  updatedAt: number;         // Unix ms timestamp of last write
}
```

### `StatSession`

```typescript
interface StatSession {
  statId: string;    // Matches StatDef.id
  solved: boolean;
  guesses: Guess[];  // All submitted guesses for this stat, in order
}
```

### `Guess`

```typescript
interface Guess {
  order: string[];   // Submitted ranking — array of Country IDs, position 0 = rank 1
  bulls: boolean[];  // Position-matched: bulls[i] = true if order[i] is correct for position i
}
```

**Derived field** (computed at read time, not stored):
- `bullCount = bulls.filter(Boolean).length` — 5 bulls means the stat is solved

### `PlayerStats` (key: `rankle_stats`, never wiped)

Lifetime statistics accumulated across all completed puzzles.

```typescript
interface PlayerStats {
  played: number;
  completed: number;          // Puzzles where status reached "complete"
  totalScore: number;         // Sum of all finalScores
  bestScore: number;
  currentStreak: number;      // Consecutive days completed
  maxStreak: number;
  lastCompletedPuzzleNumber: number | null;
  scoreDistribution: Record<string, number>;
                              // e.g. { "150": 2, "100-149": 5, ... } — bucketed
}
```

---

## Scoring Engine

The scoring state is a pure function of all guesses up to the current point. It is recomputed on each guess and stored as `runningScore` in `GameState`.

```typescript
// Per-stat scoring: 5 positions × max 10 pts each = max 50 pts per stat
// n = number of guesses where a position was wrong (across all guesses for this stat)
function scoreForStat(guesses: Guess[], solution: string[]): number {
  let score = 0;

  for (let pos = 0; pos < solution.length; pos++) {
    const n = guesses.filter(g => !g.bulls[pos]).length;
    score += Math.max(10 - 2 * n, 0);
  }

  return score;
}

// Total score across all resolved stats (max 150 = 3 stats × 50)
function totalScore(statSessions: StatSession[], solutions: string[][]): number {
  return statSessions.reduce((sum, s, i) => sum + scoreForStat(s.guesses, solutions[i]), 0);
}
```

---

## Result Card

Derived at game completion; not stored (recomputed from `GameState` on demand).

```typescript
interface ResultCard {
  puzzleNumber: number;
  dateUTC: string;
  finalScore: number;         // 0–150
  grid: EmojiRow[][];         // [stat][guess] → emoji row
  shareText: string;          // Pre-formatted plain text for clipboard
}

type EmojiRow = string;       // e.g. "🟩🟥🟩🟥🟩" — one emoji per country position
```

**Emoji encoding**:
- `🟩` — bull (correct position)
- `🟥` — miss (incorrect position)

**Share text format**:
```
Rankle #42 — 130 pts

Stat 1: 🟩🟥🟩🟥🟩 / 🟩🟩🟩🟩🟩
Stat 2: 🟩🟩🟩🟩🟩
Stat 3: 🟥🟥🟩🟥🟩 / 🟥🟩🟩🟥🟩 / 🟩🟩🟩🟩🟩
```

---

## Entity Relationships

```
PuzzleFile
  └── countries: Country[]  (1 puzzle → exactly 5 countries)
  └── stats: StatDef[]      (1 puzzle → exactly 3 stats)
       └── solution: CountryId[]  (references Country.id)

GameState
  └── stats: StatSession[]  (1 state → 3 stat sessions, parallel to PuzzleFile.stats)
       └── guesses: Guess[] (0..∞ guesses per stat until solved)

PlayerStats   (separate key, updated when GameState.status → "complete")
```
