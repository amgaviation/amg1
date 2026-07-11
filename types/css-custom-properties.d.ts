import "react";

/**
 * Allow CSS custom properties (e.g. `--d` stagger delays used by the Flight
 * Deck reveal system) as keys in React inline `style` objects without an
 * `as React.CSSProperties` cast at every call site.
 */
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
