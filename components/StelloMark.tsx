// The mark: an S built from bars, with the middle one cut loose and coloured.
//
// Top and bottom stay attached to their stems — the pledge on its way in, and on its way
// back. The middle bar is the money while it is held: set apart, and the only part in colour.
//
// The accent is a CSS variable rather than a fixed fill so the mark can collapse to a single
// colour on a green background, where the green bar would otherwise vanish.

interface Props {
  /** Rendered size in pixels. Drawn on a 64-unit grid, so it scales cleanly. */
  size?: number;
  /** Single-colour rendering — for green backgrounds and print. */
  mono?: boolean;
  className?: string;
}

export default function StelloMark({ size = 20, mono = false, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      style={mono ? { ["--mark-accent" as string]: "currentColor" } : undefined}
    >
      {/* Body: top bar + upper-left stem, bottom bar + lower-right stem. */}
      <path d="M8 6h48v10H8zM8 16h10v10H8zM46 38h10v10H46zM8 48h48v10H8z" fill="currentColor" />
      {/* The held money. Kept clear of both stems so the gap reads at 16px. */}
      <rect x="22" y="27" width="20" height="10" fill="var(--mark-accent, #fdda24)" />
    </svg>
  );
}
