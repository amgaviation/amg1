/**
 * Wireframe globe with support-route arcs for the pinned Global sequence.
 * Each `.flight-arc` path carries pathLength=100 with dasharray/dashoffset
 * preset to 100 so GSAP can line-draw them to 0 on scrub.
 */
const ARC_STYLE = {
  strokeDasharray: 100,
  strokeDashoffset: 100,
} as const;

export default function Globe({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 440"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="fd-globe-glow" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#00E887" stopOpacity="0.1" />
          <stop offset="55%" stopColor="#00E887" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#070B14" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="400" cy="220" r="208" fill="url(#fd-globe-glow)" />
      <circle cx="400" cy="220" r="200" fill="none" stroke="#A9B4C6" strokeOpacity="0.22" />

      {/* parallels */}
      <g fill="none" stroke="#A9B4C6" strokeOpacity="0.14">
        <ellipse cx="400" cy="220" rx="200" ry="200" />
        <path d="M214 146a200 74 0 0 1 372 0" />
        <path d="M200 220h400" />
        <path d="M214 294a200 74 0 0 0 372 0" />
      </g>
      {/* meridians */}
      <g fill="none" stroke="#A9B4C6" strokeOpacity="0.14">
        <ellipse cx="400" cy="220" rx="66" ry="200" />
        <ellipse cx="400" cy="220" rx="132" ry="200" />
        <line x1="400" y1="20" x2="400" y2="420" />
      </g>
      {/* graticule dashes */}
      <circle cx="400" cy="220" r="216" fill="none" stroke="#00E887" strokeOpacity="0.18" strokeDasharray="2 10" />

      {/* support-route arcs (line-drawn on scrub) */}
      <g fill="none" strokeWidth="1.5" strokeLinecap="round">
        <path className="flight-arc" pathLength={100} style={ARC_STYLE} d="M258 160C320 60 480 60 545 152" stroke="#00E887" strokeOpacity="0.8" />
        <path className="flight-arc" pathLength={100} style={ARC_STYLE} d="M232 268c80-118 262-128 338-24" stroke="#00E887" strokeOpacity="0.55" />
        <path className="flight-arc" pathLength={100} style={ARC_STYLE} d="M300 330c56-70 156-76 216-14" stroke="#FFB02E" strokeOpacity="0.6" />
        <path className="flight-arc" pathLength={100} style={ARC_STYLE} d="M282 120c96-66 236-30 268 78" stroke="#A9B4C6" strokeOpacity="0.45" />
      </g>

      {/* endpoints */}
      <g fill="#00E887">
        <circle cx="258" cy="160" r="4" />
        <circle cx="545" cy="152" r="4" />
        <circle cx="232" cy="268" r="3.4" fillOpacity="0.8" />
        <circle cx="570" cy="244" r="3.4" fillOpacity="0.8" />
        <circle cx="300" cy="330" r="3" fill="#FFB02E" />
        <circle cx="516" cy="316" r="3" fill="#FFB02E" />
        <circle cx="282" cy="120" r="3" fill="#A9B4C6" />
        <circle cx="550" cy="198" r="3" fill="#A9B4C6" />
      </g>

      {/* radar sweep tick ring */}
      <g stroke="#5F6C82" strokeOpacity="0.5">
        <line x1="400" y1="4" x2="400" y2="16" />
        <line x1="400" y1="424" x2="400" y2="436" />
        <line x1="184" y1="220" x2="196" y2="220" />
        <line x1="604" y1="220" x2="616" y2="220" />
      </g>
    </svg>
  );
}
