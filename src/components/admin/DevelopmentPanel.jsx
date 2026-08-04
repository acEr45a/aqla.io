import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import ChecklistRow from "@/components/admin/dev/ChecklistRow";
import WordbankCard from "@/components/admin/dev/WordbankCard";
import { byTier, TIER_META, TIER_ORDER } from "@/components/admin/dev/devTiers";

export default function DevelopmentPanel() {
  const [ideas, setIdeas] = useState([]);
  const [bank, setBank] = useState([]);
  const [raw, setRaw] = useState("");
  const [focus, setFocus] = useState("");
  const [refining, setRefining] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    base44.entities.DevIdea.list("-created_date", 100).then(setIdeas);
    base44.entities.DevWordbankIdea.list("-created_date", 100).then(setBank);
  };
  useEffect(load, []);

  const submitIdea = async (e) => {
    e.preventDefault();
    if (!raw.trim()) return;
    setRefining(true);
    setError("");
    const res = await base44.functions.invoke("backendOpsAi", { task: "refineIdea", raw, source: "chat" });
    if (res.data?.error) setError(res.data.error);
    else setRaw("");
    setRefining(false);
    load();
  };

  const generateBank = async () => {
    setGenerating(true);
    setError("");
    const res = await base44.functions.invoke("backendOpsAi", { task: "wordbank", focus });
    if (res.data?.error) setError(res.data.error);
    setGenerating(false);
    load();
  };

  const addFromBank = async (idea) => {
    setAddingId(idea.id);
    await base44.entities.DevIdea.create({
      title: idea.title,
      summary: idea.summary,
      detail: idea.summary,
      tier: idea.tier,
      impact: idea.impact,
      effort: idea.effort,
      steps: idea.steps,
      status: "open",
      source: "wordbank",
    });
    await base44.entities.DevWordbankIdea.update(idea.id, { used: true });
    setAddingId(null);
    load();
  };

  const cycleStatus = async (idea, status) => {
    await base44.entities.DevIdea.update(idea.id, { status });
    load();
  };
  const removeIdea = async (idea) => { await base44.entities.DevIdea.delete(idea.id); load(); };
  const removeBank = async (idea) => { await base44.entities.DevWordbankIdea.delete(idea.id); load(); };

  const sorted = [...ideas].sort(byTier);
  const openCount = ideas.filter((i) => i.status !== "done").length;
  const bankSorted = [...bank].sort(byTier);

  return (
    <div className="space-y-6">
      {/* Idea capture */}
      <div className="aqla-panel rounded-2xl p-5 md:p-6">
        <p className="text-xs uppercase tracking-widest text-primary flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" /> Tell Backend Ops an idea
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Type it however it comes out. Backend Ops refines it, ranks it from big idea to small fix, and writes the detail —
          hover any row to read it.
        </p>
        <form onSubmit={submitIdea} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input value={raw} onChange={(e) => setRaw(e.target.value)}
            placeholder="e.g. let users compare their brain map against last month"
            className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50" />
          <button type="submit" disabled={refining || !raw.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {refining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {refining ? "Refining…" : "Refine & add"}
          </button>
        </form>
        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
      </div>

      {/* Checklist */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">Development checklist</h2>
          <span className="text-xs text-muted-foreground">{openCount} open · {ideas.length} total</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          {TIER_ORDER.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: TIER_META[t].color }} />
              {TIER_META[t].label} ({ideas.filter((i) => i.tier === t).length})
            </span>
          ))}
        </div>
        {sorted.length ? (
          <div className="mt-4 space-y-px overflow-hidden rounded-2xl border border-border/60">
            {sorted.map((idea) => (
              <ChecklistRow key={idea.id} idea={idea} onCycleStatus={cycleStatus} onDelete={removeIdea} />
            ))}
          </div>
        ) : (
          <p className="mt-4 aqla-panel rounded-2xl p-6 text-sm text-muted-foreground">
            Nothing yet. Describe an idea above, or pull one from the wordbank.
          </p>
        )}
      </div>

      {/* Wordbank */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-foreground">Idea wordbank</h2>
            <p className="mt-1 text-xs text-muted-foreground">Deeper detail than the checklist — hover to read the full thinking, then quick-add.</p>
          </div>
          <div className="flex gap-2">
            <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Focus (optional)"
              className="w-40 rounded-full border border-border bg-background px-4 py-2 text-xs text-foreground outline-none focus:border-primary/50" />
            <button onClick={generateBank} disabled={generating}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-foreground transition-colors hover:border-foreground/30 disabled:opacity-50">
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {generating ? "Thinking…" : "Generate ideas"}
            </button>
          </div>
        </div>
        {bankSorted.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {bankSorted.map((idea) => (
              <WordbankCard key={idea.id} idea={idea} onAdd={addFromBank} onDelete={removeBank} adding={addingId === idea.id} />
            ))}
          </div>
        ) : (
          <p className="mt-4 aqla-panel rounded-2xl p-6 text-sm text-muted-foreground">
            Wordbank is empty. Hit “Generate ideas” and Backend Ops will fill it with ranked, fully detailed concepts.
          </p>
        )}
      </div>
    </div>
  );
}