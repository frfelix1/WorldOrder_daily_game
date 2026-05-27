// Dataset domain (server / generation)

/** One country's value for a single stat, as stored in data/dataset.json */
export interface DatasetEntry {
  id: string;         // ISO 3166-1 alpha-3, e.g. "JPN"
  name: string;       // Display name, e.g. "Japan"
  flagCode: string;   // ISO 3166-1 alpha-2 lowercase, e.g. "jp"
  value: number;      // Raw stat value
  rank: number;       // Integer rank, 1 = highest/best
  tied: boolean;      // True if two or more countries share this rank
  zeroValue: boolean; // True if value is 0 (special quintile banding treatment)
  available: boolean; // True if this country is eligible for puzzle selection
}

/** One complete stat definition with all country entries */
export interface DatasetStat {
  label: string;
  category: string;
  direction: 'asc' | 'desc';
  unit: string;
  source: string;
  dataYear: number;
  tooltip: string;
  entries: DatasetEntry[];
}

/** The full parsed data/dataset.json — loaded once, used by the generator */
export interface Dataset {
  generatedAt: string;                   // ISO timestamp (informational)
  countryCount: number;                  // Total countries represented
  statCount: number;                     // Total stat definitions
  stats: Record<string, DatasetStat>;    // Keyed by stat_id (e.g. "area", "population")
}

// Puzzle domain (server / API)

export interface Country {
  id: string;       // ISO 3166-1 alpha-3, e.g. "BRA"
  name: string;     // Display name, e.g. "Brazil"
  flagCode: string; // ISO 3166-1 alpha-2 lowercase for flag-icons, e.g. "br"
}

export interface StatDef {
  id: string;           // Unique within puzzle, e.g. "stat_1"
  label: string;        // Short display name, e.g. "Population"
  category: string;     // Category slug
  tooltip: string;      // Plain-language explanation
  direction: 'asc' | 'desc';
  solution: string[];   // Ordered array of Country IDs, position 0 = rank 1
}

export interface PuzzleFile {
  date: string;         // ISO 8601 date string, e.g. "2026-05-22"
  countries: Country[]; // Exactly 5 entries
  stats: StatDef[];     // Exactly 3 entries, in reveal order
}

// Game session domain (client / localStorage)

export interface Guess {
  order: string[];  // Submitted ranking — array of Country IDs, position 0 = rank 1
  bulls: boolean[]; // Position-matched: bulls[i] = true if order[i] is correct
}

export interface StatSession {
  statId: string;  // Matches StatDef.id
  solved: boolean;
  guesses: Guess[]; // All submitted guesses for this stat, in order
}

export interface GameState {
  puzzleNumber: number;              // Integer offset from epoch; used for stale detection
  dateUTC: string;                   // "YYYY-MM-DD" UTC
  status: 'in_progress' | 'complete';
  activeStatIndex: number;           // 0 | 1 | 2
  stats: StatSession[];              // Length 3, one per stat in reveal order
  runningScore: number;              // Live score, updated after each guess (0–150)
  finalScore: number | null;         // Set when status becomes "complete"
  updatedAt: number;                 // Unix ms timestamp of last write
}

export interface PlayerStats {
  played: number;
  completed: number;
  totalScore: number;
  bestScore: number;
  currentStreak: number;
  maxStreak: number;
  lastCompletedPuzzleNumber: number | null;
  scoreDistribution: Record<string, number>;
}

// Result card (derived, not stored)

export type EmojiRow = string; // e.g. "🟩🟥🟩🟥🟩"

export interface ResultCard {
  puzzleNumber: number;
  dateUTC: string;
  finalScore: number;
  grid: EmojiRow[][];  // [stat][guess] → emoji row
  shareText: string;
}
