import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { computeDomains, primaryBottleneck } from "@/lib/scoring";
import RadialMap from "@/components/brainmap/RadialMap";
import RecommendedPlanStart from "@/components/protocols/RecommendedPlanStart";
import { protocolFit } from "@/lib/protocols";
import { ChevronDown } from "lucide-react";

const STAGES = [
  "Mapping your cognitive rhythm",
  "Comparing perceived and measured performance",
  "Identifying recovery constraints",
  "Evaluating stimulant exposure",
  "Detecting conflicting habits",
  "Ranking your highest-impact opportunities",
  "Building your questionnaire profile",
];

// Limiting factors derived only from the user's actual assessment answers — never assumed.
function deriveLimitingFactors(responses) {
  const factors = [];
  if (responses.sleep_consistency != null && responses.sleep_consistency <= 2) factors.push("Irregular sleep timing");
  if (responses.restored != null && responses.restored <= 2) factors.push("Waking unrestored");
  if (responses.caffeine_late === "often") factors.push("Late caffeine exposure");
  if (responses.screens_evening === "most_nights") factors.push("Evening screen use before bed");
  if (responses.overwhelm != null && responses.overwhelm >= 4) factors.push("Frequent mental overload");
  if (responses.work_interruptions === "constant") factors.push("Constant work interruptions");
  return factors;
}

const ANALYZED = ["Self-reported cognitive experience", "Daily rhythm and energy curve", "Sleep timing and recovery quality", "Stress and workload signals", "Caffeine, hydration, and activity patterns"];

export default function Analysis() {
  const [stage, setStage] = useState(0);
  const [domains, setDomains] = useState([]);
  const [done, setDone] = useState(false);
  const [recommendedFamily, setRecommendedFamily] = useState(null);
  const [open, setOpen] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const assessments = await base44.entities.Assessment.list("-created_date", 1);
      const responses = assessments[0]?.responses || {};
      const computed = computeDomains(responses);
      setDomains(computed);

      for (let i = 0; i < STAGES.length; i++) {
        setStage(i);
        await new Promise((r) => setTimeout(r, 1100));
      }

      const bottleneck = primaryBottleneck(computed);
      const fits = protocolFit(bottleneck.key);
      const recommended = Object.keys(fits).find((family) => fits[family].status === "Recommended") || "RESET";
      setRecommendedFamily(recommended);
      const existing = await base44.entities.BrainDomain.list();
      if (existing.length) await base44.entities.BrainDomain.deleteMany({});
      await base44.entities.BrainDomain.bulkCreate(computed.map((d) => ({
        domain_key: d.key,
        domain_name: d.label,
        score: d.score,
        confidence: "moderate",
        trend: "stable",
        summary: d.key === bottleneck.key
          ? "AQLA identified this domain as your primary performance bottleneck based on your assessment."
          : "Derived from your assessment responses. Confidence will improve with daily check-ins.",
        limiting_factors: d.key === bottleneck.key ? deriveLimitingFactors(responses) : [],
        protective_factors: d.score >= 65 ? ["Consistent self-reported patterns in this domain"] : [],
        next_action: d.key === bottleneck.key ? `Follow your ${recommended} protocol for 14 days` : "Continue daily check-ins to refine this score",
        data_sources: ["Onboarding assessment"],
      })));
      setDone(true);
    })();
  }, []);

  const reveal = Math.min(domains.length, Math.ceil(((stage + 1) / STAGES.length) * 8));

  return (
    <div className="min-h-screen bg-background aqla-glow flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center py-16">
        <RadialMap domains={domains.length ? domains : []} size={360} revealCount={done ? undefined : reveal} />
        {/* No fixed height: the stage copy and the ready-state block vary in
            length, and a hard h-16 made them overlap. Flex column + wrapping
            lets the container grow with whatever it holds. */}
        <div className="mt-6 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.p key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="text-foreground font-display text-lg break-words whitespace-normal">
                {STAGES[stage]}<span className="text-primary">…</span>
              </motion.p>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                <p className="text-foreground font-display text-xl break-words whitespace-normal">Your questionnaire profile is ready.</p>
                <RecommendedPlanStart family={recommendedFamily} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 text-left aqla-panel rounded-2xl overflow-hidden">
          <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-sm text-foreground">
            What AQLA is analyzing
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <ul className="px-5 pb-5 space-y-2 text-sm text-muted-foreground">
              {ANALYZED.map((a) => <li key={a} className="flex gap-2"><span className="text-primary">·</span>{a}</li>)}
              <li className="pt-2 text-xs">AQLA never claims certainty beyond the available information.</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}