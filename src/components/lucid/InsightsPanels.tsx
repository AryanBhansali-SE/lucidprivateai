import { useEffect, useState, useCallback } from "react";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import {
  getInsights,
  generateInsights,
  type InsightsBundle,
  type DailyPriority,
  type PatternInsight,
} from "@/server/insights.functions";
import { Panel } from "@/components/lucid/Panel";
import { StaggerReveal, RevealItem } from "@/components/lucid/motion/StaggerReveal";
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, Activity, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function useInsights() {
  const fetchInsights = useAuthedServerFn(getInsights);
  const regen = useAuthedServerFn(generateInsights);
  const [data, setData] = useState<InsightsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cached = await fetchInsights();
      if (cached) setData(cached);
    } finally {
      setLoading(false);
    }
  }, [fetchInsights]);

  const regenerate = useCallback(
    async (opts: { force?: boolean; silent?: boolean } = {}) => {
      setGenerating(true);
      try {
        const fresh = await regen({ data: { force: opts.force ?? true } });
        setData(fresh);
        if (!opts.silent) toast.success("Insights regenerated");
      } catch (e: any) {
        if (!opts.silent) toast.error(e?.message ?? "Failed to generate insights");
      } finally {
        setGenerating(false);
      }
    },
    [regen],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Auto-generate on first load if there are no insights yet
  useEffect(() => {
    if (!loading && !data) {
      regenerate({ silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return { data, loading, generating, regenerate };
}

const intensityClass: Record<DailyPriority["intensity"], string> = {
  critical: "text-gold border-gold/40 bg-gold-soft",
  important: "text-bone border-hairline bg-graphite/40",
  gentle: "text-ash border-hairline bg-transparent",
};

const categoryIcon: Record<PatternInsight["category"], typeof Activity> = {
  consistency: Activity,
  correlation: TrendingUp,
  warning: AlertTriangle,
  win: Trophy,
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DailyPriorityPanel() {
  const { data, loading, generating, regenerate } = useInsights();

  return (
    <Panel
      title="Today's Priority"
      eyebrow={
        data
          ? `AI · ${relativeTime(data.generated_at)}`
          : "AI Analysis"
      }
      action={
        <button
          onClick={() => regenerate({ force: true })}
          disabled={generating}
          className="label-cap hover:text-gold flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-3 w-3", generating && "animate-spin")}
            strokeWidth={1.5}
          />
          Refresh
        </button>
      }
    >
      {loading || (generating && !data) ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-graphite w-1/3" />
          <div className="h-3 bg-graphite w-full" />
          <div className="h-3 bg-graphite w-2/3" />
        </div>
      ) : !data ? (
        <div className="label-cap py-2">No insights yet.</div>
      ) : (
        <div
          className={cn(
            "border-l-2 pl-4 py-2 transition-colors",
            intensityClass[data.daily_priority.intensity],
          )}
        >
          {data.daily_priority.habit_name && (
            <div className="font-serif text-bone text-2xl leading-tight mb-1.5">
              {data.daily_priority.habit_name}
            </div>
          )}
          <p className="text-sm text-bone/90 leading-relaxed">
            {data.daily_priority.reason}
          </p>
          <div className="label-cap mt-3 opacity-80">
            Intensity · {data.daily_priority.intensity}
          </div>
        </div>
      )}
    </Panel>
  );
}

export function PatternsPanel() {
  const { data, loading, generating } = useInsights();

  if (loading || (generating && !data)) {
    return (
      <Panel title="Patterns Detected" eyebrow="AI Analysis">
        <div className="space-y-3 animate-pulse">
          <div className="h-3 bg-graphite w-3/4" />
          <div className="h-3 bg-graphite w-2/3" />
          <div className="h-3 bg-graphite w-4/5" />
        </div>
      </Panel>
    );
  }

  if (!data || data.patterns.length === 0) {
    return (
      <Panel title="Patterns Detected" eyebrow="AI Analysis">
        <div className="label-cap py-2">No patterns detected yet.</div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Patterns Detected"
      eyebrow={`${data.patterns.length} signal${data.patterns.length === 1 ? "" : "s"}`}
      bodyClassName="p-0"
    >
      <StaggerReveal className="divide-y divide-hairline">
        {data.patterns.map((p, i) => {
          const Icon = categoryIcon[p.category];
          return (
            <RevealItem key={i}>
              <div className="px-5 py-4 flex gap-3">
                <div
                  className={cn(
                    "shrink-0 mt-0.5",
                    p.category === "warning" && "text-destructive",
                    p.category === "win" && "text-gold",
                    p.category === "correlation" && "text-bone",
                    p.category === "consistency" && "text-ash",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="font-serif text-bone text-base leading-tight">
                    {p.title}
                  </div>
                  <p className="text-ash text-sm mt-1 leading-relaxed">{p.detail}</p>
                </div>
              </div>
            </RevealItem>
          );
        })}
      </StaggerReveal>
    </Panel>
  );
}
