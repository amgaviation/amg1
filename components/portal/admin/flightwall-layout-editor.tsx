"use client";

import { useState, type DragEvent } from "react";

/**
 * Visual layout editor for the FlightWall wall display — a draggable mock of
 * the actual screen. The map column and METAR ticker are structurally fixed
 * on the dashboard (left column / bottom bar) so they only toggle on/off;
 * the three business panels drag to reorder within the right column.
 *
 * Pure client-side state that serializes into the same hidden form fields the
 * saveFlightwallSettings server action already reads (show_* checkboxes and
 * panel_slot_N order slots), so it drops into the existing <form> unchanged.
 */

type PanelKey = "map" | "requests" | "missions" | "revenue" | "metar";
const RIGHT_PANELS: PanelKey[] = ["requests", "missions", "revenue"];

const PANEL_META: Record<PanelKey, { label: string; hint: string }> = {
  map: { label: "Traffic Map", hint: "Live basemap + Nearby Traffic list (left column)" },
  requests: { label: "Latest Requests", hint: "New AMG mission requests" },
  missions: { label: "Mission Board", hint: "Active mission pipeline" },
  revenue: { label: "Revenue", hint: "Today / month-to-date" },
  metar: { label: "METAR Ticker", hint: "Weather strip along the bottom" },
};

export function FlightwallLayoutEditor({
  initialOrder,
  initialShow,
}: {
  initialOrder: string[];
  initialShow: Record<PanelKey, boolean>;
}) {
  const [show, setShow] = useState<Record<PanelKey, boolean>>(initialShow);
  const [order, setOrder] = useState<PanelKey[]>(() => {
    const fromSaved = initialOrder.filter((p): p is PanelKey =>
      (RIGHT_PANELS as string[]).includes(p)
    );
    for (const p of RIGHT_PANELS) if (!fromSaved.includes(p)) fromSaved.push(p);
    return fromSaved;
  });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const visibleRight = order.filter((p) => show[p]);
  const hiddenPanels = (Object.keys(PANEL_META) as PanelKey[]).filter((p) => !show[p]);

  function onDragStart(e: DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Firefox needs data set for a drag to start
    e.dataTransfer.setData("text/plain", String(index));
  }

  function onDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (index !== overIndex) setOverIndex(index);
  }

  function onDrop(e: DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    // indices are into visibleRight; map back into the full order array
    const moved = visibleRight[dragIndex];
    const target = visibleRight[index];
    const next = order.filter((p) => p !== moved);
    next.splice(next.indexOf(target) + (dragIndex < index ? 1 : 0), 0, moved);
    setOrder(next);
    setDragIndex(null);
    setOverIndex(null);
  }

  function remove(panel: PanelKey) {
    setShow((s) => ({ ...s, [panel]: false }));
  }
  function add(panel: PanelKey) {
    setShow((s) => ({ ...s, [panel]: true }));
  }

  // full slot order the server action expects: map first, right-column order,
  // metar last (the dashboard treats map/metar positions as structural anyway)
  const slotOrder: PanelKey[] = ["map", ...order, "metar"];

  const cardBase =
    "rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-2.5";
  const chipBtn =
    "rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-2.5 py-1.5 text-xs text-[var(--deck-text-2)] hover:border-[var(--deck-accent-ink)] hover:text-[var(--deck-text)]";

  return (
    <div>
      {/* serialized state — same names the server action already parses */}
      {(Object.keys(PANEL_META) as PanelKey[]).map((p) =>
        show[p] ? <input key={p} type="hidden" name={`show_${p}`} value="on" /> : null
      )}
      {slotOrder.map((p, i) => (
        <input key={`slot-${i}`} type="hidden" name={`panel_slot_${i}`} value={p} />
      ))}

      {/* wall mock */}
      <div className="rounded-xl border border-[var(--deck-line)] bg-[var(--deck-inset,rgba(0,0,0,0.15))] p-3">
        <div className="grid gap-2 md:grid-cols-[1.55fr_1fr]">
          {/* left column — map (fixed position, toggle only) */}
          <div
            className={`${cardBase} flex min-h-[180px] flex-col justify-between ${show.map ? "" : "opacity-40 border-dashed"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-[var(--deck-text)]">{PANEL_META.map.label}</p>
                <p className="mt-0.5 text-xs text-[var(--deck-text-3)]">{PANEL_META.map.hint}</p>
              </div>
              {show.map ? (
                <button
                  type="button"
                  onClick={() => remove("map")}
                  aria-label="Remove Traffic Map"
                  className="text-[var(--deck-text-3)] hover:text-[var(--deck-text)]"
                >
                  ✕
                </button>
              ) : null}
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--deck-text-3)]">
              Fixed left column
            </p>
          </div>

          {/* right column — draggable business panels */}
          <div className="flex min-h-[180px] flex-col gap-2">
            {visibleRight.length === 0 ? (
              <div className={`${cardBase} border-dashed text-xs text-[var(--deck-text-3)]`}>
                No business panels — add one below.
              </div>
            ) : null}
            {visibleRight.map((p, i) => (
              <div
                key={p}
                draggable
                onDragStart={(e) => onDragStart(e, i)}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={(e) => onDrop(e, i)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={`${cardBase} flex cursor-grab items-center justify-between gap-2 active:cursor-grabbing ${
                  dragIndex === i ? "opacity-50" : ""
                } ${overIndex === i && dragIndex !== null && dragIndex !== i ? "border-[var(--deck-accent-ink)]" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <span aria-hidden className="select-none text-[var(--deck-text-3)]">⠿</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--deck-text)]">{PANEL_META[p].label}</p>
                    <p className="mt-0.5 text-xs text-[var(--deck-text-3)]">{PANEL_META[p].hint}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(p)}
                  aria-label={`Remove ${PANEL_META[p].label}`}
                  className="text-[var(--deck-text-3)] hover:text-[var(--deck-text)]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* metar ticker — fixed bottom strip, toggle only */}
        <div
          className={`${cardBase} mt-2 flex items-center justify-between ${show.metar ? "" : "opacity-40 border-dashed"}`}
        >
          <div>
            <span className="text-sm font-medium text-[var(--deck-text)]">{PANEL_META.metar.label}</span>
            <span className="ml-2 text-xs text-[var(--deck-text-3)]">{PANEL_META.metar.hint} · fixed bottom bar</span>
          </div>
          {show.metar ? (
            <button
              type="button"
              onClick={() => remove("metar")}
              aria-label="Remove METAR Ticker"
              className="text-[var(--deck-text-3)] hover:text-[var(--deck-text)]"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {/* add-back chips for removed panels */}
      {hiddenPanels.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--deck-text-3)]">Add panel:</span>
          {hiddenPanels.map((p) => (
            <button key={p} type="button" onClick={() => add(p)} className={chipBtn}>
              + {PANEL_META[p].label}
            </button>
          ))}
        </div>
      ) : null}

      <p className="mt-3 text-xs text-[var(--deck-text-3)]">
        Drag the right-column panels to reorder them. The map column and METAR ticker hold fixed positions on the wall —
        remove them with ✕ or add them back above. Layout applies when you save.
      </p>
    </div>
  );
}
