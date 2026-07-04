/**
 * Earth for the pinned Global sequence — Atlantic-centered orthographic
 * view with simplified continent landmasses, sphere shading, terminator
 * and atmosphere glow. Each `.flight-arc` path carries pathLength=100 with
 * dasharray/dashoffset preset to 100 so GSAP can line-draw them on scrub.
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
        {/* ocean sphere: lit upper-left, falling off to a dark limb */}
        <radialGradient id="fd-globe-ocean" cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#16303F" />
          <stop offset="45%" stopColor="#0E2130" />
          <stop offset="80%" stopColor="#081321" />
          <stop offset="100%" stopColor="#050B14" />
        </radialGradient>
        {/* landmass: subtle relief lit from the same corner */}
        <radialGradient id="fd-globe-land" cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#3E5A54" />
          <stop offset="55%" stopColor="#2C4340" />
          <stop offset="100%" stopColor="#16242B" />
        </radialGradient>
        {/* night-side terminator sweeping in from the right */}
        <linearGradient id="fd-globe-night" x1="0%" y1="0%" x2="100%" y2="12%">
          <stop offset="55%" stopColor="#04070E" stopOpacity="0" />
          <stop offset="92%" stopColor="#04070E" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#04070E" stopOpacity="0.72" />
        </linearGradient>
        {/* thin sunlit rim on the lit side */}
        <radialGradient id="fd-globe-rim" cx="50%" cy="50%" r="50%">
          <stop offset="86%" stopColor="#9BE8CD" stopOpacity="0" />
          <stop offset="97%" stopColor="#9BE8CD" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#CFF7E6" stopOpacity="0.32" />
        </radialGradient>
        {/* atmosphere halo outside the limb */}
        <radialGradient id="fd-globe-atmo" cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="#00E887" stopOpacity="0" />
          <stop offset="88%" stopColor="#00E887" stopOpacity="0.1" />
          <stop offset="94%" stopColor="#3ED9A4" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#00E887" stopOpacity="0" />
        </radialGradient>
        <clipPath id="fd-globe-clip">
          <circle cx="400" cy="220" r="200" />
        </clipPath>
      </defs>

      {/* atmosphere */}
      <circle cx="400" cy="220" r="236" fill="url(#fd-globe-atmo)" />

      {/* ocean */}
      <circle cx="400" cy="220" r="200" fill="url(#fd-globe-ocean)" />

      {/* landmasses (stylized, Atlantic-centered orthographic) */}
      <g clipPath="url(#fd-globe-clip)" fill="url(#fd-globe-land)" stroke="#7FA99C" strokeOpacity="0.18" strokeWidth="1">
        {/* Greenland */}
        <path d="M352 66c10-8 28-10 38-3 8 6 8 17 2 24-8 9-24 12-33 6-8-6-13-19-7-27Z" />
        {/* North America */}
        <path d="M236 106c16-16 44-24 68-20 20-14 46-12 58-2 10 8 8 20-2 28 8 8 4 20-6 27 6 10-2 22-12 27 4 12-4 24-14 29 2 10-6 20-14 24-8 5-16 2-18-6-10-2-14-12-12-22-12-6-22-16-24-28-12-8-24-20-26-32-4-9-4-19 2-25Z" />
        {/* Central America bridge */}
        <path d="M312 232c10 2 20 8 24 16 3 7-2 13-10 12-9-1-19-8-22-16-2-7 2-13 8-12Z" />
        {/* South America */}
        <path d="M340 262c12-10 32-10 42 0 10 11 12 30 6 48-5 18-16 36-28 42-11 5-21-2-24-14-4-14-4-30-2-44 1-12 1-26 6-32Z" />
        {/* Iceland */}
        <path d="M428 92c6-4 14-3 17 2 2 5-2 10-9 11-6 1-12-2-13-6-1-4 2-6 5-7Z" />
        {/* Scandinavia + Europe */}
        <path d="M492 72c12-7 28-4 32 6 3 9-4 18-14 21-4 8-12 13-21 12-3 8-12 13-21 11-8-2-11-10-7-17 3-7 10-10 16-9 1-9 8-19 15-24Z" />
        <path d="M470 128c10-8 26-9 34-2 7 7 4 17-5 22-9 6-22 6-29-1-6-6-6-14 0-19Z" />
        {/* Africa */}
        <path d="M474 158c16-12 42-12 56 2 12 13 14 34 8 54-6 22-18 44-34 52-14 7-28 0-33-15-6-16-8-35-6-52 1-16 1-32 9-41Z" />
        {/* Middle East / Asia edge fading into the limb */}
        <path d="M544 108c20-12 44-10 54 4 9 13 4 28-8 36-12 9-30 9-42 1-11-8-14-31-4-41Z" opacity="0.75" />
        <path d="M560 168c14-4 28 2 32 12 3 9-4 17-14 18-11 1-22-5-26-14-3-8 1-14 8-16Z" opacity="0.6" />
      </g>

      {/* graticule, faint */}
      <g clipPath="url(#fd-globe-clip)" fill="none" stroke="#A9B4C6" strokeOpacity="0.1">
        <path d="M214 146a200 74 0 0 1 372 0" />
        <path d="M200 220h400" />
        <path d="M214 294a200 74 0 0 0 372 0" />
        <ellipse cx="400" cy="220" rx="66" ry="200" />
        <ellipse cx="400" cy="220" rx="132" ry="200" />
        <line x1="400" y1="20" x2="400" y2="420" />
      </g>

      {/* terminator + sunlit rim */}
      <circle cx="400" cy="220" r="200" fill="url(#fd-globe-night)" />
      <circle cx="400" cy="220" r="200" fill="url(#fd-globe-rim)" />
      <circle cx="400" cy="220" r="200" fill="none" stroke="#A9B4C6" strokeOpacity="0.18" />

      {/* orbital tick ring */}
      <circle cx="400" cy="220" r="216" fill="none" stroke="#00E887" strokeOpacity="0.14" strokeDasharray="2 10" />

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

      {/* radar sweep ticks */}
      <g stroke="#5F6C82" strokeOpacity="0.5">
        <line x1="400" y1="4" x2="400" y2="16" />
        <line x1="400" y1="424" x2="400" y2="436" />
        <line x1="184" y1="220" x2="196" y2="220" />
        <line x1="604" y1="220" x2="616" y2="220" />
      </g>
    </svg>
  );
}
