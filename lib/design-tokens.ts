export const AMG_BRAND_COLORS = {
  midnightNavy: "#050B14",
  deepBlue: "#07111F",
  accentBlue: "#3B82F6",
  slateGray: "#9CA3AF",
  lightGray: "#C0C7D1",
  white: "#FFFFFF",
} as const;

export const AMG_INTERFACE_TOKENS = {
  surface: {
    background: "var(--amg-bg)",
    backgroundMuted: "var(--amg-bg-muted)",
    backgroundElevated: "var(--amg-bg-elevated)",
    backgroundGlass: "var(--amg-bg-glass)",
    backgroundPortal: "var(--amg-bg-portal)",
    backgroundFooter: "var(--amg-bg-footer)",
  },
  text: {
    primary: "var(--amg-text-primary)",
    secondary: "var(--amg-text-secondary)",
    muted: "var(--amg-text-muted)",
    subtle: "var(--amg-text-subtle)",
    inverse: "var(--amg-text-inverse)",
    accent: "var(--amg-text-accent)",
  },
  border: {
    default: "var(--amg-border-default)",
    muted: "var(--amg-border-muted)",
    strong: "var(--amg-border-strong)",
    accent: "var(--amg-border-accent)",
    glass: "var(--amg-border-glass)",
  },
  radius: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
  },
  shadow: {
    panel: "0 24px 80px rgba(0, 0, 0, 0.28)",
    lift: "0 18px 50px rgba(5, 11, 20, 0.22)",
  },
  motion: {
    fast: "160ms",
    base: "240ms",
    reveal: "720ms",
    cinematic: "3200ms",
    easeOut: "cubic-bezier(0.22, 1, 0.36, 1)",
    easeInOut: "cubic-bezier(0.76, 0, 0.24, 1)",
  },
} as const;
