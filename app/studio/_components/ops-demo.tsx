"use client";

import { useMemo, useState } from "react";
import { Counter } from "./counter";

/**
 * Interactive demo — operations dashboard.
 *
 * SAMPLE DATA ONLY. The fleet, the squawks, the hours and every number below are
 * fictional and hard-coded in this file. No backend, no network, no real
 * operator's data.
 *
 * The chart is hand-rolled SVG rather than a charting library: a one-page site
 * should not ship 100 kB of chart runtime to draw fourteen bars, and the SVG
 * carries its own text alternative for anyone not looking at it.
 */

const KPIS = [
  { label: "Aircraft available", value: 7, suffix: " / 9", note: "2 in maintenance" },
  { label: "Dispatch rate", value: 94.2, decimals: 1, suffix: "%", note: "Trailing 30 days" },
  { label: "Open squawks", value: 5, note: "2 deferred under MEL" },
  { label: "Hours flown MTD", value: 486.4, decimals: 1, note: "Across 7 airframes" },
];

const HOURS = [
  { day: "01", hours: 21.4 },
  { day: "02", hours: 26.8 },
  { day: "03", hours: 18.2 },
  { day: "04", hours: 9.6 },
  { day: "05", hours: 24.1 },
  { day: "06", hours: 31.5 },
  { day: "07", hours: 28.9 },
  { day: "08", hours: 14.3 },
  { day: "09", hours: 22.7 },
  { day: "10", hours: 35.2 },
  { day: "11", hours: 30.6 },
  { day: "12", hours: 12.8 },
  { day: "13", hours: 27.4 },
  { day: "14", hours: 33.1 },
];

type Status = "open" | "deferred" | "cleared";

type Squawk = {
  ref: string;
  tail: string;
  item: string;
  status: Status;
  age: string;
};

const SQUAWKS: Squawk[] = [
  { ref: "SQ-1841", tail: "N4521G", item: "Landing light intermittent", status: "open", age: "2 d" },
  { ref: "SQ-1839", tail: "N83T", item: "Left brake soft", status: "open", age: "3 d" },
  { ref: "SQ-1836", tail: "N512DS", item: "ADS-B out fault on ground test", status: "deferred", age: "6 d" },
  { ref: "SQ-1834", tail: "N4521G", item: "Cabin door seal worn", status: "deferred", age: "8 d" },
  { ref: "SQ-1830", tail: "N77QB", item: "Oil screen inspection due", status: "open", age: "11 d" },
  { ref: "SQ-1827", tail: "N83T", item: "Static wick missing — RH wingtip", status: "cleared", age: "14 d" },
  { ref: "SQ-1823", tail: "N512DS", item: "Nav 2 CDI flag", status: "cleared", age: "18 d" },
  { ref: "SQ-1819", tail: "N4521G", item: "Tire wear — nose", status: "cleared", age: "23 d" },
];

const FILTERS: { id: "all" | Status; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "deferred", label: "Deferred" },
  { id: "cleared", label: "Cleared" },
];

const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  deferred: "Deferred",
  cleared: "Cleared",
};

export function OpsDemo() {
  const [filter, setFilter] = useState<"all" | Status>("all");

  const rows = useMemo(
    () => (filter === "all" ? SQUAWKS : SQUAWKS.filter((s) => s.status === filter)),
    [filter],
  );

  const peak = Math.max(...HOURS.map((h) => h.hours));
  const total = HOURS.reduce((sum, h) => sum + h.hours, 0);

  return (
    <div className="s-demo">
      <div className="s-demo-head">
        <div>
          <p className="s-mono s-demo-sub">Ops dashboard</p>
          <h3 className="s-demo-title">Fleet status</h3>
        </div>
        <span className="s-demo-tag">Interactive demo — sample data</span>
      </div>

      <div className="s-demo-body">
        <div className="s-kpi-grid">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="s-kpi">
              <p className="s-mono s-kpi-value">
                <Counter to={kpi.value} decimals={kpi.decimals ?? 0} suffix={kpi.suffix ?? ""} />
              </p>
              <p className="s-kpi-label">{kpi.label}</p>
              <p className="s-kpi-note">{kpi.note}</p>
            </div>
          ))}
        </div>

        <div className="s-chart-block">
          <div className="s-chart-head">
            <p className="s-mono s-legend">Hours flown · last 14 days</p>
            <p className="s-mono s-chart-total">{total.toFixed(1)} hrs</p>
          </div>

          <div className="s-scroll-x">
            <svg
              viewBox="0 0 560 140"
              className="s-chart"
              role="img"
              aria-label={`Bar chart of daily flight hours over 14 days, ranging from ${Math.min(
                ...HOURS.map((h) => h.hours),
              ).toFixed(1)} to ${peak.toFixed(1)} hours. Full figures follow in the list below.`}
            >
              {/* Gridlines at quarter intervals of the peak. */}
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <line
                  key={f}
                  x1="0"
                  x2="560"
                  y1={120 - 108 * f}
                  y2={120 - 108 * f}
                  stroke="rgba(163,180,190,0.1)"
                  strokeWidth="1"
                />
              ))}
              <line x1="0" x2="560" y1="120" y2="120" stroke="rgba(163,180,190,0.28)" strokeWidth="1" />

              {HOURS.map((entry, index) => {
                const w = 560 / HOURS.length;
                const barW = w * 0.52;
                const h = (entry.hours / peak) * 108;
                const x = index * w + (w - barW) / 2;
                const isPeak = entry.hours === peak;
                return (
                  <g key={entry.day}>
                    <rect
                      x={x}
                      y={120 - h}
                      width={barW}
                      height={h}
                      fill={isPeak ? "var(--s-green)" : "rgba(59,240,138,0.34)"}
                    />
                    <text
                      x={x + barW / 2}
                      y="136"
                      textAnchor="middle"
                      fontSize="9"
                      fill="rgba(121,132,127,1)"
                      fontFamily="var(--s-font-mono)"
                    >
                      {entry.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* The same data as text, for anyone who is not looking at the chart. */}
          <ul className="s-vh">
            {HOURS.map((entry) => (
              <li key={entry.day}>
                Day {entry.day}: {entry.hours.toFixed(1)} hours
              </li>
            ))}
          </ul>
        </div>

        <div className="s-chart-block">
          <div className="s-chart-head">
            <p className="s-mono s-legend">Squawks</p>
            <div className="s-filter-row" role="group" aria-label="Filter squawks by status">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="s-filter"
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <p className="s-vh" role="status">
            {rows.length} squawk{rows.length === 1 ? "" : "s"} shown
          </p>

          <div className="s-scroll-x">
            <table className="s-table">
              <caption className="s-vh">
                Sample squawk list, filtered by {filter === "all" ? "all statuses" : STATUS_LABEL[filter]}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Ref</th>
                  <th scope="col">Tail</th>
                  <th scope="col">Item</th>
                  <th scope="col">Status</th>
                  <th scope="col">Age</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.ref}>
                    <td className="s-mono">{row.ref}</td>
                    <td className="s-mono">{row.tail}</td>
                    <td>{row.item}</td>
                    <td>
                      <span className="s-badge" data-status={row.status}>
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td className="s-mono">{row.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
