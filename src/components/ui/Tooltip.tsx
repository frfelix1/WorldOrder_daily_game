'use client';

import { useState, useId, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ left: 8, top: 8, placement: 'above' as 'above' | 'below' });
  // Set true during pointer-down so we can suppress onFocus show
  const pointerDownRef = useRef(false);

  // Portal only after hydration so server and client markup match.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  const updatePosition = useCallback(() => {
    if (!tooltipRef.current || !containerRef.current) return;

    const triggerRect = containerRef.current.getBoundingClientRect();
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const gutter = 8;
    const gap = 10;
    const maxLeft = Math.max(gutter, window.innerWidth - tooltipWidth - gutter);
    const left = Math.min(
      maxLeft,
      Math.max(gutter, triggerRect.left + (triggerRect.width - tooltipWidth) / 2),
    );
    const aboveTop = triggerRect.top - tooltipHeight - gap;
    const belowTop = triggerRect.bottom + gap;
    const fitsAbove = aboveTop >= gutter;
    const fitsBelow = belowTop + tooltipHeight <= window.innerHeight - gutter;
    const placement = fitsAbove || !fitsBelow ? 'above' : 'below';
    const unclampedTop = placement === 'above' ? aboveTop : belowTop;
    const top = Math.min(
      Math.max(gutter, unclampedTop),
      Math.max(gutter, window.innerHeight - tooltipHeight - gutter),
    );

    setPosition({ left, top, placement });
  }, []);

  // Keep the body-level overlay aligned while it is visible.
  useEffect(() => {
    if (!visible) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [visible, updatePosition]);

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

  return <>
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
    </div>
    {mounted && createPortal(
      <div
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        hidden={!visible}
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: 'min(240px, calc(100vw - 16px))',
          maxWidth: 'calc(100vw - 16px)',
          padding: '10px 14px',
          borderRadius: '12px',
          zIndex: 1000,
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
            [position.placement === 'above' ? 'bottom' : 'top']: '-5px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '8px',
            height: '8px',
            background: 'rgba(10, 16, 30, 0.92)',
            border: '1px solid var(--border-hover)',
            borderTop: position.placement === 'above' ? 'none' : undefined,
            borderLeft: position.placement === 'above' ? 'none' : undefined,
            borderBottom: position.placement === 'below' ? 'none' : undefined,
            borderRight: position.placement === 'below' ? 'none' : undefined,
          }}
        />
        {content}
      </div>,
      document.body,
    )}
  </>;
}
