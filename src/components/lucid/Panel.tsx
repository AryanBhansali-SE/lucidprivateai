import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "border border-border bg-card rounded-sm overflow-hidden",
        className,
      )}
    >
      {(title || action || eyebrow) && (
        <header className="flex items-baseline justify-between gap-4 px-5 py-4 border-b border-border">
          <div className="min-w-0">
            {eyebrow && <div className="label-cap mb-1">{eyebrow}</div>}
            {title && (
              <h2 className="font-serif text-[18px] leading-none text-bone truncate">
                {title}
              </h2>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  unit,
  hint,
  positive,
  negative,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-cap">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-serif text-[34px] leading-none num",
            positive && "text-gold",
            negative && "text-destructive",
            !positive && !negative && "text-bone",
          )}
        >
          {value}
        </span>
        {unit && <span className="text-ash text-sm font-mono">{unit}</span>}
      </div>
      {hint && <span className="text-[11px] text-ash font-mono">{hint}</span>}
    </div>
  );
}

export function KPIBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="label-cap">{label}</span>
          <span className="font-mono text-xs text-bone tabular">{pct}%</span>
        </div>
      )}
      <div className="h-[3px] w-full bg-graphite overflow-hidden">
        <div
          className="h-full brushed-gold transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
