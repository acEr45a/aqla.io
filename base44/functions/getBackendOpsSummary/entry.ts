import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const dateKey = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

/* Backend Ops summary: system job activity, security events, AI compute output and write volume. */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const [emails, otps, ideas, wordbank, checkIns, tests, games, protocols, reviews, pdfs] = await Promise.all([
      base44.asServiceRole.entities.EmailDigest.list("-sent_date", 500),
      base44.asServiceRole.entities.AdminOtp.list("-created_date", 300),
      base44.asServiceRole.entities.DevIdea.list("-created_date", 300),
      base44.asServiceRole.entities.DevWordbankIdea.list("-created_date", 300),
      base44.asServiceRole.entities.DailyCheckIn.list("-created_date", 500),
      base44.asServiceRole.entities.CognitiveTest.list("-created_date", 500),
      base44.asServiceRole.entities.GameSession.list("-created_date", 500),
      base44.asServiceRole.entities.Protocol.list("-created_date", 500),
      base44.asServiceRole.entities.PlanReview.list("-created_date", 300),
      base44.asServiceRole.entities.PdfArchive.list("-created_date", 300),
    ]);

    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - index));
      const key = date.toISOString().slice(0, 10);
      const on = (list, field) => list.filter((item) => dateKey(item[field]) === key).length;
      return {
        date: key,
        label: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
        emailJobs: on(emails, "sent_date"),
        securityEvents: on(otps, "created_date"),
        aiTasks: on(ideas, "created_date") + on(wordbank, "created_date"),
        writes:
          on(checkIns, "created_date") + on(tests, "created_date") + on(games, "created_date") +
          on(protocols, "created_date") + on(reviews, "created_date") + on(pdfs, "created_date"),
      };
    });

    const now = Date.now();
    const jobs = [
      {
        name: "Summary emails",
        detail: "Scheduled weekly and end-of-plan digests",
        total: emails.length,
        failed: emails.filter((item) => item.status === "failed").length,
        last: emails[0]?.sent_date || null,
      },
      {
        name: "Admin verification",
        detail: "One-time security codes issued for console access",
        total: otps.length,
        failed: otps.filter((item) => !item.used && new Date(item.expires_at).getTime() < now).length,
        last: otps[0]?.created_date || null,
      },
      {
        name: "AI compute",
        detail: "Idea refinement, wordbank generation and PDF theming",
        total: ideas.length + wordbank.length,
        failed: 0,
        last: ideas[0]?.created_date || wordbank[0]?.created_date || null,
      },
      {
        name: "Report generation",
        detail: "Branded PDF documents produced for members",
        total: pdfs.length,
        failed: 0,
        last: pdfs[0]?.created_date || null,
      },
    ];

    const checklist = {
      open: ideas.filter((item) => item.status === "open").length,
      inProgress: ideas.filter((item) => item.status === "in_progress").length,
      done: ideas.filter((item) => item.status === "done").length,
      wordbankUnused: wordbank.filter((item) => !item.used).length,
    };

    const writeMix = [
      { name: "Check-ins", count: checkIns.length },
      { name: "Cognitive tests", count: tests.length },
      { name: "Training sessions", count: games.length },
      { name: "Protocols", count: protocols.length },
      { name: "Plan reviews", count: reviews.length },
      { name: "PDF reports", count: pdfs.length },
    ].sort((a, b) => b.count - a.count);

    const totals = {
      emailJobs: emails.length,
      failedJobs: emails.filter((item) => item.status === "failed").length,
      securityEvents: otps.length,
      aiTasks: ideas.length + wordbank.length,
      writes: writeMix.reduce((sum, item) => sum + item.count, 0),
      last24hWrites: days[days.length - 1].writes,
    };

    return Response.json({ days, jobs, checklist, writeMix, totals });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}