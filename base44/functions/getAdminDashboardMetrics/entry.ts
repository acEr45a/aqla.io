import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const dateKey = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const pct = (part, total) => total ? Math.round((part / total) * 100) : 0;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const [users, assessments, checkIns, protocols, tests, emails, games, reviews, experiments, profiles, domains] = await Promise.all([
      base44.asServiceRole.entities.User.list("-created_date", 500),
      base44.asServiceRole.entities.Assessment.list("-created_date", 500),
      base44.asServiceRole.entities.DailyCheckIn.list("-date", 500),
      base44.asServiceRole.entities.Protocol.list("-created_date", 500),
      base44.asServiceRole.entities.CognitiveTest.list("-completed_date", 500),
      base44.asServiceRole.entities.EmailDigest.list("-sent_date", 500),
      base44.asServiceRole.entities.GameSession.list("-completed_date", 500),
      base44.asServiceRole.entities.PlanReview.list("-completed_date", 500),
      base44.asServiceRole.entities.Experiment.list("-created_date", 500),
      base44.asServiceRole.entities.HealthProfile.list("-created_date", 500),
      base44.asServiceRole.entities.BrainDomain.list("-updated_date", 500),
    ]);

    const userById = users.reduce((map, item) => ({ ...map, [item.id]: item }), {});

    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        date: key,
        label: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
        registrations: users.filter((item) => dateKey(item.created_date) === key).length,
        checkIns: checkIns.filter((item) => item.date === key).length,
        tests: tests.filter((item) => dateKey(item.completed_date) === key).length,
        games: games.filter((item) => dateKey(item.completed_date) === key).length,
        emails: emails.filter((item) => dateKey(item.sent_date) === key).length,
      };
    });

    const assessmentUsers = new Set(assessments.map((item) => item.created_by_id));
    const checkInCounts = checkIns.reduce((counts, item) => ({ ...counts, [item.created_by_id]: (counts[item.created_by_id] || 0) + 1 }), {});
    const activeProtocols = protocols.filter((item) => item.status === "active");
    const protocolFamilies = ["SPARK", "FLOW", "DRIVE", "LEARN", "RESET", "DIGITAL"].map((family) => ({
      name: family,
      value: activeProtocols.filter((item) => item.family === family).length,
    })).filter((item) => item.value > 0);

    // ---- Analytics: funnel, engagement, test performance ----
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const protocolUsers = new Set(activeProtocols.map((item) => item.created_by_id));
    const activeWeek = new Set(checkIns.filter((item) => item.date >= weekAgo).map((item) => item.created_by_id));

    const funnel = [
      { stage: "Registered", value: users.length, share: 100 },
      { stage: "Safety profile", value: profiles.length, share: pct(profiles.length, users.length) },
      { stage: "Assessment done", value: assessmentUsers.size, share: pct(assessmentUsers.size, users.length) },
      { stage: "Active protocol", value: protocolUsers.size, share: pct(protocolUsers.size, users.length) },
      { stage: "Active this week", value: activeWeek.size, share: pct(activeWeek.size, users.length) },
    ];

    const testTypes = [...new Set(tests.map((item) => item.test_type))].map((type) => {
      const scoped = tests.filter((item) => item.test_type === type);
      return {
        name: type.replace(/_/g, " "),
        attempts: scoped.length,
        average: Math.round(scoped.reduce((sum, item) => sum + (item.normalized_score || 0), 0) / scoped.length),
      };
    }).sort((a, b) => b.attempts - a.attempts);

    const domainAverages = [...new Set(domains.map((item) => item.domain_name))].map((name) => {
      const scoped = domains.filter((item) => item.domain_name === name);
      return { name, average: Math.round(scoped.reduce((sum, item) => sum + (item.score || 0), 0) / scoped.length) };
    }).sort((a, b) => b.average - a.average);

    const analytics = {
      funnel,
      testTypes,
      domainAverages,
      engagement: {
        avgCheckInsPerUser: users.length ? Number((checkIns.length / users.length).toFixed(1)) : 0,
        avgTestsPerUser: users.length ? Number((tests.length / users.length).toFixed(1)) : 0,
        gameSessions: games.length,
        planReviews: reviews.length,
        switchRate: reviews.length ? pct(reviews.filter((item) => item.decision === "switch").length, reviews.length) : 0,
      },
    };

    // ---- Site data: record inventory ----
    const inventory = [
      { name: "Users", count: users.length },
      { name: "Assessments", count: assessments.length },
      { name: "Safety profiles", count: profiles.length },
      { name: "Brain domains", count: domains.length },
      { name: "Protocols", count: protocols.length },
      { name: "Daily check-ins", count: checkIns.length },
      { name: "Cognitive tests", count: tests.length },
      { name: "Training sessions", count: games.length },
      { name: "Plan reviews", count: reviews.length },
      { name: "Experiments", count: experiments.length },
      { name: "Summary emails", count: emails.length },
    ];

    const eligibility = [...new Set(profiles.map((item) => item.eligibility_status))].map((status) => ({
      name: status,
      count: profiles.filter((item) => item.eligibility_status === status).length,
    }));

    // ---- Email log ----
    const emailLog = emails.slice(0, 60).map((item) => ({
      id: item.id,
      kind: item.kind,
      subject: item.subject || "(no subject)",
      period: item.period_key,
      sent_date: item.sent_date,
      recipient: userById[item.created_by_id]?.email || "unknown recipient",
      recipientName: userById[item.created_by_id]?.full_name || "Unknown user",
    }));

    const emailStats = {
      total: emails.length,
      weekly: emails.filter((item) => item.kind === "weekly").length,
      endOfPlan: emails.filter((item) => item.kind === "end_of_plan").length,
      last7: emails.filter((item) => dateKey(item.sent_date) >= weekAgo).length,
      lastSent: emails[0]?.sent_date || null,
      recipients: new Set(emails.map((item) => item.created_by_id)).size,
    };

    return Response.json({
      overview: { users: users.length, assessments: assessments.length, checkIns: checkIns.length, activeProtocols: activeProtocols.length, summaryEmails: emails.length },
      days,
      protocolFamilies,
      analytics,
      siteData: { inventory, eligibility, dataPoints: inventory.reduce((sum, item) => sum + item.count, 0) },
      emails: { stats: emailStats, log: emailLog },
      recentUsers: users.slice(0, 8).map((item) => ({
        id: item.id,
        name: item.full_name || "Unnamed user",
        email: item.email,
        joined: item.created_date,
        assessmentComplete: assessmentUsers.has(item.id),
        checkIns: checkInCounts[item.id] || 0,
        protocol: protocols.find((protocol) => protocol.created_by_id === item.id && protocol.status === "active")?.family || "—",
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}