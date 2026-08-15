import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Computes the signed-in member's consecutive daily check-in streak.
//
// Timezone: streaks are a human, local-calendar concept, so the client sends its
// own local date key (YYYY-MM-DD). We never derive "today" from server UTC time —
// that would break the streak for anyone hours ahead of or behind UTC.
//
// Grace day: one single missed day inside the run is forgiven, so a member who
// misses one day does not lose weeks of adherence. A second miss ends the run.
// Today itself is never counted as a miss — the day isn't over yet.
const dayBefore = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
};

const isDateKey = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    // Fall back to a UTC key only if the client sent nothing usable.
    const today = isDateKey(body?.today) ? body.today : new Date().toISOString().slice(0, 10);

    // User-scoped read: RLS already limits DailyCheckIn to the caller's own rows.
    const checkIns = await base44.entities.DailyCheckIn.list('-date', 400);
    const done = new Set(
      (checkIns || [])
        .filter((c) => c && c.valid !== false && isDateKey(c.date))
        .map((c) => c.date)
    );

    const checkedInToday = done.has(today);
    let cursor = checkedInToday ? today : dayBefore(today);
    let streak = 0;
    let graceUsed = false;

    // Walk backwards day by day. Cap the loop so a corrupt data set can't spin.
    for (let i = 0; i < 400; i++) {
      if (done.has(cursor)) {
        streak++;
        cursor = dayBefore(cursor);
        continue;
      }
      if (!graceUsed && streak > 0 && done.has(dayBefore(cursor))) {
        graceUsed = true;      // forgive this single missed day
        cursor = dayBefore(cursor);
        continue;
      }
      break;
    }

    return Response.json({
      current_streak: streak,
      checked_in_today: checkedInToday,
      grace_day_used: graceUsed,
      total_check_ins: done.size,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}