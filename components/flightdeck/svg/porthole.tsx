/**
 * Aircraft cabin window (porthole) frame. The aperture is a transparent
 * rounded-rect cut out of the bulkhead panel so the sky layer shows
 * through from behind. Geometry matches the sky aperture in hero.tsx:
 * viewBox 600x860, aperture 380x580 centered, radius 46%/40%.
 */
export default function Porthole({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 860"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="fd-porthole-bezel" cx="50%" cy="46%" r="62%">
          <stop offset="62%" stopColor="#0A1322" />
          <stop offset="88%" stopColor="#0E1B2E" />
          <stop offset="100%" stopColor="#070B14" />
        </radialGradient>
      </defs>

      {/* bulkhead panel with aperture cut out */}
      <path
        fillRule="evenodd"
        fill="url(#fd-porthole-bezel)"
        d="M0 0h600v860H0V0Zm300 140c-96 0-190 52-190 232v116c0 180 94 232 190 232s190-52 190-232V372c0-180-94-232-190-232Z"
      />

      {/* outer bezel ring */}
      <path
        d="M300 128c-102 0-202 56-202 244v116c0 188 100 244 202 244s202-56 202-244V372c0-188-100-244-202-244Z"
        fill="none"
        stroke="#A9B4C6"
        strokeOpacity="0.28"
        strokeWidth="2"
      />
      {/* inner bezel ring hugging the aperture */}
      <path
        d="M300 148c-92 0-182 50-182 224v116c0 174 90 224 182 224s182-50 182-224V372c0-174-90-224-182-224Z"
        fill="none"
        stroke="#00E887"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />

      {/* rivets around the bezel */}
      {[
        [300, 118],
        [178, 176],
        [104, 320],
        [92, 470],
        [104, 620],
        [178, 742],
        [300, 796],
        [422, 742],
        [496, 620],
        [508, 470],
        [496, 320],
        [422, 176],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="4"
          fill="#5F6C82"
          fillOpacity="0.55"
        />
      ))}

      {/* HUD corner ticks */}
      <path d="M36 36h26M36 36v26" stroke="#00E887" strokeOpacity="0.6" strokeWidth="1.5" fill="none" />
      <path d="M564 824h-26M564 824v-26" stroke="#00E887" strokeOpacity="0.6" strokeWidth="1.5" fill="none" />

      {/* window shade rail hint */}
      <path
        d="M212 132c26-10 56-16 88-16s62 6 88 16"
        stroke="#A9B4C6"
        strokeOpacity="0.2"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
