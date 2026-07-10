'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
} from '@dnd-kit/core';
import type { Modifier } from '@dnd-kit/core';
import { useRef, useState } from 'react';
import type { Country } from '../../types';
import { clamp01, valueAtFraction } from '../../lib/line-scale';
import { formatStatValue } from '../../lib/formatting';

/**
 * Modifier that snaps the center of the drag overlay chip to the pointer cursor,
 * regardless of where the drag started within the source element.
 *
 * Without this, the overlay is positioned at the source element's original rect
 * and translated by the pointer delta — which causes a visual offset when the
 * overlay is a different shape/size than the source element.
 */
const OVERLAY_CHIP_SIZE = 44; // must match the overlay chip's rendered width/height

const snapCenterToCursor: Modifier = ({
  activatorEvent,
  activeNodeRect,
  transform,
}) => {
  if (!activatorEvent || !activeNodeRect) {
    return transform;
  }

  // Where the user initially clicked within the active element
  const evt = activatorEvent as PointerEvent | MouseEvent | TouchEvent;
  let startX: number;
  let startY: number;
  if ('clientX' in evt) {
    startX = evt.clientX;
    startY = evt.clientY;
  } else if ('touches' in evt && evt.touches.length > 0) {
    startX = evt.touches[0].clientX;
    startY = evt.touches[0].clientY;
  } else {
    return transform;
  }

  // Offset from the source element's top-left to the initial pointer position
  const offsetX = startX - activeNodeRect.left;
  const offsetY = startY - activeNodeRect.top;

  // The overlay wrapper is positioned at activeNodeRect's top/left with
  // activeNodeRect's width/height (see dnd-kit PositionedOverlay source).
  // Our chip content is at the wrapper's top-left corner.
  // To center the chip (OVERLAY_CHIP_SIZE) on the cursor:
  const halfChip = OVERLAY_CHIP_SIZE / 2;

  return {
    ...transform,
    x: transform.x + offsetX - halfChip,
    y: transform.y + offsetY - halfChip,
  };
};

export interface LineScaleBoardProps {
  /** The five countries in play. */
  countries: Country[];
  /** Value at the far-left endpoint (smallest of the five). */
  min: number;
  /** Value at the far-right endpoint (largest of the five). */
  max: number;
  /** Unit for readout/endpoint labels (e.g. "km²"). '' when none. */
  unit: string;
  /** Current placement per country as a fraction t ∈ [0,1]. Absent = not placed. */
  positions: Record<string, number>;
  /** Countries locked as correct on a prior guess (not repositionable). */
  locked: Record<string, boolean>;
  /** Emitted when the player moves/places a token. */
  onPositionsChange: (positions: Record<string, number>) => void;
  /** When true, disables all interaction (stat solved). */
  disabled?: boolean;
  /**
   * When provided (only after the round is solved), renders a second "correct
   * answer" line below the player's track showing the true fractional positions.
   * Keyed by country ID, value ∈ [0, 1].
   */
  correctPositions?: Record<string, number>;
}

const TOKEN_PREFIX = 'token:';

/** Small discrete keyboard step (fraction) — see feature 010 accessibility model. */
const KEY_STEP = 0.02;

function tokenIdFor(countryId: string): string {
  return `${TOKEN_PREFIX}${countryId}`;
}

function countryIdFromToken(dragId: string): string {
  return dragId.startsWith(TOKEN_PREFIX) ? dragId.slice(TOKEN_PREFIX.length) : dragId;
}

// ── Draggable token ───────────────────────────────────────────────────────────

function Token({
  country,
  fraction,
  isPlaced,
  isLocked,
  disabled,
  valueText,
  onKeyStep,
}: {
  country: Country;
  fraction: number;
  isPlaced: boolean;
  isLocked: boolean;
  disabled: boolean;
  valueText: string | null;
  onKeyStep: (countryId: string, direction: 'left' | 'right' | 'min' | 'max') => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: tokenIdFor(country.id),
    disabled: disabled || isLocked,
  });

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled || isLocked) return;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        onKeyStep(country.id, 'left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        onKeyStep(country.id, 'right');
        break;
      case 'Home':
        e.preventDefault();
        onKeyStep(country.id, 'min');
        break;
      case 'End':
        e.preventDefault();
        onKeyStep(country.id, 'max');
        break;
      default:
        break;
    }
  }

  const ariaValueText = valueText ?? 'not placed';

  // Small "correct" checkmark badge, shared by both layouts.
  const lockedBadge = isLocked ? (
    <span
      className="flex items-center justify-center rounded-full"
      style={{
        width: 16,
        height: 16,
        background: 'rgba(0,232,150,0.15)',
        border: '1px solid rgba(0,232,150,0.35)',
        flexShrink: 0,
      }}
      aria-label="correct"
    >
      <svg width="9" height="9" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M2.5 7.5L5.5 10.5L11.5 3.5"
          stroke="var(--success)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  ) : null;

  // ── Placed token: compact round flag chip on the track. The country name is
  //    visually hidden and revealed on hover / :focus-visible (see globals.css).
  //    Screen readers still get the name via aria-label + aria-valuetext.
  if (isPlaced) {
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        data-testid="line-token"
        data-country={country.id}
        data-dragging={String(isDragging)}
        className="line-token"
        role="slider"
        aria-label={country.name}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(fraction * 100)}
        aria-valuetext={ariaValueText}
        tabIndex={disabled || isLocked ? -1 : 0}
        onKeyDown={handleKeyDown}
        style={{
          position: 'absolute',
          left: `${fraction * 100}%`,
          top: '50%',
          transform: `translate(-50%, -50%)`,
          zIndex: isDragging ? 30 : 10,
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: isLocked
            ? '2px solid rgba(0,232,150,0.5)'
            : isDragging
              ? '2px solid rgba(232,197,71,0.7)'
              : '2px solid var(--border-hover)',
          background: isLocked ? 'rgba(0,232,150,0.08)' : 'var(--surface-2)',
          boxShadow: isDragging
            ? '0 0 18px rgba(232,197,71,0.35)'
            : '0 2px 8px rgba(0,0,0,0.35)',
          cursor: disabled || isLocked ? 'default' : isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.2 : 1,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <span
          className={`fi fi-${country.flagCode}`}
          style={{ fontSize: '28px', borderRadius: '3px', overflow: 'hidden', flexShrink: 0 }}
          aria-hidden="true"
        />
        {/* Hover/focus-revealed name label, floating below the chip. */}
        <span
          className="line-token-name font-medium"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '8px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-hover)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            fontSize: '12px',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          {country.name}
          {lockedBadge}
        </span>
      </div>
    );
  }

  // ── Unplaced token in the staging tray: flag + always-visible name pill.
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-testid="line-token"
      data-country={country.id}
      role="button"
      aria-label={`${country.name} — not placed`}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '6px 10px',
        borderRadius: '20px',
        border: isLocked
          ? '1px solid rgba(0,232,150,0.4)'
          : isDragging
            ? '1px solid rgba(232,197,71,0.6)'
            : '1px solid var(--border-hover)',
        background: isLocked ? 'rgba(0,232,150,0.06)' : 'var(--surface-2)',
        boxShadow: isDragging ? '0 0 16px rgba(232,197,71,0.25)' : '0 2px 8px rgba(0,0,0,0.3)',
        cursor: disabled || isLocked ? 'default' : isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.2 : 1,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <span
        className={`fi fi-${country.flagCode}`}
        style={{ fontSize: '18px', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}
        aria-hidden="true"
      />
      <span
        className="font-medium"
        style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
      >
        {country.name}
      </span>
      {lockedBadge}
    </div>
  );
}

// ── Track (droppable) ─────────────────────────────────────────────────────────

function Track({
  trackRef,
  children,
  bubble,
}: {
  trackRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  bubble?: { fraction: number; label: string } | null;
}) {
  const { setNodeRef } = useDroppable({ id: 'line-scale-track-droppable' });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        trackRef.current = node;
      }}
      data-testid="line-scale-track"
      style={{
        position: 'relative',
        width: '100%',
        height: 'var(--touch-min, 48px)',
        marginTop: '8px',
        marginBottom: '8px',
      }}
    >
      {/* The visible line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: '3px',
          transform: 'translateY(-50%)',
          borderRadius: '2px',
          background:
            'linear-gradient(90deg, rgba(0,196,232,0.35) 0%, rgba(232,197,71,0.35) 100%)',
        }}
      />
      {children}
      {/* Floating value bubble above the token currently being placed. */}
      {bubble && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${bubble.fraction * 100}%`,
            bottom: 'calc(100% + 8px)',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-cinzel)',
            fontWeight: 700,
            fontSize: '14px',
            color: 'var(--gold)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-hover)',
            borderRadius: '10px',
            padding: '4px 10px',
            pointerEvents: 'none',
            zIndex: 40,
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
          }}
        >
          {bubble.label}
          {/* Downward caret */}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              width: 0,
              height: 0,
              transform: 'translateX(-50%)',
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid var(--surface-2)',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LineScaleBoard({
  countries,
  min,
  max,
  unit,
  positions,
  locked,
  onPositionsChange,
  disabled = false,
  correctPositions,
}: LineScaleBoardProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeCountryId, setActiveCountryId] = useState<string | null>(null);
  const [dragFraction, setDragFraction] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function trackWidth(): number {
    const rect = trackRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? rect.width : 1;
  }

  /** Fraction the token started at (0 if unplaced, so it enters from the left). */
  function startFractionFor(countryId: string): number {
    return positions[countryId] ?? 0;
  }

  function fractionAfterDelta(countryId: string, deltaX: number, activeRect?: { left: number; width: number } | null): number {
    const isUnplaced = positions[countryId] == null;
    if (isUnplaced && activeRect) {
      // For unplaced tokens, compute fraction from the dragged element's
      // current center X relative to the track, rather than using delta from
      // the staging tray origin which has no meaningful relation to the track.
      const trackRect = trackRef.current?.getBoundingClientRect();
      if (trackRect && trackRect.width > 0) {
        const centerX = activeRect.left + activeRect.width / 2;
        return clamp01((centerX - trackRect.left) / trackRect.width);
      }
    }
    const start = startFractionFor(countryId);
    return clamp01(start + deltaX / trackWidth());
  }

  function handleDragStart({ active }: DragStartEvent) {
    const countryId = countryIdFromToken(active.id as string);
    if (disabled || locked[countryId]) return;
    setActiveCountryId(countryId);
    setDragFraction(startFractionFor(countryId));
  }

  function handleDragMove({ active, delta }: DragMoveEvent) {
    const countryId = countryIdFromToken(active.id as string);
    if (disabled || locked[countryId]) return;
    const activeRect = active.rect.current.translated ?? null;
    setDragFraction(fractionAfterDelta(countryId, delta.x, activeRect));
  }

  function handleDragEnd({ active, delta }: DragEndEvent) {
    const countryId = countryIdFromToken(active.id as string);
    setActiveCountryId(null);
    setDragFraction(null);
    if (disabled || locked[countryId]) return;
    const activeRect = active.rect.current.translated ?? null;
    const next = { ...positions, [countryId]: fractionAfterDelta(countryId, delta.x, activeRect) };
    onPositionsChange(next);
  }

  function handleKeyStep(countryId: string, direction: 'left' | 'right' | 'min' | 'max') {
    if (disabled || locked[countryId]) return;
    const current = positions[countryId] ?? 0;
    let next: number;
    switch (direction) {
      case 'left':
        next = clamp01(current - KEY_STEP);
        break;
      case 'right':
        next = clamp01(current + KEY_STEP);
        break;
      case 'min':
        next = 0;
        break;
      case 'max':
        next = 1;
        break;
    }
    onPositionsChange({ ...positions, [countryId]: next });
  }

  const placed = countries.filter((c) => positions[c.id] != null);
  const unplaced = countries.filter((c) => positions[c.id] == null);

  // The country object currently being dragged (used by DragOverlay).
  const activeCountry = activeCountryId != null
    ? countries.find((c) => c.id === activeCountryId) ?? null
    : null;

  // Live readout value for the actively dragged token.
  const readoutValue =
    activeCountryId != null && dragFraction != null
      ? formatStatValue(valueAtFraction(dragFraction, min, max), unit)
      : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div data-testid="line-scale-board">
        {/* Live value readout (shown while dragging) */}
        <div
          data-testid="line-value-readout"
          aria-live="polite"
          aria-atomic="true"
          style={{
            minHeight: '20px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: readoutValue ? 'var(--gold)' : 'transparent',
            fontFamily: 'var(--font-cinzel)',
          }}
        >
          {readoutValue ?? '\u00A0'}
        </div>

        {/* Track (full width) with placed tokens */}
        <Track
          trackRef={trackRef}
          bubble={
            activeCountryId != null && dragFraction != null
              ? {
                  fraction: dragFraction,
                  label: formatStatValue(valueAtFraction(dragFraction, min, max), unit),
                }
              : null
          }
        >
          {placed.map((c) => (
            <Token
              key={c.id}
              country={c}
              fraction={positions[c.id]}
              isPlaced
              isLocked={!!locked[c.id]}
              disabled={disabled}
              valueText={formatStatValue(valueAtFraction(positions[c.id], min, max), unit)}
              onKeyStep={handleKeyStep}
            />
          ))}
        </Track>

        {/* Endpoint labels beneath the track ends */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '12px',
            marginTop: '4px',
          }}
        >
          <span
            data-testid="line-endpoint-min"
            style={{
              fontSize: 'var(--fs-body)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              textAlign: 'left',
            }}
          >
            {formatStatValue(min, unit)}
          </span>

          <span
            data-testid="line-endpoint-max"
            style={{
              fontSize: 'var(--fs-body)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              textAlign: 'right',
            }}
          >
            {formatStatValue(max, unit)}
          </span>
        </div>

        {/* Staging tray for unplaced tokens */}
        {!disabled && unplaced.length > 0 && (
          <div style={{ marginTop: '18px' }}>
            <p
              className="uppercase"
              style={{
                fontSize: '9px',
                letterSpacing: '0.3em',
                color: 'var(--text-muted)',
                fontWeight: 700,
                marginBottom: '10px',
                paddingLeft: '4px',
              }}
            >
              Place on the line
            </p>
            <div
              style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
              aria-label="Countries to place"
            >
              {unplaced.map((c) => (
                <Token
                  key={c.id}
                  country={c}
                  fraction={0}
                  isPlaced={false}
                  isLocked={!!locked[c.id]}
                  disabled={disabled}
                  valueText={null}
                  onKeyStep={handleKeyStep}
                />
              ))}
            </div>
          </div>
        )}

        {/* Correct answer line — only shown once the round is solved */}
        {correctPositions && (
          <div
            className="animate-slide-up-fade"
            style={{ marginTop: '24px' }}
            aria-hidden="true"
          >
            <p
              className="uppercase"
              style={{
                fontSize: '9px',
                letterSpacing: '0.3em',
                color: 'var(--text-muted)',
                fontWeight: 700,
                marginBottom: '6px',
                paddingLeft: '4px',
              }}
            >
              Correct placement
            </p>
            <div
              data-testid="line-scale-answer-track"
              style={{
                position: 'relative',
                width: '100%',
                height: '48px',
              }}
            >
              {/* Green answer line */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  height: '3px',
                  transform: 'translateY(-50%)',
                  borderRadius: '2px',
                  background:
                    'linear-gradient(90deg, rgba(0,232,150,0.3) 0%, rgba(0,232,150,0.6) 100%)',
                }}
              />
              {/* Correct-position flag chips (non-interactive) */}
              {countries.map((c) => (
                <div
                  key={c.id}
                  style={{
                    position: 'absolute',
                    left: `${(correctPositions[c.id] ?? 0) * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(0,232,150,0.55)',
                    background: 'rgba(0,232,150,0.08)',
                    boxShadow: '0 0 12px rgba(0,232,150,0.18)',
                    zIndex: 10,
                  }}
                >
                  <span
                    className={`fi fi-${c.flagCode}`}
                    style={{ fontSize: '22px', borderRadius: '3px', overflow: 'hidden' }}
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DragOverlay — renders a portal at body level that follows the pointer.
          snapCenterToCursor modifier ensures the flag chip is centered on the cursor.
          dropAnimation={null} prevents a spring-back fighting the committed position. */}
      <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
        {activeCountry && (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(232,197,71,0.8)',
              background: 'var(--surface-2)',
              boxShadow: '0 0 0 3px rgba(232,197,71,0.15), 0 8px 24px rgba(0,0,0,0.5)',
              transform: 'scale(1.15)',
              cursor: 'grabbing',
              pointerEvents: 'none',
            }}
          >
            <span
              className={`fi fi-${activeCountry.flagCode}`}
              style={{ fontSize: '28px', borderRadius: '3px', overflow: 'hidden' }}
              aria-hidden="true"
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
