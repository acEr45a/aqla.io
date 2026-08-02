import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import { LIFESTYLE_EVIDENCE } from "@/lib/lifestyleEvidence";
import { COGNITIVE_TEST_EVIDENCE } from "@/lib/cognitiveTestEvidence";
import EvidenceEntry from "@/components/evidence/EvidenceEntry";

export default function EvidenceLibrary() {
  const [view, setView] = useState("ingredients");
  const [ingredients, setIngredients] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => { base44.entities.Ingredient.list("name", 100).then(setIngredients); }, []);

  const categories = view === "ingredients"
    ? PROTOCOL_FAMILIES.map((family) => ({
        key: family.key, title: family.name, subtitle: family.purpose,
        items: (ingredients || []).filter((item) => item.family === family.key),
      }))
    : view === "lifestyle"
    ? [...new Set(LIFESTYLE_EVIDENCE.map((item) => item.category))].map((category) => ({
        key: category, title: category, subtitle: "Lifestyle factor",
        items: LIFESTYLE_EVIDENCE.filter((item) => item.category === category),
      }))
    : [...new Set(COGNITIVE_TEST_EVIDENCE.map((item) => item.category))].map((category) => ({
        key: category, title: category, subtitle: "Cognitive baseline",
        items: COGNITIVE_TEST_EVIDENCE.filter((item) => item.category === category),
      }));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Research index</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">Evidence Library</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Review the clinical evidence, studied populations, realistic effect sizes, limitations, and research grades behind AQLA's ingredients and lifestyle factors.
      </p>

      <div className="mt-7 inline-flex rounded-full border border-border p-1">
        {["ingredients", "lifestyle", "tests"].map((option) => (
          <button key={option} onClick={() => { setView(option); setOpen(null); }}
            className={`rounded-full px-5 py-2 text-xs capitalize transition-colors ${view === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {option === "lifestyle" ? "Lifestyle factors" : option === "tests" ? "Cognitive tests" : "Ingredients"}
          </button>
        ))}
      </div>

      {view === "ingredients" && ingredients === null ? (
        <div className="mt-10 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary/40" />)}</div>
      ) : (
        categories.filter((group) => group.items.length).map((group) => (
          <section key={group.key} className="mt-10">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="font-display text-lg text-foreground">{group.title}</h2>
              <p className="text-xs text-muted-foreground">{group.subtitle}</p>
            </div>
            <div className="space-y-3">
              {group.items.map((item) => <EvidenceEntry key={item.id} item={item} open={open === item.id} onToggle={() => setOpen(open === item.id ? null : item.id)} />)}
            </div>
          </section>
        ))
      )}

      <p className="mt-14 border-t border-border/50 pt-6 text-xs leading-relaxed text-muted-foreground">
        Research grades describe evidence strength in studied populations, not a guarantee of individual benefit. AQLA does not diagnose or replace medical care.
      </p>
    </div>
  );
}