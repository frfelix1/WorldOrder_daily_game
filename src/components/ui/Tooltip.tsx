'use client';

import { useState, useId, useEffect, useRef, useCallback, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [leftOffset, setLeftOffset] = useState('-50%');
  // Set true during pointer-down so we can suppress onFocus show
  const pointerDownRef = useRef(false);

  const hide = useCallback(() => setVisible(false), []);

  // Clamp tooltip position within viewport after it becomes visible
  useEffect(() => {
    if (!visible || !tooltipRef.current || !containerRef.current) return;
    const containerEl = containerRef.current;
    const tooltipEl = tooltipRef.current;
    const containerRect = containerEl.getBoundingClientRect();
    const tooltipWidth = tooltipEl.offsetWidth;
    const gutter = 12;
    const vw = window.innerWidth;
    let left = -(tooltipWidth / 2);
    const absLeft = containerRect.left + containerRect.width / 2 + left;
    if (absLeft < gutter) left += gutter - absLeft;
    const absRight = containerRect.left + containerRect.width / 2 + left + tooltipWidth;
    if (absRight > vw - gutter) left -= absRight - (vw - gutter);
    setLeftOffset(`${left}px`);
  }, [visible]);

  // Dismiss on outside pointer
  useEffect(() => {
    if (!visible) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        hide();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [visible, hide]);

  // Dismiss on Escape
  useEffect(() => {
    if (!visible) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') hide();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [visible, hide]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      aria-describedby={tooltipId}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {/* Trigger — accessible interactive control with >=44px tappable area */}
      <button
        data-testid="tooltip-trigger"
        type="button"
        aria-label="Show stat explanation"
        onPointerDown={() => {
          // Flag that focus is about to be caused by a pointer event (not keyboard)
          pointerDownRef.current = true;
          queueMicrotask(() => { pointerDownRef.current = false; });
        }}
        onFocus={() => {
          // Only show for keyboard focus (not pointer-induced)
          if (!pointerDownRef.current) setVisible(true);
        }}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setVisible(false);
          }
        }}
        onClick={() => {
          // Toggle on pointer tap/click (independent of hover/focus path)
          setVisible((v) => !v);
        }}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'inherit',
          display: 'inline',
          font: 'inherit',
          color: 'inherit',
          textDecoration: 'inherit',
          minHeight: 'var(--touch-min)',
          minWidth: 'var(--touch-min)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </button>
      <div
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        hidden={!visible}
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          left: '50%',
          transform: `translateX(${leftOffset})`,
          width: 'min(240px, calc(100vw - 24px))',
          maxWidth: 'calc(100vw - 24px)',
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
