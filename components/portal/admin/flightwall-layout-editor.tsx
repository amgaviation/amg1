"use client";

import { useState, type DragEvent } from "react";
import { BUILTIN_WIDGETS, GENERIC_WIDGETS, WIDGET_LABELS } from "@/lib/flightwall/widget-catalog";

/**
 * Visual layout editor for the FlightWall wall display — a draggable mock of
 * the two-column wall. EVERY block is movable: drag any card within or
 * between columns (including the map, nearby-traffic list, and METAR),
 * remove with ✕, and add anything from the palette — the five bespoke
 * panels plus 20+ generic data widgets fed from the portal database.
 *
 * Serializes to a single hidden `layout_json` field ({left, right} arrays of
 * widget keys) that the server action validates with sanitizeLayout().
 */

type Col = "left" | "right";
type Layout = Record<Col, string[]>;

const DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  [...BUILTIN_WIDGETS, ...GENERIC_WIDGETS].map((w) => [w.key, w.description])
);
const BUILTIN_KEYS = new Set(BUILTIN_WIDGETS.map((w) => w.key));

export function FlightwallLayoutEditor({ initialLayout }: { initialLayout: Layout }) {
  const [layout, setLayout] = useState<Layout>({
    left: [...initialLayout.left],
    right: [...initialLayout.right],
  });
  const [drag, setDrag] = useState<{ col: Col; index: number } | null>(null);
  const [over, setOver] = useState<{ col: Col; index: number } | null>(null);

  const placed = new Set([...layout.left, ...layout.right]);
  const palette = [...BUILTIN_WIDGETS, ...GENERIC_WIDGETS].filter((w) => !placed.has(w.key));

  function move(from: { col: Col; index: number }, to: { col: Col; index: number }) {
    setLayout((prev) => {
      const next: Layout = { left: [...prev.left], right: [...prev.right] };
      const [key] = next[from.col].splice(from.index, 1);
      if (key === undefined) return prev;
      const target = Math.min(to.index, next[to.col].length);
      next[to.col].splice(target, 0, key);
      return next;
    });
  }

  function onDragStart(e: DragEvent, col: Col, index: number) {
    setDrag({ col, index });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${col}:${index}`);
  }
  function onDragOverCard(e: DragEvent, col: Col, index: number) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (!over || over.col !== col || over.index !== index) setOver({ col, index });
  }
  function onDropCard(e: DragEvent, col: Col, index: number) {
    e.preventDefault();
    e.stopPropagation();
    if (drag) move(drag, { col, index });
    setDrag(null);
    setOver(null);
  }
  function onDragOverColumn(e: DragEvent, col: Col) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!over || over.col !== col || over.index !== layout[col].length) setOver({ col, index: layout[col].length });
  }
  function onDropColumn(e: DragEvent, col: Col) {
    e.preventDefault();
    if (drag) move(drag, { col, index: layout[col].length });
    setDrag(null);
    setOver(null);
  }

  function remove(col: Col, index: number) {
    setLayout((prev) => {
      const next: Layout = { left: [...prev.left], right: [...prev.right] };
      next[col].splice(index, 1);
      return next;
    });
  }
  function add(key: string) {
    setLayout((prev) => {
      // heavier visual blocks default left, data lists default right
      const col: Col = key === "map" || key === "nearby" ? "left" : "right";
      const next: Layout = { left: [...prev.left], right: [...prev.right] };
      next[col].push(key);
      return next;
    });
  }

  const cardBase =
    "rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-2.5 flex cursor-grab items-center justify-between gap-2 active:cursor-grabbing";
  const chipBtn =
    "rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-2.5 py-1.5 text-xs text-[var(--deck-text-2)] hover:border-[var(--deck-accent-ink)] hover:text-[var(--deck-text)]";

  function renderCard(key: string, col: Col, index: number) {
    const isDragging = drag && drag.col === col && drag.index === index;
    const isOver = over && over.col === col && over.index === index && !isDragging;
    return (
      <div
        key={key}
        draggable
        onDragStart={(e) => onDragStart(e, col, index)}
        onDragOver={(e) => onDragOverCard(e, col, index)}
        onDrop={(e) => onDropCard(e, col, index)}
        onDragEnd={() => {
          setDrag(null);
          setOver(null);
        }}
        className={`${cardBase} ${isDragging ? "opacity-50" : ""} ${isOver ? "border-[var(--deck-accent-ink)]" : ""}`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className="select-none text-[var(--deck-text-3)]">⠿</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--deck-text)]">
              {WIDGET_LABELS[key] ?? key}
              {!BUILTIN_KEYS.has(key) ? (
                <span className="ml-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--deck-text-3)]">data</span>
              ) : null}
            </p>
            <p className="truncate text-xs text-[var(--deck-text-3)]">{DESCRIPTIONS[key] ?? ""}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => remove(col, index)}
          aria-label={`Remove ${WIDGET_LABELS[key] ?? key}`}
          className="shrink-0 text-[var(--deck-text-3)] hover:text-[var(--deck-text)]"
        >
          ✕
        </button>
      </div>
    );
  }

  function renderColumn(col: Col, title: string) {
    return (
      <div
        onDragOver={(e) => onDragOverColumn(e, col)}
        onDrop={(e) => onDropColumn(e, col)}
        className="flex min-h-[220px] flex-col gap-2 rounded-lg border border-dashed border-[var(--deck-line)] p-2"
      >
        <p className="px-1 text-[10px] uppercase tracking-[0.18em] text-[var(--deck-text-3)]">{title}</p>
        {layout[col].map((key, i) => renderCard(key, col, i))}
        {layout[col].length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-[var(--deck-text-3)]">Drop panels here</p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <input type="hidden" name="layout_json" value={JSON.stringify(layout)} />

      <div className="rounded-xl border border-[var(--deck-line)] bg-[var(--deck-inset,rgba(0,0,0,0.15))] p-3">
        <div className="grid gap-2 md:grid-cols-[1.55fr_1fr]">
          {renderColumn("left", "Left column (wide)")}
          {renderColumn("right", "Right column")}
        </div>
      </div>

      {palette.length > 0 ? (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-[var(--deck-text-3)]">
            Add to the wall ({palette.length} available — data widgets pull live from the portal database):
          </p>
          <div className="flex flex-wrap gap-2">
            {palette.map((w) => (
              <button key={w.key} type="button" onClick={() => add(w.key)} className={chipBtn} title={w.description}>
                + {w.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-[var(--deck-text-3)]">
        Drag any card within or between columns — nothing is fixed. ✕ removes a panel (it returns to the palette).
        The left column renders wider on the wall; layout applies on the dashboard&rsquo;s next load after saving.
      </p>
    </div>
  );
}
