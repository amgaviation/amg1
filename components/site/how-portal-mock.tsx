/**
 * Abstract, CSS-only mission-file mock for the "Inside AMG Connect" section —
 * the page-scale echo of the home page's stylized console illustration
 * (components/flightdeck/connect.tsx). It renders hairline rows, mono field
 * labels and skeleton bars only: no tail numbers, names, amounts or any other
 * real-looking data are fabricated. Field labels are placeholders, values are
 * deliberately blank skeleton blocks, and the panel is labelled as illustrative.
 *
 * Server component (no interactivity); it lives inside PortalScreenshotFrame's
 * browser chrome and gives this page its own portal visual rather than the five
 * text cards alone describing something the reader can't see.
 */
const STAGES = [
  { label: "Submitted", state: "done" },
  { label: "Quoted", state: "done" },
  { label: "Crew", state: "done" },
  { label: "In flight", state: "live" },
] as const;

const VAULT = ["Agreement", "Invoice", "Insurance"] as const;

function SkeletonBar({ w }: { w: string }) {
  return (
    <span
      className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(169,180,198,0.22),rgba(169,180,198,0.08))]"
      style={{ width: w }}
      aria-hidden="true"
    />
  );
}

export function HowPortalMock() {
  return (
    <div className="text-[var(--oc-aluminum)]" role="img" aria-label="Illustrative preview of a mission file in the AMG Connect portal">
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-[rgba(169,180,198,0.14)] pb-3">
        <span className="font-mono text-[10px] uppercase [letter-spacing:0.16em] text-[var(--instrument-ink)]">
          Mission file
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--instrument-ink)]" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase [letter-spacing:0.16em] text-[var(--oc-aluminum-2)]">
            Link active
          </span>
        </span>
      </div>

      {/* Stage stepper — echoes the four steps above */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {STAGES.map((stage) => (
          <div key={stage.label} className="flex flex-col items-center gap-1.5">
            <span
              className={
                stage.state === "live"
                  ? "h-2 w-2 rounded-full bg-[var(--amber)] shadow-[0_0_0_3px_rgba(255,176,46,0.16)]"
                  : "h-2 w-2 rounded-full bg-[var(--instrument)] shadow-[0_0_0_3px_rgba(48,138,255,0.14)]"
              }
              aria-hidden="true"
            />
            <span className="font-mono text-[8px] uppercase [letter-spacing:0.1em] text-[var(--oc-aluminum-2)]">
              {stage.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-px bg-[linear-gradient(90deg,var(--instrument),rgba(48,138,255,0.06))]" aria-hidden="true" />

      {/* Document vault — skeleton rows, no data */}
      <p className="mt-4 font-mono text-[9px] uppercase [letter-spacing:0.16em] text-[var(--oc-aluminum-2)]">
        Document vault
      </p>
      <div className="mt-2 grid gap-2">
        {VAULT.map((label) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 border border-[rgba(169,180,198,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-2.5"
          >
            <span className="font-mono text-[10px] text-[var(--oc-aluminum-2)]">{label}</span>
            <span className="flex flex-1 items-center gap-2">
              <SkeletonBar w="42%" />
              <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full border border-[rgba(48,138,255,0.4)] text-[var(--instrument-ink)]" aria-hidden="true">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" />
                </svg>
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Message thread — skeleton lines */}
      <div className="mt-3 border border-[rgba(169,180,198,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-3">
        <span className="font-mono text-[9px] uppercase [letter-spacing:0.16em] text-[var(--oc-aluminum-2)]">
          Mission thread
        </span>
        <div className="mt-2.5 grid gap-2">
          <span className="flex items-center gap-2">
            <span className="font-mono text-[8px] uppercase [letter-spacing:0.1em] text-[var(--instrument-ink)]">AMG</span>
            <SkeletonBar w="64%" />
          </span>
          <span className="flex items-center gap-2">
            <span className="font-mono text-[8px] uppercase [letter-spacing:0.1em] text-[var(--oc-aluminum-2)]">You</span>
            <SkeletonBar w="48%" />
          </span>
        </div>
      </div>

      {/* Reminder chip */}
      <div className="mt-3 flex items-center gap-2.5 border border-[rgba(255,176,46,0.22)] bg-[rgba(255,176,46,0.05)] px-3 py-2.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--amber)]" aria-hidden="true" />
        <span className="font-mono text-[9px] uppercase [letter-spacing:0.16em] text-[var(--amber)]">Reminder</span>
        <SkeletonBar w="40%" />
      </div>

      <p className="mt-4 text-right font-mono text-[9px] uppercase [letter-spacing:0.14em] text-[var(--oc-aluminum-2)]">
        Illustrative preview — not live data
      </p>
    </div>
  );
}
