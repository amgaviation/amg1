"use client";

import { useState } from "react";

const CUSTOM_HERO_IMAGE = "/images/amg-custom/hero-aircraft-operations.jpg";
const FALLBACK_HERO_IMAGE = "/images/hero-jet-poster.jpg";

export function HeroPortalImage() {
  const [src, setSrc] = useState(CUSTOM_HERO_IMAGE);

  return (
    <img
      src={src}
      alt="Private aircraft positioned for AMG operational support coordination"
      className="h-full w-full object-cover"
      onError={() => {
        if (src !== FALLBACK_HERO_IMAGE) {
          setSrc(FALLBACK_HERO_IMAGE);
        }
      }}
    />
  );
}
