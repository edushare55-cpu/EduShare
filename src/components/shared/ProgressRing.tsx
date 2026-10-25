interface ProgressRingProps {
  size?:      number;   // SVG diameter in px (default 48)
  strokeWidth?: number; // Ring width (default 4)
  percent:    number;   // 0–100
  color?:     string;   // Tailwind-compatible stroke color class or CSS value
  trackColor?: string;
  children?:  React.ReactNode;
}

/**
 * ProgressRing — SVG circular progress indicator.
 * Reusable across lesson cards, assessment status, etc.
 */
export function ProgressRing({
  size       = 48,
  strokeWidth = 4,
  percent,
  color      = "#00236f",
  trackColor = "#e6e8ea",
  children,
}: ProgressRingProps) {
  const radius      = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset      = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
