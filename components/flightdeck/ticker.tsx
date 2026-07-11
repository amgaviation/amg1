/**
 * TICKER — coordinate marquee directly under the hero. Infinite 44s linear
 * loop; the content is duplicated so the -50% translate wraps seamlessly.
 * Mono micro-labels separated by small rotated blue squares.
 */

const ITEMS = [
  "Ops desk 0700–2200 ET",
  "N-reg · Part 91",
  "Crew · credential-reviewed",
  "$0 pass-through markup",
  "Quote · 24 hr",
  "KTPA → KATL",
  "Ferry · repositioning",
  "US based · worldwide coordination",
];

export default function Ticker() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div
      style={{
        position: "relative",
        zIndex: 4,
        background: "var(--sp-void)",
        borderTop: "1px solid var(--sp-hair)",
        borderBottom: "1px solid var(--sp-hair)",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      <div
        aria-hidden
        className="fd-marquee"
        style={{ display: "inline-flex", alignItems: "center", padding: "12px 0" }}
      >
        {loop.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--sp-ink-3)",
            }}
          >
            <span style={{ padding: "0 30px" }}>{item}</span>
            <span
              aria-hidden
              style={{ width: 3, height: 3, background: "var(--sp-blue)", transform: "rotate(45deg)" }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
