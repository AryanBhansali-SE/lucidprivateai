import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Panel, KPIBar } from "@/components/lucid/Panel";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import {
  listGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  createKeyResult,
  updateNumericKR,
  deleteKeyResult,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "@/server/goals.functions";
import { Plus, X, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useInsights } from "@/components/lucid/InsightsPanels";
import { TutorialPopover } from "@/components/lucid/tutorial/TutorialPopover";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Objectives — Lucid" },
      { name: "description", content: "Define High-Level Objectives and quantified Key Results." },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const list = useAuthedServerFn(listGoals);
  const create = useAuthedServerFn(createGoal);
  const [goals, setGoals] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const { data: insights } = useInsights();

  const diagnosisFor = (goalId: string) =>
    insights?.goal_diagnoses.find((d) => d.goal_id === goalId);

  const reload = useCallback(async () => {
    setGoals(await list());
  }, [list]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <>
      <TutorialPopover
        tutorialKey="goals"
        title="Objectives & Key Results."
        body="Each goal breaks into measurable key results. The Analyst grades your trajectory with a red/amber/green dot."
        position="bottom-right"
      />
      <div className="space-y-6">
      <Panel
        title="Objectives & Key Results"
        eyebrow={`${goals.length} defined`}
        action={
          <button
            onClick={() => setCreating(true)}
            className="label-cap hover:text-gold flex items-center gap-1"
          >
            <Plus className="h-3 w-3" strokeWidth={1.5} /> Objective
          </button>
        }
        bodyClassName="p-0"
      >
        {goals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="label-cap mb-3">No objectives defined</div>
            <button
              onClick={() => setCreating(true)}
              className="text-gold text-sm font-mono hover:underline"
            >
              + Define your first objective
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {goals.map((g) => {
              const dx = diagnosisFor(g.id);
              const dotColor =
                dx?.status === "green"
                  ? "bg-gold"
                  : dx?.status === "amber"
                    ? "bg-yellow-500"
                    : dx?.status === "red"
                      ? "bg-destructive"
                      : "bg-hairline";
              return (
                <li key={g.id}>
                  <button
                    onClick={() => setOpen(g.id)}
                    className="w-full text-left px-5 py-5 hover:bg-graphite/30 transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-4 mb-3">
                      <div className="min-w-0 flex items-baseline gap-3">
                        <span
                          className={cn("inline-block h-2 w-2 rounded-full shrink-0", dotColor)}
                          title={dx ? `${dx.status.toUpperCase()} · ${dx.verdict}` : "No diagnosis yet"}
                        />
                        <div className="min-w-0">
                          <h3 className="font-serif text-bone text-[17px] truncate">{g.title}</h3>
                          <div className="label-cap mt-1">
                            {g.kr_count} key result{g.kr_count !== 1 && "s"}
                            {g.target_date && ` · target ${g.target_date}`}
                            {g.status !== "active" && ` · ${g.status}`}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-bone tabular text-sm shrink-0">
                        {Math.round(g.progress * 100)}%
                      </span>
                    </div>
                    <KPIBar value={g.progress} />
                    {dx && (
                      <div className="mt-3 text-xs text-ash italic leading-relaxed pl-5">
                        {dx.verdict}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {creating && (
        <CreateGoalSheet
          onClose={() => setCreating(false)}
          onSubmit={async (p) => {
            try {
              await create({ data: p });
              toast.success("Objective created");
              setCreating(false);
              reload();
            } catch (e: any) {
              toast.error(e?.message ?? "Failed");
            }
          }}
        />
      )}

      {open && <GoalDrawer id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </div>
    </>
  );
}

function CreateGoalSheet({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (p: { title: string; description?: string; target_date?: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60">
      <div className="w-full max-w-md bg-card border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-serif text-bone text-xl">New objective</h3>
          <button onClick={onClose} className="text-ash hover:text-bone">
            <X className="h-4 w-4" strokeWidth={1.25} />
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!title.trim()) return;
            await onSubmit({
              title: title.trim(),
              description: desc.trim() || undefined,
              target_date: date || undefined,
            });
          }}
          className="p-5 space-y-4"
        >
          <Field label="Title">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-hairline focus:border-gold outline-none py-2 text-bone text-sm font-mono"
              placeholder="Reach Series A by Q4"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className="w-full bg-transparent border border-hairline focus:border-gold outline-none p-2.5 text-bone text-sm resize-none"
            />
          </Field>
          <Field label="Target date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-hairline focus:border-gold outline-none py-2 text-bone text-sm font-mono"
            />
          </Field>
          <button
            type="submit"
            className="w-full brushed-gold text-obsidian font-mono uppercase text-xs tracking-[0.2em] py-3"
          >
            Commit
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="label-cap">{label}</label>
      {children}
    </div>
  );
}

function GoalDrawer({
  id,
  onClose,
  onChanged,
}: {
  id: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const fetchGoal = useAuthedServerFn(getGoal);
  const updateG = useAuthedServerFn(updateGoal);
  const delG = useAuthedServerFn(deleteGoal);
  const addKR = useAuthedServerFn(createKeyResult);
  const updNum = useAuthedServerFn(updateNumericKR);
  const delKR = useAuthedServerFn(deleteKeyResult);
  const addItem = useAuthedServerFn(addChecklistItem);
  const togItem = useAuthedServerFn(toggleChecklistItem);
  const delItem = useAuthedServerFn(deleteChecklistItem);

  const [goal, setGoal] = useState<any>(null);
  const [addingKR, setAddingKR] = useState(false);

  const reload = useCallback(async () => {
    setGoal(await fetchGoal({ data: { id } }));
  }, [fetchGoal, id]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <aside
        className="w-full max-w-xl bg-background border-l border-border h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {!goal ? (
          <div className="p-8 label-cap">Loading…</div>
        ) : (
          <>
            <div className="px-6 py-5 border-b border-border flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="label-cap mb-1">Objective</div>
                <h2 className="font-serif text-bone text-2xl leading-tight">{goal.title}</h2>
                {goal.description && (
                  <p className="text-ash text-sm mt-2">{goal.description}</p>
                )}
                {goal.target_date && (
                  <div className="label-cap mt-2">Target · {goal.target_date}</div>
                )}
              </div>
              <button onClick={onClose} className="text-ash hover:text-bone shrink-0">
                <X className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="label-cap">Key Results</div>
                <button
                  onClick={() => setAddingKR(true)}
                  className="label-cap hover:text-gold flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" strokeWidth={1.5} /> Add
                </button>
              </div>

              {goal.key_results.length === 0 ? (
                <div className="label-cap text-center py-8">No key results yet</div>
              ) : (
                <ul className="space-y-5">
                  {goal.key_results.map((kr: any) => (
                    <li key={kr.id} className="border border-border p-4 space-y-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <h4 className="text-bone text-sm font-medium">{kr.title}</h4>
                        <button
                          onClick={async () => {
                            await delKR({ data: { id: kr.id } });
                            reload();
                            onChanged();
                          }}
                          className="text-ash hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" strokeWidth={1.25} />
                        </button>
                      </div>

                      {kr.kind === "numeric" ? (
                        <NumericKR
                          kr={kr}
                          onUpdate={async (current_value) => {
                            await updNum({ data: { id: kr.id, current_value } });
                            reload();
                            onChanged();
                          }}
                        />
                      ) : (
                        <ChecklistKR
                          kr={kr}
                          onAdd={async (label) => {
                            await addItem({ data: { key_result_id: kr.id, label } });
                            reload();
                            onChanged();
                          }}
                          onToggle={async (id, done) => {
                            await togItem({ data: { id, done } });
                            reload();
                            onChanged();
                          }}
                          onDelete={async (id) => {
                            await delItem({ data: { id } });
                            reload();
                            onChanged();
                          }}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-4 border-t border-border space-y-3">
                <div className="label-cap">Status</div>
                <div className="grid grid-cols-4 gap-px bg-hairline border border-hairline">
                  {(["active", "paused", "achieved", "archived"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={async () => {
                        await updateG({ data: { id: goal.id, status: s } });
                        reload();
                        onChanged();
                      }}
                      className={cn(
                        "py-2 text-[10px] font-mono uppercase tracking-wider",
                        goal.status === s ? "bg-gold text-obsidian" : "bg-card text-ash hover:text-bone",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    if (!confirm("Delete this objective?")) return;
                    await delG({ data: { id: goal.id } });
                    onChanged();
                    onClose();
                  }}
                  className="text-destructive text-xs font-mono uppercase tracking-wider hover:underline"
                >
                  Delete objective
                </button>
              </div>
            </div>
          </>
        )}

        {addingKR && goal && (
          <AddKRSheet
            onClose={() => setAddingKR(false)}
            onSubmit={async (p) => {
              await addKR({ data: { goal_id: goal.id, ...p } });
              setAddingKR(false);
              reload();
              onChanged();
            }}
          />
        )}
      </aside>
    </div>
  );
}

function NumericKR({
  kr,
  onUpdate,
}: {
  kr: any;
  onUpdate: (v: number) => Promise<void>;
}) {
  const [val, setVal] = useState(String(kr.current_value ?? 0));
  const pct = kr.target_value
    ? Math.min(1, (Number(val) || 0) / kr.target_value)
    : 0;

  return (
    <div className="space-y-3">
      <KPIBar value={pct} />
      <div className="flex items-baseline gap-2 font-mono text-sm">
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => {
            const n = Number(val);
            if (!isNaN(n) && n !== kr.current_value) onUpdate(n);
          }}
          className="w-24 bg-transparent border-b border-hairline focus:border-gold outline-none py-1 text-bone tabular"
        />
        <span className="text-ash">/</span>
        <span className="text-bone tabular">{kr.target_value}</span>
        {kr.unit && <span className="text-ash text-xs">{kr.unit}</span>}
      </div>
    </div>
  );
}

function ChecklistKR({
  kr,
  onAdd,
  onToggle,
  onDelete,
}: {
  kr: any;
  onAdd: (label: string) => Promise<void>;
  onToggle: (id: string, done: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const items = kr.key_result_items ?? [];
  const done = items.filter((i: any) => i.done).length;

  return (
    <div className="space-y-3">
      <KPIBar value={items.length ? done / items.length : 0} />
      <ul className="space-y-1">
        {items.map((it: any) => (
          <li key={it.id} className="flex items-center gap-2 group">
            <button
              onClick={() => onToggle(it.id, !it.done)}
              className={cn(
                "h-3.5 w-3.5 border shrink-0 grid place-items-center transition-colors",
                it.done ? "bg-gold border-gold" : "border-hairline hover:border-ash",
              )}
            >
              {it.done && <Check className="h-2.5 w-2.5 text-obsidian" strokeWidth={2.5} />}
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                it.done ? "text-ash line-through" : "text-bone",
              )}
            >
              {it.label}
            </span>
            <button
              onClick={() => onDelete(it.id)}
              className="opacity-0 group-hover:opacity-100 text-ash hover:text-destructive"
            >
              <X className="h-3 w-3" strokeWidth={1.25} />
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!label.trim()) return;
          await onAdd(label.trim());
          setLabel("");
        }}
      >
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="+ Add item"
          className="w-full bg-transparent border-0 border-b border-hairline focus:border-gold outline-none py-1.5 text-sm text-bone placeholder:text-ash/60"
        />
      </form>
    </div>
  );
}

function AddKRSheet({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (p: {
    title: string;
    kind: "numeric" | "checklist";
    target_value?: number;
    unit?: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"numeric" | "checklist">("numeric");
  const [target, setTarget] = useState("100");
  const [unit, setUnit] = useState("");

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-card border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-serif text-bone text-lg">New key result</h3>
          <button onClick={onClose} className="text-ash">
            <X className="h-4 w-4" strokeWidth={1.25} />
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!title.trim()) return;
            await onSubmit({
              title: title.trim(),
              kind,
              target_value: kind === "numeric" ? Number(target) || 100 : undefined,
              unit: kind === "numeric" && unit.trim() ? unit.trim() : undefined,
            });
          }}
          className="p-5 space-y-4"
        >
          <Field label="Title">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-b border-hairline focus:border-gold outline-none py-2 text-bone text-sm font-mono"
              placeholder="MRR reaches $10,000"
            />
          </Field>
          <Field label="Type">
            <div className="grid grid-cols-2 gap-px bg-hairline border border-hairline">
              {(["numeric", "checklist"] as const).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKind(k)}
                  className={cn(
                    "py-2 text-xs font-mono uppercase tracking-wider",
                    kind === k ? "bg-gold text-obsidian" : "bg-card text-ash hover:text-bone",
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
          </Field>
          {kind === "numeric" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Target">
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-transparent border-b border-hairline focus:border-gold outline-none py-2 text-bone text-sm font-mono tabular"
                />
              </Field>
              <Field label="Unit">
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="USD"
                  className="w-full bg-transparent border-b border-hairline focus:border-gold outline-none py-2 text-bone text-sm font-mono"
                />
              </Field>
            </div>
          )}
          <button
            type="submit"
            className="w-full brushed-gold text-obsidian font-mono uppercase text-xs tracking-[0.2em] py-3"
          >
            Commit
          </button>
        </form>
      </div>
    </div>
  );
}
