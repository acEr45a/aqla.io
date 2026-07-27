import React from "react";

const GRADE_META = {
  A: { label: "A · Strong", color: "#C9F24E" },
  B: { label: "B · Moderate", color: "#7B94FF" },
  C: { label: "C · Emerging", color: "#F2C04E" },
  D: { label: "D · Weak / mechanistic", color: "#E8A28F" },
  excluded: { label: "Excluded", color: "#E8756B" },
};

export function GradeBadge({ grade }) {
  const g = GRADE_META[grade] || GRADE_META.D;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium"
      style={{ borderColor: `${g.color}55`, color: g.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: g.color }} />
      {g.label}
    </span>
  );
}

export default function EvidencePassport({ ingredient }) {
  const rows = [
    ["Intended role", ingredient.role],
    ["Type of evidence", ingredient.evidence_type],
    ["Studied population", ingredient.studied_population],
    ["Effect size", ingredient.effect_size],
    ["Expected timeframe", ingredient.timeframe],
    ["Limitations", ingredient.limitations],
    ["Safety", ingredient.safety_info],
    ["Interactions", (ingredient.interactions || []).join(", ") || "None documented"],
    ["Last scientific review", ingredient.last_reviewed],
  ];
  return (
    <div className="mt-4 border-t border-border/50 pt-4 space-y-3">
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <div key={k} className="grid grid-cols-[140px_1fr] gap-4 text-sm">
          <span className="text-muted-foreground text-xs pt-0.5">{k}</span>
          <span className="text-foreground/90 leading-relaxed">{v}</span>
        </div>
      ))}
      {ingredient.references?.length > 0 && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">Research references</p>
          {ingredient.references.map((ref, i) => (
            <p key={i} className="text-xs text-foreground/70 leading-relaxed">· {ref}</p>
          ))}
        </div>
      )}
    </div>
  );
}