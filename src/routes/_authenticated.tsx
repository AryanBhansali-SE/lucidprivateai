import { createFileRoute, Outlet, Navigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/lucid/Sidebar";
import { Header } from "@/components/lucid/Header";
import { LayoutDashboard, Grid3x3, Target, BookText, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const NAV = [
  { to: "/pulse", label: "Pulse", icon: LayoutDashboard },
  { to: "/matrix", label: "Habit Matrix", icon: Grid3x3 },
  { to: "/goals", label: "Objectives", icon: Target },
  { to: "/journal", label: "Journal", icon: BookText },
  { to: "/settings", label: "Settings", icon: Settings },
];

function AuthLayout() {
  const { session, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [path]);

  // Distraction-free shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "." && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="font-serif italic text-gold text-3xl animate-pulse">Lucid</div>
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" />;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[260px] h-full bg-card border-r border-border flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-border">
              <span className="font-serif italic text-gold text-2xl">Lucid</span>
              <button onClick={() => setMobileOpen(false)} className="text-ash">
                <X className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>
            <nav className="flex-1 p-3">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm",
                    path.startsWith(n.to)
                      ? "bg-graphite text-bone"
                      : "text-ash hover:text-bone",
                  )}
                >
                  <n.icon className="h-4 w-4" strokeWidth={1.25} />
                  {n.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          collapsed={collapsed}
          onMobileMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="px-5 md:px-8 py-6 md:py-8 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
