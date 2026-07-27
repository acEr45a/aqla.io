import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { STATUS_META } from "@/lib/safety";
import { Shield, ArrowRight } from "lucide-react";

export default function EligibilityGate() {
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    base44.entities.HealthProfile.list("-created_date", 1).then((rows) => setProfile(rows[0] || null));
  }, []);

  if (profile === undefined) return null;

  if (profile === null) {
    return (
      <div className="mt-6 aqla-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#F2C04E]" strokeWidth={1.5} />
          <div>
            <p className="text-sm text-foreground">Safety screening not yet completed</p>
            <p className="text-xs text-muted-foreground mt-0.5">Supplement recommendations stay locked until you complete the 2-minute screen.</p>
          </div>
        </div>
        <Link to="/safety" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          Complete screening <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const meta = STATUS_META[profile.eligibility_status];
  return (
    <div className="mt-6 aqla-panel rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 shrink-0" style={{ color: meta.color }} strokeWidth={1.5} />
        <div>
          <p className="text-sm" style={{ color: meta.color }}>{meta.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{meta.message}</p>
        </div>
      </div>
      {profile.flags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 pl-8">
          {profile.flags.map((f) => (
            <span key={f} className="px-2.5 py-1 rounded-full bg-secondary text-[11px] text-foreground/70">{f}</span>
          ))}
        </div>
      )}
      <Link to="/safety" className="mt-3 pl-8 block text-[11px] text-muted-foreground hover:text-foreground">Retake screening</Link>
    </div>
  );
}