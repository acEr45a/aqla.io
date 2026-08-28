import { apiClient } from "@/api/apiClient";
import { localDateKey } from "@/lib/dateKey";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import { PROTOCOL_DETAILS } from "@/lib/protocolDetails";

export function planReviewDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return localDateKey(date);
}

export async function activateProtocolFamily(family, replacedStatus = "paused") {
  const protocols = await apiClient.entities.Protocol.list("-created_date");
  let target = protocols.find((plan) => plan.family === family);
  if (!target) {
    const catalog = PROTOCOL_FAMILIES.find((plan) => plan.key === family);
    const details = PROTOCOL_DETAILS[family];
    target = await apiClient.entities.Protocol.create({
      name: `${catalog.name} 14-Day Plan`, family, objective: catalog.purpose,
      why_selected: "Selected from your completed assessment or your confirmed choice.",
      status: "paused", start_date: localDateKey(), review_date: planReviewDate(), duration_days: 14,
      expected_benefits: details?.benefits || [], measuring: ["Clarity", "Energy", "Stress", "Sleep quality"],
    });
  }

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
  await apiClient.entities.Protocol.bulkUpdate(updates);
  window.dispatchEvent(new Event("aqla:protocol-changed"));
  return { ...target, ...updates[updates.length - 1] };
}