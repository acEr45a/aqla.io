import React from "react";
import { rankFor } from "@/lib/ranks";

const POSITIONS = {
  focus: "left-[3%] top-[13%]", stress_regulation: "right-[3%] top-[12%]",
  memory: "left-0 top-[34%]", sleep_recovery: "right-0 top-[31%]",
  mental_energy: "left-0 top-[67%]", cognitive_resilience: "right-[-2%] top-[53%]",
  learning_capacity: "left-[17%] bottom-[12%]", lifestyle_protection: "right-[5%] bottom-[14%]",
};

export default function HologramLabels({ domains, activeKey, onHover, onSelect }) {
  return domains.map((domain) => {
    const rank = rankFor(domain.score);
    return (
      <button key={domain.key} type="button" onClick={() => onSelect?.(domain)}
        onMouseEnter={() => onHover(domain.key)} onMouseLeave={() => onHover(null)}
        className={`absolute z-10 w-[30%] max-w-[150px] rounded-lg border bg-background/85 px-2 py-2 text-left shadow-xl backdrop-blur-md md:px-3 ${POSITIONS[domain.key] || "left-1/2 top-1/2"}`}
        style={{ borderColor: `${rank.color}${activeKey === domain.key ? "aa" : "55"}`, boxShadow: activeKey === domain.key ? `0 0 24px ${rank.color}30` : "0 8px 24px rgba(0,0,0,.3)" }}>
        <span className="block text-xs leading-none text-foreground md:text-sm">{domain.label}</span>
        <span className="mt-1 block font-display text-xs tabular-nums md:text-sm" style={{ color: rank.color }}>{domain.score} {rank.name}</span>
      </button>
    );
  });
}