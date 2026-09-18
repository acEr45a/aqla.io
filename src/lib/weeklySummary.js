import { apiClient, runAiWorker } from "@/api/apiClient";
import { localDateKey } from "@/lib/dateKey";

// Sunday-anchored key for the current week, e.g. "week-2026-07-26"
export function weekKey(date = new Date()) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return `week-${localDateKey(start)}`;
}

// End of week = Friday, Saturday or Sunday (local)
export function isEndOfWeek(date = new Date()) {
  const d = date.getDay();
  return d === 5 || d === 6 || d === 0;
}

export function withinLastDays(dateStr, days) {
  if (!dateStr) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(dateStr) >= cutoff;
}

export async function generateWeeklySummary() {
  const [checkIns, sessions, domains, protocols] = await Promise.all([
    apiClient.entities.DailyCheckIn.list("-date", 14),
    apiClient.entities.GameSession.list("-completed_date", 30),
    apiClient.entities.BrainDomain.list("-updated_date"),
    apiClient.entities.Protocol.filter({ status: "active" }, "-created_date", 1),
  ]);

  const weekCheckIns = checkIns.filter((c) => withinLastDays(c.date, 7));
  const weekSessions = sessions.filter((s) => withinLastDays(s.completed_date, 7));

  // No fabricated output: require real signals from this week.
  if (weekCheckIns.length < 3) return null;

  // Centralized in worker-registry.ts: weekly_summary (prompt + schema live server-side).
  const res = await runAiWorker("weekly_summary", {
    daily_check_ins: weekCheckIns.map((c) => ({ date: c.date, clarity: c.clarity, energy: c.energy, stress: c.stress, sleep_quality: c.sleep_quality, caffeine_servings: c.caffeine_servings, caffeine_last_time: c.caffeine_last_time, demand: c.demand, note: c.note })),
    training_sessions: weekSessions.map((s) => ({ game: s.game_id, score: s.score, date: s.completed_date })),
    brain_domains: domains.map((d) => ({ name: d.domain_name, score: d.score, trend: d.trend })),
    active_protocol: protocols[0] ? { name: protocols[0].name, family: protocols[0].family, objective: protocols[0].objective } : null,
  });

  return {
    ...res,
    check_in_count: weekCheckIns.length,
    session_count: weekSessions.length,
  };
}