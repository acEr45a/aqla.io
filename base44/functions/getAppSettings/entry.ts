import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let test_mode = false;
    let captcha = null;
    try {
      const settings = await base44.asServiceRole.entities.AppSettings.list();
      test_mode = !!settings[0]?.test_mode;
    } catch (e) {}
    try {
      const configs = await base44.asServiceRole.entities.CaptchaConfig.list();
      const c = configs[0];
      if (c) captcha = { v3_site_key: c.v3_site_key, v2_site_key: c.v2_site_key, score_threshold: c.score_threshold ?? 0.5 };
    } catch (e) {}
    return Response.json({ test_mode, captcha });
  } catch (error) {
    return Response.json({ test_mode: false, captcha: null });
  }
}