import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { useRoles } from "@/lib/use-roles";
import { getAdminOverview } from "@/server/admin.functions";
import { Panel } from "@/components/lucid/Panel";
import { StaggerReveal } from "@/components/lucid/motion/StaggerReveal";
import { CountUp } from "@/components/lucid/motion/CountUp";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPanel,
});

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;

function AdminPanel() {
  const { isSuperAdmin, loading: rolesLoading } = useRoles();
  const fetchOverview = useAuthedServerFn(getAdminOverview);
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchOverview()
      .then(setData)
      .catch((e) => setErr(e?.message ?? "Failed to load"));
  }, [isSuperAdmin]);

  if (rolesLoading) {
    return <div className="text-ash text-sm">Verifying clearance…</div>;
  }
  if (!isSuperAdmin) {
    return <Navigate to="/pulse" />;
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="label-cap text-gold">Sovereign Console</div>
        <h1 className="font-serif text-3xl md:text-4xl text-bone mt-1">
          Admin / Overview
        </h1>
        <p className="text-ash text-sm mt-2">
          Read-only telemetry across all users on this instance.
        </p>
      </header>

      {err && (
        <Panel>
          <p className="text-destructive text-sm">{err}</p>
        </Panel>
      )}

      {data && (
        <>
          <StaggerReveal>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { k: "Users", v: data.totals.users },
                { k: "Habits", v: data.totals.habits },
                { k: "Logs", v: data.totals.logs },
                { k: "Active Goals", v: data.totals.goals },
                { k: "Journals", v: data.totals.journals },
              ].map((m) => (
                <Panel key={m.k}>
                  <div className="label-cap">{m.k}</div>
                  <div className="font-mono text-3xl text-bone mt-2">
                    <CountUp value={m.v} />
                  </div>
                </Panel>
              ))}
            </div>
          </StaggerReveal>

          <Panel>
            <div className="label-cap mb-4">User Ledger</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ash border-b border-border">
                    <th className="py-2 pr-4 font-mono text-[10px] tracking-wider uppercase">User</th>
                    <th className="py-2 pr-4 font-mono text-[10px] tracking-wider uppercase">Roles</th>
                    <th className="py-2 pr-4 font-mono text-[10px] tracking-wider uppercase text-right">Habits</th>
                    <th className="py-2 pr-4 font-mono text-[10px] tracking-wider uppercase text-right">Logs</th>
                    <th className="py-2 pr-4 font-mono text-[10px] tracking-wider uppercase text-right">Goals</th>
                    <th className="py-2 pr-4 font-mono text-[10px] tracking-wider uppercase text-right">Entries</th>
                    <th className="py-2 pr-4 font-mono text-[10px] tracking-wider uppercase">Last Log</th>
                    <th className="py-2 font-mono text-[10px] tracking-wider uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-border/50 hover:bg-graphite/30"
                    >
                      <td className="py-3 pr-4">
                        <div className="text-bone">
                          {u.display_name ?? "—"}
                        </div>
                        <div className="text-ash/60 text-xs font-mono">
                          {u.id.slice(0, 8)}…
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {u.roles.length === 0 ? (
                          <span className="text-ash/60 text-xs">user</span>
                        ) : (
                          <div className="flex gap-1 flex-wrap">
                            {u.roles.map((r) => (
                              <span
                                key={r}
                                className={
                                  r === "super_admin"
                                    ? "px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-gold text-gold"
                                    : "px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-border text-ash"
                                }
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-bone">{u.habits}</td>
                      <td className="py-3 pr-4 text-right font-mono text-bone">{u.logs}</td>
                      <td className="py-3 pr-4 text-right font-mono text-bone">{u.goals}</td>
                      <td className="py-3 pr-4 text-right font-mono text-bone">{u.journals}</td>
                      <td className="py-3 pr-4 font-mono text-ash text-xs">
                        {u.last_log ?? "—"}
                      </td>
                      <td className="py-3 font-mono text-ash text-xs">
                        {new Date(u.created_at).toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                  {data.users.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-ash">
                        No users yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
