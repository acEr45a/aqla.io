import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import { activateProtocolFamily } from "@/lib/protocolPlan";

export default function RecommendedPlanStart({ family }) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const plan = PROTOCOL_FAMILIES.find((item) => item.key === family);
  if (!plan) return null;

  const start = async () => {
    setStarting(true);
    await activateProtocolFamily(family);
    navigate("/today");
  };

  return (
    <div className="mt-5 aqla-panel rounded-2xl p-6 text-left">
      <p className="text-xs uppercase tracking-widest text-primary">Your recommended 14-day plan</p>
      <h2 className="mt-2 font-display text-2xl text-foreground">{plan.name}</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{plan.purpose}</p>
      <p className="mt-3 text-xs text-muted-foreground">Daily check-ins will track your response. After 14 check-ins, AQLA Intelligence will review your results with you.</p>
      <button onClick={start} disabled={starting} className="mt-5 w-full inline-flex justify-center items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-medium disabled:opacity-50">
        {starting ? "Starting…" : `Start ${plan.name}`} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}