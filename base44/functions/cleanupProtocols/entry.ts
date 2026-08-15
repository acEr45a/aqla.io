import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Admin-only protocol housekeeping. Finds stale/unused Protocol records across
// ALL members (Protocol RLS is owner-scoped, so this runs as service role) and
// deletes them on request.
//
// Payload:
//   { mode: "scan" }                        → preview what would be removed
//   { mode: "delete", protocol_ids: [...] } → delete those specific protocols
//   { mode: "delete", user_id: "..." }      → delete all stale protocols for one member
//   { mode: "delete", all: true }           → delete every stale protocol found
//
// Safety: a member's newest active protocol is NEVER stale and can never be
// deleted by this function, so nobody loses the plan they're currently running.
const STALE_AFTER_DAYS = 30;

type Stale = {
  id: string;
  user_id: string;
  name: string;
  family: string;
  status: string;
  start_date: string | null;
  review_date: string | null;
  reason: string;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

// Classifies every protocol into stale (removable) vs kept.
function classify(protocols: any[]) {
  const today = todayKey();
  const byUser = new Map<string, any[]>();
  for (const p of protocols) {
    const owner = p.created_by_id || "unknown";
    if (!byUser.has(owner)) byUser.set(owner, []);
    byUser.get(owner)!.push(p);
  }

  const stale: Stale[] = [];
  let keptCount = 0;

  for (const [owner, list] of byUser.entries()) {
    // Newest first, so the live plan is index 0 of the actives.
    const sorted = [...list].sort((a, b) =>
      (b.created_date || "") < (a.created_date || "") ? -1 : 1
    );
    const actives = sorted.filter((p) => (p.status || "active") === "active");
    const liveId = actives[0]?.id || null;

    for (const p of sorted) {
      const status = p.status || "active";
      let reason: string | null = null;

      if (p.id === liveId) {
        reason = null; // current plan — always protected
      } else if (status === "active") {
        reason = "Superseded duplicate — a newer active plan exists";
      } else if (p.review_date && daysBetween(today, p.review_date) > STALE_AFTER_DAYS) {
        reason = `${status} — review date passed ${daysBetween(today, p.review_date)} days ago`;
      } else if (!p.review_date && p.created_date && daysBetween(today, p.created_date.slice(0, 10)) > STALE_AFTER_DAYS) {
        reason = `${status} — no review date, created ${daysBetween(today, p.created_date.slice(0, 10))} days ago`;
      }

      if (reason) {
        stale.push({
          id: p.id,
          user_id: owner,
          name: p.name || "Untitled protocol",
          family: p.family || "—",
          status,
          start_date: p.start_date || null,
          review_date: p.review_date || null,
          reason,
        });
      } else {
        keptCount++;
      }
    }
  }

  return { stale, keptCount };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden — admin only" }, { status: 403 });

    let body: any = {};
    try { body = await req.json(); } catch { /* noop */ }
    const mode = body.mode === "delete" ? "delete" : "scan";

    const svc = base44.asServiceRole;
    const protocols = await svc.entities.Protocol.list("-created_date", 2000);
    const { stale, keptCount } = classify(protocols || []);

    // Attach member names so the admin sees who each protocol belongs to.
    const users = await svc.entities.User.list("-created_date", 2000);
    const nameOf = new Map((users || []).map((u: any) => [u.id, u.full_name || u.email || "Unknown member"]));
    const withNames = stale.map((s) => ({ ...s, user_name: nameOf.get(s.user_id) || "Unknown member" }));

    if (mode === "scan") {
      return Response.json({
        ok: true,
        mode: "scan",
        total_protocols: (protocols || []).length,
        kept: keptCount,
        stale_count: withNames.length,
        stale: withNames,
      });
    }

    // DELETE — only ever touches ids present in the stale set.
    const staleIds = new Set(stale.map((s) => s.id));
    let targets: Stale[];
    if (Array.isArray(body.protocol_ids) && body.protocol_ids.length) {
      targets = stale.filter((s) => body.protocol_ids.includes(s.id));
    } else if (body.user_id) {
      targets = stale.filter((s) => s.user_id === body.user_id);
    } else if (body.all === true) {
      targets = stale;
    } else {
      return Response.json(
        { error: "Provide protocol_ids, user_id, or all:true to delete." },
        { status: 400 }
      );
    }

    const deleted: string[] = [];
    const failed: string[] = [];
    for (const t of targets) {
      if (!staleIds.has(t.id)) { failed.push(t.id); continue; }
      try {
        await svc.entities.Protocol.delete(t.id);
        deleted.push(t.id);
      } catch {
        failed.push(t.id);
      }
    }

    return Response.json({
      ok: true,
      mode: "delete",
      deleted_count: deleted.length,
      deleted,
      failed,
      remaining_stale: withNames.filter((s) => !deleted.includes(s.id)).length,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}