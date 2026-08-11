import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/* Full app test: runs a battery of platform checks and returns a health score out of 100. */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const checks = [];
    const add = (name, status, detail) => checks.push({ name, status, detail });

    // 1. Database connectivity
    let users = [];
    try {
      users = await base44.asServiceRole.entities.User.list('-created_date', 200);
      add('Database connectivity', 'pass', `Reached the database — ${users.length} registered users.`);
    } catch (e) {
      add('Database connectivity', 'fail', `Could not read users: ${e.message}`);
    }

    const [protocols, checkins, tests, domains, assessments, digests, otps] = await Promise.all([
      base44.asServiceRole.entities.Protocol.list('-created_date', 500),
      base44.asServiceRole.entities.DailyCheckIn.list('-created_date', 500),
      base44.asServiceRole.entities.CognitiveTest.list('-created_date', 500),
      base44.asServiceRole.entities.BrainDomain.list('-created_date', 500),
      base44.asServiceRole.entities.Assessment.list('-created_date', 500),
      base44.asServiceRole.entities.EmailDigest.list('-created_date', 200),
      base44.asServiceRole.entities.AdminOtp.list('-created_date', 100),
    ]);

    // 2. Backend functions responding
    try {
      const res = await base44.functions.invoke('getAdminDashboardMetrics', {});
      if (res.data && res.data.overview) add('Backend functions', 'pass', 'Metrics endpoint responded with valid data.');
      else add('Backend functions', 'warn', 'Metrics endpoint responded but the payload looks incomplete.');
    } catch (e) {
      add('Backend functions', 'fail', `Metrics endpoint failed: ${e.message}`);
    }

    // 3. Protocol integrity
    const badProtocols = protocols.filter((p) => !p.family || !p.name).length;
    const activeByUser = {};
    protocols.filter((p) => p.status === 'active').forEach((p) => { activeByUser[p.created_by_id] = (activeByUser[p.created_by_id] || 0) + 1; });
    const dupActive = Object.values(activeByUser).filter((n) => n > 1).length;
    if (badProtocols === 0 && dupActive === 0) add('Protocol integrity', 'pass', `${protocols.length} protocols — no missing fields or duplicate active plans.`);
    else add('Protocol integrity', dupActive > 0 ? 'fail' : 'warn', `${badProtocols} incomplete protocols, ${dupActive} users with multiple active plans.`);

    // 4. Check-in data
    const badCheckins = checkins.filter((c) => !c.date).length;
    add('Check-in data', badCheckins === 0 ? 'pass' : 'warn', badCheckins === 0 ? `${checkins.length} check-ins, all dated correctly.` : `${badCheckins} check-ins missing a date.`);

    // 5. Cognitive test scores
    const badTests = tests.filter((t) => typeof t.normalized_score !== 'number' || isNaN(t.normalized_score)).length;
    add('Cognitive test scores', badTests === 0 ? 'pass' : 'fail', badTests === 0 ? `${tests.length} tests, all with valid scores.` : `${badTests} tests have invalid scores.`);

    // 6. Brain domain scores
    const badDomains = domains.filter((d) => d.score < 0 || d.score > 100).length;
    add('Brain domain scores', badDomains === 0 ? 'pass' : 'fail', badDomains === 0 ? `${domains.length} domain records within 0–100 range.` : `${badDomains} domain scores out of range.`);

    // 7. Onboarding funnel — users stuck without an assessment
    const assessedIds = new Set(assessments.map((a) => a.created_by_id));
    const stuck = users.filter((u) => !assessedIds.has(u.id)).length;
    checks.push({
      name: 'Onboarding funnel',
      status: stuck === 0 ? 'pass' : 'warn',
      detail: stuck === 0 ? 'Every registered user has completed an assessment.' : `${stuck} of ${users.length} users have not completed an assessment.`,
      resolve_action: stuck > 0 ? 'kick_onboard_users' : null,
    });

    // 8. Email delivery
    const failedEmails = digests.filter((d) => d.status === 'failed').length;
    add('Email delivery', failedEmails === 0 ? 'pass' : 'warn', failedEmails === 0 ? `${digests.length} digests delivered, no failures.` : `${failedEmails} email digests failed to deliver.`);

    // 9. Security hygiene — expired unused OTPs
    const now = new Date();
    const stale = otps.filter((o) => !o.used && new Date(o.expires_at) < now).length;
    checks.push({
      name: 'Security hygiene',
      status: stale <= 5 ? 'pass' : 'warn',
      detail: stale <= 5 ? 'Admin verification codes are clean.' : `${stale} expired verification codes should be cleaned up.`,
      resolve_action: stale > 0 ? 'cleanup_expired_otps' : null,
    });

    // 10. SEO & meta — audit the published landing page's head tags
    let landingHtml: string | null = null;
    try {
      const origin = new URL(req.url).origin;
      const landingRes = await fetch(origin, { headers: { accept: 'text/html' }, redirect: 'follow' });
      if (landingRes.ok) {
        landingHtml = await landingRes.text();
        const titleMatch = landingHtml.match(/<title[^>]*>([^<]*)<\/title>/i);
        const titleLen = titleMatch ? titleMatch[1].trim().length : 0;
        const has = (re: RegExp) => re.test(landingHtml!);
        const gaps: string[] = [];
        if (titleLen < 10 || titleLen > 70) gaps.push('title length');
        if (!has(/<meta[^>]+name=["']description["']/i)) gaps.push('meta description');
        if (!has(/<meta[^>]+property=["']og:title["']/i)) gaps.push('og:title');
        if (!has(/<meta[^>]+property=["']og:description["']/i)) gaps.push('og:description');
        if (!has(/<meta[^>]+property=["']og:image["']/i)) gaps.push('og:image');
        if (!has(/<link[^>]+rel=["']canonical["']/i)) gaps.push('canonical');
        if (gaps.length === 0) add('SEO & meta', 'pass', 'Landing page has title, description, and Open Graph tags.');
        else checks.push({
          name: 'SEO & meta',
          status: gaps.length > 3 ? 'fail' : 'warn',
          detail: `Missing: ${gaps.join(', ')}. These affect search ranking and social sharing.`,
          resolve_action: 'fix_seo_meta',
        });
      } else {
        checks.push({
          name: 'SEO & meta',
          status: 'warn',
          detail: `Could not fetch the landing page (HTTP ${landingRes.status}).`,
          resolve_action: 'fix_seo_meta',
        });
      }
    } catch (e: any) {
      checks.push({
        name: 'SEO & meta',
        status: 'warn',
        detail: `SEO audit skipped: ${e.message}`,
        resolve_action: 'fix_seo_meta',
      });
    }

    // 11. Page design — mobile-readiness & reader-grabbing signals
    if (landingHtml) {
      const has = (re: RegExp) => re.test(landingHtml);
      const gaps: string[] = [];
      if (!has(/<meta[^>]+name=["']viewport["']/i)) gaps.push('viewport');
      if (!has(/<link[^>]+rel=["']manifest["']/i)) gaps.push('web manifest');
      if (!has(/<link[^>]+rel=["']apple-touch-icon["']/i)) gaps.push('apple-touch-icon');
      if (!has(/<meta[^>]+name=["']theme-color["']/i)) gaps.push('theme-color');
      if (!has(/<meta[^>]+name=["']format-detection["']/i)) gaps.push('format-detection');
      if (gaps.length === 0) add('Page design', 'pass', 'Landing page is mobile-ready with icons, manifest, and theme color.');
      else checks.push({
        name: 'Page design',
        status: gaps.length > 2 ? 'warn' : 'pass',
        detail: `Mobile-readiness gaps: ${gaps.join(', ')}.`,
        resolve_action: 'fix_page_design',
      });
    } else {
      checks.push({
        name: 'Page design',
        status: 'warn',
        detail: 'Could not audit the landing page — it may not be published yet.',
        resolve_action: 'fix_page_design',
      });
    }

    const score = Math.max(0, Math.round(100 - checks.reduce((sum, c) => sum + (c.status === 'fail' ? 20 : c.status === 'warn' ? 8 : 0), 0)));

    return Response.json({ score, checks, ran_at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}