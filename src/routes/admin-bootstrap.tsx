import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { bootstrapAdmin } from "@/server/admin.functions";

export const Route = createFileRoute("/admin-bootstrap")({
  component: BootstrapPage,
});

function BootstrapPage() {
  const run = useServerFn(bootstrapAdmin);
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "running" } | { kind: "done"; reason: string } | { kind: "error"; reason: string }
  >({ kind: "idle" });

  useEffect(() => {
    setState({ kind: "running" });
    run()
      .then((r) =>
        r.ok
          ? setState({ kind: "done", reason: r.reason })
          : setState({ kind: "error", reason: r.reason }),
      )
      .catch((e) =>
        setState({ kind: "error", reason: e?.message ?? "Unknown error" }),
      );
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-background px-6">
      <div className="max-w-md w-full border border-border bg-card p-8 rounded-sm">
        <div className="font-serif italic text-gold text-3xl mb-1">Lucid</div>
        <div className="label-cap mb-6">Sovereign Bootstrap</div>

        {state.kind === "running" && (
          <p className="text-ash text-sm">Provisioning sovereign account…</p>
        )}
        {state.kind === "done" && state.reason === "bootstrapped" && (
          <div className="space-y-3">
            <p className="text-bone text-sm">
              ✓ Super-admin account provisioned.
            </p>
            <p className="text-ash text-xs">
              Sign in at <a className="text-gold underline" href="/auth">/auth</a> with the bootstrap email and password.
            </p>
          </div>
        )}
        {state.kind === "done" && state.reason === "already_bootstrapped" && (
          <div className="space-y-3">
            <p className="text-bone text-sm">
              A super-admin already exists. Bootstrap is sealed.
            </p>
            <p className="text-ash text-xs">
              Sign in at <a className="text-gold underline" href="/auth">/auth</a>.
            </p>
          </div>
        )}
        {state.kind === "error" && (
          <p className="text-destructive text-sm">Failed: {state.reason}</p>
        )}
      </div>
    </div>
  );
}
