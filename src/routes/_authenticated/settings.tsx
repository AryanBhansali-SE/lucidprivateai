import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/lucid/Panel";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { listHabits, archiveHabit, updateHabit } from "@/server/habits.functions";
import { useAuth } from "@/lib/auth";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{ title: "Settings — Lucid" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const list = useAuthedServerFn(listHabits);
  const archive = useAuthedServerFn(archiveHabit);
  const update = useAuthedServerFn(updateHabit);
  const [habits, setHabits] = useState<any[]>([]);

  const reload = useCallback(async () => setHabits(await list()), [list]);
  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="space-y-6 max-w-2xl">
      <Panel title="Account" eyebrow="Identity">
        <div className="space-y-3">
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="User ID" value={<span className="font-mono text-[11px]">{user?.id}</span>} />
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={() => signOut()}
            className="text-destructive text-xs font-mono uppercase tracking-wider hover:underline"
          >
            Sign out
          </button>
        </div>
      </Panel>

      <Panel
        title="Habits"
        eyebrow={`${habits.length} active`}
        bodyClassName="p-0"
      >
        {habits.length === 0 ? (
          <div className="p-8 text-center label-cap">No habits defined yet.</div>
        ) : (
          <ul className="divide-y divide-hairline">
            {habits.map((h) => (
              <li key={h.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-bone text-sm">{h.name}</div>
                  <div className="label-cap mt-0.5">
                    {h.tier} · {h.break_penalty ? "penalizes breaks" : "no penalty"}
                  </div>
                </div>
                <select
                  value={h.tier}
                  onChange={async (e) => {
                    await update({
                      data: { id: h.id, tier: e.target.value as any },
                    });
                    reload();
                  }}
                  className="bg-card border border-hairline text-bone text-xs font-mono py-1 px-2 outline-none focus:border-gold"
                >
                  <option value="keystone">Keystone</option>
                  <option value="core">Core</option>
                  <option value="supporting">Supporting</option>
                </select>
                <button
                  onClick={async () => {
                    if (!confirm(`Archive "${h.name}"?`)) return;
                    await archive({ data: { id: h.id } });
                    toast.success("Archived");
                    reload();
                  }}
                  className="text-ash hover:text-destructive"
                  aria-label="Archive"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.25} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Keyboard" eyebrow="Shortcuts">
        <ul className="space-y-2 text-sm">
          <li className="flex items-baseline justify-between">
            <span className="text-ash">Distraction-free toggle</span>
            <kbd className="font-mono text-xs text-bone bg-graphite px-2 py-1 border border-hairline">
              ⌘ .
            </kbd>
          </li>
        </ul>
      </Panel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="label-cap">{label}</span>
      <span className="text-bone text-sm truncate">{value}</span>
    </div>
  );
}
