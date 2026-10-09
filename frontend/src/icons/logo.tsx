export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="go-chat logo">
      <rect x="1" y="1" width="30" height="30" fill="var(--fg)" />
      <rect x="5" y="5" width="14" height="10" fill="var(--bg)" />
      <rect x="5" y="18" width="22" height="2" fill="var(--accent)" />
      <rect x="5" y="22" width="16" height="2" fill="var(--bg)" />
      <polygon points="13,15 19,12 19,18" fill="var(--accent)" />
    </svg>
  )
}
