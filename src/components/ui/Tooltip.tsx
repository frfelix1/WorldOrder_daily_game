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
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '240px',
          padding: '10px 14px',
          borderRadius: '12px',
          zIndex: 50,
          pointerEvents: 'none',
          background: 'rgba(10, 16, 30, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--border-hover)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,197,71,0.05)',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          lineHeight: '1.6',
          animation: visible ? 'fadeIn 0.15s ease-out both' : 'none',
        }}
      >
        {/* Small arrow */}
        <div
          style={{
            position: 'absolute',
            bottom: '-5px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '8px',
            height: '8px',
            background: 'rgba(10, 16, 30, 0.92)',
            border: '1px solid var(--border-hover)',
            borderTop: 'none',
            borderLeft: 'none',
          }}
        />
        {content}
      </div>
    </div>
  );
}
