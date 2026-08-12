import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { token, version } = body || {};
    if (!token || !version) return Response.json({ error: "Missing token or version" }, { status: 400 });

    const configs = await base44.asServiceRole.entities.CaptchaConfig.list();
    const config = configs[0];
    if (!config) return Response.json({ error: "Captcha not configured" }, { status: 500 });

    const secretKey = version === "v2" ? config.v2_secret_key : config.v3_secret_key;
    const threshold = config.score_threshold ?? 0.5;

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });
    const data = await res.json();
    return Response.json({ success: !!data.success, score: data.score ?? 1, threshold });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}