import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import PlanReviewFlow from "@/components/review/PlanReviewFlow";

export default function PlanReviewGate() {
  const [due, setDue] = useState(null);
  const load = async () => {
    const active = await apiClient.entities.Protocol.filter({ status: "active" }, "-created_date", 1);
    const protocol = active[0];
    if (!protocol?.start_date) return setDue(null);
    const [checkIns, reviews] = await Promise.all([
      apiClient.entities.DailyCheckIn.list("-date", 60),
      apiClient.entities.PlanReview.filter({ protocol_id: protocol.id, cycle_started_date: protocol.start_date }, "-created_date", 1),
    ]);
    const cycleCheckIns = checkIns.filter((item) => item.date >= protocol.start_date);
    const uniqueDates = new Set(cycleCheckIns.map((item) => item.date));
    setDue(uniqueDates.size >= 14 && !reviews.length ? { protocol, checkIns: cycleCheckIns.slice(0, 14) } : null);
  };
  useEffect(() => {
    load();
    window.addEventListener("aqla:check-in-saved", load);
    window.addEventListener("aqla:protocol-changed", load);
    return () => { window.removeEventListener("aqla:check-in-saved", load); window.removeEventListener("aqla:protocol-changed", load); };
  }, []);
  if (!due) return null;
  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-background aqla-glow"><PlanReviewFlow {...due} onComplete={() => setDue(null)} /></div>;
}