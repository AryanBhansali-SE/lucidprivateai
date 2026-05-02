
# LUCID — Build Plan

A private-banking-grade personal performance dashboard. Deep charcoal canvas, brushed gold highlights, Playfair Display headers, Inter for data. Real backend with auth so it's a tool you can use daily, not a demo.

## Visual System

- **Palette (dark, default and only theme):** Obsidian `#0A0A0A`, Charcoal `#121212`, Graphite `#1A1A1A`, Hairline borders `#2A2A2A`, Bone text `#E8E6E1`, Ash muted `#8B8680`, Brushed Gold `#D4AF37` (accent only — never decoration).
- **Typography:** Playfair Display for headers and metric labels of weight, Inter (tabular numerals on) for data. JetBrains Mono for timestamps, scores, and "terminal" microcopy.
- **Density:** Tight line-height, hairline 1px borders, generous outer padding, dense inner tables. No shadows, no gradients (one subtle gold-on-gold accent only). No emoji, no rounded "playful" icons — Lucide line icons only, 1.25px stroke.
- **Motion:** Subtle. Numbers tween on update. No bounces, no confetti.

## Data Model (Lovable Cloud / Supabase)

```text
profiles            (id → auth.users, display_name, created_at)
habits              (id, user_id, name, tier: 'keystone'|'core'|'supporting',
                     break_penalty: bool, created_at, archived_at)
habit_logs          (id, user_id, habit_id, log_date, completed, created_at,
                     UNIQUE(habit_id, log_date))
goals               (id, user_id, title, description, target_date, status,
                     created_at)
key_results         (id, goal_id, title, kind: 'numeric'|'checklist',
                     target_value, current_value, unit, sort_order)
key_result_items    (id, key_result_id, label, done, sort_order)   -- checklist KRs
journal_entries     (id, user_id, entry_date, content_md,
                     sentiment: 'focused'|'steady'|'drifting'|'depleted'|'energized',
                     key_takeaways, created_at, UNIQUE(user_id, entry_date))
```

RLS on every table: `user_id = auth.uid()`. `key_results` and `key_result_items` checked via parent goal ownership. Trigger auto-creates a `profiles` row on signup.

## Consistency Score (combined logic)

Per the user's choice, both tier weighting and streak penalty apply.

```text
For each habit over rolling 30 days:
  weight       = { keystone: 3, core: 2, supporting: 1 }[tier]
  raw_rate     = completed_days / 30
  if break_penalty AND a streak ≥ 5 was broken in window:
      raw_rate *= 0.85    (one-time penalty per break, capped)
  contribution = weight * raw_rate

score = 100 * Σ contribution / Σ weight
```

Displayed as a single 0–100 number with a thin radial ring. Recomputed server-side on read so it's always fresh.

## Routes

```text
/                        → landing redirect to /pulse if signed in, else /auth
/auth                    → email/password + Google sign-in (single page, tabs)
/_authenticated          → layout: Sidebar + Header + Outlet
  /pulse                 → Performance Analytics (default after login)
  /matrix                → High-Density Habit Matrix
  /goals                 → Billionaire Goal Engine (list + detail drawer)
  /journal               → Journal of Record (write + Review Mode toggle)
  /settings              → habits CRUD, account, sign out
```

Distraction-Free mode: a single keyboard shortcut (`⌘.`) collapses the sidebar to an icon rail; a second press hides the header chrome too.

## Screens

### Pulse (`/pulse`)
- Top strip: today's Consistency Score (large), 7-day delta, active goals count, journal streak.
- 7-day line chart: habits-completed vs goal-progress %.
- Radial indicators: one ring per active goal, top 4.
- Today's habits checklist (inline-completable).
- "Last journal entry" excerpt.

### Habit Matrix (`/matrix`)
- Rows = habits, columns = last 60 days. Cells are 14×14 squares.
  - Empty = `#1A1A1A`. Completed = brushed gold, opacity by tier weight.
- Hover any cell → date + status. Click toggles completion.
- Sidebar: Consistency Score (radial), per-tier breakdown, longest streak, current streak.
- "+ Add habit" opens a sheet (name, tier, break_penalty toggle).

### Goal Engine (`/goals`)
- List of High-Level Objectives. Each card: title, target date, aggregate progress bar (KPI style — thin, gold fill, percent in tabular numerals).
- Click → side drawer with Key Results.
  - Numeric KR: current/target with inline edit, progress bar.
  - Checklist KR: ordered items, ticked off inline.
  - Aggregate goal % = mean of KR completions (numeric: current/target capped at 1).

### Journal (`/journal`)
- Left: date picker (mini calendar, dots on entry days).
- Center: markdown editor (textarea + live preview toggle). Sentiment selector (5 options as small pills). "Key Takeaways" field below.
- Top-right toggle: **Write** / **Review**.
- Review Mode: each past entry rendered as a card with a right-side metrics column showing that day's:
  - Habits completed (x/y, mini list)
  - Active goal progress snapshots (top 3)
  - Sentiment chip
  - Day's Consistency Score

### Settings
- Manage habits (rename, change tier, archive).
- Account: email, sign out.

## Server Functions (TanStack `createServerFn` + `requireSupabaseAuth`)

```text
habits.functions.ts       listHabits, createHabit, updateHabit, archiveHabit,
                          toggleHabitLog(date), getMatrix(days)
score.functions.ts        getConsistencyScore(asOf?), getDailyScores(range)
goals.functions.ts        listGoals, createGoal, updateGoal,
                          listKeyResults(goalId), upsertKeyResult,
                          toggleChecklistItem, updateNumericKR
journal.functions.ts      upsertEntry(date, …), listEntries(range),
                          getReviewBundle(date)   -- entry + metrics + goals
pulse.functions.ts        getPulse(days=7)        -- combined chart payload
```

All sensitive logic (score math, review bundle aggregation) lives server-side. Client never trusts client-computed scores.

## Build Order

1. **Auth + shell.** Enable Lovable Cloud. Create migrations for all tables + RLS + profiles trigger. Build `/auth` (email/password + Google) and the `_authenticated` layout (Sidebar with collapse, Header with date and Distraction-Free toggle).
2. **Design system.** Replace `src/styles.css` with the Stealth Wealth tokens. Wire Playfair Display + Inter + JetBrains Mono. Build `Panel`, `Stat`, `RadialScore`, `KPIBar` primitives.
3. **Habits + Matrix.** Server functions, matrix grid, add-habit sheet, score computation.
4. **Goals.** List + detail drawer, both KR types, progress aggregation.
5. **Journal.** Editor + Review Mode with combined metrics bundle.
6. **Pulse.** 7-day line chart (Recharts, restyled to hairline gold), radial rings, today summary.
7. **Polish pass.** Empty states, loading skeletons (charcoal shimmer, no animation flair), keyboard shortcuts, mobile responsive (matrix scrolls horizontally, sidebar becomes a drawer).

## What I Will Not Do

- No light mode (the brief is dark-first; adding a toggle dilutes the aesthetic).
- No streak badges, levels, XP, or any gamification language.
- No emoji or colored category chips. Sentiments are typographic labels with a single gold underline indicator.
- No third-party rich-text editor — markdown via a small textarea + `marked` for preview keeps it fast and minimal.

## Open Items (will default if not raised)

- **Google sign-in:** I'll wire it; if you'd rather skip and ship email/password only for v1, say so before I start step 1.
- **Charts library:** Recharts (already in shadcn ecosystem), restyled. If you want pure SVG hand-rolled, tell me now — it's slower to build but lighter.

Approve and I'll execute steps 1–7 in order.
