import type { Variants } from "framer-motion";

export const motionEase = [0.22, 1, 0.36, 1] as const;

export const motionDuration = {
  fast: 0.22,
  medium: 0.62,
  slow: 1,
  hero: 2,
} as const;

export const motionStagger = {
  tight: 0.08,
  standard: 0.12,
} as const;

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0 },
};

export const leftRevealVariants: Variants = {
  hidden: { opacity: 0, x: -56 },
  visible: { opacity: 1, x: 0 },
};

export const rightRevealVariants: Variants = {
  hidden: { opacity: 0, x: 56 },
  visible: { opacity: 1, x: 0 },
};

export const scaleRevealVariants: Variants = {
  hidden: { opacity: 0, scale: 1.05 },
  visible: { opacity: 1, scale: 1 },
};
