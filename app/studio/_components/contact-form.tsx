"use client";

import { useId, useState } from "react";
import { BRAND } from "@/lib/studio/brand";

/**
 * Contact path — real, not simulated.
 *
 * There is no form backend yet (Tony has not chosen one), so this form does the
 * only honest thing a keyless static page can: it composes the message and hands
 * it to the visitor's own mail client. Nothing is transmitted from this page, no
 * request is made, and the UI says so in plain words above the button. A
 * pretend "Thanks, we'll be in touch!" over a submit that goes nowhere would be
 * a lie, and this page is a portfolio piece about not lying.
 *
 * To swap in a real backend later: replace `handleSubmit` with a POST to the
 * service endpoint and add a genuine pending/success/error state. The fields
 * below are already the ones a quote needs.
 */

const PROJECT_TYPES = [
  "Marketing website",
  "Booking & scheduling",
  "Client or member portal",
  "Payments & billing (Stripe)",
  "Ops dashboard / admin tools",
  "Care plan for an existing site",
  "Not sure yet",
];

export function ContactForm() {
  const uid = useId();
  const [handedOff, setHandedOff] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const business = String(data.get("business") ?? "").trim();
    const type = String(data.get("type") ?? "").trim();
    const detail = String(data.get("detail") ?? "").trim();

    const body = [
      `Name: ${name}`,
      `Business: ${business || "—"}`,
      `Needs: ${type}`,
      "",
      detail,
      "",
      "— sent from 3greenstudios.com",
    ].join("\n");

    const href = `mailto:${BRAND.email}?subject=${encodeURIComponent(
      `Project enquiry — ${business || name}`,
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = href;
    setHandedOff(true);
  };

  return (
    <form className="s-form" onSubmit={handleSubmit}>
      <div className="s-form-grid">
        <div className="s-form-row">
          <label className="s-legend" htmlFor={`${uid}-name`}>
            Your name
          </label>
          <input id={`${uid}-name`} name="name" type="text" required autoComplete="name" />
        </div>
        <div className="s-form-row">
          <label className="s-legend" htmlFor={`${uid}-business`}>
            Business
          </label>
          <input
            id={`${uid}-business`}
            name="business"
            type="text"
            autoComplete="organization"
            placeholder="Flight school, FBO, MRO…"
          />
        </div>
      </div>

      <div className="s-form-row">
        <label className="s-legend" htmlFor={`${uid}-type`}>
          What do you need
        </label>
        <select id={`${uid}-type`} name="type" defaultValue={PROJECT_TYPES[0]}>
          {PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="s-form-row">
        <label className="s-legend" htmlFor={`${uid}-detail`}>
          The short version
        </label>
        <textarea
          id={`${uid}-detail`}
          name="detail"
          rows={4}
          required
          placeholder="What you run, what it has to do, and any date you're working toward."
        />
      </div>

      <p className="s-form-note" id={`${uid}-note`}>
        This opens your email app with the details filled in. Nothing is sent from
        this page — no form service, no tracking.
      </p>

      <div className="s-form-foot">
        <button type="submit" className="s-btn s-btn--primary" aria-describedby={`${uid}-note`}>
          Compose the email
        </button>
        <p className="s-mono s-form-alt" role="status">
          {handedOff
            ? "Handed off to your email app. If nothing opened, use the address below."
            : "Or write directly — the address is below."}
        </p>
      </div>
    </form>
  );
}
