import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function LegalPage({ title, updated, children }) {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-background aqla-glow px-5 py-10 md:px-8">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to AQLA
        </button>
        <p className="mt-10 text-xs uppercase tracking-[0.18em] text-primary">AQLA legal</p>
        <h1 className="mt-2 font-display text-3xl font-light text-foreground md:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </main>
  );
}