import React from "react";
import { Link } from "react-router-dom";
import { Radar, CalendarCheck, ShieldCheck, ArrowRight, Bot, AlertOctagon } from "lucide-react";
import HelpAgentChat from "@/components/help/HelpAgentChat";
import IssueReportForm from "@/components/help/IssueReportForm";

const GUIDES = [
  {
    id: "brain-map", icon: Radar, title: "Interpreting Brain Map scores", path: "/map", action: "Open Brain Map",
    paragraphs: [
      "Each score runs from 0 to 100 and summarizes the signals available for that domain. It is a personal baseline and trend marker—not an IQ score, diagnosis, or comparison with other people.",
      "Confidence shows how much relevant data supports a score. Questionnaire-only estimates begin with lower confidence; completed cognitive tests and repeated check-ins strengthen it. Focus on direction and consistency over time rather than a single number.",
      "Open a region to see its contributing data, limiting factors, protective factors, and next action. Rank names make ranges easier to scan but do not change the underlying score.",
    ],
  },
  {
    id: "daily-check-in", icon: CalendarCheck, title: "Using daily check-ins", path: "/today", action: "Go to Today",
    paragraphs: [
      "Record clarity, energy, stress, sleep quality, and any side effects from the Today page. A check-in should reflect how you feel now; there is no ideal answer.",
      "Use the note and demand fields for context such as travel, illness, deadlines, unusually hard training, or disrupted sleep. This helps separate a real protocol response from short-term noise.",
      "Consistency matters more than frequency. Check in at roughly the same time and review patterns across several days before changing a protocol.",
    ],
  },
  {
    id: "safety", icon: ShieldCheck, title: "Understanding safety protocols", path: "/safety", action: "Review Safety Screening",
    paragraphs: [
      "Safety screening runs before supplement recommendations. Fixed rules check medications, conditions, sensitivities, pregnancy status, and other contraindications; the AI coach cannot override a safety stop.",
      "A paused or clinician-review result does not diagnose a problem. It means AQLA will avoid or delay a recommendation until the relevant risk is clarified.",
      "Report side effects in your daily check-in and stop a new intervention if symptoms are concerning. Seek urgent medical care for severe or rapidly worsening symptoms.",
    ],
  },
];

export default function HelpCenter() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Documentation</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">Help Center</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Practical guidance for reading your results, building a useful daily record, and understanding AQLA's safety boundaries.</p>

      <section className="mt-8">
        <div className="flex items-center gap-2.5 mb-4">
          <Bot className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <h2 className="font-display text-xl text-foreground">Ask the AQLA Assistant</h2>
        </div>
        <HelpAgentChat />
      </section>

      <section className="mt-10">
        <div className="flex items-center gap-2.5 mb-4">
          <AlertOctagon className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <h2 className="font-display text-xl text-foreground">Report an issue</h2>
        </div>
        <p className="mb-4 max-w-xl text-sm leading-relaxed text-muted-foreground">Found a bug, data problem, or safety concern? Send it straight to the admin team — they'll review and follow up.</p>
        <IssueReportForm />
      </section>

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Help topics">
        {GUIDES.map((guide) => <a key={guide.id} href={`#${guide.id}`} className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground">{guide.title}</a>)}
      </nav>

      <div className="mt-10 space-y-5">
        {GUIDES.map(({ id, icon: Icon, title, paragraphs, path, action }) => (
          <section id={id} key={id} className="aqla-panel scroll-mt-8 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3"><Icon className="w-5 h-5 text-primary" strokeWidth={1.5} /><h2 className="font-display text-xl text-foreground">{title}</h2></div>
            <div className="mt-5 space-y-3">{paragraphs.map((text) => <p key={text} className="text-sm leading-relaxed text-muted-foreground">{text}</p>)}</div>
            <Link to={path} className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-primary">{action}<ArrowRight className="w-3.5 h-3.5" /></Link>
          </section>
        ))}
      </div>
    </div>
  );
}