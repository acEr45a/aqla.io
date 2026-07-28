import { base44 } from "@/api/base44Client";
import { localDateKey } from "@/lib/dateKey";

export function planReviewDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return localDateKey(date);
}

export async function activateProtocolFamily(family, replacedStatus = "paused") {
  const protocols = await base44.entities.Protocol.list("-created_date");
  const target = protocols.find((plan) => plan.family === family);
  if (!target) throw new Error(`${family} plan is unavailable.`);

  const updates = protocols
    .filter((plan) => plan.status === "active" && plan.id !== target.id)
    .map((plan) => ({ id: plan.id, status: replacedStatus }));
  updates.push({
    id: target.id,
    status: "active",
    start_date: localDateKey(),
    review_date: planReviewDate(),
    duration_days: 14,
  });
  await base44.entities.Protocol.bulkUpdate(updates);
  window.dispatchEvent(new Event("aqla:protocol-changed"));
  return { ...target, ...updates[updates.length - 1] };
}