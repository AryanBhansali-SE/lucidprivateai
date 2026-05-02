import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { addDays, toISODate } from "@/lib/date";

// ---------- Types returned to the client ----------
export interface DailyPriority {
  habit_name: string | null;
  reason: string;
  intensity: "critical" | "important" | "gentle";
}
export interface PatternInsight {
  title: string;
  detail: string;
  category: "consistency" | "correlation" | "warning" | "win";
}
export interface GoalDiagnosis {
  goal_id: string;
  status: "green" | "amber" | "red";
  verdict: string;
}
export interface InsightsBundle {
  daily_priority: DailyPriority;
  patterns: PatternInsight[];
  goal_diagnoses: GoalDiagnosis[];
  generated_at: string;
}

const STALE_AFTER_HOURS = 6;

// ---------- Public: read cached insights ----------
export const getInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InsightsBundle | null> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("ai_insights")
      .select("daily_priority, patterns, goal_diagnoses, generated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      daily_priority: data.daily_priority as unknown as DailyPriority,
      patterns: data.patterns as unknown as PatternInsight[],
      goal_diagnoses: data.goal_diagnoses as unknown as GoalDiagnosis[],
      generated_at: data.generated_at as string,
    };
  });

// ---------- Public: regenerate insights ----------
export const generateInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ force: z.boolean().optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }): Promise<InsightsBundle> => {
    const { supabase, userId } = context;

    // 1. Honor the 6-hour cache unless force=true
    if (!data.force) {
      const { data: cached } = await supabase
        .from("ai_insights")
        .select("daily_priority, patterns, goal_diagnoses, generated_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (cached) {
        const ageMs = Date.now() - new Date(cached.generated_at as string).getTime();
        if (ageMs < STALE_AFTER_HOURS * 3600 * 1000) {
          return {
            daily_priority: cached.daily_priority as unknown as DailyPriority,
            patterns: cached.patterns as unknown as PatternInsight[],
            goal_diagnoses: cached.goal_diagnoses as unknown as GoalDiagnosis[],
            generated_at: cached.generated_at as string,
          };
        }
      }
    }

    // 2. Pull recent data (last 30 days) for analysis
    const since = toISODate(addDays(new Date(), -30));
    const today = toISODate(new Date());

    const [habitsRes, logsRes, goalsRes, krsRes, journalRes] = await Promise.all([
      supabase
        .from("habits")
        .select("id, name, tier, break_penalty")
        .eq("user_id", userId)
        .is("archived_at", null),
      supabase
        .from("habit_logs")
        .select("habit_id, log_date, completed")
        .eq("user_id", userId)
        .gte("log_date", since),
      supabase
        .from("goals")
        .select("id, title, description, status, target_date, created_at")
        .eq("user_id", userId)
        .eq("status", "active"),
      supabase
        .from("key_results")
        .select("id, goal_id, title, kind, current_value, target_value, unit"),
      supabase
        .from("journal_entries")
        .select("entry_date, content_md, sentiment, key_takeaways")
        .eq("user_id", userId)
        .gte("entry_date", since)
        .order("entry_date", { ascending: false })
        .limit(15),
    ]);

    const habits = habitsRes.data ?? [];
    const logs = logsRes.data ?? [];
    const goals = goalsRes.data ?? [];
    const krs = krsRes.data ?? [];
    const journals = journalRes.data ?? [];

    // 3. Build a compact summary for the model
    const habitSummaries = habits.map((h) => {
      const habitLogs = logs.filter((l) => l.habit_id === h.id && l.completed);
      const last7 = habitLogs.filter(
        (l) => new Date(l.log_date) >= addDays(new Date(), -7),
      ).length;
      const last30 = habitLogs.length;
      const lastDoneLog = habitLogs.sort((a, b) =>
        b.log_date.localeCompare(a.log_date),
      )[0];
      return {
        name: h.name,
        tier: h.tier,
        completions_last_7d: last7,
        completions_last_30d: last30,
        last_completed: lastDoneLog?.log_date ?? null,
      };
    });

    const goalSummaries = goals.map((g) => {
      const goalKrs = krs.filter((k) => k.goal_id === g.id);
      const progressPct =
        goalKrs.length === 0
          ? 0
          : Math.round(
              (goalKrs.reduce((acc, k) => {
                if (!k.target_value || Number(k.target_value) === 0) return acc;
                return acc + Math.min(1, Number(k.current_value ?? 0) / Number(k.target_value));
              }, 0) /
                goalKrs.length) *
                100,
            );
      const daysRemaining = g.target_date
        ? Math.round(
            (new Date(g.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          )
        : null;
      return {
        id: g.id,
        title: g.title,
        progress_pct: progressPct,
        days_remaining: daysRemaining,
        kr_count: goalKrs.length,
      };
    });

    const journalSummaries = journals.slice(0, 10).map((j) => ({
      date: j.entry_date,
      sentiment: j.sentiment,
      excerpt: (j.content_md ?? "").slice(0, 240),
    }));

    // 4. Call Lovable AI Gateway with a structured tool call
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are LUCID's analytical engine — a cold, perceptive
performance analyst writing for a single elite user. Your tone is editorial,
terse, and direct. Avoid generic motivational fluff. Address the user as "you".
Sentences should be short and observation-led. No emoji. Today is ${today}.`;

    const userPayload = {
      today,
      habits: habitSummaries,
      goals: goalSummaries,
      recent_journal: journalSummaries,
    };

    const tools = [
      {
        type: "function",
        function: {
          name: "report_insights",
          description: "Return the analytical bundle for the user.",
          parameters: {
            type: "object",
            properties: {
              daily_priority: {
                type: "object",
                description: "The single most important action for today.",
                properties: {
                  habit_name: {
                    type: ["string", "null"],
                    description: "Name of the habit to focus on, or null if a non-habit action.",
                  },
                  reason: {
                    type: "string",
                    description: "1-2 sentence reason, observation-led.",
                  },
                  intensity: {
                    type: "string",
                    enum: ["critical", "important", "gentle"],
                  },
                },
                required: ["habit_name", "reason", "intensity"],
                additionalProperties: false,
              },
              patterns: {
                type: "array",
                description: "2-4 non-obvious patterns detected in the user's data.",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Short headline (under 60 chars)." },
                    detail: { type: "string", description: "1-2 sentence specific finding with numbers when possible." },
                    category: {
                      type: "string",
                      enum: ["consistency", "correlation", "warning", "win"],
                    },
                  },
                  required: ["title", "detail", "category"],
                  additionalProperties: false,
                },
              },
              goal_diagnoses: {
                type: "array",
                description: "One diagnosis per active goal.",
                items: {
                  type: "object",
                  properties: {
                    goal_id: { type: "string" },
                    status: { type: "string", enum: ["green", "amber", "red"] },
                    verdict: { type: "string", description: "1 sentence verdict on trajectory." },
                  },
                  required: ["goal_id", "status", "verdict"],
                  additionalProperties: false,
                },
              },
            },
            required: ["daily_priority", "patterns", "goal_diagnoses"],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze this user's last 30 days and produce the bundle.\n\nDATA:\n${JSON.stringify(userPayload, null, 2)}`,
          },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "report_insights" } },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429) {
        throw new Error("Rate limit exceeded. Wait a moment, then try again.");
      }
      if (aiRes.status === 402) {
        throw new Error("AI credits exhausted. Add credits to continue.");
      }
      throw new Error(`AI gateway error ${aiRes.status}: ${text}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return a structured response.");
    }
    const parsed = JSON.parse(toolCall.function.arguments) as {
      daily_priority: DailyPriority;
      patterns: PatternInsight[];
      goal_diagnoses: GoalDiagnosis[];
    };

    const generatedAt = new Date().toISOString();

    // 5. Upsert into cache
    const { error: upsertErr } = await supabase
      .from("ai_insights")
      .upsert(
        [
          {
            user_id: userId,
            daily_priority: parsed.daily_priority as never,
            patterns: parsed.patterns as never,
            goal_diagnoses: parsed.goal_diagnoses as never,
            generated_at: generatedAt,
          },
        ],
        { onConflict: "user_id" },
      );
    if (upsertErr) throw new Error(upsertErr.message);

    return {
      daily_priority: parsed.daily_priority,
      patterns: parsed.patterns,
      goal_diagnoses: parsed.goal_diagnoses,
      generated_at: generatedAt,
    };
  });
