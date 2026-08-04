import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { QA_DEFAULTS, BLEND, TEST_TYPES } from '../../shared/cognitiveBaseline.js';

// Admin-only: auto-completes the cognitive baseline for a target user by writing
// passing CognitiveTest records and blending the scores into their Brain Map domains.
// Mirrors the QA pass-through in the frontend (?qa=1) so the Backend Ops agent can
// unstick a user's onboarding without them playing the interactive tasks.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access only' }, { status: 403 });

    let body = {};
    try { body = await req.json(); } catch { /* empty payload allowed */ }
    const userId = body.user_id;
    if (!userId) return Response.json({ error: 'user_id is required' }, { status: 400 });

    const svc = base44.asServiceRole;
    const now = new Date().toISOString();

    // Create a passing CognitiveTest record for every baseline test type, owned by the target user.
    for (const type of TEST_TYPES) {
      const d = QA_DEFAULTS[type];
      await svc.entities.CognitiveTest.create({
        test_type: type,
        raw_results: d.raw,
        normalized_score: d.score,
        completed_date: now,
        valid: true,
        created_by_id: userId,
      });
    }

    // Blend the new scores into the target user's Brain Map domains.
    const latest = {};
    const rows = await svc.entities.CognitiveTest.filter({ created_by_id: userId });
    for (const r of rows) {
      const rec = r;
      const completedAt = new Date(rec.completed_date || rec.created_date).getTime();
      if (rec.raw_results?.game_id || rec.valid === false) continue;
      if (!latest[rec.test_type] || completedAt > new Date(latest[rec.test_type].completed_date || latest[rec.test_type].created_date).getTime()) {
        latest[rec.test_type] = rec;
      }
    }

    const domains = await svc.entities.BrainDomain.filter({ created_by_id: userId });
    const byKey = {};
    for (const d of domains) { if (!byKey[d.domain_key]) byKey[d.domain_key] = d; }

    let updatedDomains = 0;
    for (const [domainKey, testType, w] of BLEND) {
      const d = byKey[domainKey];
      const t = latest[testType];
      if (!d || !t) continue;
      const newScore = Math.round(d.score * (1 - w) + t.normalized_score * w);
      const sources = Array.from(new Set([...(d.data_sources || []), 'Cognitive baseline tests']));
      await svc.entities.BrainDomain.update(d.id, {
        score: newScore,
        confidence: 'high',
        trend: newScore > d.score ? 'up' : newScore < d.score ? 'down' : d.trend,
        data_sources: sources,
      });
      updatedDomains++;
    }

    return Response.json({
      status: 'success',
      user_id: userId,
      tests_created: TEST_TYPES.length,
      domains_updated: updatedDomains,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}