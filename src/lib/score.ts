// Consistency Score: tier-weighted + streak-break penalty.
// Pure functions — server functions import these.

import { addDays, toISODate } from "./date";

export type Tier = "keystone" | "core" | "supporting";

export const TIER_WEIGHT: Record<Tier, number> = {
  keystone: 3,
  core: 2,
  supporting: 1,
};

export interface ScoreHabit {
  id: string;
  tier: Tier;
  break_penalty: boolean;
}

export interface ScoreLog {
  habit_id: string;
  log_date: string; // YYYY-MM-DD
  completed: boolean;
}

const WINDOW_DAYS = 30;

/**
 * Compute Consistency Score for a set of habits over the last `WINDOW_DAYS`
 * ending on `asOf` (inclusive).
 */
export function computeScore(
  habits: ScoreHabit[],
  logs: ScoreLog[],
  asOf: Date = new Date(),
): number {
  if (habits.length === 0) return 0;

  // Build set of completion dates per habit
  const byHabit = new Map<string, Set<string>>();
  for (const h of habits) byHabit.set(h.id, new Set());
  for (const l of logs) {
    if (l.completed) byHabit.get(l.habit_id)?.add(l.log_date);
  }

  // Window dates
  const windowDates: string[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    windowDates.push(toISODate(addDays(asOf, -i)));
  }

  let totalWeight = 0;
  let totalContribution = 0;

  for (const h of habits) {
    const weight = TIER_WEIGHT[h.tier];
    totalWeight += weight;

    const set = byHabit.get(h.id) ?? new Set();
    let completed = 0;
    for (const d of windowDates) if (set.has(d)) completed++;
    let rate = completed / WINDOW_DAYS;

    if (h.break_penalty) {
      // Look for any broken streak ≥ 5: a run of 5+ completed days followed by a miss.
      let run = 0;
      let brokeBigStreak = false;
      for (const d of windowDates) {
        if (set.has(d)) {
          run++;
        } else {
          if (run >= 5) brokeBigStreak = true;
          run = 0;
        }
      }
      if (brokeBigStreak) rate *= 0.85;
    }

    totalContribution += weight * rate;
  }

  if (totalWeight === 0) return 0;
  return Math.round((100 * totalContribution) / totalWeight);
}

export function currentStreak(logs: ScoreLog[], habitId: string, asOf: Date = new Date()): number {
  const set = new Set(
    logs.filter((l) => l.habit_id === habitId && l.completed).map((l) => l.log_date),
  );
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = toISODate(addDays(asOf, -i));
    if (set.has(d)) streak++;
    else break;
  }
  return streak;
}

export function longestStreak(logs: ScoreLog[], habitId: string): number {
  const dates = logs
    .filter((l) => l.habit_id === habitId && l.completed)
    .map((l) => l.log_date)
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of dates) {
    if (prev === null) {
      run = 1;
    } else {
      const [py, pm, pd] = prev.split("-").map(Number);
      const prevDate = new Date(py, pm - 1, pd);
      const next = toISODate(addDays(prevDate, 1));
      run = next === d ? run + 1 : 1;
    }
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
