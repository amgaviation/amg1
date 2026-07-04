/**
 * Top-down engineering blueprint of a long-range business jet.
 * Stroke-only line work with dimension callouts — the crossfade target
 * for the photographic jet render in the mission deck sequence.
 */
export default function Blueprint({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 460 1160"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <marker id="fd-bp-arrow" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 8 4 0 8Z" fill="#5F6C82" />
        </marker>
      </defs>

      {/* light construction grid */}
      <g stroke="#A9B4C6" strokeOpacity="0.08">
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`v${i}`} x1={30 + i * 40} y1="20" x2={30 + i * 40} y2="1140" />
        ))}
        {Array.from({ length: 15 }, (_, i) => (
          <line key={`h${i}`} x1="20" y1={40 + i * 76} x2="440" y2={40 + i * 76} />
        ))}
      </g>

      {/* centerline */}
      <line x1="230" y1="30" x2="230" y2="1130" stroke="#00E887" strokeOpacity="0.35" strokeDasharray="10 6 2 6" />

      <g fill="none" stroke="#00E887" strokeOpacity="0.85" strokeWidth="1.6">
        {/* fuselage */}
        <path d="M230 60c14 0 26 24 30 68l6 100 4 300-2 330-6 130c-4 46-18 82-32 82s-28-36-32-82l-6-130-2-330 4-300 6-100c4-44 16-68 30-68Z" />
        {/* cockpit windows */}
        <path d="M214 150c4-18 10-28 16-28s12 10 16 28" strokeOpacity="0.55" />
        <path d="M212 168h36" strokeOpacity="0.4" />
        {/* main wings */}
        <path d="M258 470l160 176c8 9 12 18 12 29v40c0 8-6 11-13 7l-159-96" />
        <path d="M202 470 42 646c-8 9-12 18-12 29v40c0 8 6 11 13 7l159-96" />
        {/* winglets */}
        <path d="M430 675v46c0 10-4 13-10 6l-8-10" strokeOpacity="0.6" />
        <path d="M30 675v46c0 10 4 13 10 6l8-10" strokeOpacity="0.6" />
        {/* rear engines */}
        <path d="M262 900c0-12 8-20 18-20s18 8 18 20v70c0 12-8 20-18 20s-18-8-18-20v-70Z" />
        <path d="M198 900c0-12-8-20-18-20s-18 8-18 20v70c0 12 8 20 18 20s18-8 18-20v-70Z" />
        {/* T-tail horizontal stabilizer */}
        <path d="M244 1024l96 62c7 5 10 11 10 19v18c0 7-5 9-11 5l-95-56" />
        <path d="M216 1024l-96 62c-7 5-10 11-10 19v18c0 7 5 9 11 5l95-56" />
        {/* vertical stabilizer root */}
        <path d="M222 1010h16l6 96h-28l6-96Z" strokeOpacity="0.6" />
      </g>

      {/* cabin frames */}
      <g stroke="#A9B4C6" strokeOpacity="0.3">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`f${i}`} x1="204" y1={260 + i * 64} x2="256" y2={260 + i * 64} />
        ))}
      </g>

      {/* dimension: wingspan */}
      <g stroke="#5F6C82" strokeOpacity="0.7" strokeWidth="1">
        <line x1="30" y1="770" x2="430" y2="770" markerStart="url(#fd-bp-arrow)" markerEnd="url(#fd-bp-arrow)" />
        <line x1="30" y1="726" x2="30" y2="782" strokeDasharray="3 4" />
        <line x1="430" y1="726" x2="430" y2="782" strokeDasharray="3 4" />
      </g>
      <text x="230" y="762" textAnchor="middle" fill="#5F6C82" fontFamily="var(--font-mono, monospace)" fontSize="13" letterSpacing="3">
        SPAN
      </text>

      {/* dimension: length */}
      <g stroke="#5F6C82" strokeOpacity="0.7" strokeWidth="1">
        <line x1="404" y1="60" x2="404" y2="1130" markerStart="url(#fd-bp-arrow)" markerEnd="url(#fd-bp-arrow)" />
      </g>
      <text x="418" y="600" fill="#5F6C82" fontFamily="var(--font-mono, monospace)" fontSize="13" letterSpacing="3" transform="rotate(90 418 600)">
        LOA
      </text>

      {/* title block */}
      <g fontFamily="var(--font-mono, monospace)" fill="#5F6C82" fontSize="12" letterSpacing="2.5">
        <text x="36" y="70">AMG // MISSION DECK</text>
        <text x="36" y="90" fillOpacity="0.7">PLANFORM REF 01</text>
      </g>
    </svg>
  );
}
