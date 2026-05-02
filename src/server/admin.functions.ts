import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

/**
 * Bootstraps the super_admin account from ADMIN_BOOTSTRAP_EMAIL +
 * ADMIN_BOOTSTRAP_PASSWORD secrets. Idempotent.
 *
 * - If no super_admin exists yet, creates (or finds) the auth user for that
 *   email, sets the password, marks email confirmed, and grants super_admin.
 * - If a super_admin already exists, this is a no-op.
 *
 * Public (no auth) by design — first-run bootstrap. Refuses to do anything
 * once a super_admin is present, so it cannot be abused later.
 */
export const bootstrapAdmin = createServerFn({ method: "POST" }).handler(
  async () => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return { ok: false, reason: "Server not configured" as const };
    }
    if (!email || !password) {
      return { ok: false, reason: "Bootstrap secrets missing" as const };
    }

    const admin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Bail if any super_admin already exists.
    const { count: existingAdmins, error: countErr } = await admin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    if (countErr) {
      return { ok: false, reason: "Role lookup failed" as const };
    }
    if ((existingAdmins ?? 0) > 0) {
      return { ok: true, reason: "already_bootstrapped" as const };
    }

    // 2. Find or create the auth user.
    let userId: string | null = null;
    // listUsers paginates; bootstrap account should be findable on page 1
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) {
      return { ok: false, reason: "User lookup failed" as const };
    }
    const found = list.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (found) {
      userId = found.id;
      // Reset password to bootstrap value + ensure email confirmed
      await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
    } else {
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name: "Super Admin" },
        });
      if (createErr || !created.user) {
        return { ok: false, reason: "User create failed" as const };
      }
      userId = created.user.id;
    }

    // 3. Grant super_admin (idempotent via UNIQUE).
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role: "super_admin" });
    if (roleErr && !/duplicate key/i.test(roleErr.message)) {
      return { ok: false, reason: "Role grant failed" as const };
    }

    return { ok: true, reason: "bootstrapped" as const };
  },
);

/** Returns whether the calling user has a given role. */
export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) return { roles: [] as string[] };
    return { roles: (data ?? []).map((r) => r.role) };
  });

/**
 * Returns global telemetry — only callable by super_admin (RLS enforced).
 */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Hard gate: must be super_admin
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleRow) {
      throw new Response("Forbidden", { status: 403 });
    }

    const [
      { data: profiles },
      { data: habits },
      { data: logs },
      { data: goals },
      { data: journals },
      { data: roles },
    ] = await Promise.all([
      supabase.from("profiles").select("id, display_name, created_at"),
      supabase.from("habits").select("id, user_id, archived_at"),
      supabase.from("habit_logs").select("id, user_id, log_date"),
      supabase.from("goals").select("id, user_id, status"),
      supabase.from("journal_entries").select("id, user_id, entry_date"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const byUser = new Map<
      string,
      {
        id: string;
        display_name: string | null;
        created_at: string;
        habits: number;
        logs: number;
        goals: number;
        journals: number;
        roles: string[];
        last_log: string | null;
      }
    >();

    for (const p of profiles ?? []) {
      byUser.set(p.id, {
        id: p.id,
        display_name: p.display_name,
        created_at: p.created_at,
        habits: 0,
        logs: 0,
        goals: 0,
        journals: 0,
        roles: [],
        last_log: null,
      });
    }
    for (const h of habits ?? []) {
      const u = byUser.get(h.user_id);
      if (u && !h.archived_at) u.habits++;
    }
    for (const l of logs ?? []) {
      const u = byUser.get(l.user_id);
      if (!u) continue;
      u.logs++;
      if (!u.last_log || l.log_date > u.last_log) u.last_log = l.log_date;
    }
    for (const g of goals ?? []) {
      const u = byUser.get(g.user_id);
      if (u && g.status === "active") u.goals++;
    }
    for (const j of journals ?? []) {
      const u = byUser.get(j.user_id);
      if (u) u.journals++;
    }
    for (const r of roles ?? []) {
      const u = byUser.get(r.user_id);
      if (u) u.roles.push(r.role);
    }

    const users = Array.from(byUser.values()).sort(
      (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
    );

    return {
      totals: {
        users: users.length,
        habits: (habits ?? []).filter((h) => !h.archived_at).length,
        logs: (logs ?? []).length,
        goals: (goals ?? []).filter((g) => g.status === "active").length,
        journals: (journals ?? []).length,
      },
      users,
    };
  });
