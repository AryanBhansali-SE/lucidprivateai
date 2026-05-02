import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lucid" },
      {
        name: "description",
        content: "Access your private Lucid performance terminal.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/pulse" });
  }, [session, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/pulse` },
        });
        if (error) throw error;
        toast.success("Account created");
      }
      // Do NOT navigate here. The useEffect above watches `session` and will
      // navigate to /pulse once onAuthStateChange has propagated the new
      // session into React state. Navigating early causes the guard on
      // /_authenticated to see a stale null session and bounce back to /auth.
    } catch (err: any) {
      toast.error(err?.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left: ornament */}
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-border bg-card">
        <div className="flex items-baseline gap-3">
          <span className="font-serif italic text-gold text-3xl">Lucid</span>
          <span className="label-cap">Private Terminal</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <div className="label-cap">Mandate</div>
            <h2 className="font-serif text-bone text-[42px] leading-[1.1]">
              "Track what compounds.<br />
              Ignore what does not."
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-px bg-hairline border border-hairline">
            {[
              ["Consistency", "Weighted by intent"],
              ["Objectives", "Quantified, dated"],
              ["Journal", "Of the record"],
            ].map(([h, sub]) => (
              <div key={h} className="bg-card p-4">
                <div className="font-serif text-bone text-base leading-tight">{h}</div>
                <div className="label-cap mt-1.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="label-cap">Lucid · Est. 2026 · For private use only</div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-baseline gap-3">
            <span className="font-serif italic text-gold text-3xl">Lucid</span>
            <span className="label-cap">Private Terminal</span>
          </div>

          <div>
            <div className="label-cap mb-2">
              {mode === "signin" ? "Authentication" : "Enrollment"}
            </div>
            <h1 className="font-serif text-bone text-3xl">
              {mode === "signin" ? "Access your terminal" : "Open an account"}
            </h1>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="label-cap">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-hairline focus:border-gold outline-none px-0 py-2.5 text-bone text-sm font-mono transition-colors"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <label className="label-cap">Passphrase</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-hairline focus:border-gold outline-none px-0 py-2.5 text-bone text-sm font-mono transition-colors"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-4 brushed-gold text-obsidian font-mono uppercase text-xs tracking-[0.2em] py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === "signin" ? "Authenticate" : "Enroll"}
            </button>
          </form>

          <div className="pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
              className="label-cap hover:text-bone transition-colors"
            >
              {mode === "signin"
                ? "→ No account? Enroll instead."
                : "→ Already enrolled? Authenticate."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
