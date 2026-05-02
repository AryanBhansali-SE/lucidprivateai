import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, Search, Command, Menu } from "lucide-react";

const titles: Record<string, string> = {
  "/": "Overview",
  "/habits": "Habit Tracker",
  "/youtube": "YouTube Monitor",
  "/projects": "AI Project Hub",
};

const mobileNav = [
  { to: "/", label: "Overview" },
  { to: "/habits", label: "Habits" },
  { to: "/youtube", label: "YouTube" },
  { to: "/projects", label: "Projects" },
];

export function Header() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [dark, setDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const title = titles[path] ?? "LUCID";
  const now = new Date().toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="h-full flex items-center px-4 md:px-6 gap-3">
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden h-8 w-8 grid place-items-center rounded-md hover:bg-secondary"
          aria-label="Toggle menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="md:hidden flex items-center gap-2">
          <div className="h-5 w-5 rounded-sm bg-primary" />
          <span className="font-mono text-sm font-semibold">LUCID</span>
        </div>

        <div className="hidden md:flex items-baseline gap-3">
          <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
          <span className="font-mono text-[11px] text-muted-foreground">{now}</span>
        </div>

        <div className="flex-1" />

        <div className="hidden sm:flex items-center gap-2 px-2.5 h-8 rounded-md border border-border bg-surface w-64">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search…"
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
          <kbd className="font-mono text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>

        <button
          onClick={() => setDark((d) => !d)}
          className="h-8 w-8 grid place-items-center rounded-md border border-border bg-surface hover:bg-secondary transition-colors"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface p-2">
          {mobileNav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm rounded-md hover:bg-secondary"
            >
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
