import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Grid3x3, Target, BookText, Settings, ChevronsLeft, ChevronsRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoles } from "@/lib/use-roles";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  glyph: string;
}

const NAV: NavItem[] = [
  { to: "/pulse", label: "Pulse", icon: LayoutDashboard, glyph: "I" },
  { to: "/matrix", label: "Habit Matrix", icon: Grid3x3, glyph: "II" },
  { to: "/goals", label: "Objectives", icon: Target, glyph: "III" },
  { to: "/journal", label: "Journal", icon: BookText, glyph: "IV" },
];

const ADMIN_NAV: NavItem = {
  to: "/admin",
  label: "Sovereign",
  icon: ShieldCheck,
  glyph: "Σ",
};

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { isSuperAdmin } = useRoles();
  const items = isSuperAdmin ? [...NAV, ADMIN_NAV] : NAV;

  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200",
        collapsed ? "w-[60px]" : "w-[220px]",
      )}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        {collapsed ? (
          <div className="w-full grid place-items-center">
            <span className="font-serif italic text-gold text-xl tracking-tight">L</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="font-serif italic text-gold text-2xl leading-none">Lucid</span>
            <span className="font-mono text-[9px] text-ash uppercase tracking-[0.2em]">
              Private
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-2">
        {!collapsed && (
          <div className="px-3 mb-3 label-cap">Operations</div>
        )}
        <ul className="space-y-px">
          {NAV.map((item) => {
            const active = path.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-sm transition-colors relative",
                    active
                      ? "bg-graphite text-bone"
                      : "text-ash hover:text-bone hover:bg-graphite/50",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-px bg-gold" />
                  )}
                  <span
                    className={cn(
                      "font-mono text-[10px] tracking-wider w-6 shrink-0 text-center",
                      active ? "text-gold" : "text-ash/60",
                    )}
                  >
                    {item.glyph}
                  </span>
                  {!collapsed && (
                    <span className="text-[13px] font-medium tracking-tight">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: settings + collapse */}
      <div className="border-t border-border p-2 space-y-px">
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-sm text-ash hover:text-bone hover:bg-graphite/50 transition-colors",
            path.startsWith("/settings") && "bg-graphite text-bone",
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-3.5 w-3.5 shrink-0" strokeWidth={1.25} />
          {!collapsed && <span className="text-[13px]">Settings</span>}
        </Link>
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-ash hover:text-bone hover:bg-graphite/50 transition-colors"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <ChevronsRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.25} />
          ) : (
            <>
              <ChevronsLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={1.25} />
              <span className="text-[13px]">Distraction-free</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
