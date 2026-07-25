/**
 * TICKER — coordinate marquee directly under the hero. Infinite 44s linear
 * loop; the content is duplicated so the -50% translate wraps seamlessly.
 * Mono micro-labels separated by small rotated blue squares.
 */

// Every line here is a claim a customer could hold us to, so each one has to be
// something AMG actually does today. "Worldwide coordination" was removed: the
// service area is the Southeast US and we should not imply otherwise.
const ITEMS = [
  "Calls returned same business day",
  "N-reg · Part 91",
  "Crew · credential-reviewed",
  "$0 markup · no vendor rebates",
  "First reply · within 24 hrs",
  "KTPA → KATL",
  "Ferry · repositioning",
  "Florida & the Southeast",
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
