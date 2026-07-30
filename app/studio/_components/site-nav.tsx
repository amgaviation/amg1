"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND, NAV_LINKS, QUOTE_MAILTO } from "@/lib/studio/brand";

/**
 * Sticky nav. Condenses (shorter, darker, hairline rule) once the hero is behind
 * you, and collapses its anchors into a disclosure below 820px.
 *
 * The three pips in the brand mark are the gear motif at its smallest — they lit
 * in sequence on load, which is why the mark reads as "3 green" rather than as a
 * decorative dot cluster.
 */
export function SiteNav() {
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setCondensed(window.scrollY > 48);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Escape closes the disclosure and returns focus to the control that opened it
  // — otherwise keyboard focus is stranded inside a hidden panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || toggleRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <header className="s-nav" data-condensed={condensed ? "true" : "false"}>
      <div className="s-shell s-nav-inner">
        <a href="#top" className="s-nav-mark">
          <span className="s-nav-pips" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="s-nav-name">
            <span className="s-nav-name-full">{BRAND.name}</span>
            <span className="s-nav-name-short">{BRAND.shortName}</span>
          </span>
        </a>

        <nav className="s-nav-links" aria-label="Sections">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="s-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="s-nav-actions">
          <a href={QUOTE_MAILTO} className="s-btn s-btn--primary s-btn--sm s-nav-cta">
            Start a project
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="s-nav-toggle"
            aria-expanded={open}
            aria-controls="studio-nav-panel"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="s-vh">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" data-open={open ? "true" : "false"}>
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      <div
        ref={panelRef}
        id="studio-nav-panel"
        className="s-nav-panel"
        data-open={open ? "true" : "false"}
        hidden={!open}
      >
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
        <a href={QUOTE_MAILTO} onClick={() => setOpen(false)}>
          Start a project
        </a>
      </div>
    </header>
  );
}
