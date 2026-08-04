import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Admin-only: permanently deletes every record owned by a user, then the user account itself.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { user_id } = await req.json().catch(() => ({}));
    if (!user_id) return Response.json({ error: "Missing user_id" }, { status: 400 });
    if (user_id === admin.id) return Response.json({ error: "You cannot delete your own account." }, { status: 400 });

    const ownedEntities = [
      "Assessment", "DailyCheckIn", "Protocol", "CognitiveTest", "GameSession",
      "PlanReview", "Experiment", "HealthProfile", "BrainDomain", "EmailDigest",
      "AdminOtp", "PdfArchive", "ClinicianReview",
    ];

    for (const name of ownedEntities) {
      await base44.asServiceRole.entities[name].deleteMany({ created_by_id: user_id });
    }

    await base44.asServiceRole.entities.User.delete(user_id);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}