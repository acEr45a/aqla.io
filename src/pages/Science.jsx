import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import EvidencePassport, { GradeBadge } from "@/components/science/EvidencePassport";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Science() {
  const [ingredients, setIngredients] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    apiClient.entities.Ingredient.list("name", 100).then(setIngredients);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <p className="text-xs text-muted-foreground tracking-widest uppercase">Evidence library</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">The Evidence Passport</h1>
      <p className="mt-3 text-muted-foreground max-w-xl text-sm leading-relaxed">
        Every ingredient AQLA may recommend carries a graded evidence record — the type of studies, populations,
        realistic effect sizes, limitations, and interactions. No stars. No fake percentages.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        {[["A", "Strong"], ["B", "Moderate"], ["C", "Emerging"], ["D", "Weak / mechanistic"]].map(([g, l]) => (
          <span key={g} className="px-3 py-1.5 rounded-full border border-border">{g} — {l}</span>
        ))}
      </div>

      {ingredients === null ? (
        <div className="mt-10 space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse bg-secondary/40 rounded-2xl" />)}</div>
      ) : (
        PROTOCOL_FAMILIES.map((fam) => {
          const items = ingredients.filter((i) => i.family === fam.key);
          if (!items.length) return null;
          return (
            <section key={fam.key} className="mt-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full" style={{ background: fam.color }} />
                <h2 className="font-display text-lg tracking-wide text-foreground">{fam.name}</h2>
                <span className="text-xs text-muted-foreground">{fam.purpose}</span>
              </div>
              <div className="space-y-3">
                {items.map((ing) => (
                  <div key={ing.id} className="aqla-panel rounded-2xl p-5">
                    <button onClick={() => setOpen(open === ing.id ? null : ing.id)} className="w-full flex items-center justify-between gap-4 text-left">
                      <div>
                        <p className="text-foreground font-medium text-sm">{ing.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ing.role}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <GradeBadge grade={ing.evidence_grade} />
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open === ing.id ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {open === ing.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                          <EvidencePassport ingredient={ing} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}

      <p className="mt-14 text-[11px] text-muted-foreground leading-relaxed border-t border-border/50 pt-6">
        Evidence grades reflect the strength of research in studied populations — not a guarantee of individual response.
        AQLA measures your personal response through experiments before drawing conclusions.
      </p>
    </div>
  );
}