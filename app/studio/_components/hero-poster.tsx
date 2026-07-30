/**
 * The static frame of the hero scope.
 *
 * This is not a placeholder — it is the shipped artwork for anyone who never
 * gets the canvas: reduced-motion visitors, no-JS visitors, and everyone during
 * the first moments before the scene is mounted. Inline SVG so it costs one
 * paint and no network request, and so the hero is complete-looking at first
 * byte rather than a dark rectangle waiting for script.
 */
export function HeroPoster({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const rings = [0.25, 0.5, 0.75, 1];
  const bearings = Array.from({ length: 12 }, (_, i) => i * 30);
  // Fixed sample traffic — the same picture the canvas paints, frozen.
  const tracks = [
    { x: 118, y: 96, r: -22 },
    { x: 268, y: 62, r: 148 },
    { x: 322, y: 178, r: -108 },
    { x: 96, y: 214, r: 34 },
    { x: 212, y: 246, r: 196 },
    { x: 368, y: 122, r: 62 },
  ];

  return (
    <svg
      viewBox="0 0 480 320"
      className={className}
      style={style}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="s-scope-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3bf08a" stopOpacity="0.16" />
          <stop offset="60%" stopColor="#3bf08a" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#3bf08a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="s-scope-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3bf08a" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#3bf08a" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="480" height="320" fill="url(#s-scope-glow)" />

      <g transform="translate(240 160)">
        {/* Sweep wedge, held at its 10-o'clock position. */}
        <path d="M0 0 L-208 -78 A222 138 0 0 1 -186 -112 Z" fill="url(#s-scope-sweep)" />
        <line x1="0" y1="0" x2="-206" y2="-80" stroke="#3bf08a" strokeOpacity="0.42" strokeWidth="1" />

        {rings.map((scale, index) => (
          <ellipse
            key={scale}
            rx={220 * scale}
            ry={136 * scale}
            fill="none"
            stroke="#7ad2a5"
            strokeOpacity={index === rings.length - 1 ? 0.3 : 0.17}
            strokeWidth="1"
            strokeDasharray={index % 2 === 0 ? "3 7" : undefined}
          />
        ))}

        {bearings.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const long = deg % 90 === 0;
          const inner = long ? 0.9 : 0.955;
          return (
            <line
              key={deg}
              x1={Math.cos(rad) * 220 * inner}
              y1={Math.sin(rad) * 136 * inner}
              x2={Math.cos(rad) * 220}
              y2={Math.sin(rad) * 136}
              stroke="#7ad2a5"
              strokeOpacity="0.3"
              strokeWidth="1"
            />
          );
        })}
      </g>

      {tracks.map((track) => (
        <g key={`${track.x}-${track.y}`} transform={`translate(${track.x} ${track.y}) rotate(${track.r})`}>
          <path d="M5 0 L-3.5 3 L-3.5 -3 Z" fill="#3bf08a" fillOpacity="0.72" />
          <line x1="0" y1="0" x2="14" y2="0" stroke="#3bf08a" strokeOpacity="0.3" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}
