import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Panel, KPIBar } from "@/components/lucid/Panel";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { upsertEntry, getEntry, getReviewBundle } from "@/server/journal.functions";
import { todayISO, formatLong } from "@/lib/date";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { marked } from "marked";
import { TutorialPopover } from "@/components/lucid/tutorial/TutorialPopover";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Lucid" },
      { name: "description", content: "Markdown journal of record with side-by-side metrics review." },
    ],
  }),
  component: JournalPage,
});

const SENTIMENTS = ["focused", "steady", "drifting", "depleted", "energized"] as const;
type Sentiment = (typeof SENTIMENTS)[number];

function JournalPage() {
  const [mode, setMode] = useState<"write" | "review">("write");

  return (
    <>
      <TutorialPopover
        tutorialKey="journal"
        title="The Journal."
        body="Write freely. Lucid scores sentiment and surfaces themes. Switch to Review to see the patterns over time."
        position="bottom-right"
      />
      <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="label-cap mb-1">Journal of Record</div>
          <h2 className="font-serif text-bone text-2xl">
            {mode === "write" ? "Compose entry" : "Review past days"}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-px bg-hairline border border-hairline">
          {(["write", "review"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-5 py-2 text-xs font-mono uppercase tracking-wider",
                mode === m ? "bg-gold text-obsidian" : "bg-card text-ash hover:text-bone",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "write" ? <WriteMode /> : <ReviewMode />}
    </div>
    </>
  );
}

function WriteMode() {
  const fetchEntry = useAuthedServerFn(getEntry);
  const save = useAuthedServerFn(upsertEntry);

  const [date, setDate] = useState(todayISO());
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [takeaways, setTakeaways] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const e = await fetchEntry({ data: { entry_date: date } });
    setContent(e?.content_md ?? "");
    setSentiment((e?.sentiment as Sentiment | null) ?? null);
    setTakeaways(e?.key_takeaways ?? "");
  }, [fetchEntry, date]);

  useEffect(() => {
    load();
  }, [load]);

  // Autosave (debounced)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!content && !sentiment && !takeaways) return;
      setSaving(true);
      try {
        await save({
          data: {
            entry_date: date,
            content_md: content,
            sentiment: sentiment,
            key_takeaways: takeaways || null,
          },
        });
      } catch (e: any) {
        toast.error(e?.message ?? "Save failed");
      } finally {
        setSaving(false);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [content, sentiment, takeaways, date, save]);

  const html = useMemo(
    () => (preview ? marked.parse(content || "_Empty_", { breaks: true }) : ""),
    [content, preview],
  );

  return (
    <Panel
      title={formatLong(parseISO(date))}
      eyebrow={saving ? "Saving…" : "Autosaved"}
      action={
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayISO()}
            className="bg-transparent border-b border-hairline focus:border-gold outline-none text-xs font-mono text-bone tabular"
          />
          <button
            onClick={() => setPreview((p) => !p)}
            className="label-cap hover:text-gold"
          >
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {preview ? (
          <article
            className="prose-sm text-bone leading-relaxed min-h-[300px] [&_h1]:font-serif [&_h1]:text-2xl [&_h2]:font-serif [&_h2]:text-xl [&_a]:text-gold [&_strong]:text-bone [&_em]:text-ash [&_code]:bg-graphite [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-gold [&_blockquote]:pl-4 [&_blockquote]:text-ash [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="The day, in full…"
            className="w-full bg-transparent outline-none text-bone text-[15px] leading-relaxed min-h-[300px] resize-none placeholder:text-ash/40 font-sans"
          />
        )}

        <div className="space-y-2">
          <div className="label-cap">Daily Sentiment</div>
          <div className="flex flex-wrap gap-px bg-hairline border border-hairline">
            {SENTIMENTS.map((s) => (
              <button
                key={s}
                onClick={() => setSentiment((cur) => (cur === s ? null : s))}
                className={cn(
                  "px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors",
                  sentiment === s ? "bg-gold text-obsidian" : "bg-card text-ash hover:text-bone",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="label-cap">Key Takeaways</label>
          <textarea
            value={takeaways}
            onChange={(e) => setTakeaways(e.target.value)}
            rows={2}
            placeholder="Three lines, max."
            className="w-full bg-transparent border border-hairline focus:border-gold outline-none p-3 text-bone text-sm resize-none placeholder:text-ash/40"
          />
        </div>
      </div>
    </Panel>
  );
}

function ReviewMode() {
  const fetch = useAuthedServerFn(getReviewBundle);
  const [bundle, setBundle] = useState<any>(null);

  useEffect(() => {
    fetch({ data: { days: 14 } }).then(setBundle);
  }, [fetch]);

  if (!bundle) return <div className="h-64 bg-card border border-border animate-pulse" />;

  if (bundle.entries.length === 0) {
    return (
      <Panel title="Review" eyebrow="Last 14 days">
        <div className="py-12 text-center label-cap">No entries to review yet.</div>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {bundle.entries.map((e: any) => (
        <Panel
          key={e.entry_date}
          title={formatLong(parseISO(e.entry_date))}
          eyebrow={e.sentiment ? `Sentiment · ${e.sentiment}` : "No sentiment"}
        >
          <div className="grid md:grid-cols-[1fr_240px] gap-6">
            <div>
              {e.key_takeaways && (
                <div className="mb-4 pb-4 border-b border-border">
                  <div className="label-cap mb-2">Key Takeaways</div>
                  <p className="text-bone text-sm">{e.key_takeaways}</p>
                </div>
              )}
              <p className="text-bone text-sm leading-relaxed whitespace-pre-wrap line-clamp-[12]">
                {e.content_md || "—"}
              </p>
            </div>

            <div className="space-y-5 md:border-l md:border-border md:pl-6">
              <div>
                <div className="label-cap mb-2">Habits</div>
                <div className="font-serif text-bone text-2xl tabular">
                  {e.habits_completed}
                  <span className="text-ash text-base">/{e.habits_total}</span>
                </div>
                {e.completed_names.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {e.completed_names.slice(0, 4).map((n: string) => (
                      <li key={n} className="text-xs text-ash truncate">
                        · {n}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {bundle.goals.length > 0 && (
                <div>
                  <div className="label-cap mb-2">Active goals (now)</div>
                  <ul className="space-y-2.5">
                    {bundle.goals.map((g: any) => (
                      <li key={g.id} className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs text-bone truncate">{g.title}</span>
                          <span className="font-mono text-[10px] text-ash tabular shrink-0">
                            {Math.round(g.progress * 100)}%
                          </span>
                        </div>
                        <KPIBar value={g.progress} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
