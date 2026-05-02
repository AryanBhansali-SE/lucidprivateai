import { cn } from "@/lib/utils";

/**
 * Hairline radial progress ring. Pure SVG, no gradient, brushed gold stroke.
 */
export function RadialScore({
  value, // 0..100
  size = 120,
  stroke = 2,
  showValue = true,
  label,
  sublabel,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  showValue?: boolean;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="var(--color-hairline)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="var(--color-gold)"
            strokeWidth={stroke}
            strokeLinecap="butt"
            fill="none"
            strokeDasharray={`${dash} ${c - dash}`}
            style={{ transition: "stroke-dasharray 600ms ease" }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="font-serif text-bone leading-none num" style={{ fontSize: size * 0.32 }}>
                {Math.round(pct)}
              </div>
              {label && <div className="label-cap mt-1.5">{label}</div>}
            </div>
          </div>
        )}
      </div>
      {sublabel && <div className="mt-2 label-cap text-center">{sublabel}</div>}
    </div>
  );
}
