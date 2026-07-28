import { base44 } from "@/api/base44Client";
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
    base44.entities.DailyCheckIn.list("-date", 14),
    base44.entities.GameSession.list("-completed_date", 30),
    base44.entities.BrainDomain.list("-updated_date"),
    base44.entities.Protocol.filter({ status: "active" }, "-created_date", 1),
  ]);

  const weekCheckIns = checkIns.filter((c) => withinLastDays(c.date, 7));
  const weekSessions = sessions.filter((s) => withinLastDays(s.completed_date, 7));

  // No fabricated output: require real signals from this week.
  if (weekCheckIns.length < 3) return null;

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are AQLA Intelligence writing an end-of-week summary for one user.
STRICT RULES: use ONLY the data below. Never invent numbers, times, windows, trends or events. If a field cannot be supported by the data, return an empty string for it. State uncertainty when the sample is small. No diagnosis, no medication advice.

Daily check-ins this week (1-10 scales): ${JSON.stringify(weekCheckIns.map((c) => ({ date: c.date, clarity: c.clarity, energy: c.energy, stress: c.stress, sleep_quality: c.sleep_quality, caffeine_servings: c.caffeine_servings, caffeine_last_time: c.caffeine_last_time, demand: c.demand, note: c.note })))}
Training sessions this week: ${JSON.stringify(weekSessions.map((s) => ({ game: s.game_id, score: s.score, date: s.completed_date })))}
Brain Map domains (from assessment): ${JSON.stringify(domains.map((d) => ({ name: d.domain_name, score: d.score, trend: d.trend })))}
Active protocol: ${JSON.stringify(protocols[0] ? { name: protocols[0].name, family: protocols[0].family, objective: protocols[0].objective } : "none")}`,
    response_json_schema: {
      type: "object",
      properties: {
        headline: { type: "string" },
        observed: { type: "string" },
        pattern: { type: "string" },
        training: { type: "string" },
        next_week_focus: { type: "string" },
        confidence: { type: "string", enum: ["low", "moderate", "high"] },
      },
      required: ["headline", "observed", "next_week_focus", "confidence"],
    },
  });

  return {
    ...res,
    check_in_count: weekCheckIns.length,
    session_count: weekSessions.length,
  };
}