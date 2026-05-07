// The "V" mark from the UX: a small circle (top-left dot) and a slanted
// rounded-rect bar. Color is configurable per screen.
export const DermoLogo = ({
  className = "",
  color = "#8d77ab",
  size = 40,
}: {
  className?: string;
  color?: string;
  size?: number;
}) => (
  <svg
    viewBox="0 0 180 200"
    width={size}
    height={size * (200 / 180)}
    className={className}
    aria-label="Dermo"
  >
    {/* dot */}
    <circle cx="35" cy="55" r="29" fill={color} />
    {/* slanted pill */}
    <rect
      x="78"
      y="12"
      width="56"
      height="180"
      rx="28"
      fill={color}
      transform="rotate(30 106 102)"
    />
  </svg>
);
