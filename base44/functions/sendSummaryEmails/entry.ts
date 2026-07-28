import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  weekKey, withinLastDays, daysSince, weeklyPrompt, endOfPlanPrompt, emailShell,
} from '../../shared/summaryEmails.js';

const SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body_html: { type: "string" },
    confidence: { type: "string", enum: ["low", "moderate", "high"] },
  },
  required: ["subject", "body_html"],
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date();
    const isSunday = now.getDay() === 0;
    const users = await svc.entities.User.list();
    const sent = [];

    for (const user of users) {
      if (!user.email) continue;
      const q = { created_by_id: user.id };
      const [checkIns, sessions, domains, protocols, digests] = await Promise.all([
        svc.entities.DailyCheckIn.filter(q, "-date", 40),
        svc.entities.GameSession.filter(q, "-completed_date", 60),
        svc.entities.BrainDomain.filter(q, "-updated_date", 20),
        svc.entities.Protocol.filter({ ...q, status: "active" }, "-created_date", 1),
        svc.entities.EmailDigest.filter(q, "-sent_date", 40),
      ]);
      const protocol = protocols[0] || null;
      const name = user.full_name?.split(" ")[0] || "there";

      const send = async (kind, periodKey, prompt, title) => {
        if (digests.some((d) => d.kind === kind && d.period_key === periodKey)) return;
        const res = await svc.integrations.Core.InvokeLLM({ prompt, response_json_schema: SUMMARY_SCHEMA });
        await svc.integrations.Core.SendEmail({
          to: user.email,
          from_name: "AQLA",
          subject: res.subject,
          body: emailShell(title, res.body_html),
        });
        await svc.entities.EmailDigest.create({
          kind, period_key: periodKey, protocol_id: protocol?.id,
          sent_date: now.toISOString(), subject: res.subject, created_by_id: user.id,
        });
        sent.push({ user: user.email, kind });
      };

      // End-of-plan report: the 14-day cycle has elapsed.
      if (protocol?.start_date && daysSince(protocol.start_date, now) >= (protocol.duration_days || 14)) {
        const cycleCheckIns = checkIns.filter((c) => new Date(c.date) >= new Date(protocol.start_date));
        if (cycleCheckIns.length >= 5) {
          await send("end_of_plan", `plan-${protocol.id}`,
            endOfPlanPrompt({ name, checkIns: cycleCheckIns, sessions, domains, protocol }),
            "Your 14-day plan report");
          continue;
        }
      }

      // Weekly summary: one per week, only with real signal.
      if (isSunday) {
        const weekCheckIns = checkIns.filter((c) => withinLastDays(c.date, 7, now));
        const weekSessions = sessions.filter((s) => withinLastDays(s.completed_date, 7, now));
        if (weekCheckIns.length >= 3) {
          await send("weekly", weekKey(now),
            weeklyPrompt({ name, checkIns: weekCheckIns, sessions: weekSessions, domains, protocol }),
            "Your week in review");
        }
      }
    }

    return Response.json({ ok: true, sent_count: sent.length, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}