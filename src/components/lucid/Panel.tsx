import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  dense,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground overflow-hidden",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <div className="min-w-0">
            {title && (
              <h2 className="text-xs font-semibold tracking-tight uppercase font-mono">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn(dense ? "p-0" : "p-4")}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  delta,
  positive,
}: {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 p-4 border-r last:border-r-0 border-border">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-xl font-semibold tracking-tight tabular-nums">{value}</span>
      {delta && (
        <span
          className={cn(
            "text-[11px] font-mono",
            positive ? "text-success" : "text-destructive",
          )}
        >
          {positive ? "▲" : "▼"} {delta}
        </span>
      )}
    </div>
  );
}
