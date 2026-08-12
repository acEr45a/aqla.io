import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Hard-coded owner. Only this user, plus anyone they promote, is a Super Admin.
const OWNER_ID = "6a670dff96c46b62aaca0b7e";

async function isSuperAdmin(base44, user) {
  if (!user) return false;
  if (user.id === OWNER_ID) return true;
  const configs = await base44.asServiceRole.entities.SuperAdminConfig.list();
  const ids = configs[0]?.super_admin_ids || [];
  return ids.includes(user.id);
}

async function writeLog(base44, action, target, meta) {
  await base44.asServiceRole.entities.SuperAdminLog.create({
    action, target_user_id: target || null, timestamp: new Date().toISOString(), meta: meta || {}
  });
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { action } = body || {};
    const superAdmin = await isSuperAdmin(base44, user);

    if (action === "check") {
      return Response.json({ isSuperAdmin: superAdmin });
    }

    if (!superAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    if (action === "listAdmins") {
      const users = await base44.asServiceRole.entities.User.list();
      const configs = await base44.asServiceRole.entities.SuperAdminConfig.list();
      const superIds = configs[0]?.super_admin_ids || [];
      const admins = users
        .filter((u) => u.role === "admin")
        .map((u) => ({ id: u.id, email: u.email, full_name: u.full_name, isSuper: u.id === OWNER_ID || superIds.includes(u.id) }));
      return Response.json({ admins });
    }

    if (action === "promote") {
      const { target_user_id } = body;
      if (!target_user_id) return Response.json({ error: "Missing target" }, { status: 400 });
      const configs = await base44.asServiceRole.entities.SuperAdminConfig.list();
      if (!configs.length) {
        await base44.asServiceRole.entities.SuperAdminConfig.create({ super_admin_ids: [target_user_id] });
      } else {
        const ids = Array.from(new Set([...(configs[0].super_admin_ids || []), target_user_id]));
        await base44.asServiceRole.entities.SuperAdminConfig.update(configs[0].id, { super_admin_ids: ids });
      }
      await writeLog(base44, "promote", target_user_id, { by: user.id });
      return Response.json({ ok: true });
    }

    if (action === "demote") {
      const { target_user_id } = body;
      const configs = await base44.asServiceRole.entities.SuperAdminConfig.list();
      if (configs.length) {
        const ids = (configs[0].super_admin_ids || []).filter((id) => id !== target_user_id);
        await base44.asServiceRole.entities.SuperAdminConfig.update(configs[0].id, { super_admin_ids: ids });
      }
      await writeLog(base44, "demote", target_user_id, { by: user.id });
      return Response.json({ ok: true });
    }

    if (action === "logs") {
      const logs = await base44.asServiceRole.entities.SuperAdminLog.list("-timestamp", 50);
      return Response.json({ logs });
    }

    if (action === "getCaptcha") {
      const configs = await base44.asServiceRole.entities.CaptchaConfig.list();
      return Response.json({ config: configs[0] || null });
    }

    if (action === "saveCaptcha") {
      const { config } = body;
      const existing = await base44.asServiceRole.entities.CaptchaConfig.list();
      if (existing.length) {
        await base44.asServiceRole.entities.CaptchaConfig.update(existing[0].id, config);
      } else {
        await base44.asServiceRole.entities.CaptchaConfig.create(config);
      }
      await writeLog(base44, "key_edit", null, { fields: Object.keys(config || {}) });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}