import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Lock, Download, Cpu, ShieldCheck, Eye, Trash2, ArrowLeft } from "lucide-react";

const SECTIONS = [
  { icon: Eye, title: "What AQLA collects", body: "Your assessment answers, daily check-ins, cognitive test results, protocol history, and experiment outcomes. Nothing is collected silently." },
  { icon: Cpu, title: "AI vs. fixed rules", body: "The AI coach interprets patterns and explains reasoning — but eligibility, contraindications, and safety stops are decided by deterministic rules the AI cannot override." },
  { icon: ShieldCheck, title: "When clinicians see your data", body: "Only when a supplement recommendation carries safety flags requiring professional review, and only the data relevant to that decision." },
  { icon: Trash2, title: "Deletion and control", body: "You can export everything below, and request full deletion of your account and records at any time from your profile." },
];

export default function Trust() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteAllData = async () => {
    setDeleting(true);
    const me = await base44.auth.me();
    const q = { created_by_id: me.id };
    await Promise.all([
      base44.entities.Assessment.deleteMany(q),
      base44.entities.CognitiveTest.deleteMany(q),
      base44.entities.Protocol.deleteMany(q),
      base44.entities.Experiment.deleteMany(q),
      base44.entities.DailyCheckIn.deleteMany(q),
      base44.entities.BrainDomain.deleteMany(q),
      base44.entities.HealthProfile.deleteMany(q),
    ]);
    setDeleting(false);
    window.location.href = "/assessment";
  };

  const exportData = async () => {
    setExporting(true);
    const [assessments, tests, protocols, experiments, checkins, domains] = await Promise.all([
      base44.entities.Assessment.list(), base44.entities.CognitiveTest.list(),
      base44.entities.Protocol.list(), base44.entities.Experiment.list(),
      base44.entities.DailyCheckIn.list(), base44.entities.BrainDomain.list(),
    ]);
    const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), assessments, cognitive_tests: tests, protocols, experiments, daily_checkins: checkins, brain_domains: domains }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aqla-data-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
    setExporting(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link to="/settings"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to settings
      </Link>
      <div className="flex items-center gap-3">
        <Lock className="w-6 h-6 text-primary" strokeWidth={1.5} />
        <h1 className="text-2xl md:text-3xl font-light text-foreground">Trust center</h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed">
        Your brain data is the most personal data there is. Here is exactly how AQLA handles it.
      </p>

      <div className="mt-10 space-y-6">
        {SECTIONS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4 aqla-panel rounded-2xl p-6">
            <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="font-display text-foreground">{title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 aqla-panel rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-foreground">Export your data</p>
          <p className="text-xs text-muted-foreground mt-1">Assessments, tests, protocols, experiments, and check-ins as a single file.</p>
        </div>
        <button onClick={exportData} disabled={exporting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
          <Download className="w-3.5 h-3.5" /> {exporting ? "Preparing…" : "Download export"}
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-destructive">🗑️ Delete my data</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
            Permanently erases your assessments, tests, brain map, protocols, experiments and check-ins. This cannot be undone.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button disabled={deleting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" /> {deleting ? "Deleting…" : "Delete all data"}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all your data?</AlertDialogTitle>
              <AlertDialogDescription>
                Every assessment, cognitive test, brain map score, protocol, experiment and check-in will be permanently deleted.
                Consider downloading an export first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteAllData}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, delete everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <p className="mt-10 text-[11px] text-muted-foreground border-t border-border/50 pt-6">
        AQLA is a general wellness platform. It does not diagnose, treat, prevent, or cure any condition.
      </p>
    </div>
  );
}