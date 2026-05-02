import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Habit = { id: string; name: string; color: string };

const HABITS: Habit[] = [
  { id: "deep", name: "Deep Work", color: "bg-primary" },
  { id: "read", name: "Read 30m", color: "bg-primary" },
  { id: "exer", name: "Exercise", color: "bg-primary" },
  { id: "ship", name: "Ship code", color: "bg-primary" },
  { id: "med", name: "Meditate", color: "bg-primary" },
];

// deterministic pseudo-random for SSR consistency
function seeded(i: number, salt = 1) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const DAYS = 182; // ~26 weeks
const WEEKS = Math.ceil(DAYS / 7);

function HeatGrid({ salt }: { salt: number }) {
  const cells = useMemo(() => {
    return Array.from({ length: WEEKS * 7 }, (_, i) => {
      const r = seeded(i, salt);
      const level = r < 0.45 ? 0 : r < 0.65 ? 1 : r < 0.8 ? 2 : r < 0.92 ? 3 : 4;
      return level;
    });
  }, [salt]);

  const heat = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];

  return (
    <div className="overflow-x-auto">
      <div
        className="grid grid-flow-col gap-[3px]"
        style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
      >
        {cells.map((lvl, i) => (
          <div
            key={i}
            className={cn("h-[10px] w-[10px] rounded-[2px]", heat[lvl])}
            title={`Day ${i + 1}: level ${lvl}`}
          />
        ))}
      </div>
    </div>
  );
}

export function HabitTracker() {
  const [active, setActive] = useState<string>(HABITS[0].id);
  const habit = HABITS.find((h) => h.id === active)!;
  const salt = HABITS.findIndex((h) => h.id === active) + 1;

  // mini stats
  const stats = useMemo(() => {
    let streak = 0;
    let total = 0;
    for (let i = DAYS - 1; i >= 0; i--) {
      const r = seeded(i, salt);
      const done = r >= 0.45;
      if (done) total++;
      if (i === DAYS - 1 || streak > 0 || done) {
        if (done) streak++;
        else if (i !== DAYS - 1) break;
      }
    }
    return { streak, total, rate: Math.round((total / DAYS) * 100) };
  }, [salt]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {HABITS.map((h) => (
          <button
            key={h.id}
            onClick={() => setActive(h.id)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
              active === h.id
                ? "bg-secondary border-border text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60",
            )}
          >
            {h.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1 rounded-md border border-border bg-surface-2 p-3">
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Streak</div>
          <div className="text-2xl font-semibold tabular-nums mt-1">{stats.streak}d</div>
        </div>
        <div className="col-span-1 rounded-md border border-border bg-surface-2 p-3">
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Completed</div>
          <div className="text-2xl font-semibold tabular-nums mt-1">{stats.total}</div>
        </div>
        <div className="col-span-1 rounded-md border border-border bg-surface-2 p-3">
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Rate</div>
          <div className="text-2xl font-semibold tabular-nums mt-1">{stats.rate}%</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {habit.name} · last 26 weeks
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <div
                key={l}
                className={cn("h-2.5 w-2.5 rounded-[2px]", `bg-heat-${l}`)}
              />
            ))}
            <span>More</span>
          </div>
        </div>
        <HeatGrid salt={salt} />
      </div>
    </div>
  );
}
