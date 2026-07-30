"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Interactive demo — aircraft and instructor scheduling.
 *
 * SAMPLE DATA ONLY. Every tail number, name and slot below is fictional and is
 * generated in this file; there is no backend, no network call, and no shared
 * state. Nothing here reflects a real operator's schedule.
 *
 * The dates are a fixed sample week rather than "today + 5". That is a
 * deliberate choice: a demo built on the real clock would either render
 * differently on the server than on the client (hydration mismatch) or drift
 * into showing an empty past. A frozen week is honest — it is labelled sample
 * data — and it is stable.
 *
 * Keyboard: resource, day and slot are all native radio groups, so arrow keys,
 * Home/End and screen-reader announcements work without a line of JS.
 */

type Resource = {
  id: string;
  label: string;
  detail: string;
  kind: "Aircraft" | "Instructor";
};

const RESOURCES: Resource[] = [
  { id: "n4521g", label: "C172", detail: "N4521G", kind: "Aircraft" },
  { id: "n83t", label: "PA-28", detail: "N83T", kind: "Aircraft" },
  { id: "n512ds", label: "SR20", detail: "N512DS", kind: "Aircraft" },
  { id: "rivera", label: "CFI", detail: "J. Rivera", kind: "Instructor" },
];

const DAYS = [
  { id: "mon", dow: "Mon", date: "06" },
  { id: "tue", dow: "Tue", date: "07" },
  { id: "wed", dow: "Wed", date: "08" },
  { id: "thu", dow: "Thu", date: "09" },
  { id: "fri", dow: "Fri", date: "10" },
];

const SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

/** Stable 32-bit string hash — same answer on the server and in the browser. */
function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** ~30% of slots are already spoken for, deterministically. */
function isFree(resourceId: string, dayId: string, slot: string) {
  return hash(`${resourceId}|${dayId}|${slot}`) % 10 > 2;
}

function confirmationCode(resourceId: string, dayId: string, slot: string) {
  return `3G-${(hash(`${resourceId}${dayId}${slot}`) % 9000) + 1000}`;
}

type Phase = "idle" | "reserving" | "confirmed";

export function BookingDemo() {
  const uid = useId();
  const [resourceId, setResourceId] = useState(RESOURCES[0].id);
  const [dayId, setDayId] = useState(DAYS[1].id);
  const [slot, setSlot] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const resource = RESOURCES.find((r) => r.id === resourceId) ?? RESOURCES[0];
  const day = DAYS.find((d) => d.id === dayId) ?? DAYS[0];

  const availability = useMemo(
    () => SLOTS.map((s) => ({ slot: s, free: isFree(resourceId, dayId, s) })),
    [resourceId, dayId],
  );

  const freeCount = availability.filter((s) => s.free).length;

  // Changing resource or day invalidates the pending selection rather than
  // silently carrying a now-unavailable time across.
  const pick = (next: Partial<{ resourceId: string; dayId: string }>) => {
    if (next.resourceId) setResourceId(next.resourceId);
    if (next.dayId) setDayId(next.dayId);
    setSlot(null);
    setPhase("idle");
  };

  const reserve = () => {
    if (!slot || phase !== "idle") return;
    setPhase("reserving");
    // Stands in for a round trip. In-memory only; nothing is persisted.
    timer.current = setTimeout(() => setPhase("confirmed"), 650);
  };

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setSlot(null);
    setPhase("idle");
  };

  if (phase === "confirmed" && slot) {
    return (
      <div className="s-demo">
        <DemoHead title="Schedule" subtitle="Booking & scheduling" />
        <div className="s-demo-body s-booking-done" role="status">
          <div className="s-booking-tick" aria-hidden="true">
            <span />
          </div>
          <p className="s-mono s-booking-code">{confirmationCode(resourceId, dayId, slot)}</p>
          <p className="s-booking-line">
            {resource.label} <strong>{resource.detail}</strong> reserved for{" "}
            <strong>
              {day.dow} {day.date}
            </strong>{" "}
            at <strong>{slot}</strong> · 1.0 hr block
          </p>
          <p className="s-booking-note">
            Confirmation and calendar invite would be emailed on a live system.
          </p>
          <button type="button" className="s-btn s-btn--ghost s-btn--sm" onClick={reset}>
            Book another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="s-demo">
      <DemoHead title="Schedule" subtitle="Booking & scheduling" />

      <div className="s-demo-body">
        <fieldset className="s-field">
          <legend className="s-legend">Resource</legend>
          <div className="s-opt-row">
            {RESOURCES.map((item) => (
              <label key={item.id} className="s-opt">
                <input
                  className="s-vh"
                  type="radio"
                  name={`${uid}-resource`}
                  value={item.id}
                  checked={item.id === resourceId}
                  onChange={() => pick({ resourceId: item.id })}
                />
                <span>
                  <span className="s-opt-lead">{item.label}</span>
                  <span className="s-opt-sub">{item.detail}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="s-field">
          <legend className="s-legend">Date · sample week</legend>
          <div className="s-opt-row">
            {DAYS.map((item) => (
              <label key={item.id} className="s-opt s-opt--day">
                <input
                  className="s-vh"
                  type="radio"
                  name={`${uid}-day`}
                  value={item.id}
                  checked={item.id === dayId}
                  onChange={() => pick({ dayId: item.id })}
                />
                <span>
                  <span className="s-opt-sub">{item.dow}</span>
                  <span className="s-opt-lead">{item.date}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="s-field">
          <legend className="s-legend">
            Available times
            <span className="s-legend-count">
              {freeCount} of {SLOTS.length} open
            </span>
          </legend>
          <div className="s-slot-grid">
            {availability.map(({ slot: time, free }) => (
              <label key={time} className="s-slot" data-free={free ? "true" : "false"}>
                <input
                  className="s-vh"
                  type="radio"
                  name={`${uid}-slot`}
                  value={time}
                  disabled={!free}
                  checked={slot === time}
                  onChange={() => setSlot(time)}
                />
                <span aria-hidden={free ? undefined : "true"}>{time}</span>
                {free ? null : <span className="s-vh">{time} unavailable</span>}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="s-booking-foot">
          <p className="s-mono s-booking-summary" id={`${uid}-summary`}>
            {slot
              ? `${resource.label} ${resource.detail} · ${day.dow} ${day.date} · ${slot}`
              : "Select a time to continue"}
          </p>
          <button
            type="button"
            className="s-btn s-btn--primary s-btn--sm"
            onClick={reserve}
            disabled={!slot || phase === "reserving"}
            aria-describedby={`${uid}-summary`}
          >
            {phase === "reserving" ? "Reserving…" : "Book slot"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DemoHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="s-demo-head">
      <div>
        <p className="s-mono s-demo-sub">{subtitle}</p>
        <h3 className="s-demo-title">{title}</h3>
      </div>
      <span className="s-demo-tag">Interactive demo — sample data</span>
    </div>
  );
}
