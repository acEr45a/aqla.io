import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const avg = (rows, key) => {
  const values = rows.map((r) => r[key]).filter((v) => typeof v === "number");
  return values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : null;
};
const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0);

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const [users, checkIns, domains, protocols, tests] = await Promise.all([
      base44.asServiceRole.entities.User.list("-created_date", 500),
      base44.asServiceRole.entities.DailyCheckIn.list("-date", 500),
      base44.asServiceRole.entities.BrainDomain.list("-updated_date", 500),
      base44.asServiceRole.entities.Protocol.list("-created_date", 500),
      base44.asServiceRole.entities.CognitiveTest.list("-completed_date", 500),
    ]);

    const recent = checkIns.filter((item) => item.date >= since);
    const mine = recent.filter((item) => item.created_by_id === user.id);
    const others = recent.filter((item) => item.created_by_id !== user.id);
    const contributors = new Set(recent.map((item) => item.created_by_id)).size;

    const signals = ["clarity", "energy", "sleep_quality", "stress"].map((key) => ({
      key,
      label: { clarity: "Mental clarity", energy: "Energy", sleep_quality: "Sleep quality", stress: "Stress load" }[key],
      community: avg(others.length ? others : recent, key),
      you: avg(mine, key),
      lowerIsBetter: key === "stress",
    }));

    const domainNames = [...new Set(domains.map((item) => item.domain_name))];
    const domainComparison = domainNames.map((name) => {
      const scoped = domains.filter((item) => item.domain_name === name);
      const community = avg(scoped, "score");
      const own = scoped.find((item) => item.created_by_id === user.id);
      const you = own?.score ?? null;
      return {
        name,
        community,
        you: you === null ? null : Math.round(you),
        percentile: you === null ? null : pct(scoped.filter((item) => (item.score || 0) <= you).length, scoped.length),
      };
    }).filter((item) => item.community !== null).sort((a, b) => b.community - a.community);

    const activeProtocols = protocols.filter((item) => item.status === "active");
    const families = ["SPARK", "FLOW", "DRIVE", "LEARN", "RESET", "DIGITAL"].map((family) => ({
      name: family,
      value: activeProtocols.filter((item) => item.family === family).length,
    })).filter((item) => item.value > 0);

    const myCheckIns = mine.length;
    const perUser = {};
    recent.forEach((item) => { perUser[item.created_by_id] = (perUser[item.created_by_id] || 0) + 1; });
    const counts = Object.values(perUser);

    const testTypes = [...new Set(tests.map((item) => item.test_type))].map((type) => {
      const scoped = tests.filter((item) => item.test_type === type);
      const own = scoped.filter((item) => item.created_by_id === user.id);
      return {
        name: type.replace(/_/g, " "),
        community: avg(scoped, "normalized_score"),
        you: own.length ? avg(own, "normalized_score") : null,
      };
    }).filter((item) => item.community !== null);

    return Response.json({
      members: users.length,
      contributors,
      window: "last 30 days",
      signals,
      domainComparison,
      families,
      testTypes,
      consistency: {
        you: myCheckIns,
        communityAverage: counts.length ? Number((counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1)) : 0,
        percentile: counts.length ? pct(counts.filter((c) => c <= myCheckIns).length, counts.length) : null,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}