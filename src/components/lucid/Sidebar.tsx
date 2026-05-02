import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Activity, Youtube, Sparkles, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/habits", label: "Habits", icon: Activity },
  { to: "/youtube", label: "YouTube", icon: Youtube },
  { to: "/projects", label: "AI Projects", icon: Sparkles },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex md:w-56 lg:w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="h-14 flex items-center px-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-sm bg-primary grid place-items-center">
            <div className="h-2 w-2 rounded-[1px] bg-primary-foreground" />
          </div>
          <span className="font-mono text-sm tracking-tight font-semibold">LUCID</span>
          <span className="font-mono text-[10px] text-muted-foreground ml-1">v1.0</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <div className="mt-3 px-2.5 flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/40 grid place-items-center text-[11px] font-semibold text-primary-foreground">
            JS
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Operator</div>
            <div className="text-[10px] font-mono text-muted-foreground truncate">online</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
