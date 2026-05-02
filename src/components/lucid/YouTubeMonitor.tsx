import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Radio } from "lucide-react";

type Video = {
  id: string;
  title: string;
  publishedAgo: string;
  views: number;
  ctr: number;
  earnings: number;
  trend: number[];
};

const SEED: Video[] = [
  {
    id: "1",
    title: "Building listofdates.ai in 24 Hours",
    publishedAgo: "2d",
    views: 48210,
    ctr: 8.2,
    earnings: 312.4,
    trend: [3, 5, 4, 7, 9, 8, 12, 11, 14, 13, 16, 18],
  },
  {
    id: "2",
    title: "NLQ Assistant — Architecture Deep Dive",
    publishedAgo: "6d",
    views: 22870,
    ctr: 6.4,
    earnings: 148.1,
    trend: [8, 6, 7, 5, 6, 4, 5, 3, 4, 3, 2, 3],
  },
  {
    id: "3",
    title: "Why I Quit My Job to Build AI Tools",
    publishedAgo: "12d",
    views: 121430,
    ctr: 11.7,
    earnings: 892.5,
    trend: [2, 4, 6, 8, 12, 15, 18, 16, 14, 13, 12, 10],
  },
  {
    id: "4",
    title: "TanStack Start vs Next.js 15",
    publishedAgo: "21d",
    views: 67800,
    ctr: 9.1,
    earnings: 421.0,
    trend: [10, 12, 11, 9, 8, 7, 6, 5, 5, 4, 4, 3],
  },
];

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="text-primary">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function YouTubeMonitor() {
  const [videos, setVideos] = useState(SEED);
  const [pulse, setPulse] = useState(0);

  // simulate live updates
  useEffect(() => {
    const t = setInterval(() => {
      setVideos((vs) =>
        vs.map((v) => ({
          ...v,
          views: v.views + Math.floor(Math.random() * 20),
          earnings: +(v.earnings + Math.random() * 0.5).toFixed(2),
        })),
      );
      setPulse((p) => p + 1);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const totals = videos.reduce(
    (acc, v) => ({
      views: acc.views + v.views,
      earnings: acc.earnings + v.earnings,
      ctr: acc.ctr + v.ctr,
    }),
    { views: 0, earnings: 0, ctr: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <Radio
            className={cn(
              "h-3 w-3 text-success transition-opacity",
              pulse % 2 === 0 ? "opacity-100" : "opacity-40",
            )}
          />
          LIVE · syncing every 3s
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-muted-foreground">
            Total views <span className="text-foreground tabular-nums">{fmt(totals.views)}</span>
          </span>
          <span className="text-muted-foreground">
            Avg CTR{" "}
            <span className="text-foreground tabular-nums">
              {(totals.ctr / videos.length).toFixed(1)}%
            </span>
          </span>
          <span className="text-muted-foreground">
            Est.{" "}
            <span className="text-primary tabular-nums">${totals.earnings.toFixed(2)}</span>
          </span>
        </div>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2">
            <tr className="text-[10px] font-mono uppercase text-muted-foreground">
              <th className="text-left font-medium px-3 py-2">Video</th>
              <th className="text-right font-medium px-3 py-2 hidden sm:table-cell">Views</th>
              <th className="text-right font-medium px-3 py-2 hidden md:table-cell">CTR</th>
              <th className="text-right font-medium px-3 py-2">Est. $</th>
              <th className="text-right font-medium px-3 py-2 hidden lg:table-cell">Trend</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr
                key={v.id}
                className="border-t border-border hover:bg-secondary/40 transition-colors"
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="h-8 w-12 rounded bg-gradient-to-br from-primary/30 to-primary/5 border border-border shrink-0 grid place-items-center">
                      <div className="h-0 w-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate max-w-[220px] sm:max-w-xs">
                        {v.title}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {v.publishedAgo} ago
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-right px-3 py-2.5 tabular-nums text-xs hidden sm:table-cell">
                  {fmt(v.views)}
                </td>
                <td className="text-right px-3 py-2.5 tabular-nums text-xs hidden md:table-cell">
                  <span className={v.ctr >= 8 ? "text-success" : "text-muted-foreground"}>
                    {v.ctr.toFixed(1)}%
                  </span>
                </td>
                <td className="text-right px-3 py-2.5 tabular-nums text-xs font-medium text-primary">
                  ${v.earnings.toFixed(2)}
                </td>
                <td className="text-right px-3 py-2.5 hidden lg:table-cell">
                  <div className="flex justify-end">
                    <Sparkline data={v.trend} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <a
          href="#"
          className="text-[11px] font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          Open YouTube Studio <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
