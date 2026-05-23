'use client';

import { useState, useId, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <div
      className="relative inline-block"
      aria-describedby={tooltipId}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <div
        id={tooltipId}
        role="tooltip"
        hidden={!visible}
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 px-3 py-2.5 rounded-xl shadow-2xl z-50 pointer-events-none text-xs leading-relaxed"
        style={{
          background: 'var(--surface-3)',
          border: '1px solid var(--border-hover)',
          color: 'var(--text-secondary)',
        }}
      >
        {content}
      </div>
    </div>
  );
}
