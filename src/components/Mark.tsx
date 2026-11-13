/** The Unveil mark: a Lebanese triple arch with a parted veil. */
export function Mark({ className = "", size, label }: { className?: string; size?: number; label?: string }) {
  return (
    <svg className={`mark ${className}`} viewBox="0 0 120 112" width={size} role={label ? "img" : undefined}
      aria-label={label} aria-hidden={label ? undefined : true}>
      <path className="arch" d="M16 100 V66 A12 12 0 0 1 40 66 V100" />
      <path className="arch" d="M80 100 V66 A12 12 0 0 1 104 66 V100" />
      <path className="arch" d="M45 100 V44 A15 15 0 0 1 75 44 V100" />
      <path className="drape" d="M60 30 C55 48, 52 70, 48.5 99" />
      <path className="drape" d="M60 30 C65 48, 68 70, 71.5 99" />
      <path className="base" d="M8 100 H112" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className} style={{ fontFamily: "var(--display)", fontStyle: "italic", whiteSpace: "nowrap" }}>
      Unveil<span style={{ color: "var(--champagne)", fontStyle: "normal" }}>.</span>
    </span>
  );
}
