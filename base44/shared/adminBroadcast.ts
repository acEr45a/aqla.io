// Shared helper: emails every admin a styled HTML message and reports how many
// were delivered. Used by clinician alerts and user-submitted issues.
export async function broadcastToAdmins(
  svc: any,
  { subject, html, fromName }: { subject: string; html: string; fromName?: string }
): Promise<{ delivered: number; total: number; results: any[] }> {
  const users = await svc.entities.User.list("-created_date", 200);
  const admins = users.filter((u: any) => u.role === "admin" && u.email);
  if (admins.length === 0) return { delivered: 0, total: 0, results: [] };

  const results = await Promise.all(
    admins.map((admin: any) =>
      svc.integrations.Core.SendEmail({
        to: admin.email,
        subject,
        body: html,
        ...(fromName ? { from_name: fromName } : {}),
      })
        .then(() => ({ admin: admin.email, status: "delivered" }))
        .catch((e: any) => ({ admin: admin.email, status: "failed", error: e.message }))
    )
  );
  const delivered = results.filter((r: any) => r.status === "delivered").length;
  return { delivered, total: admins.length, results };
}