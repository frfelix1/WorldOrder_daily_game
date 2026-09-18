'use client';

import type { DailyResult, StatsHistory } from '../../types';

interface StatsViewProps {
  history: StatsHistory | null;
  currentDateUTC: string | null;
  currentPuzzleNumber: number | null;
  currentResult?: DailyResult | null;
  persistenceStatus?: 'saved' | 'unsaved' | null;
  onClose?: () => void;
}

function formatUTCDate(dateUTC: string): string {
  return dateUTC;
}

function statusMessage(history: StatsHistory): string | null {
  if (history.storageStatus === 'unavailable') return 'History storage is unavailable. Results may not persist.';
  if (history.storageStatus === 'unsupported') return 'Unsupported history version found. Existing data was not overwritten.';
  if (history.storageStatus === 'corrupt') return 'History contains invalid data. Valid days remain visible.';
  return null;
}

export function StatsView({
  history,
  currentDateUTC,
  currentPuzzleNumber,
  currentResult = null,
  persistenceStatus = null,
  onClose,
}: StatsViewProps) {
  const records = history?.records ?? [];
  const hasCurrentResult = currentResult?.puzzleNumber === currentPuzzleNumber;
  const hasSavedCurrent = records.some((record) => record.puzzleNumber === currentPuzzleNumber);
  const status = history ? statusMessage(history) : null;

  return (
    <section aria-labelledby="daily-stats-heading" className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="daily-stats-heading" className="text-lg font-bold tracking-[0.16em] uppercase">Daily Stats</h2>
        {onClose && <button type="button" onClick={onClose} className="min-h-[var(--touch-min)] rounded-lg px-3 text-sm underline">Back to game</button>}
      </div>

      {!history && <p role="status">Loading history...</p>}
      {status && <p role="status" className="mb-4">{status}</p>}
      {persistenceStatus === 'unsaved' && <p role="status" className="mb-4">Completed, not saved. Results may not persist.</p>}

      {currentDateUTC && !hasCurrentResult && !hasSavedCurrent && (
        <p className="mb-4 rounded-lg border border-[var(--border)] p-3">{currentDateUTC}: Incomplete</p>
      )}

      {history && records.length === 0 && !hasCurrentResult && history.storageStatus !== 'unavailable' && history.storageStatus !== 'unsupported' && (
        <p className="mb-4">No completed games yet.</p>
      )}

      {history && records.length === 0 && history.storageStatus === 'unsupported' && !status && (
        <p className="mb-4">Unsupported history is unavailable.</p>
      )}

      {history && (
        <ul aria-label="Daily results" className="flex flex-col gap-2">
          {records.map((record) => (
            <li key={record.puzzleNumber} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-3">
              <span>{formatUTCDate(record.dateUTC)}</span>
              <span>Completed</span>
              <span>{record.finalScore === null ? 'Score unavailable' : `${record.finalScore} / 1000`}</span>
            </li>
          ))}
          {hasCurrentResult && !records.some((record) => record.puzzleNumber === currentResult?.puzzleNumber) && (
            <li className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-3">
              <span>{currentResult.dateUTC}</span><span>Completed</span><span>{currentResult.finalScore === null ? 'Score unavailable' : `${currentResult.finalScore} / 1000`}</span>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
