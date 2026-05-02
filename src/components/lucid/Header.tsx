import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Menu, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatLong } from "@/lib/date";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = {
  "/pulse": "Pulse",
  "/matrix": "Habit Matrix",
  "/goals": "Objectives & Key Results",
  "/journal": "Journal of Record",
  "/settings": "Settings",
};

export function Header({
  onMobileMenu,
  collapsed,
  onToggleStealth,
}: {
  onMobileMenu: () => void;
  collapsed: boolean;
  onToggleStealth?: () => void;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  const matchedKey = Object.keys(titles).find((k) => path.startsWith(k));
  const title = matchedKey ? titles[matchedKey] : "Lucid";
  const today = formatLong(new Date());

  return (
    <header
      className={cn(
        "h-16 shrink-0 border-b border-border bg-background flex items-center px-5 md:px-8 gap-4",
      )}
    >
      <button
        onClick={onMobileMenu}
        className="md:hidden h-8 w-8 grid place-items-center rounded-sm hover:bg-graphite text-ash hover:text-bone"
        aria-label="Menu"
      >
        <Menu className="h-4 w-4" strokeWidth={1.25} />
      </button>

      <div className="flex items-baseline gap-3 min-w-0">
        <h1 className="font-serif text-[22px] leading-none text-bone truncate">{title}</h1>
        <span className="hidden sm:inline text-ash/60">·</span>
        <span className="hidden sm:inline label-cap">{today}</span>
      </div>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center gap-5">
        {onToggleStealth && (
          <button
            onClick={onToggleStealth}
            title={collapsed ? "Exit stealth mode (⌘.)" : "Enter stealth mode (⌘.)"}
            className="h-8 w-8 grid place-items-center rounded-sm text-ash hover:text-gold transition-colors"
          >
            {collapsed ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.25} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.25} />
            )}
          </button>
        )}
        <div className="text-right">
          <div className="font-mono text-xs text-ash leading-tight">{time}</div>
          <div className="label-cap leading-tight lucid-eyebrow">Local</div>
        </div>
        <div className="h-7 w-px bg-hairline" />
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full ring-gold-soft grid place-items-center font-serif text-gold text-sm">
            {(user?.email ?? "·").charAt(0).toUpperCase()}
          </div>
          <div className="text-right hidden lg:block">
            <div className="text-xs text-bone leading-tight max-w-[140px] truncate">
              {user?.email}
            </div>
            <div className="label-cap leading-tight">Operator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
