import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const dateKey = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const [users, assessments, checkIns, protocols, tests, emails] = await Promise.all([
      base44.asServiceRole.entities.User.list("-created_date", 500),
      base44.asServiceRole.entities.Assessment.list("-created_date", 500),
      base44.asServiceRole.entities.DailyCheckIn.list("-date", 500),
      base44.asServiceRole.entities.Protocol.list("-created_date", 500),
      base44.asServiceRole.entities.CognitiveTest.list("-completed_date", 500),
      base44.asServiceRole.entities.EmailDigest.list("-sent_date", 500),
    ]);

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
      };
    });

    const assessmentUsers = new Set(assessments.map((item) => item.created_by_id));
    const checkInCounts = checkIns.reduce((counts, item) => ({ ...counts, [item.created_by_id]: (counts[item.created_by_id] || 0) + 1 }), {});
    const activeProtocols = protocols.filter((item) => item.status === "active");
    const protocolFamilies = ["SPARK", "FLOW", "DRIVE", "LEARN", "RESET", "DIGITAL"].map((family) => ({
      name: family,
      value: activeProtocols.filter((item) => item.family === family).length,
    })).filter((item) => item.value > 0);

    return Response.json({
      overview: { users: users.length, assessments: assessments.length, checkIns: checkIns.length, activeProtocols: activeProtocols.length, summaryEmails: emails.length },
      days,
      protocolFamilies,
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