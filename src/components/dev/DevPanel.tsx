'use client';

import { useEffect, useState } from 'react';

interface DevPanelProps {
  currentDate: string;
  todayDate: string;
  onDateChange: (date: string) => void;
}

export function DevPanel({ currentDate, todayDate, onDateChange }: DevPanelProps) {
  const [open, setOpen] = useState(false);
  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/puzzles')
      .then((r) => r.json())
      .then((data: { dates: string[] }) => setDates(data.dates))
      .catch(() => {});
  }, []);

  const isOverriding = currentDate !== todayDate;

  function handleRandomize(): void {
    if (dates.length === 0) return;
    const picked = dates[Math.floor(Math.random() * dates.length)];
    onDateChange(picked);
    setOpen(false);
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.5rem',
        fontFamily: 'monospace',
      }}
    >
      {/* Panel */}
      {open && (
        <div
          data-testid="dev-panel"
          style={{
            background: 'rgba(10,10,14,0.97)',
            border: '1px solid rgba(232,197,71,0.25)',
            borderRadius: '0.75rem',
            padding: '0.75rem',
            minWidth: '11rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.15em',
              color: 'rgba(232,197,71,0.5)',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              paddingBottom: '0.4rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            Seed Override
          </div>

          {/* Randomize button */}
          <button
            data-testid="dev-randomize"
            onClick={handleRandomize}
            disabled={dates.length === 0}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(232,197,71,0.3)',
              background: dates.length === 0
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(232,197,71,0.1)',
              color: dates.length === 0
                ? 'rgba(255,255,255,0.25)'
                : 'rgb(232,197,71)',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
              cursor: dates.length === 0 ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
              outline: 'none',
            }}
          >
            {dates.length === 0 ? 'No puzzles available' : '⚡ Randomize'}
          </button>

          {/* Reset to today */}
          {isOverriding && (
            <button
              data-testid="dev-reset"
              onClick={() => {
                onDateChange(todayDate);
                setOpen(false);
              }}
              style={{
                marginTop: '0.5rem',
                paddingTop: '0.4rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'rgba(0,196,232,0.7)',
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '0.35rem 0',
              }}
            >
              Reset to today
            </button>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        data-testid="dev-toggle"
        onClick={() => setOpen((v) => !v)}
        title="Dev: switch puzzle date"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.3rem 0.6rem',
          borderRadius: '999px',
          border: `1px solid ${isOverriding ? 'rgba(232,197,71,0.5)' : 'rgba(255,255,255,0.12)'}`,
          background: isOverriding
            ? 'rgba(232,197,71,0.1)'
            : 'rgba(10,10,14,0.85)',
          color: isOverriding ? 'rgb(232,197,71)' : 'rgba(255,255,255,0.35)',
          fontSize: '0.65rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s',
          outline: 'none',
        }}
      >
        <span style={{ fontSize: '0.7rem' }}>⚙</span>
        <span>DEV</span>
        {isOverriding && (
          <span
            style={{
              background: 'rgba(232,197,71,0.2)',
              borderRadius: '999px',
              padding: '0.05rem 0.35rem',
              fontSize: '0.6rem',
            }}
          >
            {currentDate.slice(5)}
          </span>
        )}
      </button>
    </div>
  );
}
