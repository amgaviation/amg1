"use client";

import Link from "next/link";
import { Reveal } from "./fd-anim";

const STARTING_FEES = [
  { label: "Temporary pilot coverage coordination", amount: "Scope reviewed" },
  { label: "Maintenance ferry / repositioning coordination", amount: "Scope reviewed" },
  { label: "Flight-department overflow", amount: "Custom scope" },
] as const;

/** Public pricing intentionally states starting coordination fees only. */
export default function PricingManifest() {
  return (
    <section
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid var(--deck-line)",
        padding: "clamp(5.5rem,9vw,9rem) clamp(20px,4vw,52px)",
      }}
    >
      <div className="fd-manifest-grid" style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
        <Reveal>
          <span className="rv" style={{ "--d": "0s", display: "inline-block", fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 500, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--deck-ink-3)" }}>
            02 — Starting fees
          </span>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(34px,4vw,56px)", letterSpacing: "-0.02em", color: "var(--deck-ink)", margin: "14px 0 16px", lineHeight: 0.98 }}>
            <span className="rv-mask"><span className="rv-inner" style={{ "--d": "0.1s" }}>Clear coordination fees.</span></span>
            <span className="rv-mask"><span className="rv-inner" style={{ "--d": "0.2s" }}>Scope reviewed first.</span></span>
          </h2>
          <p className="rv" style={{ "--d": "0.3s", fontSize: 15.5, lineHeight: 1.65, color: "var(--deck-ink-2)", maxWidth: 460, margin: 0 }}>
            Fees cover AMG&apos;s coordination work. Aircraft ownership, operational control, crew acceptance, insurance, and any third-party costs remain subject to review and separate agreement.
          </p>
        </Reveal>

        <Reveal>
          <div className="rv" style={{ "--d": "0.15s", background: "#070D1A", border: "1px solid var(--sp-hair-strong)", borderRadius: 4, padding: "26px 30px 30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--sp-ink-3)" }}>
              <span>Support request</span><span>Manual review</span>
            </div>
            {STARTING_FEES.map((row, index) => (
              <div key={row.label} className="rv" style={{ "--d": `${0.25 + index * 0.1}s`, display: "flex", justifyContent: "space-between", gap: 20, padding: "16px 0", borderBottom: "1px solid var(--sp-hair)", fontSize: 14, color: "var(--sp-ink-2)" }}>
                <span>{row.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--sp-ink-1)", whiteSpace: "nowrap" }}>{row.amount}</span>
              </div>
            ))}
            <Link href="/request" className="fd-btn fd-btn-primary" style={{ marginTop: 24 }}>
              Request Support
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
