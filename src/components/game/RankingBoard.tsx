'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import type { Country } from '../../types';

export interface RankingBoardProps {
  countries: Country[];
  /** Which country ID is in each slot (null = empty). Length must be 5. */
  slotAssignments: (string | null)[];
  /** Which slots are locked (correct on a previous guess). Length must be 5. */
  lockedSlots: boolean[];
  onSlotsChange: (assignments: (string | null)[]) => void;
  /** When true, disables all interaction (stat solved). */
  disabled?: boolean;
  /**
   * Pre-formatted value strings for each slot position (index 0–4).
   * null means no value to display (slot unlocked, empty, or value unavailable).
   * When provided, locked slots render the value alongside the country name.
   */
  slotValues?: (string | null)[];
}

// ── Draggable pool chip ───────────────────────────────────────────────────────

function PoolChipItem({
  country,
  onChipClick,
}: {
  country: Country;
  onChipClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool:${country.id}`,
  });

  return (
    <li
      ref={setNodeRef}
      data-testid="pool-chip"
      className="select-none transition-all duration-200"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 20px',
        borderRadius: '24px',
        border: isDragging
          ? '1px solid rgba(232,197,71,0.5)'
          : '1px solid var(--border-hover)',
        background: isDragging
          ? 'rgba(232,197,71,0.08)'
          : 'var(--surface-2)',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.35 : 1,
        boxShadow: isDragging
          ? '0 0 16px rgba(232,197,71,0.2)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
      }}
      {...attributes}
      {...listeners}
      onClick={onChipClick}
    >
      <span
        className={`fi fi-${country.flagCode} flex-shrink-0`}
        style={{ fontSize: '22px', borderRadius: '2px', overflow: 'hidden' }}
        aria-hidden="true"
      />
      <span
        className="font-medium"
        style={{ fontSize: '15px', color: 'var(--text-primary)' }}
      >
        {country.name}
      </span>
    </li>
  );
}

// ── Draggable content inside a slot ──────────────────────────────────────────

function SlotDraggableContent({
  draggableId,
  country,
  disabled,
  onRemoveClick,
}: {
  draggableId: string;
  country: Country;
  disabled: boolean;
  onRemoveClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: draggableId,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0.25 : 1,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
      {...attributes}
      {...listeners}
      className={disabled ? '' : 'cursor-grab active:cursor-grabbing'}
    >
      <span
        className={`fi fi-${country.flagCode} flex-shrink-0`}
        style={{ fontSize: '20px', borderRadius: '3px', overflow: 'hidden' }}
        aria-hidden="true"
      />
      <span
        className="font-medium flex-1"
        style={{ fontSize: '14px', color: 'var(--text-primary)' }}
      >
        {country.name}
      </span>
      {!disabled && (
        <button
          className="flex-shrink-0 rounded-full transition-all focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          style={{
            padding: '4px',
            color: 'var(--text-muted)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--wrong)';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,48,98,0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveClick();
          }}
          aria-label={`Remove ${country.name} from this slot`}
          title="Remove"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2 2l8 8M10 2l-8 8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Droppable slot ────────────────────────────────────────────────────────────

function SlotDropZone({
  slotId,
  rank,
  country,
  isLocked,
  disabled,
  slotValue,
  onEmptySlotClick,
  onRemoveFromSlot,
}: {
  slotId: string;
  rank: number;
  country: Country | null;
  isLocked: boolean;
  disabled: boolean;
  slotValue?: string | null;
  onEmptySlotClick: () => void;
  onRemoveFromSlot: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    disabled: isLocked || disabled,
  });

  const slotIndex = parseInt(slotId.split(':')[1]);

  const borderColor = isLocked
    ? 'rgba(0,232,150,0.35)'
    : isOver
      ? 'rgba(232,197,71,0.7)'
      : country
        ? 'var(--border-hover)'
        : 'var(--border)';

  const bgColor = isLocked
    ? 'rgba(0,232,150,0.04)'
    : isOver
      ? 'rgba(232,197,71,0.06)'
      : country
        ? 'var(--surface-1)'
        : 'transparent';

  const boxShadow = isLocked
    ? '0 0 16px rgba(0,232,150,0.08), inset 0 0 0 1px rgba(0,232,150,0.1)'
    : isOver
      ? '0 0 20px rgba(232,197,71,0.15), inset 0 0 0 1px rgba(232,197,71,0.15)'
      : 'none';

  return (
    <li
      ref={setNodeRef}
      data-testid="ranking-slot"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '14px',
        border: `1px solid ${borderColor}`,
        borderStyle: !country && !isLocked && !isOver ? 'dashed' : 'solid',
        background: bgColor,
        boxShadow,
        transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        backdropFilter: country || isLocked ? 'blur(6px)' : 'none',
        WebkitBackdropFilter: country || isLocked ? 'blur(6px)' : 'none',
      }}
    >
      {/* Rank number */}
      <span
        style={{
          fontSize: '13px',
          fontWeight: 700,
          width: '20px',
          textAlign: 'center',
          flexShrink: 0,
          fontFamily: 'var(--font-cinzel)',
          color: isLocked ? 'var(--success)' : country ? 'var(--gold)' : 'var(--text-muted)',
          letterSpacing: '0.05em',
        }}
      >
        {rank}
      </span>

      {/* Thin divider */}
      <div
        style={{
          width: '1px',
          height: '28px',
          flexShrink: 0,
          background: isLocked
            ? 'rgba(0,232,150,0.2)'
            : country
              ? 'rgba(232,197,71,0.15)'
              : 'var(--border)',
        }}
      />

      {country ? (
        isLocked ? (
          /* Locked: display only */
          <>
            <span
              className={`fi fi-${country.flagCode} flex-shrink-0`}
              style={{ fontSize: '20px', borderRadius: '3px', overflow: 'hidden' }}
              aria-hidden="true"
            />
            <span
              className="font-medium flex-1"
              style={{ fontSize: '14px', color: 'var(--text-primary)' }}
            >
              {country.name}
            </span>
            {/* Revealed value */}
            {slotValue != null && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'rgba(0,232,150,0.7)',
                  flexShrink: 0,
                  letterSpacing: '0.02em',
                }}
              >
                {slotValue}
              </span>
            )}
            {/* Checkmark */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: 22,
                height: 22,
                background: 'rgba(0,232,150,0.12)',
                border: '1px solid rgba(0,232,150,0.3)',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M2.5 7.5L5.5 10.5L11.5 3.5"
                  stroke="var(--success)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </>
        ) : (
          /* Placed + unlocked: draggable with remove button */
          <SlotDraggableContent
            draggableId={`placed:${slotIndex}:${country.id}`}
            country={country}
            disabled={disabled}
            onRemoveClick={onRemoveFromSlot}
          />
        )
      ) : (
        /* Empty slot */
        <button
          className="flex-1 text-left focus:outline-none focus:underline"
          style={{
            fontSize: '13px',
            fontStyle: 'italic',
            color: 'var(--text-muted)',
          }}
          onClick={onEmptySlotClick}
          aria-label={`Slot ${rank}: empty. Click to place next available country.`}
          tabIndex={disabled ? -1 : 0}
          disabled={disabled}
        >
          Drop a country here
        </button>
      )}
    </li>
  );
}

// ── Pool droppable wrapper ────────────────────────────────────────────────────

function PoolDropZone({ children, disabled }: { children: React.ReactNode; disabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool', disabled });
  return (
    <div
      ref={setNodeRef}
      style={{
        padding: '10px',
        borderRadius: '14px',
        border: isOver ? '1px solid rgba(232,197,71,0.3)' : '1px solid transparent',
        background: isOver ? 'rgba(232,197,71,0.04)' : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export function RankingBoard({
  countries,
  slotAssignments,
  lockedSlots,
  onSlotsChange,
  disabled = false,
  slotValues,
}: RankingBoardProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  /** IDs of countries currently placed in any slot */
  const assignedIds = new Set(slotAssignments.filter(Boolean) as string[]);
  const poolCountries = countries.filter((c) => !assignedIds.has(c.id));

  /** Parse a draggable ID into { countryId, sourceSlotIndex (-1 = pool) } */
  function parseDragId(id: string): { countryId: string; sourceSlotIndex: number } {
    if (id.startsWith('pool:')) {
      return { countryId: id.slice(5), sourceSlotIndex: -1 };
    }
    if (id.startsWith('placed:')) {
      const rest = id.slice(7);
      const colonIdx = rest.indexOf(':');
      return {
        sourceSlotIndex: parseInt(rest.slice(0, colonIdx)),
        countryId: rest.slice(colonIdx + 1),
      };
    }
    return { countryId: id, sourceSlotIndex: -1 };
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveDragId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveDragId(null);
    if (!over) return;

    const { countryId, sourceSlotIndex } = parseDragId(active.id as string);
    const overId = over.id as string;
    const newSlots = [...slotAssignments];

    if (overId === 'pool') {
      if (sourceSlotIndex >= 0) {
        newSlots[sourceSlotIndex] = null;
        onSlotsChange(newSlots);
      }
    } else if (overId.startsWith('slot:')) {
      const destIndex = parseInt(overId.split(':')[1]);
      if (lockedSlots[destIndex]) return;

      const existingInDest = newSlots[destIndex];
      if (sourceSlotIndex >= 0) {
        newSlots[sourceSlotIndex] = existingInDest;
        newSlots[destIndex] = countryId;
      } else {
        newSlots[destIndex] = countryId;
      }
      onSlotsChange(newSlots);
    }
  }

  /** Click an empty slot → place the first pool country */
  function handleEmptySlotClick(slotIndex: number) {
    if (disabled || lockedSlots[slotIndex] || slotAssignments[slotIndex] !== null) return;
    if (poolCountries.length === 0) return;
    const newSlots = [...slotAssignments];
    newSlots[slotIndex] = poolCountries[0].id;
    onSlotsChange(newSlots);
  }

  /** Click the remove button on a placed slot item → return to pool */
  function handleRemoveFromSlot(slotIndex: number) {
    if (disabled || lockedSlots[slotIndex]) return;
    const newSlots = [...slotAssignments];
    newSlots[slotIndex] = null;
    onSlotsChange(newSlots);
  }

  /** Click a pool chip → place in the first empty unlocked slot */
  function handlePoolChipClick(country: Country) {
    if (disabled) return;
    const firstEmpty = slotAssignments.findIndex((s, i) => s === null && !lockedSlots[i]);
    if (firstEmpty === -1) return;
    const newSlots = [...slotAssignments];
    newSlots[firstEmpty] = country.id;
    onSlotsChange(newSlots);
  }

  // Resolve country for drag overlay
  const activeDragCountry = activeDragId
    ? (() => {
        const { countryId } = parseDragId(activeDragId);
        return countries.find((c) => c.id === countryId) ?? null;
      })()
    : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* ── Ranking slots ── */}
      <ol
        data-testid="ranking-board"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}
        aria-label="Ranking slots"
      >
        {slotAssignments.map((countryId, index) => {
          const country = countryId
            ? countries.find((c) => c.id === countryId) ?? null
            : null;
          return (
            <SlotDropZone
              key={index}
              slotId={`slot:${index}`}
              rank={index + 1}
              country={country}
              isLocked={lockedSlots[index]}
              disabled={disabled}
              slotValue={slotValues?.[index] ?? null}
              onEmptySlotClick={() => handleEmptySlotClick(index)}
              onRemoveFromSlot={() => handleRemoveFromSlot(index)}
            />
          );
        })}
      </ol>

      {/* ── Pool ── */}
      {!disabled && poolCountries.length > 0 && (
        <div style={{ marginTop: '20px' }}>
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
            Available
          </p>
          <PoolDropZone disabled={disabled}>
            <ul
              style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}
              aria-label="Countries to place"
            >
              {poolCountries.map((country) => (
                <PoolChipItem
                  key={country.id}
                  country={country}
                  onChipClick={() => handlePoolChipClick(country)}
                />
              ))}
            </ul>
          </PoolDropZone>
        </div>
      )}

      {/* ── Drag overlay ── */}
      <DragOverlay>
        {activeDragCountry ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              borderRadius: '24px',
              border: '1px solid rgba(232,197,71,0.6)',
              background: 'var(--surface-2)',
              boxShadow: '0 0 30px rgba(232,197,71,0.3), 0 12px 40px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transform: 'scale(1.04)',
              cursor: 'grabbing',
            }}
          >
            <span
              className={`fi fi-${activeDragCountry.flagCode}`}
              style={{ fontSize: '22px', borderRadius: '2px', overflow: 'hidden' }}
              aria-hidden="true"
            />
            <span
              className="font-medium"
              style={{ fontSize: '15px', color: 'var(--text-primary)' }}
            >
              {activeDragCountry.name}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
